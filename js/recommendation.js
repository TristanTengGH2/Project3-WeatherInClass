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

// Sensitivity preference -> °F offset applied to the outfit-band thresholds.
// "runs cold" needs a lower temp before they're satisfied with lighter clothing (negative offset
// shifts them toward heavier categories sooner); "runs hot" is the opposite.
export const SENSITIVITY_OFFSETS = {
  cold: 10,
  average: 0,
  hot: -10,
};

export function classifyOutfitCategory(apparentTempF, sensitivity = "average") {
  const offset = SENSITIVITY_OFFSETS[sensitivity] ?? 0;
  const t = apparentTempF + offset;
  if (t < 35) return "cold";
  if (t < 45) return "cool";
  if (t < 60) return "mild";
  return "warm";
}

export function computeReminderFlags(day, prefs) {
  const hydrationOffset =
    prefs.applySensitivityToHydration ? SENSITIVITY_OFFSETS[prefs.sensitivity] ?? 0 : 0;
  return {
    umbrella: day.precipProbMax >= 40,
    sun: day.uvIndexMax >= 3,
    hydration: day.apparentTempF + hydrationOffset >= 80,
  };
}

function randomIndex() {
  return Math.floor(Math.random() * 3);
}

/** Build a fresh recommendation state for one (location, date) day's forecast. */
export function buildRecommendationState(day, prefs) {
  const category = classifyOutfitCategory(day.apparentTempF, prefs.sensitivity);
  const outfitIndex = randomIndex();
  const flags = computeReminderFlags(day, prefs);
  const reminders = Object.entries(flags)
    .filter(([, active]) => active)
    .map(([type]) => ({ type, textIndex: randomIndex() }));

  return {
    date: day.date,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    outfitIndex,
    outfitImage: OUTFITS[category][outfitIndex],
    icon: day.icon,
    apparentTempF: day.apparentTempF,
    reminders,
  };
}
