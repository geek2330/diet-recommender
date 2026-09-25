import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle, RefreshCw, X, ShieldCheck, Flame, Check } from 'lucide-react';
import { LoggedMealItem } from '../types/diet';
import { searchCatalogFallback } from '../../lib/nutrition.js';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealItem: (item: LoggedMealItem) => void;
}

const POPULAR_USDA_FOODS = [
  'Apple',
  'Chicken breast',
  'Eggs',
  'Salmon',
  'White rice',
  'Banana',
  'Oats',
  'Greek yogurt',
  'Broccoli',
  'Avocado',
  'Beef',
];

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
  const [justLogged, setJustLogged] = useState(false);

  // Execute search whenever modal opens if results are empty
  useEffect(() => {
    if (isOpen && results.length === 0) {
      handleSearch(undefined, 'Apple');
      setQuery('Apple');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent, termOverride?: string) => {
    if (e) e.preventDefault();
    const searchTerm = (termOverride !== undefined ? termOverride : query).trim();
    if (!searchTerm) return;

    setIsLoading(true);
    setError(null);
    setSelectedFood(null);

    try {
      const res = await fetch(`/api/nutrition/search?query=${encodeURIComponent(searchTerm)}&page=1&page_size=12`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setResults(data.items);
          setSelectedFood(data.items[0]);
          setSelectedPortionG(data.items[0].serving_size || 100);
          return;
        }
      }
      // If endpoint returns non-OK (e.g. 404 on unconfigured routes) or empty results,
      // gracefully load matching items from verified USDA Reference Catalog
      const fallback = searchCatalogFallback(searchTerm, 12);
      setResults(fallback);
      if (fallback.length > 0) {
        setSelectedFood(fallback[0]);
        setSelectedPortionG(fallback[0].serving_size || 100);
      }
    } catch (err: any) {
      // In case of any network error, guarantee verified USDA foods output
      const fallback = searchCatalogFallback(searchTerm, 12);
      setResults(fallback);
      if (fallback.length > 0) {
        setSelectedFood(fallback[0]);
        setSelectedPortionG(fallback[0].serving_size || 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (foodName: string) => {
    setQuery(foodName);
    handleSearch(undefined, foodName);
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

    setJustLogged(true);
    setTimeout(() => {
      setJustLogged(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">USDA FoodData Central Database</h3>
              <p className="text-xs text-slate-400">Query verified calorie, macro, and micronutrient data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
            Quick:
          </span>
          {POPULAR_USDA_FOODS.map((foodName) => (
            <button
              key={foodName}
              type="button"
              onClick={() => handleChipClick(foodName)}
              className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-all ${
                query.toLowerCase() === foodName.toLowerCase()
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {foodName}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Type any food or energy query (e.g. Apple, Chicken breast, Salmon, Oats, Banana)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Search</span>
          </button>
        </form>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {isLoading && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
              Searching USDA FoodData Central...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Type an ingredient or food name above to search verified USDA nutrition records.
            </div>
          )}

          {!isLoading &&
            results.map((food, idx) => {
              const isSelected = selectedFood?.food_id === food.food_id;

              return (
                <div
                  key={`${food.food_id}-${idx}`}
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
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>{food.name}</span>
                        {food.food_id && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/60">
                            USDA #{food.food_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {food.category && <span className="mr-2">Category: {food.category}</span>}
                        <span>Serving: {food.serving_size || 100}{food.serving_unit || 'g'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-bold text-amber-400 flex items-center justify-end space-x-1">
                        <Flame className="h-3 w-3 text-amber-500" />
                        <span>{food.nutrients?.calories ?? 0} kcal</span>
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
              <span className="text-slate-400">USDA FDC #{selectedFood.food_id}</span>
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
                      className={`flex-1 py-1 text-xs rounded font-medium border transition-colors ${
                        selectedPortionG === g
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
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
                Calculated Energy:{' '}
                <strong className="text-amber-400 font-bold">
                  {Math.round((selectedFood.nutrients?.calories || 0) * (selectedPortionG / (selectedFood.serving_size || 100)))} kcal
                </strong>
                <span className="text-[11px] text-slate-400 ml-2">
                  (P: {Math.round((selectedFood.nutrients?.protein_g || 0) * (selectedPortionG / (selectedFood.serving_size || 100)) * 10) / 10}g,
                  C: {Math.round((selectedFood.nutrients?.carbs_g || 0) * (selectedPortionG / (selectedFood.serving_size || 100)) * 10) / 10}g,
                  F: {Math.round((selectedFood.nutrients?.fat_g || 0) * (selectedPortionG / (selectedFood.serving_size || 100)) * 10) / 10}g)
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogFood}
                disabled={justLogged}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                {justLogged ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Logged!</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Log to Tracker</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
