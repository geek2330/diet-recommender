import React, { useState, useMemo } from 'react';
import { DailyMealPlan, Meal, LoggedMealItem, DietaryPattern } from '../types/diet';
import {
  PlusCircle,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  UtensilsCrossed,
  Award,
} from 'lucide-react';
import { getDailyMealStructure, getMealRecommendations } from '../../lib/nutribalance.js';

interface MealPlanViewProps {
  plan: DailyMealPlan;
  dietaryPattern: DietaryPattern;
  onLogMeal: (meal: Meal) => void;
  onLogFoodItem?: (item: LoggedMealItem) => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({
  plan,
  dietaryPattern,
  onLogMeal,
}) => {
  const [loggedMealIds, setLoggedMealIds] = useState<Record<string, boolean>>({});

  // NutriBalance Meal Structure inspection state
  const [showStructureDrawer, setShowStructureDrawer] = useState(true);
  const [selectedRecCategory, setSelectedRecCategory] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('All');

  // Compute NutriBalance Daily Meal Structure dynamically from plan targets
  const nutribalanceStructure = useMemo(() => {
    return getDailyMealStructure({
      dietary_pattern: dietaryPattern,
      target_calories: plan.dailyTargets.calories,
      meals_per_day: Math.max(3, Math.min(6, plan.meals?.length || 4)),
    });
  }, [dietaryPattern, plan.dailyTargets.calories, plan.meals?.length]);

  // Curated NutriBalance meal recommendations matching pattern
  const nutribalanceRecommendations = useMemo(() => {
    return getMealRecommendations({
      meal_type: selectedRecCategory === 'All' ? undefined : selectedRecCategory,
      dietary_pattern: dietaryPattern,
      target_calories: Math.round(plan.dailyTargets.calories / 3.5),
      max_results: 6,
    }).recommendations;
  }, [selectedRecCategory, dietaryPattern, plan.dailyTargets.calories]);

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
              <div className="text-lg font-bold text-white">{nutribalanceStructure.meal_slots.length}</div>
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
    </div>
  );
};
