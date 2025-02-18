// --- Constants ---
const CITIES_JSON_URL = 'cities.json'; // URL for the cities JSON file
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LANGUAGE = 'en';

// --- DOM Elements ---
const citiesContainer = document.getElementById('cities');
const citySearch = document.getElementById('citySearch');
const searchButton = document.getElementById('searchButton');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchBarContainer = document.getElementById('search-bar-container');
const scrollableContainer = document.getElementById('scrollable-container');

// --- State Variables ---
let selectedIndex = -1; // Track the selected suggestion index
let lastSearchTerm = ''; // Track the last search term to prevent duplicates

// --- Weather Icon and Description Mappings ---
const WEATHER_MAPPINGS = {
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

// --- Utility Functions ---

/**
 * Fetches JSON data from a URL.
 * @param {string} url - The URL to fetch from.
 * @returns {Promise<any>} - The JSON data.
 * @throws {Error} - If the fetch fails.
 */
async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Saves data to session storage.
 * @param {string} key - The key to store the data under.
 * @param {any} data - The data to store (will be JSON stringified).
 */
function saveToSessionStorage(key, data) {
  if (isSessionStorageAvailable()) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Retrieves data from session storage.
 * @param {string} key - The key to retrieve the data from.
 * @returns {any} - The parsed JSON data, or null if not found.
 */
function getFromSessionStorage(key) {
  if (isSessionStorageAvailable()) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Checks if session storage is available.
 * @returns {boolean} - True if session storage is available, false otherwise.
 */
function isSessionStorageAvailable() {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// --- Data Loading and Storage ---

/**
 * Loads cities from the JSON file and saves them to session storage.
 */
async function loadCities() {
  try {
    const cities = await fetchJson(CITIES_JSON_URL);
    saveToSessionStorage('cities', cities);
    console.log('Cities loaded:', cities);
  } catch (error) {
    console.error('Error loading cities:', error);
  }
}

// Initialize cities on app start
loadCities();

// --- Weather API Functions ---

/**
 * Fetches weather data for a given city.
 * @param {string} city - The name of the city.
 * @returns {Promise<{ name: string, country_code: string, weather: object }|null>} - The weather data or null if an error occurs.
 */
async function fetchWeather(city) {
  try {
    const geocodingData = await fetchGeocodingData(city);

    if (!geocodingData?.results?.length) {
      throw new Error('Location not found');
    }

    const { latitude, longitude, name, country_code } = geocodingData.results[0];
    const weatherData = await fetchWeatherData(latitude, longitude);

    return { name, country_code, weather: weatherData };
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
    return null;
  }
}

/**
 * Fetches geocoding data for a city.
 * @param {string} city - The city name.
 * @returns {Promise<any>} - The geocoding data.
 */
async function fetchGeocodingData(city) {
  const url = `${GEOCODING_API_URL}?name=${city}&count=1&language=${DEFAULT_LANGUAGE}&format=json`;
  return await fetchJson(url);
}

/**
 * Fetches weather data for given coordinates.
 * @param {number} latitude - Latitude.
 * @param {number} longitude - Longitude.
 * @returns {Promise<any>} - The weather data.
 */
async function fetchWeatherData(latitude, longitude) {
  const url = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode`;
  return await fetchJson(url);
}

// --- UI Rendering Functions ---

/**
 * Creates a city card element.
 * @param {object} cityData - The city data.
 * @returns {HTMLElement} - The city card element.
 */
function createCityCard(cityData) {
  const { name, country_code, weather } = cityData;
  const currentTemp = weather.current_weather.temperature;
  const weatherCode = weather.current_weather.weathercode;

  const card = document.createElement('div');
  card.className = 'col';
  card.innerHTML = `
    <div class="card h-100 p-3">
      <div class="card-body text-center position-relative">
        <button class="btn btn-sm position-absolute top-0 end-0 m-2 remove-button" aria-label="Remove city">
          <i class="fas fa-x"></i>
        </button>
        <h3 class="card-title">${name}, ${country_code}</h3>
        ${getWeatherIcon(weatherCode)}
        <p class="card-text">Current: ${currentTemp}°C</p>
        <p class="card-text">${getWeatherDescription(weatherCode)}</p>
        <hr>
        <h5>Next 6 Hours:</h5>
        <div class="d-flex justify-content-around">
          ${getNext6HoursForecast(weather.hourly.time, weather.hourly.temperature_2m)}
        </div>
      </div>
    </div>
  `;

  // Add event listener to the remove button
  const removeButton = card.querySelector('.remove-button');
  removeButton.addEventListener('click', () => {
    card.remove();
    saveSettings();
  });

  return card;
}

/**
 * Generates the HTML for the next 6 hours forecast.
 * @param {Array<string>} times - Array of hourly time strings.
 * @param {Array<number>} temperatures - Array of hourly temperatures.
 * @returns {string} - HTML string for the forecast.
 */
function getNext6HoursForecast(times, temperatures) {
  const now = new Date();
  const currentHour = now.getHours();
  const forecastItems = [];

  for (let i = 0; i < 6; i++) {
    const forecastHour = (currentHour + i) % 24;
    let forecastIndex = times.findIndex(time => new Date(time).getHours() === forecastHour);

    if (forecastIndex === -1) {
      forecastIndex = times.findIndex(time => new Date(time).getHours() === forecastHour);
    }

    if (forecastIndex !== -1) {
      const temperature = temperatures[forecastIndex];
      forecastItems.push(`
        <div>
          <small>${forecastHour}h</small>
          <p>${temperature}°C</p>
        </div>
      `);
    } else {
      forecastItems.push(`
        <div>
          <small>${forecastHour}h</small>
          <p>--°C</p>
        </div>
      `);
    }
  }

  return forecastItems.join('');
}

/**
 * Gets the weather icon based on the weather code.
 * @param {number} weatherCode - The weather code.
 * @returns {string} - The FontAwesome icon HTML.
 */
function getWeatherIcon(weatherCode) {
  const icon = WEATHER_MAPPINGS[weatherCode]?.icon || 'fa-question';
  return `<i class="fas ${icon} weather-icon"></i>`;
}

/**
 * Gets the weather description based on the weather code.
 * @param {number} weatherCode - The weather code.
 * @returns {string} - The weather description.
 */
function getWeatherDescription(weatherCode) {
  return WEATHER_MAPPINGS[weatherCode]?.description || 'Unknown weather';
}

// --- Search Functionality ---

/**
 * Handles the city search.
 */
async function handleSearch() {
  const city = citySearch.value.trim();
  if (!city || city === lastSearchTerm) return;

  lastSearchTerm = city;

  if (isCityAlreadyDisplayed(city)) return;

  await addNewCityToStorage(city);

  const cityData = await fetchWeather(city);
  if (cityData) {
    const card = createCityCard(cityData);
    citiesContainer.prepend(card);
    citySearch.value = '';
    saveSettings();
  }
}

/**
 * Checks if the city is already displayed.
 * @param {string} city - The city name.
 * @returns {boolean} - True if the city is already displayed, false otherwise.
 */
function isCityAlreadyDisplayed(city) {
  const cityCards = document.querySelectorAll('.card-title');
  return Array.from(cityCards).some(card => card.textContent.includes(city));
}

/**
 * Adds a new city to session storage if it's not already there.
 * @param {string} city - The city name.
 */
async function addNewCityToStorage(city) {
  let cities = getFromSessionStorage('cities') || [];
  const cityExists = cities.some(c => c.name.toLowerCase() === city.toLowerCase());

  if (!cityExists) {
    try {
      const response = await fetch(`${GEOCODING_API_URL}?name=${city}&count=1&language=${DEFAULT_LANGUAGE}&format=json`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const newCity = {
          name: data.results[0].name,
          country: data.results[0].country,
        };
        cities.push(newCity);
        saveToSessionStorage('cities', cities);
      }
    } catch (error) {
      console.error('Error fetching city:', error);
    }
  }
}

// --- Autocomplete Functionality ---

/**
 * Shows autocomplete suggestions based on the input.
 * @param {string} input - The input string.
 */
function showAutocompleteSuggestions(input) {
  const cities = getFromSessionStorage('cities') || [];
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(input.toLowerCase())
  );

  autocompleteDropdown.innerHTML = '';

  filteredCities.forEach((city, index) => {
    const suggestion = document.createElement('div');
    suggestion.className = `dropdown-item ${index === selectedIndex ? 'selected' : ''}`;
    suggestion.textContent = `${city.name}, ${city.country}`;
    suggestion.setAttribute('role', 'option');
    suggestion.setAttribute('aria-selected', index === selectedIndex);
    suggestion.addEventListener('click', () => {
      citySearch.value = city.name;
      autocompleteDropdown.style.display = 'none';
      handleSearch();
    });
    autocompleteDropdown.appendChild(suggestion);
  });

  autocompleteDropdown.style.display = filteredCities.length > 0 ? 'block' : 'none';
}

/**
 * Updates the selected suggestion in the autocomplete dropdown.
 * @param {NodeListOf<Element>} suggestions - A list of suggestion elements.
 */
function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((suggestion, index) => {
    suggestion.classList.toggle('selected', index === selectedIndex);
    suggestion.setAttribute('aria-selected', index === selectedIndex);
  });

  if (selectedIndex >= 0 && suggestions[selectedIndex]) {
    suggestions[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// --- Save and Load Settings ---

/**
 * Saves the current app settings.
 */
async function saveSettings() {
  const settings = {
    isSearchBarHidden: searchBarContainer.classList.contains('d-none'),
    cities: Array.from(citiesContainer.children).map((card) => {
      const name = card.querySelector('.card-title').textContent.split(',')[0];
      const country_code = card.querySelector('.card-title').textContent.split(',')[1].trim();
      return { name, country_code };
    }),
  };

  await window.electron.writeSettings(settings);
  console.log('Settings saved:', settings);
}

/**
 * Loads the saved app settings.
 */
async function loadSettings() {
  const settings = await window.electron.readSettings();
  console.log('Settings loaded:', settings);

  if (settings.isSearchBarHidden) {
    searchBarContainer.classList.add('d-none');
  }

  settings.cities.forEach(async (city) => {
    const cityData = await fetchWeather(city.name);
    if (cityData) {
      const card = createCityCard(cityData);
      citiesContainer.appendChild(card);
    }
  });
}

// Load settings when the app starts
loadSettings();

// --- Event Listeners ---

searchButton.addEventListener('click', handleSearch);

citySearch.addEventListener('keydown', (e) => {
  const suggestions = autocompleteDropdown.querySelectorAll('.dropdown-item');

  if (e.key === 'ArrowDown') {
    selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'ArrowUp') {
    selectedIndex = Math.max(selectedIndex - 1, -1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      citySearch.value = suggestions[selectedIndex].textContent.split(',')[0];
      autocompleteDropdown.style.display = 'none';
      handleSearch();
    } else {
      handleSearch();
    }
  }
});

let debounceTimer;
citySearch.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const input = e.target.value.trim();
    if (input) {
      showAutocompleteSuggestions(input);
    } else {
      autocompleteDropdown.style.display = 'none';
    }
  }, 300);
});

document.addEventListener('click', (e) => {
  if (!citySearch.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
    autocompleteDropdown.style.display = 'none';
  }
});

// --- Electron Integration ---

document.getElementById('close-btn').addEventListener('click', () => {
  window.electron.send('close-window');
});

document.getElementById('minimize-btn').addEventListener('click', () => {
  window.electron.send('minimize-window');
});

searchToggleBtn.addEventListener('click', () => {
  searchBarContainer.classList.toggle('d-none');
  saveSettings();
});

if (scrollableContainer) {
  scrollableContainer.addEventListener('wheel', (event) => {
    scrollableContainer.scrollTop += event.deltaY;
  });
}