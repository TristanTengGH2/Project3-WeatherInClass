export const OUTFITS = {
  cold: [
    "assets/cold-01-puffer-front.png",
    "assets/cold-02-wool-coat-front.png",
    "assets/cold-03-parka-front.png",
  ],
  cool: [
    "assets/cool-01-fleece-front.png",
    "assets/cool-02-denim-front.png",
    "assets/cool-03-hoodie-front.png",
  ],
  mild: [
    "assets/mild-01-cardigan-front.png",
    "assets/mild-02-flannel-front.png",
    "assets/mild-03-bomber-front.png",
  ],
  warm: [
    "assets/warm-01-tshirt-shorts-front.png",
    "assets/warm-02-tank-cap-front.png",
    "assets/warm-03-button-shirt-front.png",
  ],
};

const CATEGORY_LABELS = {
  cold: "Cold",
  cool: "Cool",
  mild: "Mild",
  warm: "Warm",
};

const RECOMMENDATION_TEXTS = {
  cold: "It's cold out — bundle up with a heavy coat.",
  cool: "Cool air today — a jacket over a layer should do it.",
  mild: "Mild conditions — a light layer is enough.",
  warm: "Warm today — dress light and stay comfortable.",
};

export const REMINDER_TEXTS = {
  umbrella: [
    "Rain's likely today — bring an umbrella.",
    "Don't forget your umbrella, showers are expected.",
    "Grab an umbrella before you head out.",
  ],
  sun: [
    "UV is high — put on some sunscreen.",
    "Don't forget sunscreen today.",
    "Sun's strong out there — sunscreen and shades recommended.",
  ],
  hydration: [
    "It's hot — stay hydrated today.",
    "Drink extra water, it's a warm one.",
    "Keep water on hand — temps are climbing.",
  ],
};

export const REMINDER_ICONS = {
  umbrella: "assets/umbrella.png",
  sun: "assets/sunscreen.png",
  hydration: "assets/water.png",
};

// Default boundaries (°F) between outfit categories, from research.md's conventional bands.
// The User can override these with the 3-handle sensitivity slider (0-100°F).
export const DEFAULT_BOUNDARIES = { b1: 35, b2: 45, b3: 60 };

export function classifyOutfitCategory(apparentTempF, boundaries = DEFAULT_BOUNDARIES) {
  const { b1, b2, b3 } = boundaries;
  if (apparentTempF < b1) return "cold";
  if (apparentTempF < b2) return "cool";
  if (apparentTempF < b3) return "mild";
  return "warm";
}

export function computeReminderFlags(day, prefs) {
  const hydrationOffset = prefs.applySensitivityToHydration
    ? prefs.boundaries.b3 - DEFAULT_BOUNDARIES.b3
    : 0;
  return {
    umbrella: day.precipProbMax >= 40,
    sun: day.uvIndexMax >= 3,
    hydration: day.apparentTempF >= 80 + hydrationOffset,
  };
}

function randomIndex() {
  return Math.floor(Math.random() * 3);
}

/**
 * Build recommendation state for one (location, date) forecast.
 * Existing variation indices can be supplied when preferences change so the
 * category/reminders recalculate without visibly re-rolling content.
 */
export function buildRecommendationState(day, prefs, variations = {}) {
  const category = classifyOutfitCategory(day.apparentTempF, prefs.boundaries);
  const outfitIndex = variations.outfitIndex ?? randomIndex();
  const flags = computeReminderFlags(day, prefs);
  const reminderTextIndices = { ...(variations.reminderTextIndices || {}) };
  const reminders = Object.entries(flags)
    .filter(([, active]) => active)
    .map(([type]) => {
      reminderTextIndices[type] ??= randomIndex();
      return { type, textIndex: reminderTextIndices[type] };
    });

  return {
    date: day.date,
    currentTempF: day.currentTempF,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    recommendationText: RECOMMENDATION_TEXTS[category],
    outfitIndex,
    outfitImage: OUTFITS[category][outfitIndex],
    icon: day.icon,
    apparentTempF: day.apparentTempF,
    actualHighF: day.actualHighF,
    actualLowF: day.actualLowF,
    uvIndexMax: day.uvIndexMax,
    windSpeedMph: day.windSpeedMph,
    reminderTextIndices,
    reminders,
  };
}
