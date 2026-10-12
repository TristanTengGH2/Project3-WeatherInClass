import {
  geocodeZip,
  getDeviceLocation,
  fetchForecast,
  weatherCodeToIcon,
  LocationError,
  WeatherServiceError,
} from "./weather.js";
import { REMINDER_TEXTS, REMINDER_ICONS, DEFAULT_BOUNDARIES } from "./recommendation.js";
import { getRecommendationState } from "./state.js";
import { saveLocation, loadLocation, savePrefs, loadPrefs } from "./storage.js";

const zipInput = document.getElementById("zip-input");
const zipSubmitBtn = document.getElementById("zip-submit-btn");
const locateBtn = document.getElementById("locate-btn");
const pageHeader = document.getElementById("location-bar");
const appEl = document.getElementById("app");
const zipError = document.getElementById("zip-error");
const locationStatus = document.getElementById("location-status");
const placeholderStatus = document.getElementById("placeholder-status");
const forecastView = document.getElementById("forecast-view");
const locationNameEl = document.getElementById("location-name");
const currentForecastLabel = document.getElementById("current-forecast-label");
const weatherIconEl = document.getElementById("weather-icon");
const characterSpriteEl = document.getElementById("character-sprite");
const temperatureDisplay = document.getElementById("temperature-display");
const recommendationTextEl = document.getElementById("recommendation-text");
const statUvMobile = document.getElementById("stat-uv-mobile");
const statWindMobile = document.getElementById("stat-wind-mobile");
const statsRowDesktop = document.getElementById("stats-row-desktop");
const remindersList = document.getElementById("reminders-list");
const daySelector = document.getElementById("day-selector");
const loadingOverlay = document.getElementById("loading-overlay");
const errorPanel = document.getElementById("error-panel");
const retryBtn = document.getElementById("retry-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const settingsCloseBtn = document.getElementById("settings-close-btn");
const settingsSaveBtn = document.getElementById("settings-save-btn");
const tabSettingsBtn = document.getElementById("tab-settings");
const tabInfoBtn = document.getElementById("tab-info");
const panelSettings = document.getElementById("panel-settings");
const panelInfo = document.getElementById("panel-info");
const hydrationOffsetToggle = document.getElementById("hydration-offset-toggle");
const boundary1 = document.getElementById("boundary-1");
const boundary2 = document.getElementById("boundary-2");
const boundary3 = document.getElementById("boundary-3");
const boundary1Readout = document.getElementById("boundary-1-readout");
const boundary2Readout = document.getElementById("boundary-2-readout");
const boundary3Readout = document.getElementById("boundary-3-readout");

const prefs = {
  boundaries: { ...DEFAULT_BOUNDARIES },
  applySensitivityToHydration: false,
  unit: "F",
};
const savedPrefs = loadPrefs();
if (savedPrefs) Object.assign(prefs, savedPrefs, { boundaries: { ...prefs.boundaries, ...savedPrefs.boundaries } });
let draftPrefs = null;

let currentLocationKey = null;
let currentLocationLabel = "";
let currentDays = [];
let selectedIndex = 0;
let lastAction = null; // re-run on Retry

function setLoading(isLoading) {
  loadingOverlay.hidden = !isLoading;
  document.querySelectorAll("button, input").forEach((control) => {
    control.disabled = isLoading;
  });
  appEl.setAttribute("aria-busy", String(isLoading));
}

function showError() {
  forecastView.hidden = true;
  placeholderStatus.hidden = true;
  pageHeader.inert = true;
  appEl.inert = true;
  errorPanel.hidden = false;
  queueMicrotask(() => retryBtn.focus());
}

function hideError() {
  errorPanel.hidden = true;
  pageHeader.inert = false;
  appEl.inert = false;
}

function clearZipError() {
  zipError.hidden = true;
  zipInput.setAttribute("aria-invalid", "false");
}

function showZipError() {
  zipError.hidden = false;
  zipInput.setAttribute("aria-invalid", "true");
  forecastView.hidden = true;
  placeholderStatus.hidden = true;
}

function clearLocationStatus() {
  locationStatus.hidden = true;
  locationStatus.textContent = "";
}

function showLocationStatus(text) {
  locationStatus.hidden = false;
  locationStatus.textContent = text;
}

function dayLabel(dateStr, index) {
  if (index === 0) return "Today";
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return weekday;
}

function formatTemp(tempF) {
  if (prefs.unit === "C") {
    const c = ((tempF - 32) * 5) / 9;
    return `${Math.round(c)}°C`;
  }
  return `${Math.round(tempF)}°F`;
}

function renderDaySelector() {
  daySelector.innerHTML = "";
  currentDays.forEach((day, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = dayLabel(day.date, i);
    btn.setAttribute("aria-pressed", String(i === selectedIndex));
    if (i === selectedIndex) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedIndex = i;
      renderSelectedDay();
    });
    daySelector.appendChild(btn);
  });
}

function renderSelectedDay() {
  const day = currentDays[selectedIndex];
  const state = getRecommendationState(currentLocationKey, day, prefs);

  currentForecastLabel.textContent =
    selectedIndex === 0 ? "Today" : `Forecast for ${dayLabel(day.date, selectedIndex)}`;

  weatherIconEl.src = `assets/${state.icon}.png`;
  weatherIconEl.alt = `Weather: ${state.icon.replaceAll("-", " ")}`;

  characterSpriteEl.src = state.outfitImage;
  characterSpriteEl.alt = `Character wearing a ${state.categoryLabel.toLowerCase()}-weather outfit`;

  temperatureDisplay.textContent = `High ${formatTemp(state.actualHighF)} · Low ${formatTemp(state.actualLowF)}`;
  recommendationTextEl.textContent = state.recommendationText;

  const uvText = `UV ${Math.round(state.uvIndexMax)}`;
  const windText = `Wind ${Math.round(state.windSpeedMph)} mph`;
  statUvMobile.textContent = uvText;
  statWindMobile.textContent = windText;
  statsRowDesktop.textContent = `${windText} · ${uvText}`;

  remindersList.innerHTML = "";
  state.reminders.forEach((r) => {
    const li = document.createElement("li");
    const icon = document.createElement("img");
    icon.src = REMINDER_ICONS[r.type];
    icon.alt = "";
    icon.width = 24;
    icon.height = 24;
    const text = document.createElement("span");
    text.textContent = REMINDER_TEXTS[r.type][r.textIndex];
    li.appendChild(icon);
    li.appendChild(text);
    remindersList.appendChild(li);
  });

  renderDaySelector();
}

async function loadForecastFor(lat, lon, label, locationKey, persistAs) {
  setLoading(true);
  hideError();
  try {
    const days = await fetchForecast(lat, lon);
    currentDays = days.map((d) => ({ ...d, icon: weatherCodeToIcon(d.weatherCode) }));
    currentLocationKey = locationKey;
    currentLocationLabel = label;
    selectedIndex = 0;

    placeholderStatus.hidden = true;
    forecastView.hidden = false;
    locationNameEl.textContent = currentLocationLabel;
    renderSelectedDay();

    if (persistAs) saveLocation(persistAs);
  } catch (err) {
    if (err instanceof WeatherServiceError) {
      showError();
    } else {
      throw err;
    }
  } finally {
    setLoading(false);
  }
}

async function handleZipSubmit() {
  const zip = zipInput.value.trim();
  clearZipError();
  clearLocationStatus();
  lastAction = handleZipSubmit;

  setLoading(true);
  let location;
  try {
    location = await geocodeZip(zip);
  } catch (err) {
    setLoading(false);
    if (err instanceof LocationError) {
      showZipError();
      return;
    }
    if (err instanceof WeatherServiceError) {
      showError();
      return;
    }
    throw err;
  }
  setLoading(false);
  await loadForecastFor(location.lat, location.lon, location.name, `zip:${location.zip}`, {
    type: "zip",
    zip: location.zip,
    lat: location.lat,
    lon: location.lon,
    name: location.name,
  });
}

async function handleLocate() {
  clearZipError();
  clearLocationStatus();
  lastAction = handleLocate;

  setLoading(true);
  let pos;
  try {
    pos = await getDeviceLocation();
  } catch {
    setLoading(false);
    showLocationStatus("Location access denied — enter your zip code instead");
    zipInput.focus();
    return;
  }
  setLoading(false);
  const locationKey = `geo:${pos.lat.toFixed(2)},${pos.lon.toFixed(2)}`;
  await loadForecastFor(pos.lat, pos.lon, "Current location", locationKey, {
    type: "geo",
    lat: pos.lat,
    lon: pos.lon,
  });
}

zipInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleZipSubmit();
});

// Explicit button, since inputmode="numeric" often shows an iOS keyboard with no
// Return/Go key, making the Enter-key shortcut above unreachable on many phones.
zipSubmitBtn.addEventListener("click", handleZipSubmit);

locateBtn.addEventListener("click", handleLocate);

retryBtn.addEventListener("click", () => {
  if (lastAction) lastAction();
});

// --- Settings modal ---

function openSettingsModal() {
  pageHeader.inert = true;
  appEl.inert = true;
  settingsModal.hidden = false;
  tabSettingsBtn.focus();
}

function closeSettingsModal() {
  settingsModal.hidden = true;
  draftPrefs = null;
  pageHeader.inert = false;
  appEl.inert = false;
  settingsBtn.focus();
}

function switchTab(tab) {
  const isSettings = tab === "settings";
  tabSettingsBtn.classList.toggle("selected", isSettings);
  tabSettingsBtn.setAttribute("aria-selected", String(isSettings));
  tabSettingsBtn.tabIndex = isSettings ? 0 : -1;
  tabInfoBtn.classList.toggle("selected", !isSettings);
  tabInfoBtn.setAttribute("aria-selected", String(!isSettings));
  tabInfoBtn.tabIndex = isSettings ? -1 : 0;
  panelSettings.hidden = !isSettings;
  panelInfo.hidden = isSettings;
}

function updateBoundaryReadouts() {
  const boundaries = draftPrefs.boundaries;
  boundary1Readout.textContent = `${boundaries.b1}°F`;
  boundary2Readout.textContent = `${boundaries.b2}°F`;
  boundary3Readout.textContent = `${boundaries.b3}°F`;
  boundary1.setAttribute("aria-valuetext", `${boundaries.b1} degrees Fahrenheit`);
  boundary2.setAttribute("aria-valuetext", `${boundaries.b2} degrees Fahrenheit`);
  boundary3.setAttribute("aria-valuetext", `${boundaries.b3} degrees Fahrenheit`);
}

function applyPrefsToControls() {
  draftPrefs = {
    ...prefs,
    boundaries: { ...prefs.boundaries },
  };
  boundary1.value = String(draftPrefs.boundaries.b1);
  boundary2.value = String(draftPrefs.boundaries.b2);
  boundary3.value = String(draftPrefs.boundaries.b3);
  updateBoundaryReadouts();
  hydrationOffsetToggle.checked = draftPrefs.applySensitivityToHydration;
  document.querySelector(`input[name="unit"][value="${draftPrefs.unit}"]`).checked = true;
}

settingsBtn.addEventListener("click", () => {
  applyPrefsToControls();
  switchTab("settings");
  openSettingsModal();
});

settingsCloseBtn.addEventListener("click", closeSettingsModal);
tabSettingsBtn.addEventListener("click", () => switchTab("settings"));
tabInfoBtn.addEventListener("click", () => switchTab("info"));

settingsSaveBtn.addEventListener("click", () => {
  Object.assign(prefs, draftPrefs, { boundaries: { ...draftPrefs.boundaries } });
  savePrefs(prefs);
  if (currentDays.length > 0) renderSelectedDay();
  closeSettingsModal();
});

settingsModal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSettingsModal();
});

document.getElementById("settings-tabs").addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (document.activeElement !== tabSettingsBtn && document.activeElement !== tabInfoBtn) return;
  event.preventDefault();
  const nextTab = document.activeElement === tabSettingsBtn ? "info" : "settings";
  switchTab(nextTab);
  (nextTab === "settings" ? tabSettingsBtn : tabInfoBtn).focus();
});

// Keep the 3 handles ordered (b1 <= b2 <= b3) by clamping whichever handle moved.
function handleBoundaryInput(key, input) {
  input.addEventListener("input", () => {
    let value = Number(input.value);
    if (key === "b1") value = Math.min(value, draftPrefs.boundaries.b2);
    if (key === "b2") value = Math.max(draftPrefs.boundaries.b1, Math.min(value, draftPrefs.boundaries.b3));
    if (key === "b3") value = Math.max(value, draftPrefs.boundaries.b2);
    input.value = String(value);
    draftPrefs.boundaries[key] = value;
    updateBoundaryReadouts();
  });
}
handleBoundaryInput("b1", boundary1);
handleBoundaryInput("b2", boundary2);
handleBoundaryInput("b3", boundary3);

// The 3 sliders overlap (same track, full width); when two handles share a value, whichever
// is last in the DOM always sits on top and blocks the others from being grabbed. On
// touch/click, bring whichever handle's current value is closest to the touch point to the
// front so it's the one that actually responds to the drag.
const boundarySliderEl = document.getElementById("boundary-slider");
function bringNearestHandleToFront(clientX) {
  const rect = boundarySliderEl.getBoundingClientRect();
  const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const touchedValue = pct * 100;
  const handles = [boundary1, boundary2, boundary3];
  handles
    .slice()
    .sort((a, b) => Math.abs(touchedValue - Number(a.value)) - Math.abs(touchedValue - Number(b.value)))
    .forEach((el, i) => {
      el.style.zIndex = String(handles.length - i);
    });
}
boundarySliderEl.addEventListener("pointerdown", (e) => bringNearestHandleToFront(e.clientX));

hydrationOffsetToggle.addEventListener("change", (e) => {
  draftPrefs.applySensitivityToHydration = e.target.checked;
});

document.querySelectorAll('input[name="unit"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    draftPrefs.unit = e.target.value;
  });
});

// --- Restore saved location on load ---

const savedLocation = loadLocation();
if (savedLocation) {
  if (savedLocation.type === "zip") {
    zipInput.value = savedLocation.zip;
  }
  loadForecastFor(
    savedLocation.lat,
    savedLocation.lon,
    savedLocation.type === "zip" ? savedLocation.name : "Current location",
    savedLocation.type === "zip"
      ? `zip:${savedLocation.zip}`
      : `geo:${savedLocation.lat.toFixed(2)},${savedLocation.lon.toFixed(2)}`
  );
}
