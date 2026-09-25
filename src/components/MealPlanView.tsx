import React, { useState, useMemo } from 'react';
import { DailyMealPlan, Meal, FoodItem, LoggedMealItem, DietaryPattern } from '../types/diet';
import {
  PlusCircle,
  Check,
  ArrowRightLeft,
  BookOpen,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  ShieldCheck,
  UtensilsCrossed,
  Layers,
  Award,
} from 'lucide-react';
import { getDailyMealStructure, getMealRecommendations } from '../../lib/nutribalance.js';

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

  // NutriBalance Meal Structure inspection state
  const [showStructureDrawer, setShowStructureDrawer] = useState(true);
  const [selectedRecCategory, setSelectedRecCategory] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('All');

  // Compute NutriBalance Daily Meal Structure dynamically from plan targets
  const nutribalanceStructure = useMemo(() => {
    return getDailyMealStructure({
      dietary_pattern: dietaryPattern,
      target_calories: plan.dailyTargets.calories,
      meals_per_day: Math.max(3, Math.min(6, plan.meals.length || 4)),
    });
  }, [dietaryPattern, plan.dailyTargets.calories, plan.meals.length]);

  // Curated NutriBalance meal recommendations matching pattern
  const nutribalanceRecommendations = useMemo(() => {
    return getMealRecommendations({
      meal_type: selectedRecCategory === 'All' ? undefined : selectedRecCategory,
      dietary_pattern: dietaryPattern,
      target_calories: Math.round(plan.dailyTargets.calories / 3.5),
      max_results: 6,
    }).recommendations;
  }, [selectedRecCategory, dietaryPattern, plan.dailyTargets.calories]);

  const handleLogClick = (meal: Meal) => {
    onLogMeal(meal);
    setLoggedMealIds((prev) => ({ ...prev, [meal.id]: true }));
    setTimeout(() => {
      setLoggedMealIds((prev) => ({ ...prev, [meal.id]: false }));
    }, 2500);
  };

  const handleAdoptNutriBalanceMeal = (recMeal: any) => {
    const newMeal: Meal = {
      id: `nb-${Date.now()}`,
      type: recMeal.meal_type === 'Breakfast'
        ? 'Breakfast'
        : recMeal.meal_type === 'Lunch'
        ? 'Lunch'
        : recMeal.meal_type === 'Dinner'
        ? 'Dinner'
        : 'Morning Snack',
      name: recMeal.name,
      calories: recMeal.calories,
      proteinG: recMeal.protein_g,
      carbsG: recMeal.carbs_g,
      fatG: recMeal.fat_g,
      description: recMeal.description,
      foods: recMeal.ingredients.map((ing: any) => ({
        name: ing.name,
        portion: ing.portion,
        calories: ing.calories,
        proteinG: ing.protein_g,
        carbsG: ing.carbs_g,
        fatG: ing.fat_g,
      })),
      healthNotes: recMeal.balance_highlights?.[0] || 'Clinically balanced NutriBalance recommendation.',
    };

    onLogMeal(newMeal);
    setLoggedMealIds((prev) => ({ ...prev, [recMeal.meal_id]: true }));
    setTimeout(() => {
      setLoggedMealIds((prev) => ({ ...prev, [recMeal.meal_id]: false }));
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
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                NutriBalance MCP Grounded
              </span>
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

      {/* NutriBalance MCP Daily Meal Structure & Pacing Guide */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">
                  NutriBalance MCP: Daily Meal Structure & Pacing Blueprint
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  /api/mcp
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diurnal nutrient pacing and muscle protein synthesis (MPS) thresholds calibrated to {dietaryPattern} guidelines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowStructureDrawer(!showStructureDrawer)}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <span>{showStructureDrawer ? 'Hide Structure' : 'Show Structure'}</span>
            {showStructureDrawer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showStructureDrawer && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Meal Slot Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nutribalanceStructure.meal_slots.map((slot: any) => (
                <div
                  key={slot.slot_index}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span>{slot.slot_name}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {slot.recommended_timing}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-amber-400">{slot.target_calories}</span>
                      <span className="text-xs text-slate-400">kcal ({slot.calorie_percentage}%)</span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-0.5">
                      <span className="text-indigo-400 font-semibold">P: {slot.target_protein_g}g</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400 font-semibold">C: {slot.target_carbs_g}g</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-rose-400 font-semibold">F: {slot.target_fat_g}g</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 leading-snug">
                      {slot.description}
                    </p>
                  </div>

                  <div className="text-[10px] font-medium text-emerald-400/90 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/50 mt-1">
                    {slot.protein_pacing_guideline}
                  </div>
                </div>
              ))}
            </div>

            {/* Pacing Rules list */}
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">NutriBalance Pacing Principle:</span>
                <span className="text-slate-400">
                  {nutribalanceStructure.pacing_rules[1] || 'Front-load calories for metabolic alignment.'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {nutribalanceStructure.evidence_framework}
              </span>
            </div>
          </div>
        )}
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

              {/* Log Meal Button */}
              <button
                type="button"
                onClick={() => handleLogClick(meal)}
                disabled={isJustLogged}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md ${
                  isJustLogged
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {isJustLogged ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Logged to Daily Intake Tracker!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Log this Meal to Tracker</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* NutriBalance Curated Meal Recommendations Library */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                NutriBalance MCP Curated Meal Recommendations
              </h3>
              <p className="text-xs text-slate-400">
                Scientifically formulated recipes with balanced micronutrients and authentic USDA FDC portions
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedRecCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedRecCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nutribalanceRecommendations.map((rec: any) => {
            const isLogged = loggedMealIds[rec.meal_id];

            return (
              <div
                key={rec.meal_id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rec.meal_type}
                    </span>
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400">
                      <Award className="h-3.5 w-3.5" />
                      <span>{rec.balance_score}/100</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-2 line-clamp-1">{rec.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="flex items-center justify-between py-2 text-xs">
                    <span className="font-extrabold text-amber-400">{rec.calories} kcal</span>
                    <div className="text-[10px] text-slate-400 space-x-1.5">
                      <span>P: {rec.protein_g}g</span>
                      <span>•</span>
                      <span>C: {rec.carbs_g}g</span>
                      <span>•</span>
                      <span>F: {rec.fat_g}g</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  {rec.balance_highlights && rec.balance_highlights.length > 0 && (
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 text-[10px] text-emerald-300/90 leading-tight">
                      ✓ {rec.balance_highlights[0]}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAdoptNutriBalanceMeal(rec)}
                  disabled={isLogged}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    isLogged
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {isLogged ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Logged to Tracker!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Adopt & Log Recommendation</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidelines Accordion */}
      {plan.evidenceGuidelines && plan.evidenceGuidelines.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-xs space-y-2">
          <div className="font-semibold text-slate-300 flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Clinical Evidence & Guidelines Followed</span>
          </div>
          <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
            {plan.evidenceGuidelines.map((guideline, idx) => (
              <li key={idx}>{guideline}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal for USDA Alternative Search */}
      {activeAlternativeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Find USDA Substitute</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAlternativeModal(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
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
