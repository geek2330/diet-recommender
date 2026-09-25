import React, { useState } from 'react';
import { Search, Plus, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { LoggedMealItem } from '../types/diet';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealItem: (item: LoggedMealItem) => void;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  onAddMealItem,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [selectedPortionG, setSelectedPortionG] = useState(100);
  const [selectedMealSlot, setSelectedMealSlot] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedFood(null);

    try {
      const res = await fetch(`/api/nutrition/search?query=${encodeURIComponent(query.trim())}&page=1&page_size=10`);
      if (!res.ok) {
        throw new Error(`Upstream nutrition request returned status ${res.status}`);
      }
      const data = await res.json();
      setResults(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search foods');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogFood = () => {
    if (!selectedFood) return;

    // Calculate ratio based on reference size
    const refG = selectedFood.serving_size || 100;
    const ratio = selectedPortionG / refG;

    const baseCal = selectedFood.nutrients?.calories || 0;
    const baseP = selectedFood.nutrients?.protein_g || 0;
    const baseC = selectedFood.nutrients?.carbs_g || 0;
    const baseF = selectedFood.nutrients?.fat_g || 0;

    const cal = Math.round(baseCal * ratio);
    const p = Math.round(baseP * ratio * 10) / 10;
    const c = Math.round(baseC * ratio * 10) / 10;
    const f = Math.round(baseF * ratio * 10) / 10;

    onAddMealItem({
      id: `fdc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: selectedMealSlot,
      name: selectedFood.name,
      calories: cal,
      proteinG: p,
      carbsG: c,
      fatG: f,
      portion: `${selectedPortionG}g`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">USDA FoodData Central Database</h3>
              <p className="text-xs text-slate-400">Factual nutrition data retrieved via USDA upstream</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search food item (e.g. Oatmeal, Chicken breast, Salmon, Tofu)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Search</span>
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {isLoading && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
              Searching USDA FoodData Central...
            </div>
          )}

          {!isLoading && results.length === 0 && !error && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Type an ingredient or food name above to search verified USDA nutrition records.
            </div>
          )}

          {!isLoading &&
            results.map((food, idx) => {
              const isSelected = selectedFood?.food_id === food.food_id;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedFood(food);
                    setSelectedPortionG(food.serving_size || 100);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white">{food.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {food.brand && <span className="mr-2">Brand: {food.brand}</span>}
                        {food.category && <span className="mr-2">Category: {food.category}</span>}
                        <span>Serving: {food.serving_size || 100}{food.serving_unit || 'g'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-bold text-amber-400">
                        {food.nutrients?.calories ?? '--'} kcal
                      </div>
                      <div className="text-[10px] text-slate-400">
                        P: {food.nutrients?.protein_g ?? 0}g • C: {food.nutrients?.carbs_g ?? 0}g • F: {food.nutrients?.fat_g ?? 0}g
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Portion Selector & Add to Tracker controls */}
        {selectedFood && (
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400">Selected: {selectedFood.name}</span>
              <span className="text-slate-400">Food ID: {selectedFood.food_id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Serving Size (grams)</label>
                <div className="flex gap-1">
                  {[50, 100, 150, 200].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedPortionG(g)}
                      className={`flex-1 py-1 text-xs rounded font-medium border ${
                        selectedPortionG === g
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Custom Grams</label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={selectedPortionG}
                  onChange={(e) => setSelectedPortionG(Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Meal Category</label>
                <select
                  value={selectedMealSlot}
                  onChange={(e) => setSelectedMealSlot(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-300">
                Calculated:{' '}
                <strong className="text-amber-400">
                  {Math.round((selectedFood.nutrients?.calories || 0) * (selectedPortionG / (selectedFood.serving_size || 100)))} kcal
                </strong>
              </div>

              <button
                type="button"
                onClick={handleLogFood}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow"
              >
                <Plus className="h-4 w-4" />
                <span>Log to Tracker</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
