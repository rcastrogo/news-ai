import { pool } from '../db.js';

export const getArticles = async (limit = 50) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  console.log(`Fetching articles with limit: ${safeLimit}`);
  
  const { rows } = await pool.query(
    `SELECT
       a.id, a.feed_id, a.title, a.url, a.author,
       a.published_at, a.created_at, a.content,
       s.summary
     FROM articles a
     LEFT JOIN summaries s ON s.article_id = a.id
     ORDER BY a.id DESC
     LIMIT $1`,
    [safeLimit]
  );

  return rows;
};

export const getArticleById = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.*, s.summary, s.model AS summary_model
     FROM articles a
     LEFT JOIN summaries s ON s.article_id = a.id
     WHERE a.id = $1`,
    [id]
  );

  return rows[0] || null;
};

export const createArticle = async ({
  feed_id = null,
  title,
  url,
  author = null,
  published_at = null,
  content = null
}) => {
  const { rows } = await pool.query(
    `INSERT INTO articles
       (feed_id, title, url, author, published_at, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (url) DO NOTHING
     RETURNING *`,
    [feed_id, title, url, author, published_at, content]
  );

  return rows[0] || null;
};

export const deleteArticle = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM articles WHERE id = $1',
    [id]
  );

  return rowCount > 0;
};
