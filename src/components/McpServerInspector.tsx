import React, { useState } from 'react';
import { Server, Terminal, Play, CheckCircle2, ShieldCheck, ArrowRight, Copy, Check, Code, Layers } from 'lucide-react';

export const McpServerInspector: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<'g8_search_foods' | 'g8_get_food_nutrition' | 'g8_find_food_alternatives'>('g8_search_foods');

  // Input states
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
      name: 'g8_search_foods',
      description:
        'Searches for foods, ingredients, and beverages and returns matching nutritional items with food identifiers. Upstream food composition data is provided by USDA FoodData Central. A Gemini agent should use this tool when a user seeks food nutrition records, ingredient information, or needs to look up food items for meal planning. This tool does not diagnose medical conditions, evaluate health risks, or generate diet plans.',
      params: ['query (string, required)', 'page (integer >= 1)', 'page_size (integer >= 1, max 20)'],
    },
    {
      name: 'g8_get_food_nutrition',
      description:
        'Retrieves detailed macronutrient and micronutrient composition for a specific food item scaled to the specified serving size in grams. Upstream nutritional data is provided by USDA FoodData Central. A Gemini agent should use this tool when precise caloric, protein, carbohydrate, fat, or vitamin breakdowns are needed for a specific food. This tool does not estimate unmeasured nutrients, provide medical dietary prescriptions, or calculate individual metabolic needs.',
      params: ['food_id (string, required)', 'serving_g (number > 0)'],
    },
    {
      name: 'g8_find_food_alternatives',
      description:
        'Searches for factual food alternatives and substitutes that align with a user stated dietary pattern or restriction such as vegetarian, vegan, gluten-free, or dairy-free. Upstream food product and composition data is retrieved from USDA FoodData Central. A Gemini agent should use this tool when a user requests substitute ingredients or food replacements conforming to their nutritional preferences. This tool does not assess allergen severity, treat food sensitivities, or infer underlying medical diagnoses.',
      params: ['query (string, required)', 'dietary_pattern (string, required)', 'max_results (integer >= 1, max 20)'],
    },
  ];

  const handleExecuteTool = async () => {
    setIsLoading(true);

    let args: any = {};
    if (selectedTool === 'g8_search_foods') {
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

  const geminiAgentSnippet = `// Connecting a Gemini Agent to this Streamable HTTP MCP Server
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The MCP endpoint is accessible at:
// https://<deployment-url>/api/mcp
// Gemini agents use Streamable HTTP to discover and call:
// - g8_search_foods
// - g8_get_food_nutrition
// - g8_find_food_alternatives

const prompt = "Recommend a healthy high-protein breakfast and verify the calories using g8_search_foods.";
// Agent queries the diet_server MCP endpoint autonomously.`;

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
                Active & Stateless
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Implements <code className="text-emerald-400 font-mono">@modelcontextprotocol/sdk@1.30.1</code> over Streamable HTTP at{' '}
              <code className="text-emerald-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-700">/api/mcp</code>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
              <span className="text-slate-500">Upstream: </span>
              <strong className="text-emerald-400 font-mono">USDA FoodData Central</strong>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
              <span className="text-slate-500">Security: </span>
              <strong className="text-cyan-400 font-mono">readOnlyHint=true</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Selector & Descriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {toolsInfo.map((tool) => (
          <div
            key={tool.name}
            onClick={() => setSelectedTool(tool.name as any)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedTool === tool.name
                ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <span className="font-mono text-xs font-bold text-emerald-400">{tool.name}</span>
                {selectedTool === tool.name && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-300 mt-2 line-clamp-4 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/50">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Inputs (Zod):</div>
              <div className="space-y-0.5">
                {tool.params.map((p, i) => (
                  <div key={i} className="text-[10px] text-slate-400 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
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
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Tool Arguments (Validated with Zod)
          </div>

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
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-64 leading-tight">
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
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-64 leading-tight">
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
              Connecting External Gemini Agents (Streamable HTTP / mcpToTool)
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
          Other teams' Gemini agents connect directly to this application's <code className="text-emerald-300 font-mono">/api/mcp</code> endpoint over Streamable HTTP without maintaining server-side conversational state.
        </p>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
          {geminiAgentSnippet}
        </pre>
      </div>
    </div>
  );
};
