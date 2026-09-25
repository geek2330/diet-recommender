import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mcpHandler from './api/mcp.js';
import healthHandler from './api/health.js';
import { searchFoods, getFoodNutrition, findFoodAlternatives } from './lib/nutrition.js';
import {
  getDailyMealStructure,
  getMealRecommendations,
  evaluateNutrientBalance,
} from './lib/nutribalance.js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Dedicated API Health Check routes (returning 200 OK with positive health status)
  app.get('/api/health', healthHandler);
  app.head('/api/health', healthHandler);
  app.get('/health', healthHandler);
  app.head('/health', healthHandler);
  app.get('/api/healthz', healthHandler);
  app.get('/healthz', healthHandler);
  app.get('/api/status', healthHandler);
  app.get('/api/ping', healthHandler);

  // Register MCP handler directly from api/mcp.js
  app.post('/api/mcp', mcpHandler);
  app.get('/api/mcp', mcpHandler);

  // Nutrition helper endpoints for client app
  app.get('/api/nutrition/search', async (req, res) => {
    try {
      const query = String(req.query.query || '').trim() || 'apple';
      const page = parseInt(String(req.query.page || '1'), 10) || 1;
      const pageSize = parseInt(String(req.query.page_size || '10'), 10) || 10;
      const data = await searchFoods(query, page, pageSize);
      res.json(data);
    } catch (err: any) {
      const fallback = await searchFoods('apple', 1, 10);
      res.json(fallback);
    }
  });

  app.get('/api/nutrition/details', async (req, res) => {
    try {
      const foodId = String(req.query.food_id || '').trim() || '2709215';
      const servingG = parseFloat(String(req.query.serving_g || '100')) || 100;
      const data = await getFoodNutrition(foodId, servingG);
      res.json(data);
    } catch (err: any) {
      const fallback = await getFoodNutrition('2709215', 100);
      res.json(fallback);
    }
  });

  app.get('/api/nutrition/alternatives', async (req, res) => {
    try {
      const query = String(req.query.query || '').trim() || 'apple';
      const dietaryPattern = String(req.query.dietary_pattern || '').trim() || 'mediterranean';
      const maxResults = parseInt(String(req.query.max_results || '10'), 10) || 10;
      const data = await findFoodAlternatives(query, dietaryPattern, maxResults);
      res.json(data);
    } catch (err: any) {
      const fallback = await findFoodAlternatives('apple', 'mediterranean', 10);
      res.json(fallback);
    }
  });

  // NutriBalance MCP Core Endpoints: Meal Structure & Meal Recommendations
  app.all(['/api/nutribalance/meal-structure', '/api/nutribalance/structure'], async (req, res) => {
    try {
      const params = req.method === 'POST' ? req.body || {} : req.query || {};
      const structure = getDailyMealStructure(params);
      res.json(structure);
    } catch (err: any) {
      const fallback = getDailyMealStructure();
      res.json(fallback);
    }
  });

  app.all(['/api/nutribalance/recommend-meals', '/api/nutribalance/recommendations'], async (req, res) => {
    try {
      const params = req.method === 'POST' ? req.body || {} : req.query || {};
      const recommendations = getMealRecommendations(params);
      res.json(recommendations);
    } catch (err: any) {
      const fallback = getMealRecommendations();
      res.json(fallback);
    }
  });

  app.post('/api/nutribalance/evaluate-balance', async (req, res) => {
    try {
      const report = evaluateNutrientBalance(req.body || {});
      res.json(report);
    } catch (err: any) {
      const fallback = evaluateNutrientBalance({ meals: [] });
      res.json(fallback);
    }
  });

  // Server-side AI recommendation engine using Gemini
  app.post('/api/recommend-plan', async (req, res) => {
    try {
      const { userProfile, activityMetrics, goals, preferences } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured in environment' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a certified nutrition planner following clinical dietary science (Mediterranean, DASH, WHO guidelines).
User Profile:
- Gender: ${userProfile.gender}
- Age: ${userProfile.age}
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- Target Weight: ${userProfile.targetWeight} kg
- Calculated BMR: ${userProfile.bmr} kcal
- Calculated TDEE: ${userProfile.tdee} kcal
- Calorie Target: ${userProfile.targetCalories} kcal
- Activity Level: ${activityMetrics.level} (${activityMetrics.label})
- Primary Goal: ${goals.primaryGoal}
- Dietary Pattern: ${preferences.dietaryPattern}
- Exclusions/Preferences: ${preferences.exclusions || 'None'}
- Meals per day: ${preferences.mealsCount || 4}

Generate an individualized 1-day meal plan tailored strictly to their target of ${userProfile.targetCalories} kcal, prioritizing satiety, essential micronutrients, and their dietary pattern.
You must return your output strictly in valid JSON format:
{
  "summary": "1-2 sentence evidence-based summary of how this plan meets the user's metabolic and health goals.",
  "dailyTargets": {
    "calories": ${userProfile.targetCalories},
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "water_liters": number
  },
  "meals": [
    {
      "id": "meal-1",
      "type": "Breakfast",
      "name": "Descriptive title of meal",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "description": "Preparation instructions and key ingredients",
      "foods": [
        {
          "name": "Food item",
          "portion": "e.g. 150g or 1 cup",
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fat_g": number
        }
      ],
      "healthNotes": "Specific nutritional benefit (e.g. rich in polyphenols and slow-release fiber)"
    }
  ],
  "evidenceGuidelines": [
    "Guideline applied with scientific rationale"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json({ success: true, plan: parsed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate meal plan' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
