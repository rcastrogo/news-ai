import { pool } from '../db.js';

export const getSummaries = async () => {
  const { rows } = await pool.query(
    `SELECT s.id, s.article_id, s.model, s.summary, s.created_at,
            a.title AS article_title
     FROM summaries s
     JOIN articles a ON a.id = s.article_id
     ORDER BY s.created_at DESC`
  );
  return rows;
};

export const getSummaryByArticleId = async (articleId) => {
  const { rows } = await pool.query(
    'SELECT * FROM summaries WHERE article_id = $1',
    [articleId]
  );
  return rows[0] || null;
};

export const createOrUpdateSummary = async ({
  article_id,
  model,
  summary
}) => {
  const { rows } = await pool.query(
    `INSERT INTO summaries (article_id, model, summary)
     VALUES ($1, $2, $3)
     ON CONFLICT (article_id)
     DO UPDATE SET
       model = EXCLUDED.model,
       summary = EXCLUDED.summary,
       created_at = NOW()
     RETURNING *`,
    [article_id, model, summary]
  );
  return rows[0];
};

export const deleteSummary = async (articleId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM summaries WHERE article_id = $1',
    [articleId]
  );
  return rowCount > 0;
};
