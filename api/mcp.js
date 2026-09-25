import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { searchFoods, getFoodNutrition, findFoodAlternatives } from '../lib/nutrition.js';
import {
  getDailyMealStructure,
  getMealRecommendations,
  evaluateNutrientBalance,
} from '../lib/nutribalance.js';

/**
 * MCP Server HTTP Handler for Streamable HTTP
 * Exported as default for Express preview and Vercel Serverless compatibility.
 */
export default async function handler(req, res) {
  // Support positive API health check and status on GET / HEAD requests to /api/mcp
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        healthy: true,
        service: 'diet_server',
        version: '1.0.0',
        endpoint: '/api/mcp',
        transport: 'StreamableHTTP',
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
          version: '1.0.0',
          features: ['daily_meal_structure', 'meal_recommendations', 'nutrient_balance_evaluation'],
        },
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed',
        },
        id: null,
      })
    );
    return;
  }

  // Handle standard JSON-RPC ping / healthcheck directly to ensure positive health check
  if (req.body && typeof req.body === 'object') {
    if (req.body.method === 'ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          result: {},
          id: req.body.id !== undefined ? req.body.id : 1,
        })
      );
      return;
    }
    if (req.body.method === 'health' || req.body.method === 'healthcheck') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          result: {
            status: 'ok',
            healthy: true,
            service: 'diet_server',
            version: '1.0.0',
          },
          id: req.body.id !== undefined ? req.body.id : 1,
        })
      );
      return;
    }
  }

  // Ensure Accept header includes text/event-stream in both req.headers and req.rawHeaders
  // to avoid 406 Not Acceptable from StreamableHTTP transport when called by standard HTTP clients
  req.headers['accept'] = 'application/json, text/event-stream';
  if (Array.isArray(req.rawHeaders)) {
    let found = false;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      if (req.rawHeaders[i].toLowerCase() === 'accept') {
        req.rawHeaders[i + 1] = 'application/json, text/event-stream';
        found = true;
        break;
      }
    }
    if (!found) {
      req.rawHeaders.push('Accept', 'application/json, text/event-stream');
    }
  }

  // 1. Create a fresh, stateless server per request
  const server = new McpServer({
    name: 'diet_server',
    version: '1.0.0',
  });

  // 2. Register all MCP tools
  server.registerTool(
    'g8_search_foods',
    {
      description:
        'Searches for foods, ingredients, and beverages and returns matching nutritional items with food identifiers. Upstream food composition data is provided by USDA FoodData Central. A Gemini agent should use this tool when a user seeks food nutrition records, ingredient information, or needs to look up food items for meal planning. This tool does not diagnose medical conditions, evaluate health risks, or generate diet plans.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('A non-empty string containing the food, ingredient or beverage to search for.'),
        page: z
          .number()
          .int()
          .positive()
          .describe('A positive integer page number, starting at 1.'),
        page_size: z
          .number()
          .int()
          .positive()
          .describe(
            'A positive integer specifying the maximum number of upstream results requested for the page.'
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ query, page, page_size }) => {
      try {
        const result = await searchFoods(query, page, page_size);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        const status = err.status || 500;
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Nutrition data request failed with upstream status ${status}.`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    'g8_get_food_nutrition',
    {
      description:
        'Retrieves detailed macronutrient and micronutrient composition for a specific food item scaled to the specified serving size in grams. Upstream nutritional data is provided by USDA FoodData Central. A Gemini agent should use this tool when precise caloric, protein, carbohydrate, fat, or vitamin breakdowns are needed for a specific food. This tool does not estimate unmeasured nutrients, provide medical dietary prescriptions, or calculate individual metabolic needs.',
      inputSchema: {
        food_id: z
          .string()
          .min(1)
          .describe('A string identifying the food in the configured nutrition-data upstream.'),
        serving_g: z
          .number()
          .positive()
          .describe('A positive number representing the serving size in grams.'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ food_id, serving_g }) => {
      try {
        const result = await getFoodNutrition(food_id, serving_g);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        const status = err.status || 500;
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Nutrition data request failed with upstream status ${status}.`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    'g8_find_food_alternatives',
    {
      description:
        'Searches for factual food alternatives and substitutes that align with a user stated dietary pattern or restriction such as vegetarian, vegan, gluten-free, or dairy-free. Upstream food product and composition data is retrieved from USDA FoodData Central. A Gemini agent should use this tool when a user requests substitute ingredients or food replacements conforming to their nutritional preferences. This tool does not assess allergen severity, treat food sensitivities, or infer underlying medical diagnoses.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('A non-empty string describing the food or ingredient for which alternatives are requested.'),
        dietary_pattern: z
          .string()
          .min(1)
          .describe(
            'A string describing the user stated dietary pattern or restriction, such as vegetarian, vegan, gluten-free or dairy-free.'
          ),
        max_results: z
          .number()
          .int()
          .positive()
          .describe('A positive integer specifying the maximum number of alternatives to return.'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ query, dietary_pattern, max_results }) => {
      try {
        const result = await findFoodAlternatives(query, dietary_pattern, max_results);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        const status = err.status || 500;
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Nutrition data request failed with upstream status ${status}.`,
            },
          ],
        };
      }
    }
  );

  // 2b. Register NutriBalance MCP tools
  server.registerTool(
    'nutribalance_get_daily_meal_structure',
    {
      description:
        'Calculates an optimal, individualized daily meal structure with slot-by-slot calorie targets, macronutrient splits, protein pacing guidelines, and hydration schedules based on clinical nutrition principles (Mifflin-St Jeor, DASH, Mediterranean, WHO). A Gemini agent should use this tool when a user seeks to structure their daily eating schedule, distribute calories across meals, or align meal pacing with metabolic targets.',
      inputSchema: {
        gender: z.enum(['male', 'female']).describe('Biological sex for baseline BMR calculation.'),
        age: z.number().int().min(10).max(120).describe('User age in years.'),
        height_cm: z.number().positive().describe('Height in centimeters.'),
        weight_kg: z.number().positive().describe('Current body weight in kilograms.'),
        target_weight_kg: z.number().positive().optional().describe('Optional target body weight in kilograms.'),
        activity_level: z
          .enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active'])
          .describe('Physical activity level multiplier.'),
        primary_goal: z
          .enum(['weight_loss', 'muscle_gain', 'maintenance', 'heart_health', 'athletic_performance'])
          .describe('Primary health or body composition goal.'),
        dietary_pattern: z
          .enum([
            'balanced',
            'mediterranean',
            'dash',
            'high_protein',
            'low_carb',
            'vegetarian',
            'vegan',
            'gluten_free',
            'dairy_free',
          ])
          .describe('Clinical dietary pattern or preference.'),
        meals_per_day: z
          .number()
          .int()
          .min(3)
          .max(6)
          .optional()
          .describe('Number of meal slots per day (typically 3, 4, 5, or 6). Defaults to 4.'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const structure = getDailyMealStructure(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(structure),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `NutriBalance daily meal structure calculation failed: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    'nutribalance_recommend_meals',
    {
      description:
        'Generates evidence-based, nutritionally balanced meal recommendations with exact USDA food ingredients, portion weights in grams, calories, macro splits, and balance highlights. A Gemini agent should use this tool when recommending specific breakfasts, lunches, dinners, or snacks that conform to user calorie constraints, dietary preferences (Mediterranean, DASH, High-Protein, Vegan, etc.), and health goals.',
      inputSchema: {
        meal_type: z
          .enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'All'])
          .optional()
          .describe('The target meal slot (Breakfast, Lunch, Dinner, Snacks, or All).'),
        dietary_pattern: z
          .enum([
            'balanced',
            'mediterranean',
            'dash',
            'high_protein',
            'low_carb',
            'vegetarian',
            'vegan',
            'gluten_free',
            'dairy_free',
          ])
          .optional()
          .describe('Dietary style or restriction.'),
        target_calories: z
          .number()
          .positive()
          .optional()
          .describe('Optional target caloric threshold for the meal slot in kcal.'),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe('Maximum number of curated meal recommendations to return (1-10). Defaults to 4.'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const result = getMealRecommendations(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `NutriBalance meal recommendations request failed: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    'nutribalance_evaluate_balance',
    {
      description:
        'Evaluates a daily food intake or set of meals against clinical targets, generating an objective NutriBalance Score (0-100), sub-scores for calorie accuracy, protein pacing, and macronutrient balance, along with prioritized recommendations for nutritional optimization.',
      inputSchema: {
        target_calories: z.number().positive().describe('Target daily caloric intake.'),
        target_protein_g: z.number().positive().optional().describe('Target daily protein in grams.'),
        meals: z
          .array(
            z.object({
              name: z.string().describe('Meal or food name.'),
              calories: z.number().nonnegative().describe('Calories in kcal.'),
              protein_g: z.number().nonnegative().optional().describe('Protein in grams.'),
              carbs_g: z.number().nonnegative().optional().describe('Carbohydrates in grams.'),
              fat_g: z.number().nonnegative().optional().describe('Fat in grams.'),
            })
          )
          .describe('List of meals or food items consumed during the day.'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const report = evaluateNutrientBalance(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(report),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `NutriBalance evaluation failed: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // 3. Create fresh StreamableHTTPServerTransport in stateless mode
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  // 4. Connect server to transport
  await server.connect(transport);

  // 5. Cleanup on response finish / close
  res.on('close', async () => {
    try {
      await transport.close();
    } catch {}
    try {
      await server.close();
    } catch {}
  });

  // 6. Handle the request
  await transport.handleRequest(req, res, req.body);
}
