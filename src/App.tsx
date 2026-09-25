/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, CalculatedMetrics, DailyMealPlan, LoggedMealItem, WaterLogEntry, Meal } from './types/diet';
import { calculateMetrics, generateBaselineMealPlan } from './utils/calculator';
import { Header } from './components/Header';
import { ProfileForm } from './components/ProfileForm';
import { MetricsSummary } from './components/MetricsSummary';
import { MealPlanView } from './components/MealPlanView';
import { CalorieTracker } from './components/CalorieTracker';
import { WaterTracker } from './components/WaterTracker';
import { McpServerInspector } from './components/McpServerInspector';
import { FoodExplorer } from './components/FoodExplorer';
import { FoodSearchModal } from './components/FoodSearchModal';
import { ApiHealthTab } from './components/ApiHealthTab';
import { Sparkles, Activity, AlertCircle } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 78,
  targetWeightKg: 74,
  activityLevel: 'moderate',
  primaryGoal: 'weight_loss',
  dietaryPattern: 'mediterranean',
  mealsPerDay: 4,
  dietaryExclusions: '',
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('nutriguide_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  // Day / Night Theme Mode state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('nutriguide_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('nutriguide_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeTab, setActiveTab] = useState<'plan' | 'tracker' | 'explorer' | 'mcp' | 'health'>('plan');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Caloric & Water Tracker states
  const [loggedMeals, setLoggedMeals] = useState<LoggedMealItem[]>(() => {
    try {
      const saved = localStorage.getItem('nutriguide_logged_meals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [waterLog, setWaterLog] = useState<WaterLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('nutriguide_water_log');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Compute metrics in real-time
  const metrics = useMemo(() => calculateMetrics(profile), [profile]);

  // Current active meal plan
  const [mealPlan, setMealPlan] = useState<DailyMealPlan>(() => generateBaselineMealPlan(profile, metrics));

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('nutriguide_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('nutriguide_logged_meals', JSON.stringify(loggedMeals));
    } catch {}
  }, [loggedMeals]);

  useEffect(() => {
    try {
      localStorage.setItem('nutriguide_water_log', JSON.stringify(waterLog));
    } catch {}
  }, [waterLog]);

  // When profile metrics change, keep baseline meal plan targets in sync if not AI generated
  useEffect(() => {
    setMealPlan((prev) => {
      // If plan already exists and matches current calories, keep it
      if (prev.dailyTargets.calories === metrics.targetCalories) {
        return prev;
      }
      return generateBaselineMealPlan(profile, metrics);
    });
  }, [profile, metrics]);

  // Generate AI meal plan via Gemini API
  const handleGenerateAiPlan = async () => {
    setIsGeneratingPlan(true);
    setApiNotice(null);

    try {
      const res = await fetch('/api/recommend-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            gender: profile.gender,
            age: profile.age,
            height: profile.heightCm,
            weight: profile.weightKg,
            targetWeight: profile.targetWeightKg,
            bmr: metrics.bmr,
            tdee: metrics.tdee,
            targetCalories: metrics.targetCalories,
          },
          activityMetrics: {
            level: profile.activityLevel,
            label: profile.activityLevel,
          },
          goals: {
            primaryGoal: profile.primaryGoal,
          },
          preferences: {
            dietaryPattern: profile.dietaryPattern,
            exclusions: profile.dietaryExclusions,
            mealsCount: profile.mealsPerDay,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setMealPlan(data.plan);
        setApiNotice('Personalized meal plan generated with Gemini AI and scientific dietary guidelines.');
      } else {
        // Fallback to baseline scientific generator
        const fallback = generateBaselineMealPlan(profile, metrics);
        setMealPlan(fallback);
        if (data.error && data.error.includes('GEMINI_API_KEY')) {
          setApiNotice('Scientific baseline plan generated. (Set GEMINI_API_KEY in environment to unlock custom AI generation).');
        } else {
          setApiNotice('Calculated baseline meal plan calibrated to your BMR/TDEE and macronutrient targets.');
        }
      }
    } catch (err: any) {
      console.warn('AI call failed, using scientific calculation engine:', err);
      const fallback = generateBaselineMealPlan(profile, metrics);
      setMealPlan(fallback);
      setApiNotice('Calculated baseline meal plan calibrated to your BMR/TDEE and macronutrient targets.');
    } finally {
      setIsGeneratingPlan(false);
      setTimeout(() => setApiNotice(null), 5000);
    }
  };

  // Logging helpers
  const handleLogMeal = (meal: Meal) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newItems: LoggedMealItem[] = meal.foods.map((food, idx) => ({
      id: `logged-${Date.now()}-${idx}`,
      timestamp,
      mealType:
        meal.type === 'Breakfast'
          ? 'Breakfast'
          : meal.type === 'Lunch'
          ? 'Lunch'
          : meal.type === 'Dinner'
          ? 'Dinner'
          : 'Snacks',
      name: food.name,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      portion: food.portion,
    }));

    setLoggedMeals((prev) => [...prev, ...newItems]);
  };

  const handleAddMealItem = (item: LoggedMealItem) => {
    setLoggedMeals((prev) => [...prev, item]);
  };

  const handleRemoveMealItem = (id: string) => {
    setLoggedMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearMeals = () => {
    if (confirm('Clear all meals logged for today?')) {
      setLoggedMeals([]);
    }
  };

  // Water helpers
  const handleAddWater = (amountMl: number) => {
    const newEntry: WaterLogEntry = {
      id: `water-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountMl,
    };
    setWaterLog((prev) => [...prev, newEntry]);
  };

  const handleRemoveLastWater = () => {
    setWaterLog((prev) => prev.slice(0, -1));
  };

  const handleClearWater = () => {
    if (confirm("Reset today's water log?")) {
      setWaterLog([]);
    }
  };

  const totalCaloriesLogged = loggedMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalWaterLoggedMl = waterLog.reduce((acc, w) => acc + w.amountMl, 0);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top App Header with Day/Night Switch and Health Tab */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        caloriesLogged={totalCaloriesLogged}
        waterLoggedMl={totalWaterLoggedMl}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notification Banner */}
        {apiNotice && (
          <div
            className={`border rounded-xl p-3.5 text-xs flex items-center justify-between shadow-lg animate-fadeIn ${
              isDark
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{apiNotice}</span>
            </div>
            <button
              onClick={() => setApiNotice(null)}
              className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Diet Recommender & Meal Plan */}
        {activeTab === 'plan' && (
          <div className="space-y-6 animate-fadeIn">
            {/* User Profile & Metrics Form */}
            <ProfileForm
              profile={profile}
              setProfile={setProfile}
              onGeneratePlan={handleGenerateAiPlan}
              isGenerating={isGeneratingPlan}
            />

            {/* Calculated Metrics Summary */}
            <MetricsSummary metrics={metrics} profile={profile} />

            {/* Meal Plan Card */}
            <MealPlanView
              plan={mealPlan}
              dietaryPattern={profile.dietaryPattern}
              onLogMeal={handleLogMeal}
              onLogFoodItem={handleAddMealItem}
            />
          </div>
        )}

        {/* Tab 2: Daily Calorie & Water Tracker */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 animate-fadeIn">
            <MetricsSummary metrics={metrics} profile={profile} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <CalorieTracker
                  metrics={metrics}
                  loggedMeals={loggedMeals}
                  onAddMealItem={handleAddMealItem}
                  onRemoveMealItem={handleRemoveMealItem}
                  onClearMeals={handleClearMeals}
                  onOpenSearchModal={() => setIsSearchModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-5">
                <WaterTracker
                  targetWaterMl={metrics.recommendedWaterMl}
                  waterLog={waterLog}
                  onAddWater={handleAddWater}
                  onRemoveLastWater={handleRemoveLastWater}
                  onClearWater={handleClearWater}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Food & USDA Explorer */}
        {activeTab === 'explorer' && (
          <div className="animate-fadeIn">
            <FoodExplorer onAddMealItem={handleAddMealItem} />
          </div>
        )}

        {/* Tab 4: Live MCP Server Hub */}
        {activeTab === 'mcp' && (
          <div className="animate-fadeIn">
            <McpServerInspector />
          </div>
        )}

        {/* Tab 5: API Health Check Tab */}
        {activeTab === 'health' && (
          <div className="animate-fadeIn">
            <ApiHealthTab theme={theme} />
          </div>
        )}
      </main>

      {/* Global USDA Food Search Modal */}
      <FoodSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddMealItem={handleAddMealItem}
      />

      {/* Footer */}
      <footer
        className={`border-t py-4 mt-12 transition-colors ${
          isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div>
            NutriGuide AI • Streamable HTTP MCP Server at{' '}
            <code className="text-emerald-500 font-mono">/api/mcp</code> • Health Check at{' '}
            <code className="text-emerald-500 font-mono">/api/health</code>
          </div>
          <div>
            Upstream nutrition provided by USDA FoodData Central (FDC) • Clinical guidelines: DASH, Mediterranean & WHO
          </div>
        </div>
      </footer>
    </div>
  );
}
