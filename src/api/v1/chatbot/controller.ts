import { Request, Response } from 'express';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import { Database } from '../../../database';
import { getEmbedding, generateAnswer } from '../chatbot/service/AIservice';
import { chunkText } from '../../../utils/chunker';
import { infoLogger, errorLogger } from '../../../utils/logger';
import { QueryTypes } from 'sequelize';
import fetch from 'node-fetch';

interface DocumentRow {
  id: number;
  content: string;
  distance: number;
}

interface InsertedDocument {
  id: number;
  filename: string;
  filepath: string;
  content: string;
  embedding: number[];
  created_at: Date;
}

function formatEmbeddingForSQL(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

async function searchWeb(query: string): Promise<string> {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();

    if (data?.AbstractText) {
      return data.AbstractText;
    }

    if (data?.RelatedTopics?.[0]?.Text) {
      return data.RelatedTopics[0].Text;
    }

    return 'No clear web definition found.';
  } catch (err) {
    errorLogger(err as Error, 'searchWeb');
    return 'Failed to fetch from web.';
  }
}

function logAndSendError(res: Response, err: unknown, context?: string): void {
  const error = err instanceof Error ? err : new Error(String(err));
  errorLogger(error, context);
  res.status(500).json({ error: error.message });
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdf(pdfBuffer);
    const cleanText = pdfData.text.replace(/\s+/g, ' ').trim();
    const chunks = chunkText(cleanText, 1000, 100);

    const inserted: InsertedDocument[] = [];

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      const formatted = formatEmbeddingForSQL(embedding);

      const result = await Database.database.query<InsertedDocument>(
        `INSERT INTO documents (filename, filepath, content, embedding)
         VALUES ($1, $2, $3, $4::vector)
         RETURNING *`,
        {
          bind: [req.file.originalname, req.file.path, chunk, formatted],
          type: QueryTypes.SELECT,
        },
      );

      if (result.length > 0) {
        inserted.push(result[0]);
      }
    }

    res.status(201).json({ message: 'File uploaded successfully', chunks: inserted });
    infoLogger(`Uploaded ${inserted.length} chunks from file ${req.file.originalname}`, 'uploadDocument');
  } catch (err) {
    logAndSendError(res, err, 'uploadDocument');
  }
}

export async function queryDocument(req: Request, res: Response): Promise<void> {
  try {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question required' });
      return;
    }

    const qEmbedding = await getEmbedding(question);
    const formatted = formatEmbeddingForSQL(qEmbedding);

    const result = await Database.database.query<DocumentRow>(
      `SELECT id, content, embedding <#> $1::vector AS distance
       FROM documents
       ORDER BY distance
       LIMIT 3`, 
      {
        bind: [formatted],
        type: QueryTypes.SELECT,
      },
    );

    let context = result.map((r) => r.content).join('\n---\n');
    let source: 'database' | 'web' = 'database';

    if (!result.length || !context.trim()) {
      context = await searchWeb(question); 
      source = 'web';
    }

    const contextChunks = context.split('\n---\n').slice(0, 3); 
    const limitedContext = contextChunks.join('\n---\n');

    const prompt = `
You are an AI assistant. Using the context below, answer the question clearly, concisely, and in simple human-friendly language.
Context: ${limitedContext}
Question: ${question}
Answer:
    `;

    const answer = await generateAnswer(prompt, question);

    await Database.database.query(
      'INSERT INTO history (question, answer, source) VALUES ($1, $2, $3)',
      {
        bind: [question, answer, source],
        type: QueryTypes.INSERT,
      },
    );

    res.json({
      answer: source === 'web'
        ? `Not found in database. Here’s a web-sourced answer:\n\n${answer}`
        : answer,
      documents: result,
      source,
    });

    infoLogger(`Answered question: "${question}" (source: ${source})`, 'queryDocument');
  } catch (err) {
    logAndSendError(res, err, 'queryDocument');
  }
}


export async function getQueryHistory(req: Request, res: Response): Promise<void> {
  try {
    const result = await Database.database.query(
      'SELECT * FROM history ORDER BY created_at DESC',
      { type: QueryTypes.SELECT },
    );
    res.json(result);
    infoLogger('Fetched query history', 'getQueryHistory');
  } catch (err) {
    logAndSendError(res, err, 'getQueryHistory');
  }
}

export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const result = await Database.database.query(
      'SELECT * FROM documents ORDER BY created_at DESC',
      { type: QueryTypes.SELECT },
    );
    res.json(result);
    infoLogger('Fetched all documents', 'getDocuments');
  } catch (err) {
    logAndSendError(res, err, 'getDocuments');
  }
}

export async function updateDocumentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const embedding = await getEmbedding(content);
    const formatted = formatEmbeddingForSQL(embedding);

    const result = await Database.database.query(
      'UPDATE documents SET content=$1, embedding=$2::vector WHERE id=$3 RETURNING *',
      {
        bind: [content, formatted, id],
        type: QueryTypes.SELECT,
      },
    );

    if (!result.length) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(result[0]);
    infoLogger(`Updated document ${id}`, 'updateDocumentById');
  } catch (err) {
    logAndSendError(res, err, 'updateDocumentById');
  }
}

export async function deleteDocumentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await Database.database.query(
      'DELETE FROM documents WHERE id=$1 RETURNING *',
      {
        bind: [id],
        type: QueryTypes.SELECT,
      },
    );

    if (!result.length) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ message: 'Deleted successfully' });
    infoLogger(`Deleted document ${id}`, 'deleteDocumentById');
  } catch (err) {
    logAndSendError(res, err, 'deleteDocumentById');
  }
}
