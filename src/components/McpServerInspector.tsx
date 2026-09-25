import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Play,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Code,
  Layers,
  Sparkles,
  UtensilsCrossed,
  Scale,
} from 'lucide-react';

export const McpServerInspector: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<
    | 'nutribalance_get_daily_meal_structure'
    | 'nutribalance_recommend_meals'
    | 'nutribalance_evaluate_balance'
    | 'g8_search_foods'
    | 'g8_get_food_nutrition'
    | 'g8_find_food_alternatives'
  >('nutribalance_get_daily_meal_structure');

  // NutriBalance Daily Meal Structure inputs
  const [nbGender, setNbGender] = useState<'male' | 'female'>('male');
  const [nbAge, setNbAge] = useState(28);
  const [nbHeightCm, setNbHeightCm] = useState(178);
  const [nbWeightKg, setNbWeightKg] = useState(78);
  const [nbTargetWeightKg, setNbTargetWeightKg] = useState(74);
  const [nbActivityLevel, setNbActivityLevel] = useState('moderate');
  const [nbPrimaryGoal, setNbPrimaryGoal] = useState('weight_loss');
  const [nbDietaryPattern, setNbDietaryPattern] = useState('mediterranean');
  const [nbMealsPerDay, setNbMealsPerDay] = useState(4);

  // NutriBalance Meal Recommendation inputs
  const [nbRecMealType, setNbRecMealType] = useState('Breakfast');
  const [nbRecPattern, setNbRecPattern] = useState('mediterranean');
  const [nbRecCalories, setNbRecCalories] = useState(450);
  const [nbRecMaxResults, setNbRecMaxResults] = useState(3);

  // NutriBalance Evaluate Balance inputs
  const [nbEvalTargetCal, setNbEvalTargetCal] = useState(2000);
  const [nbEvalTargetProtein, setNbEvalTargetProtein] = useState(130);

  // USDA Search & Nutrition inputs
  const [searchQuery, setSearchQuery] = useState('Greek yogurt');
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(3);

  const [nutritionFoodId, setNutritionFoodId] = useState('454004');
  const [nutritionServingG, setNutritionServingG] = useState(150);

  const [altQuery, setAltQuery] = useState('cow milk');
  const [altPattern, setAltPattern] = useState('dairy-free');
  const [altMaxResults, setAltMaxResults] = useState(3);

  // Response states
  const [isLoading, setIsLoading] = useState(false);
  const [rawRequest, setRawRequest] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const toolsInfo = [
    {
      name: 'nutribalance_get_daily_meal_structure',
      group: 'NutriBalance MCP Engine',
      badge: 'Daily Meal Structure',
      description:
        'Calculates an optimal, individualized daily meal structure with slot-by-slot calorie targets, macronutrient splits, protein pacing guidelines, and hydration schedules based on clinical nutrition principles (Mifflin-St Jeor, DASH, Mediterranean, WHO).',
      params: ['gender', 'age', 'height_cm', 'weight_kg', 'activity_level', 'primary_goal', 'dietary_pattern', 'meals_per_day'],
    },
    {
      name: 'nutribalance_recommend_meals',
      group: 'NutriBalance MCP Engine',
      badge: 'Meal Recommendations',
      description:
        'Generates evidence-based, nutritionally balanced meal recommendations with exact USDA food ingredients, portion weights in grams, calories, macro splits, and balance highlights tailored to calorie thresholds and dietary styles.',
      params: ['meal_type', 'dietary_pattern', 'target_calories', 'max_results'],
    },
    {
      name: 'nutribalance_evaluate_balance',
      group: 'NutriBalance MCP Engine',
      badge: 'Nutrient Balance Report',
      description:
        'Evaluates daily food intake or logged meals against clinical targets, generating an objective NutriBalance Score (0-100), sub-scores for calorie accuracy, protein pacing, and macronutrient balance with actionable optimization tips.',
      params: ['target_calories', 'target_protein_g', 'meals (array of food objects)'],
    },
    {
      name: 'g8_search_foods',
      group: 'USDA FoodData Central',
      badge: 'Food Search',
      description:
        'Searches for foods, ingredients, and beverages and returns matching nutritional items with food identifiers from USDA FoodData Central.',
      params: ['query (string, required)', 'page (integer >= 1)', 'page_size (integer >= 1, max 20)'],
    },
    {
      name: 'g8_get_food_nutrition',
      group: 'USDA FoodData Central',
      badge: 'Nutrient Breakdown',
      description:
        'Retrieves detailed macronutrient and micronutrient composition for a specific food item scaled to the specified serving size in grams.',
      params: ['food_id (string, required)', 'serving_g (number > 0)'],
    },
    {
      name: 'g8_find_food_alternatives',
      group: 'USDA FoodData Central',
      badge: 'Food Substitutes',
      description:
        'Searches for factual food alternatives and substitutes that align with a user stated dietary pattern or restriction such as vegetarian, vegan, gluten-free, or dairy-free.',
      params: ['query (string, required)', 'dietary_pattern (string, required)', 'max_results (max 20)'],
    },
  ];

  const handleExecuteTool = async () => {
    setIsLoading(true);

    let args: any = {};
    if (selectedTool === 'nutribalance_get_daily_meal_structure') {
      args = {
        gender: nbGender,
        age: Number(nbAge),
        height_cm: Number(nbHeightCm),
        weight_kg: Number(nbWeightKg),
        target_weight_kg: Number(nbTargetWeightKg),
        activity_level: nbActivityLevel,
        primary_goal: nbPrimaryGoal,
        dietary_pattern: nbDietaryPattern,
        meals_per_day: Number(nbMealsPerDay),
      };
    } else if (selectedTool === 'nutribalance_recommend_meals') {
      args = {
        meal_type: nbRecMealType,
        dietary_pattern: nbRecPattern,
        target_calories: Number(nbRecCalories),
        max_results: Number(nbRecMaxResults),
      };
    } else if (selectedTool === 'nutribalance_evaluate_balance') {
      args = {
        target_calories: Number(nbEvalTargetCal),
        target_protein_g: Number(nbEvalTargetProtein),
        meals: [
          { name: 'Greek Yogurt with Walnuts & Blueberries', calories: 420, protein_g: 28, carbs_g: 38, fat_g: 16 },
          { name: 'Wild Atlantic Salmon Bowl with Quinoa', calories: 580, protein_g: 42, carbs_g: 48, fat_g: 22 },
          { name: 'Raw Almonds & Apple Slices', calories: 190, protein_g: 5, carbs_g: 22, fat_g: 10 },
          { name: 'Herb-Crusted Baked Cod & Sweet Potato', calories: 490, protein_g: 40, carbs_g: 44, fat_g: 14 },
        ],
      };
    } else if (selectedTool === 'g8_search_foods') {
      args = {
        query: searchQuery.trim(),
        page: Number(searchPage),
        page_size: Number(searchPageSize),
      };
    } else if (selectedTool === 'g8_get_food_nutrition') {
      args = {
        food_id: nutritionFoodId.trim(),
        serving_g: Number(nutritionServingG),
      };
    } else if (selectedTool === 'g8_find_food_alternatives') {
      args = {
        query: altQuery.trim(),
        dietary_pattern: altPattern.trim(),
        max_results: Number(altMaxResults),
      };
    }

    const jsonRpcPayload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: selectedTool,
        arguments: args,
      },
    };

    setRawRequest(jsonRpcPayload);

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(jsonRpcPayload),
      });

      const data = await res.json();
      setRawResponse(data);
    } catch (err: any) {
      setRawResponse({
        error: err.message || 'Failed to call MCP server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const geminiAgentSnippet = `// Connecting a Gemini Agent to NutriBalance MCP Server
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The Streamable HTTP MCP endpoint is accessible at:
// https://<deployment-url>/api/mcp
//
// Registered NutriBalance MCP Tools:
// - nutribalance_get_daily_meal_structure: Pacing, slots, hydration & calorie distribution
// - nutribalance_recommend_meals: Clinically balanced breakfasts, lunches, dinners & snacks
// - nutribalance_evaluate_balance: NutriBalance score (0-100) & micronutrient report card
// - g8_search_foods: USDA FoodData Central food search
// - g8_get_food_nutrition: USDA composition scaled to grams
// - g8_find_food_alternatives: Diet-specific food substitutes

const prompt = "Use nutribalance_get_daily_meal_structure to configure a 4-meal Mediterranean plan for a 78kg male targeting weight loss, then recommend a 450 kcal breakfast using nutribalance_recommend_meals.";`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Server className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-white">Streamable HTTP MCP Server Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                NutriBalance MCP Active
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Implements <code className="text-emerald-400 font-mono">@modelcontextprotocol/sdk@1.30.1</code> over Streamable HTTP at{' '}
              <code className="text-emerald-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-700">/api/mcp</code>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
              <span className="text-slate-500">Core Engines: </span>
              <strong className="text-emerald-400 font-mono">NutriBalance + USDA FDC</strong>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
              <span className="text-slate-500">Tools: </span>
              <strong className="text-cyan-400 font-mono">6 registered tools</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Selector & Descriptions */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Available MCP Tools</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolsInfo.map((tool) => (
            <div
              key={tool.name}
              onClick={() => setSelectedTool(tool.name as any)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedTool === tool.name
                  ? 'bg-slate-800/95 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{tool.group}</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">{tool.name}</span>
                  </div>
                  {selectedTool === tool.name && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />}
                </div>
                <div className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {tool.badge}
                </div>
                <p className="text-[11px] text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/50">
                <div className="text-[10px] text-slate-400 font-medium mb-1">Inputs (Zod):</div>
                <div className="flex flex-wrap gap-1">
                  {tool.params.map((p, i) => (
                    <span key={i} className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tool Playground */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Live MCP Tool Playground: <span className="text-emerald-400 font-mono">{selectedTool}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={handleExecuteTool}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isLoading ? 'Executing...' : 'Call Tool via POST /api/mcp'}</span>
          </button>
        </div>

        {/* Inputs per selected tool */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Tool Arguments (Validated with Zod)</span>
            <span className="text-[10px] text-slate-500">JSON-RPC 2.0 tool execution</span>
          </div>

          {/* 1. nutribalance_get_daily_meal_structure */}
          {selectedTool === 'nutribalance_get_daily_meal_structure' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">gender</label>
                <select
                  value={nbGender}
                  onChange={(e) => setNbGender(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="male">male</option>
                  <option value="female">female</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">age (years)</label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={nbAge}
                  onChange={(e) => setNbAge(parseInt(e.target.value) || 28)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">weight_kg</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={nbWeightKg}
                  onChange={(e) => setNbWeightKg(parseFloat(e.target.value) || 75)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">height_cm</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={nbHeightCm}
                  onChange={(e) => setNbHeightCm(parseInt(e.target.value) || 178)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">activity_level</label>
                <select
                  value={nbActivityLevel}
                  onChange={(e) => setNbActivityLevel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="sedentary">sedentary</option>
                  <option value="light">light</option>
                  <option value="moderate">moderate</option>
                  <option value="very_active">very_active</option>
                  <option value="extra_active">extra_active</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">primary_goal</label>
                <select
                  value={nbPrimaryGoal}
                  onChange={(e) => setNbPrimaryGoal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="weight_loss">weight_loss</option>
                  <option value="muscle_gain">muscle_gain</option>
                  <option value="maintenance">maintenance</option>
                  <option value="heart_health">heart_health</option>
                  <option value="athletic_performance">athletic_performance</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">dietary_pattern</label>
                <select
                  value={nbDietaryPattern}
                  onChange={(e) => setNbDietaryPattern(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="mediterranean">mediterranean</option>
                  <option value="dash">dash</option>
                  <option value="high_protein">high_protein</option>
                  <option value="low_carb">low_carb</option>
                  <option value="vegetarian">vegetarian</option>
                  <option value="vegan">vegan</option>
                  <option value="balanced">balanced</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">meals_per_day</label>
                <select
                  value={nbMealsPerDay}
                  onChange={(e) => setNbMealsPerDay(parseInt(e.target.value) || 4)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value={3}>3 meals</option>
                  <option value={4}>4 meals</option>
                  <option value={5}>5 meals</option>
                  <option value={6}>6 meals</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. nutribalance_recommend_meals */}
          {selectedTool === 'nutribalance_recommend_meals' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">meal_type</label>
                <select
                  value={nbRecMealType}
                  onChange={(e) => setNbRecMealType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                  <option value="All">All Slots</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">dietary_pattern</label>
                <select
                  value={nbRecPattern}
                  onChange={(e) => setNbRecPattern(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="mediterranean">mediterranean</option>
                  <option value="dash">dash</option>
                  <option value="high_protein">high_protein</option>
                  <option value="vegan">vegan</option>
                  <option value="vegetarian">vegetarian</option>
                  <option value="balanced">balanced</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">target_calories (kcal)</label>
                <input
                  type="number"
                  min="100"
                  max="1500"
                  value={nbRecCalories}
                  onChange={(e) => setNbRecCalories(parseInt(e.target.value) || 450)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">max_results</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={nbRecMaxResults}
                  onChange={(e) => setNbRecMaxResults(parseInt(e.target.value) || 3)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* 3. nutribalance_evaluate_balance */}
          {selectedTool === 'nutribalance_evaluate_balance' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">target_calories (daily kcal)</label>
                <input
                  type="number"
                  min="1000"
                  max="5000"
                  value={nbEvalTargetCal}
                  onChange={(e) => setNbEvalTargetCal(parseInt(e.target.value) || 2000)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">target_protein_g (daily grams)</label>
                <input
                  type="number"
                  min="40"
                  max="300"
                  value={nbEvalTargetProtein}
                  onChange={(e) => setNbEvalTargetProtein(parseInt(e.target.value) || 130)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2 text-[11px] text-slate-400">
                Sample test meals provided: Greek Yogurt Parfait, Atlantic Salmon Bowl, Almonds + Apple, Baked Cod Fillet.
              </div>
            </div>
          )}

          {/* 4. g8_search_foods */}
          {selectedTool === 'g8_search_foods' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">query (string)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">page (integer &gt;= 1)</label>
                <input
                  type="number"
                  min="1"
                  value={searchPage}
                  onChange={(e) => setSearchPage(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">page_size (integer 1-20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={searchPageSize}
                  onChange={(e) => setSearchPageSize(parseInt(e.target.value) || 3)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* 5. g8_get_food_nutrition */}
          {selectedTool === 'g8_get_food_nutrition' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">food_id (string, e.g. 454004)</label>
                <input
                  type="text"
                  value={nutritionFoodId}
                  onChange={(e) => setNutritionFoodId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">serving_g (number &gt; 0)</label>
                <input
                  type="number"
                  min="1"
                  value={nutritionServingG}
                  onChange={(e) => setNutritionServingG(parseFloat(e.target.value) || 100)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* 6. g8_find_food_alternatives */}
          {selectedTool === 'g8_find_food_alternatives' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">query (food to replace)</label>
                <input
                  type="text"
                  value={altQuery}
                  onChange={(e) => setAltQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">dietary_pattern (restriction)</label>
                <input
                  type="text"
                  value={altPattern}
                  onChange={(e) => setAltPattern(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">max_results (max 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={altMaxResults}
                  onChange={(e) => setAltMaxResults(parseInt(e.target.value) || 3)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* JSON-RPC Request and Response View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Request Payload */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Client JSON-RPC 2.0 Request:</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 leading-tight">
              {rawRequest
                ? JSON.stringify(rawRequest, null, 2)
                : '// Click "Call Tool" to preview JSON-RPC 2.0 request payload'}
            </pre>
          </div>

          {/* Response Payload */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Server JSON-RPC 2.0 Response:</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72 leading-tight">
              {rawResponse
                ? JSON.stringify(rawResponse, null, 2)
                : '// Response from Streamable HTTP transport will appear here'}
            </pre>
          </div>
        </div>
      </div>

      {/* Gemini Agent Integration Reference */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Connecting External Gemini Agents (NutriBalance MCP Protocol)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => copyCode(geminiAgentSnippet)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
          >
            {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Autonomous agents query <code className="text-emerald-300 font-mono">/api/mcp</code> using standard JSON-RPC 2.0 or Gemini function calls to generate meal structures and evidence-grounded recommendations.
        </p>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
          {geminiAgentSnippet}
        </pre>
      </div>
    </div>
  );
};
