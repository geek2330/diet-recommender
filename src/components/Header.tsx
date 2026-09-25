import React from 'react';
import { Utensils, Activity, Server, Droplets, Sparkles, BookOpen } from 'lucide-react';
import { CalculatedMetrics } from '../types/diet';

interface HeaderProps {
  activeTab: 'plan' | 'tracker' | 'explorer' | 'mcp';
  setActiveTab: (tab: 'plan' | 'tracker' | 'explorer' | 'mcp') => void;
  metrics: CalculatedMetrics;
  caloriesLogged: number;
  waterLoggedMl: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  caloriesLogged,
  waterLoggedMl,
}) => {
  const calPercent = Math.min(100, Math.round((caloriesLogged / metrics.targetCalories) * 100));
  const waterPercent = Math.min(100, Math.round((waterLoggedMl / metrics.recommendedWaterMl) * 100));

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Utensils className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">NutriGuide</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI + MCP Server
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Evidence-Based Diet Planning & Daily Hydration Engine
              </p>
            </div>
          </div>

          {/* Quick Real-Time Status Chips */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Calories:</span>
              <span className="font-semibold text-white">
                {caloriesLogged} / {metrics.targetCalories} kcal
              </span>
              <span className="text-[10px] text-slate-400">({calPercent}%)</span>
            </div>

            <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <Droplets className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Water:</span>
              <span className="font-semibold text-white">
                {(waterLoggedMl / 1000).toFixed(1)} / {(metrics.recommendedWaterMl / 1000).toFixed(1)} L
              </span>
              <span className="text-[10px] text-slate-400">({waterPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-800 pt-2 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'plan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Diet Recommender</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Daily Intake & Water Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'explorer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Food & USDA Database</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'mcp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Live MCP Server Hub</span>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-400/30">
              /api/mcp
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
