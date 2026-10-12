const LOCATION_KEY = "weatherInClass.location";
const PREFS_KEY = "weatherInClass.prefs";

export function saveLocation(location) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently, nothing to persist.
  }
}

export function loadLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
