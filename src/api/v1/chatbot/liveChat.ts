import { Router } from 'express';
import { answerQuestionLive} from '../chatbot/ScraperService';
import { infoLogger, errorLogger } from '../../../utils/logger';

const router = Router();

router.post('/ask-live', async (req, res) => {
  const { question, urls } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required and must be a string' });
  }

  // Validate URLs
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'URLs are required and must be a non-empty array' });
  }

  try {
    infoLogger(`Received question: "${question}"`, 'LiveChat');

    const answer = await answerQuestionLive(question);

    infoLogger(`Answer generated for question: "${question}"`, 'LiveChat');

    res.json({ answer });
  } catch (err: unknown) {
  errorLogger(err instanceof Error ? err : new Error(String(err)));
  return [];
}

});

export default router;
