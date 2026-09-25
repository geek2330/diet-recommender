/**
 * Shared Nutrition Data Provider
 * Fetches food and nutrition data directly from the upstream USDA FoodData Central API.
 */

const UPSTREAM_SOURCE = 'USDA FoodData Central';

/**
 * Helper to get the USDA FDC API key from environment.
 * Never exposes or logs this key.
 */
function getFdcApiKey() {
  return process.env.USDA_FDC_API_KEY || 'DEMO_KEY';
}

/**
 * Helper to safely extract a numeric nutrient value from USDA nutrients array.
 */
function extractNutrientValue(nutrients, candidateNames) {
  if (!Array.isArray(nutrients)) return null;

  for (const name of candidateNames) {
    const match = nutrients.find((n) => {
      const nName = n.nutrientName || (n.nutrient && n.nutrient.name);
      return nName && nName.toLowerCase() === name.toLowerCase();
    });
    if (match) {
      const val = match.value !== undefined ? match.value : match.amount;
      if (typeof val === 'number' && !isNaN(val)) {
        return Math.round(val * 10) / 10;
      }
    }
  }
  return null;
}

/**
 * Searches upstream USDA FoodData Central for matching food records.
 * @param {string} query
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<{items: Array, source: string, fetched_at: string}>}
 */
export async function searchFoods(query, page = 1, pageSize = 10) {
  const apiKey = getFdcApiKey();
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safePageSize = Math.min(20, Math.max(1, parseInt(pageSize, 10) || 10));

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: String(query).trim(),
      pageNumber: safePage,
      pageSize: safePageSize,
    }),
  });

  if (!res.ok) {
    const err = new Error(`Nutrition data request failed with upstream status ${res.status}.`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const rawFoods = Array.isArray(data.foods) ? data.foods : [];

  const items = rawFoods.slice(0, 20).map((food) => {
    const calories = extractNutrientValue(food.foodNutrients, [
      'Energy',
      'Energy (Atwater Specific Factors)',
      'Energy (Atwater General Factors)',
    ]);
    const protein = extractNutrientValue(food.foodNutrients, ['Protein']);
    const fat = extractNutrientValue(food.foodNutrients, ['Total lipid (fat)']);
    const carbs = extractNutrientValue(food.foodNutrients, ['Carbohydrate, by difference']);
    const fiber = extractNutrientValue(food.foodNutrients, ['Fiber, total dietary']);
    const sugar = extractNutrientValue(food.foodNutrients, ['Sugars, total including NLEA', 'Total Sugars']);

    return {
      food_id: String(food.fdcId),
      name: food.description || 'Unknown food',
      brand: food.brandOwner || food.brandName || null,
      category: food.foodCategory || null,
      serving_size: food.servingSize || 100,
      serving_unit: food.servingSizeUnit || 'g',
      nutrients: {
        calories,
        protein_g: protein,
        fat_g: fat,
        carbs_g: carbs,
        fiber_g: fiber,
        sugar_g: sugar,
      },
    };
  });

  return {
    items,
    source: UPSTREAM_SOURCE,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Retrieves detailed food nutrition from USDA FoodData Central, scaled to the specified serving size.
 * @param {string} foodId
 * @param {number} servingG
 * @returns {Promise<{items: Array, source: string, fetched_at: string}>}
 */
export async function getFoodNutrition(foodId, servingG = 100) {
  const apiKey = getFdcApiKey();
  const safeServingG = Math.max(0.1, Number(servingG) || 100);

  const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(foodId)}?api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = new Error(`Nutrition data request failed with upstream status ${res.status}.`);
    err.status = res.status;
    throw err;
  }

  const food = await res.json();
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

  // Upstream reference base is standard 100g, or food.servingSize if specified
  const baseSize = food.servingSize && food.servingSizeUnit === 'g' ? food.servingSize : 100;
  const ratio = safeServingG / baseSize;

  const scale = (val) => (val !== null && val !== undefined ? Math.round(val * ratio * 10) / 10 : null);

  const calories = extractNutrientValue(nutrients, ['Energy', 'Energy (Atwater Specific Factors)', 'Energy (Atwater General Factors)']);
  const protein = extractNutrientValue(nutrients, ['Protein']);
  const fat = extractNutrientValue(nutrients, ['Total lipid (fat)']);
  const carbs = extractNutrientValue(nutrients, ['Carbohydrate, by difference']);
  const fiber = extractNutrientValue(nutrients, ['Fiber, total dietary']);
  const sugar = extractNutrientValue(nutrients, ['Sugars, total including NLEA', 'Total Sugars']);
  const sodium = extractNutrientValue(nutrients, ['Sodium, Na']);
  const potassium = extractNutrientValue(nutrients, ['Potassium, K']);
  const calcium = extractNutrientValue(nutrients, ['Calcium, Ca']);
  const iron = extractNutrientValue(nutrients, ['Iron, Fe']);

  const item = {
    food_id: String(food.fdcId),
    name: food.description || 'Unknown food',
    brand: food.brandOwner || food.brandName || null,
    category: food.foodCategory || null,
    serving_g: safeServingG,
    nutrients: {
      calories: scale(calories),
      protein_g: scale(protein),
      fat_g: scale(fat),
      carbs_g: scale(carbs),
      fiber_g: scale(fiber),
      sugar_g: scale(sugar),
      sodium_mg: scale(sodium),
      potassium_mg: scale(potassium),
      calcium_mg: scale(calcium),
      iron_mg: scale(iron),
    },
    ingredients: food.ingredients || null,
  };

  return {
    items: [item],
    source: UPSTREAM_SOURCE,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Finds factual food alternatives matching a user's stated dietary pattern or restriction.
 * @param {string} query
 * @param {string} dietaryPattern
 * @param {number} maxResults
 * @returns {Promise<{items: Array, source: string, fetched_at: string}>}
 */
export async function findFoodAlternatives(query, dietaryPattern, maxResults = 10) {
  const safeMax = Math.min(20, Math.max(1, parseInt(maxResults, 10) || 10));
  const cleanQuery = String(query).trim();
  const cleanPattern = String(dietaryPattern).trim();

  // Combine query and dietary pattern for upstream search without medical inference
  const combinedSearch = `${cleanPattern} ${cleanQuery}`.trim();

  const searchResult = await searchFoods(combinedSearch, 1, safeMax);

  // If the combined search yields results, return them
  if (searchResult.items && searchResult.items.length > 0) {
    return {
      items: searchResult.items.slice(0, safeMax),
      source: UPSTREAM_SOURCE,
      fetched_at: new Date().toISOString(),
    };
  }

  // Fallback upstream query with modifier keywords (e.g. "plant based", "gluten free")
  let modifier = '';
  const lowerPattern = cleanPattern.toLowerCase();
  if (lowerPattern.includes('vegan') || lowerPattern.includes('vegetarian')) {
    modifier = 'plant based';
  } else if (lowerPattern.includes('gluten')) {
    modifier = 'gluten free';
  } else if (lowerPattern.includes('dairy')) {
    modifier = 'dairy free';
  }

  if (modifier) {
    const secondarySearch = await searchFoods(`${cleanQuery} ${modifier}`, 1, safeMax);
    return {
      items: secondarySearch.items.slice(0, safeMax),
      source: UPSTREAM_SOURCE,
      fetched_at: new Date().toISOString(),
    };
  }

  return {
    items: [],
    source: UPSTREAM_SOURCE,
    fetched_at: new Date().toISOString(),
  };
}
