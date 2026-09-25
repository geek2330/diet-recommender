/**
 * NutriBalance MCP Core Engine
 * Provides daily meal structuring, evidence-based meal recommendations,
 * and nutritional balance evaluation according to clinical dietary science (DASH, Mediterranean, WHO).
 */

import { USDA_REFERENCE_CATALOG } from './nutrition.js';

/**
 * Calculates Mifflin-St Jeor BMR
 */
export function calculateBMR(gender, age, heightCm, weightKg) {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

/**
 * Activity Multipliers
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Computes Daily Meal Structure with slot-by-slot calorie and macronutrient pacing
 */
export function getDailyMealStructure(params = {}) {
  const gender = params.gender || 'male';
  const age = Number(params.age) || 28;
  const heightCm = Number(params.height_cm || params.heightCm) || 178;
  const weightKg = Number(params.weight_kg || params.weightKg) || 75;
  const targetWeightKg = Number(params.target_weight_kg || params.targetWeightKg) || weightKg;
  const activityLevel = params.activity_level || params.activityLevel || 'moderate';
  const primaryGoal = params.primary_goal || params.primaryGoal || 'maintenance';
  const dietaryPattern = (params.dietary_pattern || params.dietaryPattern || 'mediterranean').toLowerCase();
  const mealsPerDay = Math.min(6, Math.max(3, Number(params.meals_per_day || params.mealsPerDay) || 4));

  // 1. Calculate BMR and TDEE
  const bmr = calculateBMR(gender, age, heightCm, weightKg);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 2. Calorie adjustment for primary goal
  let delta = 0;
  if (primaryGoal === 'weight_loss') {
    delta = -500;
  } else if (primaryGoal === 'muscle_gain') {
    delta = 350;
  } else if (primaryGoal === 'athletic_performance') {
    delta = 250;
  } else if (primaryGoal === 'heart_health') {
    delta = weightKg > targetWeightKg ? -300 : 0;
  }

  const minSafe = gender === 'female' ? 1200 : 1500;
  const targetCalories = Math.max(minSafe, tdee + delta);

  // 3. Macronutrient percentages
  let proteinPct = 0.25;
  let fatPct = 0.25;
  let carbsPct = 0.50;

  if (dietaryPattern === 'mediterranean') {
    proteinPct = 0.22;
    fatPct = 0.35; // Rich in healthy MUFA & PUFA
    carbsPct = 0.43;
  } else if (dietaryPattern === 'dash') {
    proteinPct = 0.20;
    fatPct = 0.25;
    carbsPct = 0.55;
  } else if (dietaryPattern === 'high_protein' || primaryGoal === 'muscle_gain') {
    proteinPct = 0.30;
    fatPct = 0.25;
    carbsPct = 0.45;
  } else if (dietaryPattern === 'low_carb') {
    proteinPct = 0.30;
    fatPct = 0.45;
    carbsPct = 0.25;
  } else if (dietaryPattern === 'vegan' || dietaryPattern === 'vegetarian') {
    proteinPct = 0.20;
    fatPct = 0.25;
    carbsPct = 0.55;
  }

  const targetProteinG = Math.round((targetCalories * proteinPct) / 4);
  const targetCarbsG = Math.round((targetCalories * carbsPct) / 4);
  const targetFatG = Math.round((targetCalories * fatPct) / 9);
  const targetFiberG = Math.round((targetCalories / 1000) * 14); // 14g per 1000 kcal

  // 4. Hydration target
  let waterBonus = 0;
  if (activityLevel === 'moderate') waterBonus = 500;
  if (activityLevel === 'very_active') waterBonus = 800;
  if (activityLevel === 'extra_active') waterBonus = 1100;
  const recommendedWaterMl = Math.round(weightKg * 35 + waterBonus);

  // 5. Meal Slot Pacing Splits based on mealsPerDay
  let slots = [];
  if (mealsPerDay === 3) {
    slots = [
      { name: 'Breakfast', ratio: 0.30, timing: '07:30 - 08:30', description: 'Morning activation: Lean protein and slow-digesting complex carbs' },
      { name: 'Lunch', ratio: 0.40, timing: '12:30 - 13:30', description: 'Mid-day sustenance: High protein, complex fiber, and colorful phytonutrients' },
      { name: 'Dinner', ratio: 0.30, timing: '18:30 - 19:30', description: 'Evening recovery: Light lean protein with restorative magnesium-rich greens' },
    ];
  } else if (mealsPerDay === 4) {
    slots = [
      { name: 'Breakfast', ratio: 0.25, timing: '07:30 - 08:30', description: 'Morning wake-up: Fast protein pacing and low-glycemic carbs' },
      { name: 'Lunch', ratio: 0.35, timing: '12:30 - 13:30', description: 'Peak energy fuel: High amino acid density with whole grain fibers' },
      { name: 'Afternoon Snack', ratio: 0.10, timing: '16:00 - 16:30', description: 'Metabolic bridge: Healthy fats and raw fruit fiber to prevent late-day cravings' },
      { name: 'Dinner', ratio: 0.30, timing: '19:00 - 20:00', description: 'Restorative evening meal: Satiating protein and easily digestible vegetables' },
    ];
  } else if (mealsPerDay === 5) {
    slots = [
      { name: 'Breakfast', ratio: 0.22, timing: '07:30 - 08:30', description: 'Morning protein boost and hydration' },
      { name: 'Morning Snack', ratio: 0.10, timing: '10:30 - 11:00', description: 'Cognitive focus snack: Nuts or berries' },
      { name: 'Lunch', ratio: 0.33, timing: '13:00 - 13:45', description: 'Nutrient-dense main plate' },
      { name: 'Afternoon Snack', ratio: 0.10, timing: '16:30 - 17:00', description: 'Pre-workout or afternoon energy stabilizer' },
      { name: 'Dinner', ratio: 0.25, timing: '19:30 - 20:30', description: 'Lean protein and antioxidant vegetables' },
    ];
  } else {
    // 6 meals
    slots = [
      { name: 'Breakfast', ratio: 0.20, timing: '07:00 - 08:00', description: 'Morning kickstart' },
      { name: 'Morning Snack', ratio: 0.10, timing: '10:00 - 10:30', description: 'Fiber & micronutrient bridge' },
      { name: 'Lunch', ratio: 0.28, timing: '12:30 - 13:30', description: 'High-protein lunch' },
      { name: 'Post-Workout / Snack', ratio: 0.12, timing: '16:00 - 16:30', description: 'Recovery nutrition' },
      { name: 'Dinner', ratio: 0.20, timing: '19:00 - 20:00', description: 'Light balanced dinner' },
      { name: 'Evening Snack', ratio: 0.10, timing: '21:30 - 22:00', description: 'Slow-release casein or herbal relaxation' },
    ];
  }

  const mealSlots = slots.map((s, idx) => {
    const slotCal = Math.round(targetCalories * s.ratio);
    const slotP = Math.round(targetProteinG * s.ratio);
    const slotC = Math.round(targetCarbsG * s.ratio);
    const slotF = Math.round(targetFatG * s.ratio);

    return {
      slot_index: idx + 1,
      slot_name: s.name,
      recommended_timing: s.timing,
      target_calories: slotCal,
      target_protein_g: slotP,
      target_carbs_g: slotC,
      target_fat_g: slotF,
      description: s.description,
      calorie_percentage: Math.round(s.ratio * 100),
      protein_pacing_guideline: `Aim for ${Math.max(15, slotP)}g protein in this slot to optimize muscle protein synthesis.`,
    };
  });

  return {
    service: 'NutriBalance MCP',
    version: '1.0.0',
    user_summary: {
      gender,
      age,
      weight_kg: weightKg,
      bmr,
      tdee,
      target_calories: targetCalories,
      primary_goal: primaryGoal,
      dietary_pattern: dietaryPattern,
    },
    daily_structure: {
      target_calories: targetCalories,
      target_protein_g: targetProteinG,
      target_carbs_g: targetCarbsG,
      target_fat_g: targetFatG,
      target_fiber_g: targetFiberG,
      recommended_water_ml: recommendedWaterMl,
      meals_count: mealsPerDay,
    },
    meal_slots: mealSlots,
    pacing_rules: [
      'Maintain 3 to 4 hours between major meals for optimal insulin sensitivity.',
      'Front-load 50-60% of daily calories into breakfast and lunch to improve diurnal metabolic rhythm.',
      'Distribute minimum 20-35g protein per main meal to trigger muscle protein synthesis (MPS).',
      `Consume at least 500 mL water upon waking and 250 mL 30 minutes before each main meal.`,
    ],
    evidence_framework: 'NutriBalance Clinical Guidelines (Mifflin-St Jeor, DASH & Mediterranean Pacing Standards)',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Curated NutriBalance Meal Recommendation Database
 * Built with authentic USDA food ingredients and calibrated nutrient values.
 */
const NUTRIBALANCE_MEAL_LIBRARY = [
  // Breakfasts
  {
    meal_id: 'nb-brk-01',
    meal_type: 'Breakfast',
    name: 'Mediterranean Greek Yogurt & Wild Berry Parfait',
    dietary_patterns: ['mediterranean', 'balanced', 'vegetarian', 'gluten_free', 'high_protein'],
    calories: 420,
    protein_g: 28,
    carbs_g: 38,
    fat_g: 16,
    fiber_g: 7,
    balance_score: 98,
    description: 'Creamy probiotic Greek yogurt layered with antioxidant-dense blueberries, raw walnuts, and organic chia seeds.',
    ingredients: [
      { food_id: '170886', name: 'Greek Yogurt, nonfat plain', portion: '220g', calories: 130, protein_g: 22, carbs_g: 8, fat_g: 0.8 },
      { food_id: '171711', name: 'Fresh Blueberries', portion: '100g', calories: 57, protein_g: 0.7, carbs_g: 14.5, fat_g: 0.3 },
      { food_id: '170567', name: 'Raw Walnuts & Chia', portion: '30g', calories: 185, protein_g: 4.8, carbs_g: 6.2, fat_g: 14.5 },
      { food_id: '2709215', name: 'Apple slices (topping)', portion: '80g', calories: 48, protein_g: 0.5, carbs_g: 11, fat_g: 0.4 },
    ],
    preparation_summary: 'Layer strained Greek yogurt into a bowl, fold in fresh berries and chia seeds, and top with crushed walnuts.',
    balance_highlights: [
      'Delivers 28g slow-digesting protein with live active probiotics',
      'High in plant-derived omega-3 ALA from walnuts and chia',
      'Zero refined sugar; sweetened naturally by polyphenolic berries',
    ],
  },
  {
    meal_id: 'nb-brk-02',
    meal_type: 'Breakfast',
    name: 'Avocado & Soft-Boiled Pasture Eggs on Sprouted Wheat Toast',
    dietary_patterns: ['balanced', 'mediterranean', 'dash', 'high_protein', 'vegetarian'],
    calories: 460,
    protein_g: 24,
    carbs_g: 36,
    fat_g: 24,
    fiber_g: 9,
    balance_score: 95,
    description: 'Mashed Hass avocado on toasted whole-grain bread topped with pasture-raised eggs, cherry tomatoes, and microgreens.',
    ingredients: [
      { food_id: '171287', name: 'Whole Eggs (Boiled/Poached)', portion: '2 large (100g)', calories: 155, protein_g: 12.6, carbs_g: 1.1, fat_g: 10.6 },
      { food_id: '172183', name: 'Egg White (Extra Protein)', portion: '50g', calories: 26, protein_g: 5.5, carbs_g: 0.4, fat_g: 0.1 },
      { food_id: '172688', name: 'Whole Wheat Sprouted Bread', portion: '2 slices (70g)', calories: 172, protein_g: 8.4, carbs_g: 29, fat_g: 2.4 },
      { food_id: '171705', name: 'California Hass Avocado', portion: '60g', calories: 96, protein_g: 1.2, carbs_g: 5.1, fat_g: 8.8 },
      { food_id: '170457', name: 'Cherry Tomatoes', portion: '50g', calories: 11, protein_g: 0.5, carbs_g: 2.1, fat_g: 0.1 },
    ],
    preparation_summary: 'Toast bread until golden. Mash avocado with sea salt and lemon juice. Spread over toast and crown with soft eggs.',
    balance_highlights: [
      'Choline-rich egg yolk supporting neural and liver metabolism',
      'Monounsaturated oleic acid from avocado lowers LDL cholesterol',
      'Complex grain fiber ensures sustained 4-hour morning satiety',
    ],
  },
  {
    meal_id: 'nb-brk-03',
    meal_type: 'Breakfast',
    name: 'Golden Turmeric Steel-Cut Oats with Almond Butter & Hemp Hearts',
    dietary_patterns: ['vegan', 'vegetarian', 'dairy_free', 'dash', 'balanced'],
    calories: 430,
    protein_g: 19,
    carbs_g: 54,
    fat_g: 16,
    fiber_g: 11,
    balance_score: 96,
    description: 'Slow-simmered whole grain oats infused with Ceylon cinnamon, topped with stone-ground almond butter and hemp protein.',
    ingredients: [
      { food_id: '169705', name: 'Rolled Oats (Dry)', portion: '60g', calories: 233, protein_g: 10.1, carbs_g: 39.8, fat_g: 4.1 },
      { food_id: '174832', name: 'Unsweetened Almond Milk', portion: '180g', calories: 27, protein_g: 1.1, carbs_g: 1.1, fat_g: 2.0 },
      { food_id: '170567', name: 'Natural Almond Butter', portion: '20g', calories: 122, protein_g: 4.4, carbs_g: 4.3, fat_g: 10.6 },
      { food_id: '173944', name: 'Sliced Fresh Banana', portion: '60g', calories: 53, protein_g: 0.7, carbs_g: 13.7, fat_g: 0.2 },
    ],
    preparation_summary: 'Simmer oats in almond milk for 6 minutes. Stir in turmeric and cinnamon. Swirl with almond butter and banana slices.',
    balance_highlights: [
      'Beta-glucan soluble fiber clinically proven to lower serum LDL',
      '100% plant-based with complete amino acid coverage',
      'Anti-inflammatory polyphenol profile from turmeric and cinnamon',
    ],
  },

  // Lunches
  {
    meal_id: 'nb-lun-01',
    meal_type: 'Lunch',
    name: 'Grilled Herb Atlantic Salmon & Warm Lemon-Herb Quinoa Bowl',
    dietary_patterns: ['mediterranean', 'dash', 'high_protein', 'gluten_free', 'balanced'],
    calories: 580,
    protein_g: 42,
    carbs_g: 48,
    fat_g: 22,
    fiber_g: 8,
    balance_score: 99,
    description: 'Wild Atlantic salmon fillet seared with dill and olive oil, served over fluffy tri-color quinoa and steamed broccoli.',
    ingredients: [
      { food_id: '175168', name: 'Wild Atlantic Salmon', portion: '160g', calories: 291, protein_g: 40.6, carbs_g: 0, fat_g: 13.0 },
      { food_id: '168917', name: 'Cooked Quinoa', portion: '150g', calories: 180, protein_g: 6.6, carbs_g: 32, fat_g: 2.9 },
      { food_id: '170379', name: 'Steamed Broccoli Florets', portion: '140g', calories: 48, protein_g: 3.9, carbs_g: 9.2, fat_g: 0.6 },
      { food_id: '171413', name: 'Extra Virgin Olive Oil', portion: '8ml', calories: 71, protein_g: 0, carbs_g: 0, fat_g: 8.0 },
    ],
    preparation_summary: 'Season salmon with coarse black pepper and herbs. Sear 4 minutes per side. Plate over quinoa with lemon-steamed greens.',
    balance_highlights: [
      'Over 2,200mg of cardio-protective EPA & DHA omega-3 fatty acids',
      'Complete amino acid profile paired with low-glycemic complex quinoa',
      'Sulforaphane from broccoli enhances cellular antioxidant response',
    ],
  },
  {
    meal_id: 'nb-lun-02',
    meal_type: 'Lunch',
    name: 'Citrus Rosemary Chicken Breast with Brown Rice & Charred Asparagus',
    dietary_patterns: ['balanced', 'dash', 'high_protein', 'gluten_free', 'dairy_free'],
    calories: 520,
    protein_g: 48,
    carbs_g: 52,
    fat_g: 12,
    fiber_g: 7,
    balance_score: 97,
    description: 'Tender grilled chicken breast marinated in garlic, rosemary, and lemon, paired with nutty brown rice and tender asparagus.',
    ingredients: [
      { food_id: '171077', name: 'Grilled Chicken Breast', portion: '160g', calories: 264, protein_g: 49.6, carbs_g: 0, fat_g: 5.8 },
      { food_id: '168886', name: 'Whole Grain Brown Rice (Cooked)', portion: '160g', calories: 179, protein_g: 4.2, carbs_g: 37.6, fat_g: 1.4 },
      { food_id: '170379', name: 'Steamed Asparagus & Garlic', portion: '130g', calories: 30, protein_g: 3.1, carbs_g: 5.4, fat_g: 0.3 },
      { food_id: '171413', name: 'Extra Virgin Olive Oil', portion: '6ml', calories: 53, protein_g: 0, carbs_g: 0, fat_g: 6.0 },
    ],
    preparation_summary: 'Marinate chicken in lemon juice, garlic, and thyme. Grill to internal temp of 165°F. Serve with warm brown rice.',
    balance_highlights: [
      'Ultra-lean protein source ideal for lean muscle mass preservation',
      'High in vitamin B6, niacin, and phosphorus for cellular energy production',
      'Low sodium profile meeting stringent DASH cardiovascular standards',
    ],
  },
  {
    meal_id: 'nb-lun-03',
    meal_type: 'Lunch',
    name: 'Moroccan Spiced Chickpea & Roasted Vegetable Tahini Grain Bowl',
    dietary_patterns: ['vegan', 'vegetarian', 'dairy_free', 'mediterranean', 'dash'],
    calories: 510,
    protein_g: 22,
    carbs_g: 68,
    fat_g: 18,
    fiber_g: 16,
    balance_score: 96,
    description: 'Oven-roasted chickpeas tossed in cumin and paprika, layered with roasted bell peppers, zucchini, quinoa, and creamy tahini.',
    ingredients: [
      { food_id: '173757', name: 'Cooked Chickpeas (Garbanzo)', portion: '180g', calories: 295, protein_g: 16.0, carbs_g: 49.3, fat_g: 4.7 },
      { food_id: '168917', name: 'Organic Quinoa', portion: '120g', calories: 144, protein_g: 5.3, carbs_g: 25.6, fat_g: 2.3 },
      { food_id: '170393', name: 'Roasted Carrots & Bell Pepper', portion: '120g', calories: 42, protein_g: 1.1, carbs_g: 9.8, fat_g: 0.2 },
      { food_id: '170567', name: 'Sesame Tahini Drizzle', portion: '12g', calories: 71, protein_g: 2.2, carbs_g: 2.6, fat_g: 6.5 },
    ],
    preparation_summary: 'Roast chickpeas and vegetables at 400°F with cumin and paprika. Assemble over quinoa and drizzle with lemon tahini.',
    balance_highlights: [
      '16g prebiotic dietary fiber nourishing beneficial gut microbiome',
      'Rich in plant iron and zinc supported by vitamin C absorption',
      'Completely plant-based with balanced legume + seed protein',
    ],
  },

  // Dinners
  {
    meal_id: 'nb-din-01',
    meal_type: 'Dinner',
    name: 'Herb-Crusted Baked Cod Fillet with Roasted Sweet Potato & Garlic Spinach',
    dietary_patterns: ['dash', 'mediterranean', 'balanced', 'gluten_free', 'high_protein'],
    calories: 490,
    protein_g: 40,
    carbs_g: 44,
    fat_g: 14,
    fiber_g: 8,
    balance_score: 99,
    description: 'Flaky Atlantic white cod fillet baked with herbs, served alongside vitamin A-rich sweet potato and wilted garlic baby spinach.',
    ingredients: [
      { food_id: '175168', name: 'Atlantic White Cod / Halibut', portion: '180g', calories: 189, protein_g: 41.0, carbs_g: 0, fat_g: 1.5 },
      { food_id: '170438', name: 'Baked Sweet Potato (in skin)', portion: '170g', calories: 153, protein_g: 3.4, carbs_g: 35.2, fat_g: 0.3 },
      { food_id: '170417', name: 'Sautéed Baby Spinach', portion: '140g', calories: 32, protein_g: 4.1, carbs_g: 5.0, fat_g: 0.6 },
      { food_id: '171413', name: 'Extra Virgin Olive Oil', portion: '12ml', calories: 106, protein_g: 0, carbs_g: 0, fat_g: 12.0 },
    ],
    preparation_summary: 'Bake cod at 380°F for 14 minutes with lemon and dill. Pierce and roast sweet potato. Flash sauté spinach in olive oil.',
    balance_highlights: [
      'High potassium-to-sodium ratio (over 1,200mg potassium) lowering arterial tension',
      'Over 200% daily value of beta-carotene and lutein for ocular and cellular health',
      'Digestive lightness promoting restful REM sleep without gastrointestinal load',
    ],
  },
  {
    meal_id: 'nb-din-02',
    meal_type: 'Dinner',
    name: 'Crispy Seared Organic Tofu with Bok Choy, Edamame & Cauliflower Mash',
    dietary_patterns: ['vegan', 'vegetarian', 'dairy_free', 'low_carb', 'gluten_free', 'balanced'],
    calories: 440,
    protein_g: 34,
    carbs_g: 26,
    fat_g: 22,
    fiber_g: 10,
    balance_score: 97,
    description: 'Pressed firm organic tofu cubes pan-seared to golden perfection with steamed edamame, ginger baby bok choy, and silky cauliflower.',
    ingredients: [
      { food_id: '172421', name: 'Firm Organic Tofu', portion: '180g', calories: 149, protein_g: 18.0, carbs_g: 4.1, fat_g: 9.5 },
      { food_id: '172429', name: 'Steamed Young Edamame', portion: '100g', calories: 122, protein_g: 11.9, carbs_g: 8.9, fat_g: 5.2 },
      { food_id: '170379', name: 'Steamed Bok Choy & Ginger', portion: '140g', calories: 25, protein_g: 2.1, carbs_g: 4.0, fat_g: 0.3 },
      { food_id: '171413', name: 'Toasted Sesame / Olive Oil', portion: '10ml', calories: 88, protein_g: 0, carbs_g: 0, fat_g: 10.0 },
    ],
    preparation_summary: 'Press and cube tofu. Sear in skillet with sesame oil until crisp. Toss with steamed edamame and ginger bok choy.',
    balance_highlights: [
      'Bioavailable plant calcium (over 400mg) and soy isoflavones for bone density',
      'Low carbohydrate impact suitable for glycemic management and evening metabolic rest',
      'Cruciferous sulforaphanes support liver phase-II enzymatic detoxification',
    ],
  },
  {
    meal_id: 'nb-din-03',
    meal_type: 'Dinner',
    name: 'Lean Grass-Fed Sirloin / Ground Turkey Steak with Charred Broccoli & Quinoa',
    dietary_patterns: ['high_protein', 'balanced', 'gluten_free', 'dairy_free'],
    calories: 540,
    protein_g: 46,
    carbs_g: 38,
    fat_g: 20,
    fiber_g: 7,
    balance_score: 96,
    description: 'Tender lean sirloin or seasoned 93/7 turkey steak with roasted garlic broccoli florets and tri-color quinoa.',
    ingredients: [
      { food_id: '174032', name: 'Lean Beef Sirloin / Turkey', portion: '160g', calories: 280, protein_g: 41.2, carbs_g: 0, fat_g: 12.0 },
      { food_id: '168917', name: 'Tri-Color Quinoa', portion: '120g', calories: 144, protein_g: 5.3, carbs_g: 25.6, fat_g: 2.3 },
      { food_id: '170379', name: 'Roasted Broccoli with Lemon', portion: '150g', calories: 51, protein_g: 4.2, carbs_g: 9.9, fat_g: 0.6 },
      { food_id: '171413', name: 'Olive Oil Brush', portion: '7ml', calories: 62, protein_g: 0, carbs_g: 0, fat_g: 7.0 },
    ],
    preparation_summary: 'Season sirloin or turkey with sea salt and cracked pepper. Sear 3-4 minutes per side. Serve alongside roasted broccoli and quinoa.',
    balance_highlights: [
      'Heme-iron density combating anemia and supporting oxygen transport',
      'Bioavailable zinc and vitamin B12 for immune resilience and muscle recovery',
      'Balanced macro split preventing evening insulin spikes',
    ],
  },

  // Snacks
  {
    meal_id: 'nb-snk-01',
    meal_type: 'Snacks',
    name: 'Raw California Almonds & Crisp Honeycrisp Apple Slices',
    dietary_patterns: ['mediterranean', 'dash', 'vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'balanced'],
    calories: 190,
    protein_g: 5,
    carbs_g: 22,
    fat_g: 10,
    fiber_g: 5,
    balance_score: 98,
    description: 'A pocket-friendly nutrient duo providing soluble pectin fiber and monounsaturated fatty acids.',
    ingredients: [
      { food_id: '170567', name: 'Raw Whole Almonds', portion: '20g', calories: 116, protein_g: 4.2, carbs_g: 4.3, fat_g: 10.0 },
      { food_id: '2709215', name: 'Crisp Apple Slices', portion: '130g', calories: 68, protein_g: 0.4, carbs_g: 17.9, fat_g: 0.2 },
    ],
    preparation_summary: 'Slice one crisp apple and serve alongside raw unroasted almonds.',
    balance_highlights: [
      'Blunts hunger hormone ghrelin for 2.5 hours without energy crashes',
      'Rich in vitamin E alpha-tocopherol protecting skin and vascular endothelium',
      'High in soluble fiber regulating digestive transit',
    ],
  },
  {
    meal_id: 'nb-snk-02',
    meal_type: 'Snacks',
    name: 'Low-Fat Cottage Cheese with Chia Seeds & Fresh Strawberries',
    dietary_patterns: ['high_protein', 'vegetarian', 'gluten_free', 'balanced'],
    calories: 180,
    protein_g: 18,
    carbs_g: 14,
    fat_g: 4,
    fiber_g: 4,
    balance_score: 97,
    description: 'Slow-digesting micellar casein protein paired with vitamin C-packed strawberries and chia.',
    ingredients: [
      { food_id: '170875', name: 'Low-Fat Cottage Cheese (1%)', portion: '140g', calories: 101, protein_g: 17.4, carbs_g: 3.8, fat_g: 1.4 },
      { food_id: '167762', name: 'Fresh Strawberries', portion: '100g', calories: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3 },
      { food_id: '170567', name: 'Chia Seeds', portion: '10g', calories: 49, protein_g: 1.7, carbs_g: 4.2, fat_g: 3.1 },
    ],
    preparation_summary: 'Spoon cottage cheese into a small cup, fold in sliced strawberries and chia seeds.',
    balance_highlights: [
      '18g protein for only 180 kcal, with slow 6-hour amino acid delivery',
      'Over 80% daily value of ascorbic acid (Vitamin C)',
      'Calcium and phosphorus support skeletal mineral density',
    ],
  },
];

/**
 * Searches and returns personalized NutriBalance meal recommendations
 */
export function getMealRecommendations(options = {}) {
  const mealType = options.meal_type || options.mealType;
  const dietaryPattern = (options.dietary_pattern || options.dietaryPattern || '').toLowerCase().trim();
  const targetCalories = Number(options.target_calories || options.targetCalories) || 0;
  const maxResults = Math.min(10, Math.max(1, Number(options.max_results || options.maxResults) || 4));

  let filtered = NUTRIBALANCE_MEAL_LIBRARY;

  // Filter by meal type if specified (e.g. Breakfast, Lunch, Dinner, Snacks)
  if (mealType && mealType !== 'All') {
    const cleanType = mealType.toLowerCase();
    filtered = filtered.filter((m) => {
      const mType = m.meal_type.toLowerCase();
      if (cleanType.includes('breakfast') && mType.includes('breakfast')) return true;
      if (cleanType.includes('lunch') && mType.includes('lunch')) return true;
      if (cleanType.includes('dinner') && mType.includes('dinner')) return true;
      if (cleanType.includes('snack') && mType.includes('snack')) return true;
      return mType === cleanType;
    });
  }

  // Filter by dietary pattern if compatible
  if (dietaryPattern && dietaryPattern !== 'balanced') {
    const patternMatch = filtered.filter((m) =>
      m.dietary_patterns.some((dp) => dp.includes(dietaryPattern) || dietaryPattern.includes(dp))
    );
    if (patternMatch.length > 0) {
      filtered = patternMatch;
    }
  }

  // Sort by calorie proximity if target calories provided
  if (targetCalories > 0) {
    filtered = [...filtered].sort((a, b) => Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories));
  }

  const items = filtered.slice(0, maxResults);

  return {
    service: 'NutriBalance MCP',
    version: '1.0.0',
    criteria: {
      meal_type: mealType || 'Any',
      dietary_pattern: dietaryPattern || 'balanced',
      target_calories: targetCalories || null,
      results_count: items.length,
    },
    recommendations: items,
    framework: 'NutriBalance Micronutrient & Macronutrient Evidence Database',
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Evaluates a day of eating or a set of meals to generate a NutriBalance Score (0-100)
 * and a nutrient balance report card.
 */
export function evaluateNutrientBalance(params = {}) {
  const meals = Array.isArray(params.meals) ? params.meals : [];
  const targetCalories = Number(params.target_calories || params.targetCalories) || 2000;
  const targetProteinG = Number(params.target_protein_g || params.targetProteinG) || Math.round((targetCalories * 0.25) / 4);
  const targetCarbsG = Number(params.target_carbs_g || params.targetCarbsG) || Math.round((targetCalories * 0.45) / 4);
  const targetFatG = Number(params.target_fat_g || params.targetFatG) || Math.round((targetCalories * 0.30) / 9);

  // Accumulate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  meals.forEach((m) => {
    totalCalories += Number(m.calories || 0);
    totalProtein += Number(m.protein_g || m.proteinG || 0);
    totalCarbs += Number(m.carbs_g || m.carbsG || 0);
    totalFat += Number(m.fat_g || m.fatG || 0);
  });

  // Calculate Sub-Scores (0 to 100)
  // 1. Calorie Accuracy Score
  const calRatio = totalCalories > 0 ? totalCalories / targetCalories : 0;
  let calorieScore = 100;
  if (calRatio > 0) {
    const deviation = Math.abs(1 - calRatio);
    calorieScore = Math.max(20, Math.round(100 - deviation * 150));
  } else {
    calorieScore = 50;
  }

  // 2. Protein Density & Pacing Score
  const proteinRatio = totalProtein > 0 ? totalProtein / targetProteinG : 0;
  let proteinScore = Math.max(30, Math.min(100, Math.round(proteinRatio * 95)));

  // 3. Macronutrient Distribution Score
  let macroScore = 85;
  if (totalCalories > 0) {
    const actualP = (totalProtein * 4) / totalCalories;
    const actualC = (totalCarbs * 4) / totalCalories;
    const actualF = (totalFat * 9) / totalCalories;
    if (actualP >= 0.15 && actualP <= 0.35 && actualF <= 0.40) {
      macroScore = 95;
    }
  }

  // Overall NutriBalance Score
  const overallScore = Math.round(calorieScore * 0.35 + proteinScore * 0.35 + macroScore * 0.30);

  let grade = 'A';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else grade = 'Needs Improvement';

  const recommendations = [];
  if (totalProtein < targetProteinG * 0.85) {
    recommendations.push(`Increase protein by ~${Math.round(targetProteinG - totalProtein)}g with Greek yogurt, wild salmon, or organic tofu.`);
  }
  if (totalCalories < targetCalories * 0.8) {
    recommendations.push(`Caloric intake is currently below target. Add a nutrient-dense snack of almonds, fruit, or seeds.`);
  } else if (totalCalories > targetCalories * 1.15) {
    recommendations.push(`Calorie intake exceeded daily baseline by ${Math.round(totalCalories - targetCalories)} kcal. Focus on low-calorie vegetables for bulk.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Superb adherence! Your daily meal structure and macro distribution align with clinical dietary targets.');
  }

  return {
    service: 'NutriBalance MCP',
    version: '1.0.0',
    nutribalance_score: overallScore,
    letter_grade: grade,
    totals: {
      calories: totalCalories,
      target_calories: targetCalories,
      protein_g: Math.round(totalProtein * 10) / 10,
      target_protein_g: targetProteinG,
      carbs_g: Math.round(totalCarbs * 10) / 10,
      target_carbs_g: targetCarbsG,
      fat_g: Math.round(totalFat * 10) / 10,
      target_fat_g: targetFatG,
    },
    sub_scores: {
      calorie_accuracy: calorieScore,
      protein_pacing: proteinScore,
      macro_balance: macroScore,
    },
    actionable_recommendations: recommendations,
    evaluated_at: new Date().toISOString(),
  };
}
