import { pool } from '../db.js';

export const getFeeds = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM feeds ORDER BY created_at DESC'
  );
  return rows;
};

export const getFeedById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM feeds WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

export const createFeed = async ({ name, url }) => {
  const { rows } = await pool.query(
    `INSERT INTO feeds (name, url)
     VALUES ($1, $2)
     RETURNING *`,
    [name, url]
  );
  return rows[0];
};

export const updateFeed = async (id, { name, url, is_active }) => {
  const { rows } = await pool.query(
    `UPDATE feeds
     SET name = COALESCE($1, name),
         url = COALESCE($2, url),
         is_active = COALESCE($3, is_active)
     WHERE id = $4
     RETURNING *`,
    [name ?? null, url ?? null, is_active ?? null, id]
  );
  return rows[0] || null;
};

export const deleteFeed = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM feeds WHERE id = $1',
    [id]
  );
  return rowCount > 0;
};

export const updateFeedLastFetched = async (id) => {
  await pool.query(
    'UPDATE feeds SET last_fetched_at = NOW() WHERE id = $1',
    [id]
  );
};
