import axios from 'axios';
import * as cheerio from 'cheerio';
import { getEmbedding, generateAnswer, searchDatabase } from './AIservice';
import { infoLogger, errorLogger } from '../../../utils/logger';

interface Law {
  title: string;
  content: string;
  embedding?: number[];
}

const DEFAULT_URLS: string[] = [
  'https://www.amategeko.gov.rw/',
  'https://www.minijust.gov.rw/publications',
  'https://www.minijust.gov.rw/laws',
];

async function scrapeSingleUrl(url: string): Promise<Law[]> {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const laws: Law[] = [];

    $('div.law-item').each((_, el) => {
      const title = $(el).find('h2').text().trim();
      const content = $(el).find('p').text().trim();

      if (title && content) {
        laws.push({ title, content });
      }
    });

    infoLogger(`Scraped ${laws.length} laws from ${url}`);
    return laws;
  } catch (err: unknown) {
    errorLogger(err instanceof Error ? err : new Error(String(err)));
    return [];
  }
}

export async function answerQuestionLive(question: string): Promise<string> {
  const context = await searchDatabase(question);
  const answer = await generateAnswer(context, question);
  return answer;
}

export async function scrapeMultipleUrls(urls: string[]): Promise<Law[]> {
  let allLaws: Law[] = [];
  for (const url of urls) {
    const laws = await scrapeSingleUrl(url);
    allLaws = allLaws.concat(laws);
  }
  infoLogger(`Total laws scraped from all URLs: ${allLaws.length}`);
  return allLaws;
}

function cosineSim(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

export async function answerQuestionHybrid(question: string): Promise<string> {
  infoLogger(`Hybrid answer for question: "${question}"`);

  const dbContext = await searchDatabase(question);

  const scrapedDocs = await scrapeMultipleUrls(DEFAULT_URLS);

  if (!dbContext && !scrapedDocs.length) {
    return 'I could not find any relevant laws in the database or online at the moment.';
  }

  for (const doc of scrapedDocs) {
    doc.embedding = await getEmbedding(doc.content);
  }

  const questionEmbedding = await getEmbedding(question);

  scrapedDocs.sort((a, b) => {
    const simA = cosineSim(a.embedding!, questionEmbedding);
    const simB = cosineSim(b.embedding!, questionEmbedding);
    return simB - simA;
  });

  const relevantDocs = scrapedDocs.slice(0, 5);

  const scrapedContext = relevantDocs
    .map(doc => `(${doc.title}) ${doc.content}`)
    .join('\n\n');

  const context = [dbContext, scrapedContext].filter(Boolean).join('\n\n');

  const answer = await generateAnswer(context, question);

  infoLogger(`Answer generated for question: "${question}"`);

  return (
    answer +
    '\n\nDisclaimer: This is a simplified summary. For legal advice, consult a qualified lawyer.'
  );
}
