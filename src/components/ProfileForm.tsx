import React from 'react';
import { UserProfile, Gender, ActivityLevel, PrimaryGoal, DietaryPattern } from '../types/diet';
import { Sliders, Sparkles, RefreshCw, Heart, Target, Flame, Dumbbell } from 'lucide-react';
import { ACTIVITY_LABELS } from '../utils/calculator';

interface ProfileFormProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onGeneratePlan: () => void;
  isGenerating: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  setProfile,
  onGeneratePlan,
  isGenerating,
}) => {
  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-700/80 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Body Metrics & Nutritional Goals</h2>
            <p className="text-xs text-slate-400">Calibrates your BMR, TDEE, and evidence guidelines</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Gender */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
          <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => handleChange('gender', 'male')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                profile.gender === 'male'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => handleChange('gender', 'female')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                profile.gender === 'female'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Age (years)</label>
          <input
            type="number"
            min="14"
            max="100"
            value={profile.age}
            onChange={(e) => handleChange('age', Math.max(14, parseInt(e.target.value) || 25))}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
          <input
            type="number"
            min="100"
            max="250"
            value={profile.heightCm}
            onChange={(e) => handleChange('heightCm', Math.max(100, parseInt(e.target.value) || 170))}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Current Weight */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Current Weight (kg)</label>
          <input
            type="number"
            min="35"
            max="250"
            step="0.5"
            value={profile.weightKg}
            onChange={(e) => handleChange('weightKg', Math.max(35, parseFloat(e.target.value) || 70))}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Target Weight */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span>Target Weight (kg)</span>
            <span className="text-[10px] text-slate-400">
              {profile.weightKg === profile.targetWeightKg
                ? 'Maintain'
                : `${(profile.targetWeightKg - profile.weightKg).toFixed(1)} kg delta`}
            </span>
          </label>
          <input
            type="number"
            min="35"
            max="250"
            step="0.5"
            value={profile.targetWeightKg}
            onChange={(e) => handleChange('targetWeightKg', Math.max(35, parseFloat(e.target.value) || 70))}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Daily Activity Level</label>
          <select
            value={profile.activityLevel}
            onChange={(e) => handleChange('activityLevel', e.target.value as ActivityLevel)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-slate-800 text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Goal */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Primary Goal</label>
          <select
            value={profile.primaryGoal}
            onChange={(e) => handleChange('primaryGoal', e.target.value as PrimaryGoal)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="weight_loss" className="bg-slate-800">Fat Loss & Calorie Deficit (-500 kcal)</option>
            <option value="muscle_gain" className="bg-slate-800">Lean Muscle Gain (+350 kcal)</option>
            <option value="maintenance" className="bg-slate-800">Maintenance & Vitality</option>
            <option value="heart_health" className="bg-slate-800">Heart Health & Blood Pressure (DASH)</option>
            <option value="athletic_performance" className="bg-slate-800">Athletic Performance & Energy</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Dietary Pattern */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Dietary Pattern</label>
          <select
            value={profile.dietaryPattern}
            onChange={(e) => handleChange('dietaryPattern', e.target.value as DietaryPattern)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="balanced" className="bg-slate-800">Balanced WHO Standard (45-55% Carbs)</option>
            <option value="mediterranean" className="bg-slate-800">Mediterranean (Rich in Olive Oil, Fish, Plants)</option>
            <option value="dash" className="bg-slate-800">DASH Diet (Cardiovascular & Potassium rich)</option>
            <option value="high_protein" className="bg-slate-800">High Protein (30% Protein for satiety/recovery)</option>
            <option value="low_carb" className="bg-slate-800">Low Carb (Higher healthy fats)</option>
            <option value="vegetarian" className="bg-slate-800">Vegetarian (Lacto-ovo, plant-forward)</option>
            <option value="vegan" className="bg-slate-800">Vegan (100% Plant-based whole foods)</option>
            <option value="gluten_free" className="bg-slate-800">Gluten-Free</option>
            <option value="dairy_free" className="bg-slate-800">Dairy-Free</option>
          </select>
        </div>

        {/* Meals Per Day */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Daily Meal Structure</label>
          <select
            value={profile.mealsPerDay}
            onChange={(e) => handleChange('mealsPerDay', parseInt(e.target.value) || 4)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value={3} className="bg-slate-800">3 Meals (Breakfast, Lunch, Dinner)</option>
            <option value={4} className="bg-slate-800">4 Meals (3 Main + 1 Snack)</option>
            <option value={5} className="bg-slate-800">5 Meals (3 Main + 2 Snacks)</option>
          </select>
        </div>

        {/* Exclusions */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Food Exclusions / Allergies</label>
          <input
            type="text"
            placeholder="e.g. Peanuts, shellfish, lactose"
            value={profile.dietaryExclusions}
            onChange={(e) => handleChange('dietaryExclusions', e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onGeneratePlan}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Synthesizing Personalized Meal Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <span>Generate AI Meal Plan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
