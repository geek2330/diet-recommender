import { UserProfile, CalculatedMetrics, DailyMealPlan } from '../types/diet';

/**
 * Calculates BMR using the Mifflin-St Jeor Equation:
 * Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
export function calculateBMR(gender: string, age: number, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * Activity level multipliers based on standard physiological research
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Little to no exercise, desk job
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  very_active: 1.725, // Hard exercise 6-7 days/week
  extra_active: 1.9, // Very hard exercise, physical job, 2x training
};

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (Desk job, little/no exercise)',
  light: 'Lightly Active (1–3 exercise days/wk)',
  moderate: 'Moderately Active (3–5 exercise days/wk)',
  very_active: 'Very Active (6–7 hard workouts/wk)',
  extra_active: 'Extremely Active (Athletic training/physical job)',
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE) and target macros
 */
export function calculateMetrics(profile: UserProfile): CalculatedMetrics {
  const bmr = calculateBMR(profile.gender, profile.age, profile.heightCm, profile.weightKg);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // Goal adjustment
  let calorieDelta = 0;
  switch (profile.primaryGoal) {
    case 'weight_loss':
      calorieDelta = -500; // ~0.5kg loss per week safe deficit
      break;
    case 'muscle_gain':
      calorieDelta = 350; // Lean muscle surplus
      break;
    case 'heart_health':
      calorieDelta = profile.weightKg > profile.targetWeightKg ? -300 : 0;
      break;
    case 'athletic_performance':
      calorieDelta = 250;
      break;
    case 'maintenance':
    default:
      calorieDelta = 0;
  }

  // Ensure minimum safe calories (never drop below 1200 for women or 1500 for men unless clinically supervised)
  const minSafe = profile.gender === 'male' ? 1500 : 1200;
  const targetCalories = Math.max(minSafe, tdee + calorieDelta);

  // Macro distribution based on dietary pattern & goal
  let proteinPct = 0.25;
  let fatPct = 0.25;
  let carbsPct = 0.50;

  if (profile.dietaryPattern === 'mediterranean') {
    proteinPct = 0.20;
    fatPct = 0.35; // Rich in healthy monounsaturated fats (EVOO, nuts)
    carbsPct = 0.45;
  } else if (profile.dietaryPattern === 'dash') {
    proteinPct = 0.20;
    fatPct = 0.25;
    carbsPct = 0.55; // Rich in potassium, magnesium, fiber
  } else if (profile.dietaryPattern === 'high_protein' || profile.primaryGoal === 'muscle_gain') {
    proteinPct = 0.30;
    fatPct = 0.25;
    carbsPct = 0.45;
  } else if (profile.dietaryPattern === 'low_carb') {
    proteinPct = 0.30;
    fatPct = 0.50;
    carbsPct = 0.20;
  } else if (profile.dietaryPattern === 'vegan' || profile.dietaryPattern === 'vegetarian') {
    proteinPct = 0.20;
    fatPct = 0.25;
    carbsPct = 0.55;
  }

  // Gram calculations: Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
  const proteinG = Math.round((targetCalories * proteinPct) / 4);
  const carbsG = Math.round((targetCalories * carbsPct) / 4);
  const fatG = Math.round((targetCalories * fatPct) / 9);

  // Water calculation: 35 ml per kg body weight + exercise compensation
  let waterBonusMl = 0;
  if (profile.activityLevel === 'light') waterBonusMl = 350;
  else if (profile.activityLevel === 'moderate') waterBonusMl = 600;
  else if (profile.activityLevel === 'very_active') waterBonusMl = 900;
  else if (profile.activityLevel === 'extra_active') waterBonusMl = 1200;

  const recommendedWaterMl = Math.round(profile.weightKg * 35 + waterBonusMl);

  // BMI
  const heightM = profile.heightCm / 100;
  const bmi = Math.round((profile.weightKg / (heightM * heightM)) * 10) / 10;
  let bmiCategory = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obesity range';

  return {
    bmr,
    tdee,
    targetCalories,
    calorieDelta,
    macros: {
      proteinG,
      proteinPct: Math.round(proteinPct * 100),
      carbsG,
      carbsPct: Math.round(carbsPct * 100),
      fatG,
      fatPct: Math.round(fatPct * 100),
    },
    recommendedWaterMl,
    bmi,
    bmiCategory,
  };
}

/**
 * Generates an evidence-grounded baseline meal plan tailored to calculated metrics
 */
export function generateBaselineMealPlan(profile: UserProfile, metrics: CalculatedMetrics): DailyMealPlan {
  const target = metrics.targetCalories;
  const isMed = profile.dietaryPattern === 'mediterranean';
  const isDash = profile.dietaryPattern === 'dash';
  const isVegan = profile.dietaryPattern === 'vegan';
  const isVegetarian = profile.dietaryPattern === 'vegetarian';

  // Proportions: Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%
  const bCal = Math.round(target * 0.25);
  const lCal = Math.round(target * 0.35);
  const dCal = Math.round(target * 0.30);
  const sCal = Math.round(target * 0.10);

  let breakfastName = 'Greek Yogurt Bowl with Berries, Chia Seeds & Walnuts';
  let breakfastDesc = 'High in protein and probiotics, paired with antioxidant-rich blueberries and omega-3 walnuts.';
  let breakfastFoods = [
    { name: 'Greek Yogurt (0% or 2%)', portion: '200g', calories: Math.round(bCal * 0.45), proteinG: 22, carbsG: 8, fatG: 2 },
    { name: 'Fresh Blueberries & Raspberries', portion: '100g', calories: Math.round(bCal * 0.2), proteinG: 1, carbsG: 15, fatG: 0.5 },
    { name: 'Raw Walnuts & Chia Seeds', portion: '25g', calories: Math.round(bCal * 0.35), proteinG: 5, carbsG: 6, fatG: 14 },
  ];

  if (isVegan) {
    breakfastName = 'Steel-Cut Oatmeal with Almond Butter, Hemp Hearts & Sliced Banana';
    breakfastDesc = 'Sustained energy from complex beta-glucan fibers and plant protein.';
    breakfastFoods = [
      { name: 'Steel-Cut Rolled Oats', portion: '60g dry', calories: Math.round(bCal * 0.5), proteinG: 8, carbsG: 38, fatG: 3 },
      { name: 'Natural Almond Butter', portion: '20g', calories: Math.round(bCal * 0.3), proteinG: 5, carbsG: 4, fatG: 12 },
      { name: 'Hemp Hearts & Sliced Banana', portion: '1 small banana + 10g hemp', calories: Math.round(bCal * 0.2), proteinG: 4, carbsG: 22, fatG: 4 },
    ];
  }

  let lunchName = isMed
    ? 'Mediterranean Quinoa Salad with Grilled Salmon & Extra Virgin Olive Oil'
    : 'Citrus Herb Grilled Chicken with Brown Rice and Steamed Broccoli';
  let lunchDesc = 'Combines lean protein with low-glycemic complex carbohydrates and micronutrient-dense leafy greens.';
  let lunchFoods = [
    { name: isMed ? 'Wild Atlantic Salmon Fillet' : 'Grilled Chicken Breast', portion: '150g', calories: Math.round(lCal * 0.45), proteinG: 34, carbsG: 0, fatG: 8 },
    { name: 'Cooked Quinoa or Brown Rice', portion: '150g', calories: Math.round(lCal * 0.35), proteinG: 6, carbsG: 40, fatG: 2 },
    { name: 'Steamed Broccoli & Extra Virgin Olive Oil', portion: '150g broccoli + 10ml olive oil', calories: Math.round(lCal * 0.2), proteinG: 4, carbsG: 9, fatG: 10 },
  ];

  if (isVegan || isVegetarian) {
    lunchName = 'Warm Spiced Chickpea & Roasted Vegetable Grain Bowl with Tahini Drizzle';
    lunchDesc = 'Nutrient-rich legume bowl delivering complete amino acids, iron, and prebiotic fiber.';
    lunchFoods = [
      { name: 'Organic Chickpeas (Cooked)', portion: '180g', calories: Math.round(lCal * 0.45), proteinG: 16, carbsG: 42, fatG: 4 },
      { name: 'Tri-Color Quinoa', portion: '140g', calories: Math.round(lCal * 0.35), proteinG: 6, carbsG: 35, fatG: 2 },
      { name: 'Roasted Bell Peppers, Zucchini & Lemon Tahini', portion: '150g veg + 15g tahini', calories: Math.round(lCal * 0.2), proteinG: 4, carbsG: 8, fatG: 10 },
    ];
  }

  let dinnerName = isDash
    ? 'Herb-Crusted Baked Cod with Roasted Sweet Potato & Asparagus (Low Sodium)'
    : 'Grass-Fed Sirloin / Baked Turkey Breast with Roasted Asparagus & Sweet Potato';
  let dinnerDesc = 'Promotes nighttime muscle recovery while remaining easy on digestion before sleep.';
  let dinnerFoods = [
    { name: 'Baked Atlantic Cod or Lean Turkey', portion: '160g', calories: Math.round(dCal * 0.45), proteinG: 32, carbsG: 0, fatG: 3 },
    { name: 'Roasted Sweet Potato with Rosemary', portion: '180g', calories: Math.round(dCal * 0.35), proteinG: 3, carbsG: 38, fatG: 1 },
    { name: 'Charred Asparagus with Garlic & Lemon', portion: '140g', calories: Math.round(dCal * 0.2), proteinG: 4, carbsG: 7, fatG: 4 },
  ];

  if (isVegan || isVegetarian) {
    dinnerName = 'Crispy Pan-Seared Organic Tofu with Bok Choy, Edamame & Cauliflower Mash';
    dinnerDesc = 'Isoflavone-rich whole soy protein with cruciferous vegetables supporting detoxification pathways.';
    dinnerFoods = [
      { name: 'Extra Firm Organic Tofu', portion: '180g', calories: Math.round(dCal * 0.45), proteinG: 24, carbsG: 6, fatG: 14 },
      { name: 'Steamed Edamame in Pods', portion: '100g', calories: Math.round(dCal * 0.3), proteinG: 12, carbsG: 9, fatG: 5 },
      { name: 'Baby Bok Choy & Garlic Cauliflower Puree', portion: '160g', calories: Math.round(dCal * 0.25), proteinG: 4, carbsG: 10, fatG: 3 },
    ];
  }

  const snackName = 'Raw Almonds & Crisp Honeycrisp Apple Slices';
  const snackDesc = 'Stabilizes mid-day blood glucose with soluble pectin fiber and monounsaturated healthy fats.';
  const snackFoods = [
    { name: 'Raw Whole Almonds', portion: '20g', calories: Math.round(sCal * 0.6), proteinG: 4, carbsG: 4, fatG: 10 },
    { name: 'Fresh Apple Slices', portion: '120g', calories: Math.round(sCal * 0.4), proteinG: 0.5, carbsG: 16, fatG: 0.2 },
  ];

  const evidence = [
    'Mifflin-St Jeor equation calibrated to your physical profile and daily energy expenditure.',
    isMed
      ? 'Mediterranean Diet Guideline: High ratio of monounsaturated to saturated fats with cardioprotective polyphenol intake.'
      : isDash
      ? 'DASH Diet Protocol: Emphasizes potassium, magnesium, and calcium density with limited sodium intake.'
      : 'WHO Healthy Diet Principles: Minimum 400g daily fruit & vegetables, with balanced macronutrient distribution.',
    'Protein pacing: 25-35g of protein distributed across main meals to maximize muscle protein synthesis and promote satiety.',
    `Hydration target: Calibrated at ~35 mL per kg of body mass (${Math.round(metrics.recommendedWaterMl / 100) / 10} L) to preserve metabolic rate and cellular function.`,
  ];

  return {
    summary: `Tailored ${profile.dietaryPattern.toUpperCase()} nutrition plan targeting ${target} kcal with ${metrics.macros.proteinG}g protein (${metrics.macros.proteinPct}%), ${metrics.macros.carbsG}g carbs (${metrics.macros.carbsPct}%), and ${metrics.macros.fatG}g healthy fats (${metrics.macros.fatPct}%).`,
    dailyTargets: {
      calories: target,
      protein_g: metrics.macros.proteinG,
      carbs_g: metrics.macros.carbsG,
      fat_g: metrics.macros.fatG,
      water_liters: Math.round(metrics.recommendedWaterMl / 100) / 10,
    },
    meals: [
      {
        id: 'meal-breakfast',
        type: 'Breakfast',
        name: breakfastName,
        calories: bCal,
        proteinG: Math.round((metrics.macros.proteinG * 0.25)),
        carbsG: Math.round((metrics.macros.carbsG * 0.25)),
        fatG: Math.round((metrics.macros.fatG * 0.25)),
        description: breakfastDesc,
        foods: breakfastFoods,
        healthNotes: 'Provides stable morning blood glucose without insulin spikes.',
      },
      {
        id: 'meal-lunch',
        type: 'Lunch',
        name: lunchName,
        calories: lCal,
        proteinG: Math.round((metrics.macros.proteinG * 0.35)),
        carbsG: Math.round((metrics.macros.carbsG * 0.35)),
        fatG: Math.round((metrics.macros.fatG * 0.35)),
        description: lunchDesc,
        foods: lunchFoods,
        healthNotes: 'Rich in lean amino acids and sustained complex carbohydrate energy.',
      },
      {
        id: 'meal-dinner',
        type: 'Dinner',
        name: dinnerName,
        calories: dCal,
        proteinG: Math.round((metrics.macros.proteinG * 0.30)),
        carbsG: Math.round((metrics.macros.carbsG * 0.30)),
        fatG: Math.round((metrics.macros.fatG * 0.30)),
        description: dinnerDesc,
        foods: dinnerFoods,
        healthNotes: 'Optimal evening macronutrient profile for restorative sleep and cellular repair.',
      },
      {
        id: 'meal-snack',
        type: 'Morning Snack',
        name: snackName,
        calories: sCal,
        proteinG: Math.round((metrics.macros.proteinG * 0.10)),
        carbsG: Math.round((metrics.macros.carbsG * 0.10)),
        fatG: Math.round((metrics.macros.fatG * 0.10)),
        description: snackDesc,
        foods: snackFoods,
        healthNotes: 'Blunts hunger hormone ghrelin between main meal intervals.',
      },
    ],
    evidenceGuidelines: evidence,
  };
}
