
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

import articleRoutes from './routes/articleRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';

const app = express();
const clients = new Set();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try { 
    await pool.query('SELECT 1'); 
    res.json({ status: 'ok', database: 'connected' }); 
  }
  catch { 
    res.status(503).json({ status: 'error', database: 'unavailable' }); 
  }
});

app.use('/api/articles', articleRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/summaries', summaryRoutes);

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream', 
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive', 'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  clients.add(res);
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); clients.delete(res); });
});

app.post('/api/internal/notify', (req, res) => {
  console.log('1. Received internal notify request');
  if (!process.env.INTERNAL_WEBHOOK_SECRET ||
    req.get('x-internal-secret') !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log('2. Internal notify request authorized');

  const eventType = req.body?.type ?? '';
  if (!eventType) {
    return res.status(400).json({ error: 'Missing event type' });
  }

  const handlerMap = {
    'article.processed': (event) => {
      const payload = event.article ?? null;
      if (!payload) return;
      for (const client of clients) {
        client.write(`event: article.processed\ndata: ${JSON.stringify(event)}\n\n`);
      }
    },
    'worker.status': (event) => {
      const status = event.status ?? null;
      if (!status) return;
      event.occurredAt = new Date().toISOString();
      for (const client of clients) {
        client.write(`event: worker.status\ndata: ${JSON.stringify(event)}\n\n`);
      }
    }
  };
  console.log('3. Event to be sent to clients: ', eventType ?? null);
  const handler = handlerMap[eventType];
  if (handler){
    console.log('4. Broadcasting event to clients:', req.body);
    handler(req.body);
  }
  console.log('5. Event broadcast completed');
  console.log('6. Responding to internal notify request with connected clients count:', clients.size);
  res.status(202).json({ accepted: true, connectedClients: clients.size });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, '0.0.0.0', () => console.log(`API listening on :${port}`));
async function shutdown() {
  for (const client of clients) client.end();
  server.close();
  await pool.end();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
