const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const ZIP_PATTERN = /^\d{5}$/;

const US_STATE_ABBREVIATIONS = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "District of Columbia": "DC",
};

export class LocationError extends Error {}
export class WeatherServiceError extends Error {}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\./g, "");
}

function stateMatches(admin1, requestedState) {
  if (!requestedState) return true;
  const fullName = normalizeText(admin1 || "");
  const abbreviation = normalizeText(US_STATE_ABBREVIATIONS[admin1] || "");
  const requested = normalizeText(requestedState);
  return requested === fullName || requested === abbreviation;
}

function locationFromResult(result, query) {
  const state = US_STATE_ABBREVIATIONS[result.admin1] || result.admin1;
  return {
    id: result.id,
    lat: result.latitude,
    lon: result.longitude,
    name: state ? `${result.name}, ${state}` : result.name,
    query,
  };
}

/** Return matching US locations for an entered ZIP, city, or "City, State" query. */
export async function searchLocations(rawQuery, { signal, count = 8 } = {}) {
  const query = rawQuery.trim();
  if (!query || (/^\d+$/.test(query) && !ZIP_PATTERN.test(query))) return [];

  const [cityOrZip, requestedState = ""] = query.split(",", 2).map((part) => part.trim());
  if (cityOrZip.length < 2) return [];

  let response;
  try {
    const params = new URLSearchParams({
      name: cityOrZip,
      count: "10",
      language: "en",
      format: "json",
      countryCode: "US",
    });
    response = await fetch(`${GEOCODING_URL}?${params}`, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new WeatherServiceError("Network error while looking up location");
  }

  if (!response.ok) {
    throw new WeatherServiceError("Geocoding service error");
  }

  const data = await response.json();
  const uniqueMatches = new Map();
  (data.results || [])
    .filter((result) => result.country_code === "US")
    .filter((result) => stateMatches(result.admin1, requestedState))
    .filter((result) => !ZIP_PATTERN.test(query) || result.postcodes?.includes(query))
    .map((result) => locationFromResult(result, query))
    .forEach((location) => {
      if (!uniqueMatches.has(location.name)) uniqueMatches.set(location.name, location);
    });

  return [...uniqueMatches.values()].slice(0, count);
}

/** Resolve a ZIP, city, or "City, State" query to one US location. */
export async function geocodeLocation(query) {
  const matches = await searchLocations(query, { count: 1 });
  if (!matches.length) {
    throw new LocationError("Invalid location");
  }
  return matches[0];
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
 * Returns an array of 7 entries. Today's entry also includes the current
 * temperature and weather code; future entries remain forecast-only.
 */
export async function fetchForecast(lat, lon) {
  let response;
  try {
    const url =
      `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&daily=apparent_temperature_max,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,weathercode,windspeed_10m_max` +
      `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`;
    response = await fetch(url);
  } catch {
    throw new WeatherServiceError("Network error while fetching the forecast");
  }

  if (!response.ok) {
    throw new WeatherServiceError("Forecast service error");
  }

  const data = await response.json();
  const d = data.daily;
  const current = data.current;
  if (
    !d ||
    !d.time ||
    d.time.length < 7 ||
    current?.temperature_2m == null ||
    current?.weather_code == null
  ) {
    throw new WeatherServiceError("Forecast data incomplete");
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    const apparentTempF = d.apparent_temperature_max[i];
    const actualHighF = d.temperature_2m_max[i];
    const actualLowF = d.temperature_2m_min[i];
    const uvIndexMax = d.uv_index_max[i];
    const precipProbMax = d.precipitation_probability_max[i];
    const weatherCode = d.weathercode[i];
    const windSpeedMph = d.windspeed_10m_max[i];
    if (
      apparentTempF == null ||
      actualHighF == null ||
      actualLowF == null ||
      uvIndexMax == null ||
      precipProbMax == null ||
      weatherCode == null ||
      windSpeedMph == null
    ) {
      throw new WeatherServiceError("Forecast data incomplete");
    }
    days.push({
      date: d.time[i],
      currentTempF: i === 0 ? current.temperature_2m : null,
      currentWeatherCode: i === 0 ? current.weather_code : null,
      apparentTempF,
      actualHighF,
      actualLowF,
      uvIndexMax,
      precipProbMax,
      weatherCode,
      windSpeedMph,
    });
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
