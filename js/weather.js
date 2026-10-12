const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const ZIP_PATTERN = /^\d{5}$/;

export class LocationError extends Error {}
export class WeatherServiceError extends Error {}

/** Resolve a US zip code to {lat, lon, name}. Throws LocationError if invalid/not found. */
export async function geocodeZip(zip) {
  if (!ZIP_PATTERN.test(zip)) {
    throw new LocationError("Invalid zip code");
  }

  let response;
  try {
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(zip)},US&count=5&language=en&format=json`;
    response = await fetch(url);
  } catch {
    throw new WeatherServiceError("Network error while looking up location");
  }

  if (!response.ok) {
    throw new WeatherServiceError("Geocoding service error");
  }

  const data = await response.json();
  const match = (data.results || []).find((r) => r.country_code === "US");
  if (!match) {
    throw new LocationError("Invalid zip code");
  }

  return {
    lat: match.latitude,
    lon: match.longitude,
    name: match.admin1 ? `${match.name}, ${match.admin1}` : match.name,
    zip,
  };
}

/** Resolve the browser's geolocation to {lat, lon}. Rejects with a GeolocationPositionError on denial. */
export function getDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10000 }
    );
  });
}

/**
 * Fetch a 7-day forecast (today + 6 days) for a location.
 * Returns an array of 7 entries: { date, apparentTempF, uvIndexMax, precipProbMax, weatherCode }
 */
export async function fetchForecast(lat, lon) {
  let response;
  try {
    const url =
      `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
      `&daily=apparent_temperature_max,uv_index_max,precipitation_probability_max,weathercode` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
    response = await fetch(url);
  } catch {
    throw new WeatherServiceError("Network error while fetching the forecast");
  }

  if (!response.ok) {
    throw new WeatherServiceError("Forecast service error");
  }

  const data = await response.json();
  const d = data.daily;
  if (!d || !d.time || d.time.length < 7) {
    throw new WeatherServiceError("Forecast data incomplete");
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    const apparentTempF = d.apparent_temperature_max[i];
    const uvIndexMax = d.uv_index_max[i];
    const precipProbMax = d.precipitation_probability_max[i];
    const weatherCode = d.weathercode[i];
    if (
      apparentTempF == null ||
      uvIndexMax == null ||
      precipProbMax == null ||
      weatherCode == null
    ) {
      throw new WeatherServiceError("Forecast data incomplete");
    }
    days.push({ date: d.time[i], apparentTempF, uvIndexMax, precipProbMax, weatherCode });
  }
  return days;
}

/** Map Open-Meteo WMO weather codes to one of our 7 icon categories. */
export function weatherCodeToIcon(code) {
  if (code === 0) return "clear-sun";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "cloudy";
}
