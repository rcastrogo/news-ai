import { Router } from 'express';
import * as summaryService from '../services/summaryService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    res.json(await summaryService.getSummaries());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load summaries' });
  }
});

router.get('/:articleId', async (req, res) => {
  try {
    const summary = await summaryService.getSummaryByArticleId(req.params.articleId);
    if (!summary) return res.status(404).json({ error: 'Summary not found' });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load summary' });
  }
});

router.put('/:articleId', async (req, res) => {
  try {
    const { model, summary } = req.body;
    if (!model || !summary) {
      return res.status(400).json({ error: 'Model and summary are required' });
    }

    const result = await summaryService.createOrUpdateSummary({
      article_id: req.params.articleId,
      model,
      summary
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(500).json({ error: 'Unable to save summary' });
  }
});

router.delete('/:articleId', async (req, res) => {
  try {
    const deleted = await summaryService.deleteSummary(req.params.articleId);
    if (!deleted) return res.status(404).json({ error: 'Summary not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to delete summary' });
  }
});

export default router;
