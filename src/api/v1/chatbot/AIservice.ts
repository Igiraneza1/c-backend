import {
  pipeline,
  FeatureExtractionPipeline,
  Text2TextGenerationPipeline,
} from '@xenova/transformers';
import { Database } from '../../../database/index';
import { QueryTypes } from 'sequelize';

// Cache for loaded models
let embeddingModel: FeatureExtractionPipeline | null = null;
let textModel: Text2TextGenerationPipeline | null = null;

/**
 * Generate embeddings for text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!embeddingModel) {
    embeddingModel = (await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    )) as FeatureExtractionPipeline;
  }

  const output = await embeddingModel(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

/**
 * Define DB result type
 */
interface LawRow {
  id?: number;
  title?: string;
  content: string;
  similarity: number;
}

/**
 * Retrieve top N most relevant law sections from DB
 */
export async function retrieveContext(
  question: string,
  topK = 3,
): Promise<string> {
  const questionEmbedding = await getEmbedding(question);

  const rows = (await Database.database.query(
    `
    SELECT id, title, content, 1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
    FROM laws
    ORDER BY embedding <=> CAST(:embedding AS vector)
    LIMIT :topK
    `,
    {
      replacements: { embedding: questionEmbedding, topK },
      type: QueryTypes.SELECT,
    },
  )) as LawRow[];

  if (!rows.length) {
    return '';
  }

  return rows.map(r => `(${r.title ?? 'Law'}) ${r.content}`).join('\n\n');
}

function cleanAnswer(text: string, question?: string): string {
  let cleaned = text.trim();

  // Take first 2–3 sentences
  const sentences = cleaned.split(/[.!?]\s+/).filter(Boolean);
  cleaned = sentences.slice(0, 3).join('. ') + '.';

  // Remove duplicate words
  cleaned = cleaned.replace(/\b(\w+)(\s+\1){1,}\b/gi, '$1');

  // Ensure punctuation
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  // Fallback if empty or repeats question
  if (!cleaned || (question && cleaned.toLowerCase().includes(question.toLowerCase()))) {
    cleaned =
      'The law of Rwanda is defined by its Constitution and related legal codes. It provides the framework for governance, rights, and justice in the country.';
  }

  return cleaned;
}

export async function generateAnswer(
  context: string,
  question: string,
): Promise<string> {
  if (!textModel) {
    textModel = (await pipeline(
      'text2text-generation',
      'Xenova/flan-t5-small',
    )) as Text2TextGenerationPipeline;
  }

  const prompt = `
You are an AI legal assistant for Rwanda laws.
Answer clearly, in plain language, and cite relevant articles.

Context:
${context || 'No relevant law found.'}

Question:
${question}

Answer politely in 2–3 short sentences with a reference to the law:
`;

  const response = await textModel(prompt, {
    max_new_tokens: 150,
  });

  let generated = '';
  if (Array.isArray(response)) {
    generated = (response[0] as { generated_text: string }).generated_text;
  } else if (typeof response === 'object' && response !== null) {
    generated =
      (response as { generated_text?: string }).generated_text ||
      (response as { text?: string }).text ||
      JSON.stringify(response);
  } else {
    generated = String(response);
  }

  const answer = cleanAnswer(generated.replace(prompt, '').trim(), question);

  return (
    answer +
    '\n\nDisclaimer: This is a simplified summary. For legal advice, consult a qualified lawyer.'
  );
}

export async function searchDatabase(
  question: string,
  topK = 3,
): Promise<string> {
  return retrieveContext(question, topK);
}
