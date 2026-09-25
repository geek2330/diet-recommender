import { GoogleGenAI } from '@google/genai';

/**
 * Vercel Serverless Function: POST /api/recommend-plan
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { userProfile, activityMetrics, goals, preferences } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY is not configured in environment' }));
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a certified nutrition planner following clinical dietary science (Mediterranean, DASH, WHO guidelines).
User Profile:
- Gender: ${userProfile?.gender || 'not specified'}
- Age: ${userProfile?.age || 30}
- Height: ${userProfile?.height || 170} cm
- Weight: ${userProfile?.weight || 70} kg
- Target Weight: ${userProfile?.targetWeight || 70} kg
- Calculated BMR: ${userProfile?.bmr || 1600} kcal
- Calculated TDEE: ${userProfile?.tdee || 2100} kcal
- Calorie Target: ${userProfile?.targetCalories || 2000} kcal
- Activity Level: ${activityMetrics?.level || 'moderate'}
- Primary Goal: ${goals?.primaryGoal || 'maintenance'}
- Dietary Pattern: ${preferences?.dietaryPattern || 'balanced'}
- Exclusions: ${preferences?.exclusions || 'None'}
- Meals per day: ${preferences?.mealsCount || 4}

Generate an individualized 1-day meal plan tailored strictly to their target of ${userProfile?.targetCalories || 2000} kcal.
Return your output strictly as a JSON object:
{
  "summary": "1-2 sentence evidence-based summary",
  "dailyTargets": {
    "calories": ${userProfile?.targetCalories || 2000},
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "water_liters": number
  },
  "meals": [
    {
      "id": "meal-1",
      "type": "Breakfast",
      "name": "Title",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "description": "Details",
      "foods": [
        {
          "name": "Food item",
          "portion": "100g",
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fat_g": number
        }
      ],
      "healthNotes": "Clinical benefit"
    }
  ],
  "micronutrientHighlights": ["Item 1", "Item 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const plan = JSON.parse(response.text || '{}');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, plan }));
  } catch (err) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
