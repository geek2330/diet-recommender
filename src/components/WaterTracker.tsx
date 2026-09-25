import React, { useState } from 'react';
import { Droplets, Plus, RotateCcw, Award, CheckCircle2, Waves, GlassWater } from 'lucide-react';
import { WaterLogEntry } from '../types/diet';

interface WaterTrackerProps {
  targetWaterMl: number;
  waterLog: WaterLogEntry[];
  onAddWater: (amountMl: number) => void;
  onRemoveLastWater: () => void;
  onClearWater: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  targetWaterMl,
  waterLog,
  onAddWater,
  onRemoveLastWater,
  onClearWater,
}) => {
  const [customMl, setCustomMl] = useState('');

  const totalWaterMl = waterLog.reduce((acc, entry) => acc + entry.amountMl, 0);
  const percent = Math.min(100, Math.round((totalWaterMl / targetWaterMl) * 100));

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customMl, 10);
    if (amount && amount > 0) {
      onAddWater(amount);
      setCustomMl('');
    }
  };

  // Status message based on percentage
  let statusText = 'Need more water to kickstart cellular hydration';
  let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  if (percent >= 100) {
    statusText = 'Hydration Goal Achieved! Excellent cellular homeostasis';
    statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (percent >= 75) {
    statusText = 'Great hydration level, almost at daily target';
    statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  } else if (percent >= 40) {
    statusText = 'Steady progress, keep sipping consistently';
    statusColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  }

  // Glasses visual (assume 250ml per glass)
  const totalGlasses = Math.ceil(targetWaterMl / 250);
  const filledGlasses = Math.floor(totalWaterMl / 250);

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Daily Hydration & Water Tracker</h2>
            <p className="text-xs text-slate-400">Target calibrated to 35 mL/kg + activity level</p>
          </div>
        </div>

        {waterLog.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onRemoveLastWater}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Undo last log"
            >
              Undo Last
            </button>
            <button
              type="button"
              onClick={onClearWater}
              className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              title="Reset today's water"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Hydration Visual Reservoir */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Animated Cylinder / Bottle Visual */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-700/60">
          <div className="relative w-32 h-52 bg-slate-950 border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end">
            {/* Water level fill */}
            <div
              style={{ height: `${percent}%` }}
              className="w-full bg-gradient-to-t from-cyan-600 via-sky-500 to-teal-400 transition-all duration-700 relative overflow-hidden flex items-start justify-center"
            >
              {/* Shimmer wave effect */}
              <div className="absolute inset-x-0 top-0 h-2 bg-white/30 rounded-full animate-pulse"></div>
            </div>

            {/* Inner Percentage Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow">
              <span className="text-2xl font-black text-white">{percent}%</span>
              <span className="text-[11px] font-semibold text-slate-200">
                {(totalWaterMl / 1000).toFixed(2)} L
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400">Target: </span>
            <span className="text-xs font-bold text-white">{(targetWaterMl / 1000).toFixed(2)} Liters ({targetWaterMl} mL)</span>
          </div>
        </div>

        {/* Quick Log Controls & Status */}
        <div className="md:col-span-2 space-y-4">
          <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${statusColor}`}>
            {percent >= 100 ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Waves className="h-4 w-4 shrink-0" />}
            <span>{statusText}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Quick Log One-Tap Buttons:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onAddWater(250)}
                className="bg-slate-900/80 hover:bg-cyan-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all group shadow"
              >
                <GlassWater className="h-5 w-5 text-cyan-400 group-hover:text-white mb-1 transition-colors" />
                <span className="text-xs font-bold">+250 mL</span>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-100">Small Glass</span>
              </button>

              <button
                type="button"
                onClick={() => onAddWater(350)}
                className="bg-slate-900/80 hover:bg-cyan-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all group shadow"
              >
                <Droplets className="h-5 w-5 text-cyan-400 group-hover:text-white mb-1 transition-colors" />
                <span className="text-xs font-bold">+350 mL</span>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-100">Coffee / Mug</span>
              </button>

              <button
                type="button"
                onClick={() => onAddWater(500)}
                className="bg-slate-900/80 hover:bg-cyan-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all group shadow"
              >
                <Droplets className="h-5 w-5 text-cyan-400 group-hover:text-white mb-1 transition-colors" />
                <span className="text-xs font-bold">+500 mL</span>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-100">Water Bottle</span>
              </button>

              <button
                type="button"
                onClick={() => onAddWater(750)}
                className="bg-slate-900/80 hover:bg-cyan-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all group shadow"
              >
                <Award className="h-5 w-5 text-cyan-400 group-hover:text-white mb-1 transition-colors" />
                <span className="text-xs font-bold">+750 mL</span>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-100">Shaker Bottle</span>
              </button>
            </div>
          </div>

          {/* Custom mL input */}
          <form onSubmit={handleCustomAdd} className="flex gap-2 pt-1">
            <input
              type="number"
              min="50"
              max="3000"
              step="50"
              placeholder="Custom volume in mL (e.g. 400)..."
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className="flex-1 bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add mL</span>
            </button>
          </form>

          {/* Glasses visual matrix */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Equivalent Glasses (250 mL each):</span>
              <span className="font-semibold text-white">
                {filledGlasses} / {totalGlasses} glasses
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-[10px] transition-all ${
                    i < filledGlasses
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-600'
                  }`}
                  title={`Glass ${i + 1} (250 mL)`}
                >
                  💧
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Water Log Timeline */}
      {waterLog.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Today's Water Entries ({waterLog.length})
          </div>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
            {waterLog.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs text-slate-300 flex items-center space-x-1.5"
              >
                <span className="font-bold text-cyan-400">+{entry.amountMl} mL</span>
                <span className="text-[10px] text-slate-500">at {entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
