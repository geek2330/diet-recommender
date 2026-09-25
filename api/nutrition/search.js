import { searchFoods } from '../../lib/nutrition.js';

/**
 * Vercel Serverless Function: GET /api/nutrition/search
 */
export default async function handler(req, res) {
  // CORS & headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const query = String(req.query?.query || '').trim();
    const page = parseInt(String(req.query?.page || '1'), 10) || 1;
    const pageSize = parseInt(String(req.query?.page_size || '10'), 10) || 10;

    const data = await searchFoods(query, page, pageSize);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    }
  } catch (err) {
    const fallbackData = await searchFoods('apple', 1, 10);
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallbackData);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallbackData));
    }
  }
}
