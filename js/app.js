import {
  geocodeZip,
  getDeviceLocation,
  fetchForecast,
  weatherCodeToIcon,
  LocationError,
  WeatherServiceError,
} from "./weather.js";
import { REMINDER_TEXTS, REMINDER_ICONS } from "./recommendation.js";
import { getRecommendationState } from "./state.js";

const zipInput = document.getElementById("zip-input");
const locateBtn = document.getElementById("locate-btn");
const zipError = document.getElementById("zip-error");
const locationStatus = document.getElementById("location-status");
const placeholderStatus = document.getElementById("placeholder-status");
const forecastView = document.getElementById("forecast-view");
const locationNameEl = document.getElementById("location-name");
const currentForecastLabel = document.getElementById("current-forecast-label");
const weatherIconEl = document.getElementById("weather-icon");
const characterSpriteEl = document.getElementById("character-sprite");
const temperatureDisplay = document.getElementById("temperature-display");
const remindersList = document.getElementById("reminders-list");
const daySelector = document.getElementById("day-selector");
const loadingOverlay = document.getElementById("loading-overlay");
const errorPanel = document.getElementById("error-panel");
const retryBtn = document.getElementById("retry-btn");

// Default preferences until the Settings screen is built (plan.md: separate checkpoint).
const prefs = { sensitivity: "average", applySensitivityToHydration: false, unit: "F" };

let currentLocationKey = null;
let currentLocationLabel = "";
let currentDays = [];
let selectedIndex = 0;
let lastAction = null; // re-run on Retry

function setLoading(isLoading) {
  loadingOverlay.hidden = !isLoading;
  zipInput.disabled = isLoading;
  locateBtn.disabled = isLoading;
}

function showError() {
  errorPanel.hidden = false;
}

function hideError() {
  errorPanel.hidden = true;
}

function clearZipError() {
  zipError.hidden = true;
}

function showZipError() {
  zipError.hidden = false;
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
  weatherIconEl.alt = state.icon.replace("-", " ");

  characterSpriteEl.src = state.outfitImage;
  characterSpriteEl.alt = `Character wearing a ${state.categoryLabel.toLowerCase()}-weather outfit`;

  temperatureDisplay.textContent = formatTemp(state.apparentTempF);

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

async function loadForecastFor(lat, lon, label, locationKey) {
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
  await loadForecastFor(location.lat, location.lon, location.name, `zip:${location.zip}`);
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
  await loadForecastFor(pos.lat, pos.lon, "Current location", `geo:${pos.lat.toFixed(2)},${pos.lon.toFixed(2)}`);
}

zipInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleZipSubmit();
});

locateBtn.addEventListener("click", handleLocate);

retryBtn.addEventListener("click", () => {
  if (lastAction) lastAction();
});
