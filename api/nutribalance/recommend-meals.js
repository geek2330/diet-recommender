import { getMealRecommendations } from '../../lib/nutribalance.js';

/**
 * Serverless / Express Endpoint: POST & GET /api/nutribalance/recommend-meals
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const params = req.method === 'POST' ? req.body || {} : req.query || {};
    const result = getMealRecommendations(params);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(result);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
  } catch (err) {
    const fallback = getMealRecommendations({ meal_type: 'Breakfast', dietary_pattern: 'balanced' });
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallback);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallback));
    }
  }
}
