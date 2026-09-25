import React, { useState } from 'react';
import { LoggedMealItem, CalculatedMetrics } from '../types/diet';
import { Plus, Trash2, Search, Utensils, Flame, PieChart, RotateCcw } from 'lucide-react';

interface CalorieTrackerProps {
  metrics: CalculatedMetrics;
  loggedMeals: LoggedMealItem[];
  onAddMealItem: (item: LoggedMealItem) => void;
  onRemoveMealItem: (id: string) => void;
  onClearMeals: () => void;
  onOpenSearchModal: () => void;
}

export const CalorieTracker: React.FC<CalorieTrackerProps> = ({
  metrics,
  loggedMeals,
  onAddMealItem,
  onRemoveMealItem,
  onClearMeals,
  onOpenSearchModal,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customPortion, setCustomPortion] = useState('1 serving');
  const [customMealType, setCustomMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');

  // Sums
  const totalCalories = loggedMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = loggedMeals.reduce((acc, m) => acc + (m.proteinG || 0), 0);
  const totalCarbs = loggedMeals.reduce((acc, m) => acc + (m.carbsG || 0), 0);
  const totalFat = loggedMeals.reduce((acc, m) => acc + (m.fatG || 0), 0);

  const remainingCalories = metrics.targetCalories - totalCalories;
  const progressPercent = Math.min(100, Math.round((totalCalories / metrics.targetCalories) * 100));

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCalories) return;

    onAddMealItem({
      id: `manual-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: customMealType,
      name: customName.trim(),
      calories: parseInt(customCalories, 10) || 0,
      proteinG: parseFloat(customProtein) || 0,
      carbsG: parseFloat(customCarbs) || 0,
      fatG: parseFloat(customFat) || 0,
      portion: customPortion || '1 serving',
    });

    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    setShowAddForm(false);
  };

  const mealCategories: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'> = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
  ];

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Top Banner: Progress Bar & Big Numbers */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/80 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Daily Calorie Intake Tracker</h2>
              <p className="text-xs text-slate-400">Track logged meals against your daily budget</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search USDA Foods</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Quick Add</span>
            </button>

            {loggedMeals.length > 0 && (
              <button
                type="button"
                onClick={onClearMeals}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                title="Reset today's logged meals"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Big Dashboard Counter */}
        <div className="grid grid-cols-3 gap-3 pt-4 text-center">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Consumed</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{totalCalories}</div>
            <span className="text-[10px] text-slate-500">kcal logged</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Remaining</span>
            <div
              className={`text-xl sm:text-2xl font-black mt-1 ${
                remainingCalories >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {remainingCalories}
            </div>
            <span className="text-[10px] text-slate-500">{remainingCalories >= 0 ? 'kcal left' : 'kcal over'}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Target Goal</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{metrics.targetCalories}</div>
            <span className="text-[10px] text-slate-500">kcal total</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Calorie Progress: {progressPercent}%</span>
            <span className="text-slate-400">
              {totalCalories} / {metrics.targetCalories} kcal
            </span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              style={{ width: `${Math.min(100, (totalCalories / metrics.targetCalories) * 100)}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                totalCalories > metrics.targetCalories ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-amber-400'
              }`}
            />
          </div>
        </div>

        {/* Macro Progress Rings/Bars */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-indigo-500/20">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-indigo-400">Protein</span>
              <span className="text-slate-300">{Math.round(totalProtein)} / {metrics.macros.proteinG}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totalProtein / metrics.macros.proteinG) * 100)}%` }}
                className="h-full bg-indigo-500 rounded-full transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-amber-500/20">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-amber-400">Carbs</span>
              <span className="text-slate-300">{Math.round(totalCarbs)} / {metrics.macros.carbsG}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totalCarbs / metrics.macros.carbsG) * 100)}%` }}
                className="h-full bg-amber-500 rounded-full transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-900/40 p-2.5 rounded-xl border border-rose-500/20">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-rose-400">Fat</span>
              <span className="text-slate-300">{Math.round(totalFat)} / {metrics.macros.fatG}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totalFat / metrics.macros.fatG) * 100)}%` }}
                className="h-full bg-rose-500 rounded-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Quick Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleCustomSubmit}
          className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
            <span>Quick Log Food Entry</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Meal Slot</label>
              <select
                value={customMealType}
                onChange={(e) => setCustomMealType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-400 block mb-0.5">Food / Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Avocado Toast"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Calories (kcal)*</label>
              <input
                type="number"
                placeholder="320"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="15"
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="25"
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="10"
                value={customFat}
                onChange={(e) => setCustomFat(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Portion</label>
              <input
                type="text"
                placeholder="1 piece"
                value={customPortion}
                onChange={(e) => setCustomPortion(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow"
            >
              Add to Log
            </button>
          </div>
        </form>
      )}

      {/* Logged Meals List Grouped by Category */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Today's Logged Items ({loggedMeals.length})
        </h3>

        {loggedMeals.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-400 text-xs space-y-2">
            <Utensils className="h-6 w-6 mx-auto text-slate-600" />
            <p>No meals logged for today yet.</p>
            <p className="text-[11px] text-slate-500">
              Log directly from your recommended plan, search the USDA database, or use Quick Add!
            </p>
          </div>
        ) : (
          mealCategories.map((cat) => {
            const items = loggedMeals.filter((m) => m.mealType === cat);
            if (items.length === 0) return null;
            const subtotal = items.reduce((sum, item) => sum + item.calories, 0);

            return (
              <div key={cat} className="bg-slate-900/50 rounded-xl border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-1.5">
                  <span className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span>{cat}</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">{subtotal} kcal</span>
                </div>

                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({item.portion})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>P: {item.proteinG}g</span>
                          <span>•</span>
                          <span>C: {item.carbsG}g</span>
                          <span>•</span>
                          <span>F: {item.fatG}g</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="font-bold text-amber-400">{item.calories} kcal</span>
                        <button
                          type="button"
                          onClick={() => onRemoveMealItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
