import React from 'react';
import {
  Utensils,
  Activity,
  Server,
  Droplets,
  Sparkles,
  BookOpen,
  HeartPulse,
  Sun,
  Moon,
} from 'lucide-react';
import { CalculatedMetrics } from '../types/diet';

interface HeaderProps {
  activeTab: 'plan' | 'tracker' | 'explorer' | 'mcp' | 'health';
  setActiveTab: (tab: 'plan' | 'tracker' | 'explorer' | 'mcp' | 'health') => void;
  metrics: CalculatedMetrics;
  caloriesLogged: number;
  waterLoggedMl: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  caloriesLogged,
  waterLoggedMl,
  theme,
  toggleTheme,
}) => {
  const calPercent = Math.min(100, Math.round((caloriesLogged / metrics.targetCalories) * 100));
  const waterPercent = Math.min(100, Math.round((waterLoggedMl / metrics.recommendedWaterMl) * 100));
  const isDark = theme === 'dark';

  return (
    <header
      className={`border-b sticky top-0 z-40 shadow-md transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Utensils className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  NutriGuide
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  AI + MCP Server
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} hidden sm:block`}>
                Evidence-Based Diet Planning, Daily Hydration & API Health Engine
              </p>
            </div>
          </div>

          {/* Right side: Real-Time Status Chips & Day/Night Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div
              className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Calories:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {caloriesLogged} / {metrics.targetCalories} kcal
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({calPercent}%)</span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Droplets className="h-3.5 w-3.5 text-cyan-500" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Water:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(waterLoggedMl / 1000).toFixed(1)} / {(metrics.recommendedWaterMl / 1000).toFixed(1)} L
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({waterPercent}%)</span>
            </div>

            {/* Day / Night Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm'
              }`}
              title={isDark ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
              aria-label="Toggle Day/Night mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex space-x-1 border-t pt-2 pb-1 overflow-x-auto no-scrollbar transition-colors ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'plan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Diet Recommender</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Daily Intake & Water Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'explorer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Food & USDA Database</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'mcp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Live MCP Hub</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                isDark
                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              /api/mcp
            </span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HeartPulse className="h-4 w-4 text-emerald-400" />
            <span>API Health Check</span>
            <span className="flex h-2 w-2 relative ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
