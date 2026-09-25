import { getFoodNutrition } from '../../lib/nutrition.js';

/**
 * Vercel Serverless Function: GET /api/nutrition/details
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
    const foodId = String(req.query?.food_id || '').trim();
    const servingG = parseFloat(String(req.query?.serving_g || '100')) || 100;

    const data = await getFoodNutrition(foodId, servingG);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    }
  } catch (err) {
    const fallbackData = await getFoodNutrition('2709215', 100);
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallbackData);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallbackData));
    }
  }
}
