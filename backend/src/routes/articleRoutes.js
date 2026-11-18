import { Router } from 'express';
import * as articleService from '../services/articleService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await articleService.getArticles(req.query.limit));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load articles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load article' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const article = await articleService.createArticle(req.body);
    if (!article) {
      return res.status(409).json({ error: 'Article URL already exists' });
    }
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to create article' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await articleService.deleteArticle(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Article not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to delete article' });
  }
});

export default router;
