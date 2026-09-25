export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active'
  | 'extra_active';

export type PrimaryGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'heart_health'
  | 'athletic_performance';

export type DietaryPattern =
  | 'balanced'
  | 'mediterranean'
  | 'dash'
  | 'high_protein'
  | 'low_carb'
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free';

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
  dietaryPattern: DietaryPattern;
  mealsPerDay: number;
  dietaryExclusions: string;
}

export interface CalculatedMetrics {
  bmr: number;
  tdee: number;
  targetCalories: number;
  calorieDelta: number; // positive = surplus, negative = deficit
  macros: {
    proteinG: number;
    proteinPct: number;
    carbsG: number;
    carbsPct: number;
    fatG: number;
    fatPct: number;
  };
  recommendedWaterMl: number;
  bmi: number;
  bmiCategory: string;
}

export interface FoodItem {
  id?: string;
  name: string;
  portion: string;
  portionG?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Morning Snack' | 'Evening Snack';
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  description: string;
  foods: FoodItem[];
  healthNotes?: string;
}

export interface DailyMealPlan {
  summary: string;
  dailyTargets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    water_liters: number;
  };
  meals: Meal[];
  evidenceGuidelines: string[];
}

export interface LoggedMealItem {
  id: string;
  timestamp: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  portion: string;
}

export interface WaterLogEntry {
  id: string;
  timestamp: string;
  amountMl: number;
}
