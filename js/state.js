import { buildRecommendationState } from "./recommendation.js";

// In-memory only (per spec.md's Content variation section): cleared on reload,
// so the same date reuses its variation only within the current tab session.
const cache = new Map();

function keyFor(locationKey, date) {
  return `${locationKey}|${date}`;
}

/** Get (or create and cache) the recommendation state for a (location, date) day. */
export function getRecommendationState(locationKey, day, prefs) {
  const key = keyFor(locationKey, day.date);
  if (!cache.has(key)) {
    cache.set(key, buildRecommendationState(day, prefs));
  }
  return cache.get(key);
}

/** Clear all cached variations (e.g., if ever needed for testing). */
export function clearRecommendationCache() {
  cache.clear();
}
