// src/services/AIService.ts
import {
  pipeline,
  FeatureExtractionPipeline,
  Text2TextGenerationPipeline,
} from '@xenova/transformers';

// Cache for loaded models with proper typing
let embeddingModel: FeatureExtractionPipeline | null = null;
let textModel: Text2TextGenerationPipeline | null = null;

/**
 * Generate embeddings for text (multilingual, 50+ languages)
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
 * Helper: Clean repetitive or messy answers
 */
function cleanAnswer(text: string, question?: string): string {
  let cleaned = text.trim();

  // Take only the first 2–3 sentences
  const sentences = cleaned.split(/[.!?]\s+/).filter(Boolean);
  cleaned = sentences.slice(0, 3).join('. ') + '.';

  // Remove duplicate words
  cleaned = cleaned.replace(/\b(\w+)(\s+\1){1,}\b/gi, '$1');

  // Ensure answer ends with punctuation
  if (!/[.!?]$/.test(cleaned)) {
    cleaned = cleaned.replace(/[^.!?]+$/, '').trim();
  }

  // Fallback if model just repeats the question or returns empty
  if (!cleaned || (question && cleaned.toLowerCase().includes(question.toLowerCase()))) {
    cleaned =
      'The law of Rwanda is defined by its Constitution and related legal codes. It provides the framework for governance, rights, and justice in the country.';
  }

  return cleaned;
}

/**
 * Generate user-friendly answers
 */
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

  // Short, polite prompt
  const prompt = context
    ? `Context: ${context}\n\nQuestion: ${question}\n\nAnswer politely in 2–3 short sentences:`
    : `Question: ${question}\n\nAnswer politely in 2–3 short sentences:`;

  const response = await textModel(prompt, {
    max_new_tokens: 150,
  });

  // Extract generated text
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

  // Clean answer before returning
  const answer = cleanAnswer(generated.replace(prompt, '').trim(), question);

  return answer || 'I’m not sure, but I’ll try to help!';
}
