import React, { useState, useEffect } from 'react';
import { Search, Utensils, BookOpen, Layers, Plus, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { LoggedMealItem } from '../types/diet';

interface FoodExplorerProps {
  onAddMealItem: (item: LoggedMealItem) => void;
}

export const FoodExplorer: React.FC<FoodExplorerProps> = ({ onAddMealItem }) => {
  const [searchTerm, setSearchTerm] = useState('Salmon');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFoodDetails, setSelectedFoodDetails] = useState<any | null>(null);
  const [servingG, setServingG] = useState(150);
  const [mealSlot, setMealSlot] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Dinner');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nutrition/search?query=${encodeURIComponent(queryText)}&page=1&page_size=8`);
      if (!res.ok) throw new Error(`Upstream returned status ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      if (data.items && data.items.length > 0) {
        loadDetails(data.items[0].food_id, servingG);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search foods');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetails = async (foodId: string, grams: number) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/nutrition/details?food_id=${encodeURIComponent(foodId)}&serving_g=${grams}`);
      if (!res.ok) throw new Error(`Upstream returned status ${res.status}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setSelectedFoodDetails(data.items[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    executeSearch('Salmon');
  }, []);

  const handleLogCurrentFood = () => {
    if (!selectedFoodDetails) return;

    onAddMealItem({
      id: `explorer-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mealType: mealSlot,
      name: selectedFoodDetails.name,
      calories: selectedFoodDetails.nutrients?.calories || 0,
      proteinG: selectedFoodDetails.nutrients?.protein_g || 0,
      carbsG: selectedFoodDetails.nutrients?.carbs_g || 0,
      fatG: selectedFoodDetails.nutrients?.fat_g || 0,
      portion: `${servingG}g`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/80 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">USDA FoodData Central Explorer</h2>
              <p className="text-xs text-slate-400">
                Direct read-only nutrition queries powered by the USDA Food Composition Database
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40">
            <ShieldCheck className="h-4 w-4" />
            <span>Factual Upstream Records</span>
          </div>
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search foods, beverages, or raw ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchTerm)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => executeSearch(searchTerm)}
            disabled={isLoading || !searchTerm.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Search FDC</span>
          </button>
        </div>

        {/* Popular chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-400 pt-1">
          <span>Try:</span>
          {['Avocado', 'Quinoa', 'Greek Yogurt', 'Chicken Breast', 'Lentils', 'Spinach', 'Blueberries'].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setSearchTerm(chip);
                executeSearch(chip);
              }}
              className="bg-slate-900/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Search Results & Detailed Nutrition Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Results list */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Matching Food Records ({items.length})
          </h3>

          {isLoading && (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400 text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-400 mb-2" />
              Fetching USDA upstream items...
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400 text-xs">
              No results found. Try a different food term.
            </div>
          )}

          {!isLoading &&
            items.map((food) => {
              const isSelected = selectedFoodDetails?.food_id === food.food_id;

              return (
                <div
                  key={food.food_id}
                  onClick={() => loadDetails(food.food_id, servingG)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white line-clamp-1">{food.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {food.brand ? `${food.brand} • ` : ''}
                        FDC ID: <span className="font-mono text-emerald-400">{food.food_id}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-amber-400">{food.nutrients?.calories ?? '--'}</span>
                      <span className="text-[10px] text-slate-400 ml-1">kcal</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Right: Nutrition Facts Card */}
        <div className="lg:col-span-7">
          {selectedFoodDetails ? (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700 gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedFoodDetails.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedFoodDetails.brand ? `Brand: ${selectedFoodDetails.brand} • ` : ''}
                    FDC Reference #{selectedFoodDetails.food_id}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400">
                    {selectedFoodDetails.nutrients?.calories ?? '--'} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </div>
                  <div className="text-[10px] text-slate-400">per {servingG}g serving</div>
                </div>
              </div>

              {/* Serving size adjuster */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Adjust Portion Weight:</span>
                  <span className="font-mono text-emerald-400 font-bold">{servingG} grams</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="500"
                  step="25"
                  value={servingG}
                  onChange={(e) => {
                    const g = parseInt(e.target.value, 10);
                    setServingG(g);
                    loadDetails(selectedFoodDetails.food_id, g);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Macronutrients Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-indigo-500/20">
                  <div className="text-[10px] font-semibold text-indigo-400 uppercase">Protein</div>
                  <div className="text-base font-bold text-white">{selectedFoodDetails.nutrients?.protein_g ?? 0}g</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
                  <div className="text-[10px] font-semibold text-amber-400 uppercase">Carbohydrates</div>
                  <div className="text-base font-bold text-white">{selectedFoodDetails.nutrients?.carbs_g ?? 0}g</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20">
                  <div className="text-[10px] font-semibold text-rose-400 uppercase">Total Fat</div>
                  <div className="text-base font-bold text-white">{selectedFoodDetails.nutrients?.fat_g ?? 0}g</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-teal-500/20">
                  <div className="text-[10px] font-semibold text-teal-400 uppercase">Fiber</div>
                  <div className="text-base font-bold text-white">{selectedFoodDetails.nutrients?.fiber_g ?? 0}g</div>
                </div>
              </div>

              {/* Micronutrients Table */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                  Micronutrients & Minerals ({servingG}g)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sodium:</span>
                    <span className="font-semibold">{selectedFoodDetails.nutrients?.sodium_mg ?? '--'} mg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Potassium:</span>
                    <span className="font-semibold">{selectedFoodDetails.nutrients?.potassium_mg ?? '--'} mg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Calcium:</span>
                    <span className="font-semibold">{selectedFoodDetails.nutrients?.calcium_mg ?? '--'} mg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Iron:</span>
                    <span className="font-semibold">{selectedFoodDetails.nutrients?.iron_mg ?? '--'} mg</span>
                  </div>
                </div>
              </div>

              {/* Ingredients (if available) */}
              {selectedFoodDetails.ingredients && (
                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  <strong className="text-slate-300">Ingredients: </strong>
                  {selectedFoodDetails.ingredients}
                </div>
              )}

              {/* Action: Log to Tracker */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Add to:</span>
                  <select
                    value={mealSlot}
                    onChange={(e) => setMealSlot(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleLogCurrentFood}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log this Food to Tracker</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-slate-800/40 border border-slate-700 rounded-2xl text-slate-500 text-xs">
              Select any food item on the left to view detailed nutritional metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
