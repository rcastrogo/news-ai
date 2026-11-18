import { Router } from 'express';
import * as feedService from '../services/feedService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    res.json(await feedService.getFeeds());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load feeds' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const feed = await feedService.getFeedById(req.params.id);
    if (!feed) return res.status(404).json({ error: 'Feed not found' });
    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load feed' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const feed = await feedService.createFeed({ name, url });
    res.status(201).json(feed);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Feed URL already exists' });
    }
    res.status(500).json({ error: 'Unable to create feed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const feed = await feedService.updateFeed(req.params.id, req.body);
    if (!feed) return res.status(404).json({ error: 'Feed not found' });
    res.json(feed);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Feed URL already exists' });
    }
    res.status(500).json({ error: 'Unable to update feed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await feedService.deleteFeed(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Feed not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to delete feed' });
  }
});

export default router;
