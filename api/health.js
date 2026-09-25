/**
 * API Health Check Handler
 * Compatible with Vercel Serverless Functions (/api/health) and Express server.
 */
export default function handler(req, res) {
  const healthData = {
    status: 'ok',
    healthy: true,
    service: 'diet-recommender-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime() * 100) / 100,
    mcp_server: {
      name: 'diet_server',
      version: '1.0.0',
      endpoint: '/api/mcp',
      status: 'online',
      tools: [
        'g8_search_foods',
        'g8_get_food_nutrition',
        'g8_find_food_alternatives',
        'nutribalance_get_daily_meal_structure',
        'nutribalance_recommend_meals',
        'nutribalance_evaluate_balance',
      ],
      nutribalance: {
        status: 'online',
        features: ['daily_meal_structure', 'meal_recommendations', 'nutrient_balance_evaluation'],
      },
    },
    upstream: {
      provider: 'USDA FoodData Central',
      status: 'healthy',
    },
    endpoints: {
      mcp: '/api/mcp',
      health: '/api/health',
      search: '/api/nutrition/search',
      details: '/api/nutrition/details',
      alternatives: '/api/nutrition/alternatives',
      recommend_plan: '/api/recommend-plan',
      nutribalance_meal_structure: '/api/nutribalance/meal-structure',
      nutribalance_recommend_meals: '/api/nutribalance/recommend-meals',
      nutribalance_evaluate_balance: '/api/nutribalance/evaluate-balance',
    },
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(200).json(healthData);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData));
  }
}
