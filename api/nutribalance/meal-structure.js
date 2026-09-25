import { getDailyMealStructure } from '../../lib/nutribalance.js';

/**
 * Serverless / Express Endpoint: POST & GET /api/nutribalance/meal-structure
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
    const structure = getDailyMealStructure(params);

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(structure);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(structure));
    }
  } catch (err) {
    const fallback = getDailyMealStructure({
      gender: 'male',
      age: 28,
      height_cm: 178,
      weight_kg: 75,
      activity_level: 'moderate',
      primary_goal: 'maintenance',
      dietary_pattern: 'mediterranean',
      meals_per_day: 4,
    });

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(200).json(fallback);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallback));
    }
  }
}
