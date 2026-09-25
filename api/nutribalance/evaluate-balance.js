import { evaluateNutrientBalance } from '../../lib/nutribalance.js';

/**
 * Serverless / Express Endpoint: POST /api/nutribalance/evaluate-balance
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
    const result = evaluateNutrientBalance(params);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(result);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
  } catch (err) {
    const fallback = evaluateNutrientBalance({ meals: [], target_calories: 2000 });
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallback);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallback));
    }
  }
}
