import fs from 'fs';
import { Database } from '../../../database';
import { getEmbedding, generateAnswer } from '../chatbot/service/AIservice';
import { QueryTypes } from 'sequelize';

function formatEmbeddingForSQL(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export async function processFile(file: Express.Multer.File): Promise<void> {

  const text = fs.readFileSync(file.path, 'utf-8');

  const embedding = await getEmbedding(text);
  const formattedEmbedding = formatEmbeddingForSQL(embedding);

  await Database.database.query(
    'INSERT INTO documents (content, embedding) VALUES ($1, $2::vector)',
    {
      bind: [text, formattedEmbedding],
      type: QueryTypes.INSERT,
    },
  );
}

export async function queryDocuments(question: string): Promise<string> {
  const embedding = await getEmbedding(question);
  const formattedEmbedding = formatEmbeddingForSQL(embedding);

  const rows = await Database.database.query<{ content: string; similarity: number }>(
    `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     ORDER BY similarity DESC
     LIMIT 1`,
    {
      bind: [formattedEmbedding],
      type: QueryTypes.SELECT,
    },
  );

  if (!rows.length) {
    return 'No relevant documents found.';
  }

  const context = rows[0].content;
  return await generateAnswer(context, question);
}

export async function getAllDocuments(): Promise<{ id: number; content: string }[]> {
  return await Database.database.query<{ id: number; content: string }>(
    'SELECT id, content FROM documents ORDER BY id DESC',
    { type: QueryTypes.SELECT },
  );
}

export async function updateDocument(id: number, content: string): Promise<void> {
  const embedding = await getEmbedding(content);
  const formattedEmbedding = formatEmbeddingForSQL(embedding);

  await Database.database.query(
    'UPDATE documents SET content = $1, embedding = $2::vector WHERE id = $3 RETURNING *',
    {
      bind: [content, formattedEmbedding, id],
      type: QueryTypes.SELECT,
    },
  );
}

export async function deleteDocument(id: number): Promise<void> {
  await Database.database.query(
    'DELETE FROM documents WHERE id = $1 RETURNING *',
    {
      bind: [id],
      type: QueryTypes.SELECT,
    },
  );
}
