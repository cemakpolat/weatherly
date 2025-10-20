/**
 * Application Constants
 */

export const CITIES_JSON_URL = 'cities.json';
export const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
export const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
export const DEFAULT_LANGUAGE = 'en';
export const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const WEATHER_MAPPINGS = {
  0: { icon: 'fa-sun', description: 'Clear sky' },
  1: { icon: 'fa-cloud-sun', description: 'Mainly clear' },
  2: { icon: 'fa-cloud', description: 'Partly cloudy' },
  3: { icon: 'fa-cloud', description: 'Overcast' },
  45: { icon: 'fa-smog', description: 'Fog' },
  48: { icon: 'fa-smog', description: 'Depositing rime fog' },
  51: { icon: 'fa-cloud-rain', description: 'Light drizzle' },
  53: { icon: 'fa-cloud-rain', description: 'Moderate drizzle' },
  55: { icon: 'fa-cloud-rain', description: 'Dense drizzle' },
  56: { icon: 'fa-cloud-rain', description: 'Light freezing drizzle' },
  57: { icon: 'fa-cloud-rain', description: 'Dense freezing drizzle' },
  61: { icon: 'fa-cloud-showers-heavy', description: 'Slight rain' },
  63: { icon: 'fa-cloud-showers-heavy', description: 'Moderate rain' },
  65: { icon: 'fa-cloud-showers-heavy', description: 'Heavy rain' },
  66: { icon: 'fa-cloud-showers-heavy', description: 'Light freezing rain' },
  67: { icon: 'fa-cloud-showers-heavy', description: 'Heavy freezing rain' },
  71: { icon: 'fa-snowflake', description: 'Slight snowfall' },
  73: { icon: 'fa-snowflake', description: 'Moderate snowfall' },
  75: { icon: 'fa-snowflake', description: 'Heavy snowfall' },
  77: { icon: 'fa-snowflake', description: 'Snow grains' },
  80: { icon: 'fa-cloud-showers-heavy', description: 'Slight rain showers' },
  81: { icon: 'fa-cloud-showers-heavy', description: 'Moderate rain showers' },
  82: { icon: 'fa-cloud-showers-heavy', description: 'Violent rain showers' },
  85: { icon: 'fa-snowflake', description: 'Slight snow showers' },
  86: { icon: 'fa-snowflake', description: 'Heavy snow showers' },
  95: { icon: 'fa-bolt', description: 'Thunderstorm' },
  96: { icon: 'fa-bolt', description: 'Thunderstorm with slight hail' },
  99: { icon: 'fa-bolt', description: 'Thunderstorm with heavy hail' },
};

export const SEVERE_WEATHER_CODES = {
  thunderstorm: [95, 96, 99],
  heavyRain: [63, 65, 67, 82],
  heavySnow: [75, 86],
};
