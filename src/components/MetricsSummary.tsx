import React from 'react';
import { CalculatedMetrics, UserProfile } from '../types/diet';
import { Flame, Activity, Droplets, Scale, ShieldCheck, Cpu } from 'lucide-react';

interface MetricsSummaryProps {
  metrics: CalculatedMetrics;
  profile: UserProfile;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics, profile }) => {
  return (
    <div className="space-y-4">
      {/* 4 Main Metabolic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* BMR */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Basal Metabolic Rate (BMR)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{metrics.bmr} <span className="text-xs font-normal text-slate-400">kcal/day</span></div>
            <p className="text-[11px] text-slate-400 mt-0.5">Mifflin-St Jeor physiological resting rate</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500/50"></div>
        </div>

        {/* TDEE */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Daily Expenditure (TDEE)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{metrics.tdee} <span className="text-xs font-normal text-slate-400">kcal/day</span></div>
            <p className="text-[11px] text-slate-400 mt-0.5">Maintenance burn adjusted for activity</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/50"></div>
        </div>

        {/* Target Calories */}
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Target Daily Intake</span>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {metrics.calorieDelta < 0 ? `${metrics.calorieDelta} Deficit` : metrics.calorieDelta > 0 ? `+${metrics.calorieDelta} Surplus` : 'Maintenance'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{metrics.targetCalories} <span className="text-xs font-normal text-slate-400">kcal</span></div>
            <p className="text-[11px] text-slate-400 mt-0.5">Optimized for {profile.primaryGoal.replace('_', ' ')}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Water Target */}
        <div className="bg-slate-800/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-400">Daily Water Target</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-300 tracking-tight">{(metrics.recommendedWaterMl / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">L / {metrics.recommendedWaterMl} mL</span></div>
            <p className="text-[11px] text-slate-400 mt-0.5">35 mL/kg + exercise perspiration</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500/60"></div>
        </div>
      </div>

      {/* Macronutrient Split & BMI Banner */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Scale className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Macronutrient Target Budget</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">BMI: <strong className="text-white">{metrics.bmi}</strong> ({metrics.bmiCategory})</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Diet: <strong className="text-emerald-400 capitalize">{profile.dietaryPattern}</strong></span>
          </div>
        </div>

        {/* Macro Progress Stack */}
        <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${metrics.macros.proteinPct}%` }}
            className="bg-indigo-500 transition-all duration-500 hover:opacity-90"
            title={`Protein: ${metrics.macros.proteinG}g (${metrics.macros.proteinPct}%)`}
          />
          <div
            style={{ width: `${metrics.macros.carbsPct}%` }}
            className="bg-amber-500 transition-all duration-500 hover:opacity-90"
            title={`Carbs: ${metrics.macros.carbsG}g (${metrics.macros.carbsPct}%)`}
          />
          <div
            style={{ width: `${metrics.macros.fatPct}%` }}
            className="bg-rose-500 transition-all duration-500 hover:opacity-90"
            title={`Fats: ${metrics.macros.fatG}g (${metrics.macros.fatPct}%)`}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-slate-900/60 rounded-lg py-1.5 px-2 border border-indigo-500/20">
            <div className="text-[10px] font-medium text-indigo-400 uppercase">Protein ({metrics.macros.proteinPct}%)</div>
            <div className="text-base font-bold text-white">{metrics.macros.proteinG}g</div>
            <div className="text-[10px] text-slate-500">{metrics.macros.proteinG * 4} kcal</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg py-1.5 px-2 border border-amber-500/20">
            <div className="text-[10px] font-medium text-amber-400 uppercase">Carbohydrates ({metrics.macros.carbsPct}%)</div>
            <div className="text-base font-bold text-white">{metrics.macros.carbsG}g</div>
            <div className="text-[10px] text-slate-500">{metrics.macros.carbsG * 4} kcal</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg py-1.5 px-2 border border-rose-500/20">
            <div className="text-[10px] font-medium text-rose-400 uppercase">Healthy Fats ({metrics.macros.fatPct}%)</div>
            <div className="text-base font-bold text-white">{metrics.macros.fatG}g</div>
            <div className="text-[10px] text-slate-500">{metrics.macros.fatG * 9} kcal</div>
          </div>
        </div>
      </div>

      {/* Multi-Agent Architecture Ribbon (Miro Day 2 groundings) */}
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Cpu className="h-4 w-4" />
          <span className="font-semibold">Multi-Agent Engine Active:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-300">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Calorie Calculation Agent</span>
          <span className="text-slate-600">→</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Activity Analysis Agent</span>
          <span className="text-slate-600">→</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Nutrition MCP (USDA FDC)</span>
          <span className="text-slate-600">→</span>
          <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-medium">Recommendation Engine</span>
        </div>
      </div>
    </div>
  );
};
