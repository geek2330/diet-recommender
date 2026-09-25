import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { searchFoods, getFoodNutrition, findFoodAlternatives } from '../lib/nutrition.js';

/**
 * MCP Server HTTP Handler for Streamable HTTP
 * Exported as default for Express preview and Vercel Serverless compatibility.
 */
export default async function handler(req, res) {
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
