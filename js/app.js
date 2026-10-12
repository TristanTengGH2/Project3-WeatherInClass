import {
  geocodeZip,
  getDeviceLocation,
  fetchForecast,
  weatherCodeToIcon,
  LocationError,
  WeatherServiceError,
} from "./weather.js";

const zipInput = document.getElementById("zip-input");
const locateBtn = document.getElementById("locate-btn");
const zipError = document.getElementById("zip-error");
const locationStatus = document.getElementById("location-status");
const placeholderStatus = document.getElementById("placeholder-status");
const debugOutput = document.getElementById("debug-output");
const loadingOverlay = document.getElementById("loading-overlay");
const errorPanel = document.getElementById("error-panel");
const retryBtn = document.getElementById("retry-btn");

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

async function loadForecastFor(lat, lon, label) {
  setLoading(true);
  hideError();
  try {
    const days = await fetchForecast(lat, lon);
    placeholderStatus.hidden = true;
    debugOutput.hidden = false;
    debugOutput.textContent = JSON.stringify(
      { location: label, days: days.map((d) => ({ ...d, icon: weatherCodeToIcon(d.weatherCode) })) },
      null,
      2
    );
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
  await loadForecastFor(location.lat, location.lon, location.name);
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
  await loadForecastFor(pos.lat, pos.lon, "Current location");
}

zipInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleZipSubmit();
});

locateBtn.addEventListener("click", handleLocate);

retryBtn.addEventListener("click", () => {
  if (lastAction) lastAction();
});
