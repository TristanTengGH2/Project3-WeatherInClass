import { buildRecommendationState } from "./recommendation.js?v=current-conditions-1";

// In-memory only (per spec.md's Content variation section): cleared on reload,
// so the same date reuses its variation only within the current tab session.
const cache = new Map();

function keyFor(locationKey, date) {
  return `${locationKey}|${date}`;
}

/** Get (or create and cache) the recommendation state for a (location, date) day. */
export function getRecommendationState(locationKey, day, prefs) {
  const key = keyFor(locationKey, day.date);
  const previous = cache.get(key);
  const state = buildRecommendationState(day, prefs, {
    outfitIndex: previous?.outfitIndex,
    reminderTextIndices: previous?.reminderTextIndices,
  });
  cache.set(key, state);
  return state;
}

/** Clear all cached variations (e.g., if ever needed for testing). */
export function clearRecommendationCache() {
  cache.clear();
}
