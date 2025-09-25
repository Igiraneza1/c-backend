import { answerQuestionLive, scrapeMultipleUrls } from '../chatbot/ScraperService';
import { getEmbedding, generateAnswer } from './AIservice';
import { searchDatabase } from './AIservice';
import { infoLogger } from '../../../utils/logger';

interface SourceDoc {
  title: string;
  content: string;
  embedding?: number[];
}

export async function answerQuestionHybrid(question: string): Promise<string> {
  infoLogger(`Hybrid answer for question: "${question}"`);

  const dbDocs = await searchDatabase(question);
  const scrapedDocs = await scrapeMultipleUrls([
    'https://www.rwandagazette.gov.rw/laws/page1',
    'https://www.rwandagazette.gov.rw/laws/page2',
  ]);

  // Fix: Convert string results to SourceDoc objects
  const allDocs: SourceDoc[] = [];
  
  // Process dbDocs - if it returns strings, convert to SourceDoc
  if (Array.isArray(dbDocs)) {
    dbDocs.forEach(doc => {
      if (typeof doc === 'string') {
        allDocs.push({ title: 'Database Result', content: doc });
      } else {
        allDocs.push(doc as SourceDoc);
      }
    });
  }
  
  // Process scrapedDocs - if it returns strings, convert to SourceDoc
  if (Array.isArray(scrapedDocs)) {
    scrapedDocs.forEach(doc => {
      if (typeof doc === 'string') {
        allDocs.push({ title: 'Scraped Content', content: doc });
      } else {
        allDocs.push(doc as SourceDoc);
      }
    });
  }

  if (!allDocs.length) {
    // Fix: Now using answerQuestionLive
    return answerQuestionLive(question);
  }

  for (const doc of allDocs) {
    doc.embedding = await getEmbedding(doc.content);
  }

  const questionEmbedding = await getEmbedding(question);

  allDocs.sort((a, b) => {
    const simA = cosineSim(a.embedding!, questionEmbedding);
    const simB = cosineSim(b.embedding!, questionEmbedding);
    return simB - simA;
  });

  const relevantDocs = allDocs.slice(0, 5);

  const context = relevantDocs
    .map(doc => `(${doc.title}) ${doc.content}`)
    .join('\n\n');

  const answer = await generateAnswer(context, question);

  return (
    answer +
    '\n\nDisclaimer: This is a simplified summary. For legal advice, consult a qualified lawyer.'
  );
}

function cosineSim(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}