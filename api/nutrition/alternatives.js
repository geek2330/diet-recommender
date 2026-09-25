import { findFoodAlternatives } from '../../lib/nutrition.js';

/**
 * Vercel Serverless Function: GET /api/nutrition/alternatives
 */
export default async function handler(req, res) {
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
    const dietaryPattern = String(req.query?.dietary_pattern || '').trim();
    const maxResults = parseInt(String(req.query?.max_results || '10'), 10) || 10;

    const data = await findFoodAlternatives(query, dietaryPattern, maxResults);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    }
  } catch (err) {
    const fallbackData = await findFoodAlternatives('apple', 'mediterranean', 10);
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallbackData);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallbackData));
    }
  }
}
