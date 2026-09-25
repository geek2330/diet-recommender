import React, { useState } from 'react';
import { DailyMealPlan, Meal, FoodItem, LoggedMealItem, DietaryPattern } from '../types/diet';
import { PlusCircle, Check, ArrowRightLeft, BookOpen, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface MealPlanViewProps {
  plan: DailyMealPlan;
  dietaryPattern: DietaryPattern;
  onLogMeal: (meal: Meal) => void;
  onLogFoodItem: (item: LoggedMealItem) => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({
  plan,
  dietaryPattern,
  onLogMeal,
  onLogFoodItem,
}) => {
  const [loggedMealIds, setLoggedMealIds] = useState<Record<string, boolean>>({});
  const [activeAlternativeModal, setActiveAlternativeModal] = useState<{
    foodName: string;
    mealId: string;
  } | null>(null);

  const [altQuery, setAltQuery] = useState('');
  const [altResults, setAltResults] = useState<any[]>([]);
  const [isSearchingAlt, setIsSearchingAlt] = useState(false);
  const [altError, setAltError] = useState<string | null>(null);

  const handleLogClick = (meal: Meal) => {
    onLogMeal(meal);
    setLoggedMealIds((prev) => ({ ...prev, [meal.id]: true }));
    setTimeout(() => {
      setLoggedMealIds((prev) => ({ ...prev, [meal.id]: false }));
    }, 2500);
  };

  const openAlternativeSearch = (foodName: string, mealId: string) => {
    setActiveAlternativeModal({ foodName, mealId });
    setAltQuery(foodName);
    fetchAlternatives(foodName);
  };

  const fetchAlternatives = async (queryText: string) => {
    setIsSearchingAlt(true);
    setAltError(null);
    try {
      const res = await fetch(
        `/api/nutrition/alternatives?query=${encodeURIComponent(queryText)}&dietary_pattern=${encodeURIComponent(
          dietaryPattern
        )}&max_results=6`
      );
      if (!res.ok) {
        throw new Error(`Upstream returned status ${res.status}`);
      }
      const data = await res.json();
      setAltResults(data.items || []);
    } catch (err: any) {
      setAltError(err.message || 'Failed to fetch food alternatives');
      setAltResults([]);
    } finally {
      setIsSearchingAlt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Header Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Personalized Meal Plan
              </span>
              <span className="text-xs text-slate-400">USDA FDC Evidence Grounded</span>
            </div>
            <p className="text-sm text-slate-200 font-medium leading-relaxed">{plan.summary}</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-700/60 shrink-0">
            <div className="text-center pr-3 border-r border-slate-800">
              <div className="text-xs text-slate-400">Total Planned</div>
              <div className="text-lg font-bold text-emerald-400">{plan.dailyTargets.calories} kcal</div>
            </div>
            <div className="text-center pr-3 border-r border-slate-800">
              <div className="text-xs text-slate-400">Target Water</div>
              <div className="text-lg font-bold text-cyan-400">{plan.dailyTargets.water_liters} L</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Meals</div>
              <div className="text-lg font-bold text-white">{plan.meals.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plan.meals.map((meal) => {
          const isJustLogged = loggedMealIds[meal.id];

          return (
            <div
              key={meal.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-md group"
            >
              <div>
                {/* Header: Meal Type & Calories */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      {meal.type}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {meal.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-base font-extrabold text-white">{meal.calories}</span>
                    <span className="text-xs text-slate-400 ml-1">kcal</span>
                  </div>
                </div>

                {/* Macro Chips */}
                <div className="flex items-center gap-2 py-2.5 text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                    Protein: <strong>{meal.proteinG}g</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    Carbs: <strong>{meal.carbsG}g</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20">
                    Fat: <strong>{meal.fatG}g</strong>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mb-3 italic">{meal.description}</p>

                {/* Food Items Breakdown */}
                <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800 space-y-2 mb-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recommended Ingredients & Portions
                  </div>
                  <ul className="space-y-1.5">
                    {meal.foods.map((food, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          <span className="text-slate-200 font-medium">{food.name}</span>
                          <span className="text-slate-400 text-[11px]">({food.portion})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 text-[11px]">{food.calories} kcal</span>
                          <button
                            type="button"
                            onClick={() => openAlternativeSearch(food.name, meal.id)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Find alternative ingredient using MCP"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Health note */}
                {meal.healthNotes && (
                  <div className="flex items-start space-x-2 text-[11px] text-emerald-400/90 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40 mb-3">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{meal.healthNotes}</span>
                  </div>
                )}
              </div>

              {/* Action Button: Log to Tracker */}
              <button
                type="button"
                onClick={() => handleLogClick(meal)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm ${
                  isJustLogged
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700/80 hover:bg-emerald-600 text-white border border-slate-600 hover:border-emerald-500'
                }`}
              >
                {isJustLogged ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Logged to Daily Tracker!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Log this Meal to Tracker ({meal.calories} kcal)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Evidence & Scientific Grounding Card (Miro Literature Review Agent) */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-white">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold">Scientific Rationale & Dietary Literature Review</h3>
        </div>
        <p className="text-xs text-slate-400">
          Synthesized according to clinical nutrition paradigms (DASH, Mediterranean Heart Health, and WHO macronutrient boundaries).
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {plan.evidenceGuidelines.map((guideline, idx) => (
            <li
              key={idx}
              className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
            >
              <span className="text-emerald-400 font-bold">•</span>
              <span>{guideline}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternative Food Modal (powered by g8_find_food_alternatives) */}
      {activeAlternativeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Find Food Alternative (MCP Tool: <code className="text-xs text-emerald-300">g8_find_food_alternatives</code>)
                </h3>
              </div>
              <button
                onClick={() => setActiveAlternativeModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Search Alternative for:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={altQuery}
                  onChange={(e) => setAltQuery(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ingredient name..."
                />
                <button
                  type="button"
                  onClick={() => fetchAlternatives(altQuery)}
                  disabled={isSearchingAlt || !altQuery.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {isSearchingAlt ? 'Searching...' : 'Search MCP'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Pattern: <span className="text-emerald-400 font-semibold">{dietaryPattern}</span> (via USDA FoodData Central)
              </p>
            </div>

            {/* Results */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {isSearchingAlt && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Querying USDA FoodData Central upstream...
                </div>
              )}

              {altError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{altError}</span>
                </div>
              )}

              {!isSearchingAlt && altResults.length === 0 && !altError && (
                <div className="text-center py-6 text-xs text-slate-400">
                  No direct alternatives found for "{altQuery}". Try another keyword like "almond milk", "tofu", or "lentils".
                </div>
              )}

              {altResults.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs flex items-center justify-between hover:border-emerald-500/50 transition-all"
                >
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.brand ? `Brand: ${item.brand} • ` : ''}
                      {item.serving_size ? `${item.serving_size}${item.serving_unit || 'g'} • ` : ''}
                      Calories: <span className="text-emerald-400 font-bold">{item.nutrients?.calories ?? '--'} kcal</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogFoodItem({
                        id: `alt-${Date.now()}-${idx}`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        mealType: 'Snacks',
                        name: item.name,
                        calories: item.nutrients?.calories || 100,
                        proteinG: item.nutrients?.protein_g || 0,
                        carbsG: item.nutrients?.carbs_g || 0,
                        fatG: item.nutrients?.fat_g || 0,
                        portion: `${item.serving_size || 100}${item.serving_unit || 'g'}`,
                      });
                      setActiveAlternativeModal(null);
                    }}
                    className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-emerald-500/30 transition-all shrink-0 ml-2"
                  >
                    Log to Tracker
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAlternativeModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
