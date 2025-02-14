
const { ipcRenderer } = require('electron');


const citiesContainer = document.getElementById('cities');
const citySearch = document.getElementById('citySearch');
const searchButton = document.getElementById('searchButton');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');

let selectedIndex = -1; // Track the selected suggestion index
let lastSearchTerm = ''; // Track the last search term to prevent duplicates

const CITIES_JSON_URL = 'cities.json'; // URL for the cities JSON file
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LANGUAGE = 'en';

// // --- Utility Functions ---

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
  sessionStorage.setItem(key, JSON.stringify(data));
}

/**
 * Retrieves data from session storage.
 * @param {string} key - The key to retrieve the data from.
 * @returns {any} - The parsed JSON data, or null if not found.
 */
function getFromSessionStorage(key) {
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}


// --- Data Loading and Storage ---
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
 * @returns {Promise<object|null>} - The weather data, or null if an error occurred.
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
 * @param {string} city The city name.
 * @returns {Promise<any>} The geocoding data.
 */
async function fetchGeocodingData(city) {
  const url = `${GEOCODING_API_URL}?name=${city}&count=1&language=${DEFAULT_LANGUAGE}&format=json`;
  return await fetchJson(url);
}

/**
 * Fetches weather data for given coordinates.
 * @param {number} latitude Latitude.
 * @param {number} longitude Longitude.
 * @returns {Promise<any>} The weather data.
 */
async function fetchWeatherData(latitude, longitude) {
  const url = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode`;
  return await fetchJson(url);
}

// --- UI Rendering Functions ---

// Function to create a city card
function createCityCard(cityData) {
  const { name, country_code, weather } = cityData;
  const currentTemp = weather.current_weather.temperature;
  const weatherCode = weather.current_weather.weathercode;
  

  const card = document.createElement('div');
  card.className = 'col';
  card.innerHTML = `
    <div class="card h-100 p-3">
      <div class="card-body text-center position-relative">
        <!-- Remove Button -->
        <button class="btn btn-sm position-absolute top-0 end-0 m-2 remove-button">
          <i class="fas fa-x"></i>
        </button>
        <!-- City Info -->
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
    card.remove(); // Remove the card from the DOM
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

    // Handle cases where the forecast hour is not found in the initial data,
    // meaning we need to wrap around to the next day's data.
    if (forecastIndex === -1) {
      // Search for the forecast hour in the remaining hours
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
      // If the forecast hour is still not found (edge case), display a placeholder.
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
* Gets the FontAwesome icon class name based on the weather code.
* @param {number} weatherCode - The weather code.
* @returns {string} - The FontAwesome icon class name.
*/
// Function to get FontAwesome icon based on weather code
function getWeatherIcon(weatherCode) {
  const weatherIcons = {
    0: 'fa-sun', // Clear sky
    1: 'fa-cloud-sun', // Mainly clear
    2: 'fa-cloud', // Partly cloudy
    3: 'fa-cloud', // Overcast
    45: 'fa-smog', // Fog
    48: 'fa-smog', // Depositing rime fog
    51: 'fa-cloud-rain', // Light drizzle
    53: 'fa-cloud-rain', // Moderate drizzle
    55: 'fa-cloud-rain', // Dense drizzle
    56: 'fa-cloud-rain', // Light freezing drizzle
    57: 'fa-cloud-rain', // Dense freezing drizzle
    61: 'fa-cloud-showers-heavy', // Slight rain
    63: 'fa-cloud-showers-heavy', // Moderate rain
    65: 'fa-cloud-showers-heavy', // Heavy rain
    66: 'fa-cloud-showers-heavy', // Light freezing rain
    67: 'fa-cloud-showers-heavy', // Heavy freezing rain
    71: 'fa-snowflake', // Slight snowfall
    73: 'fa-snowflake', // Moderate snowfall
    75: 'fa-snowflake', // Heavy snowfall
    77: 'fa-snowflake', // Snow grains
    80: 'fa-cloud-showers-heavy', // Slight rain showers
    81: 'fa-cloud-showers-heavy', // Moderate rain showers
    82: 'fa-cloud-showers-heavy', // Violent rain showers
    85: 'fa-snowflake', // Slight snow showers
    86: 'fa-snowflake', // Heavy snow showers
    95: 'fa-bolt', // Thunderstorm
    96: 'fa-bolt', // Thunderstorm with slight hail
    99: 'fa-bolt', // Thunderstorm with heavy hail
  };
  return `<i class="fas ${weatherIcons[weatherCode] || 'fa-question'} weather-icon"></i>`;
}

/**
 * Gets the weather description based on the weather code.
 * @param {number} weatherCode - The weather code.
 * @returns {string} - The weather description.
 */
function getWeatherDescription(weatherCode) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherCodes[weatherCode] || 'Unknown weather';
}

// --- Search Functionality ---

/**
 * Handles the city search.
 */
async function handleSearch() {
  const city = citySearch.value.trim();
  if (!city) return;

  if (city === lastSearchTerm) {
      //alert('City is the same as the last search. Preventing duplicate.');
      return; // Prevent duplicate searches
  }
  lastSearchTerm = city; // Update the last search term

  if (isCityAlreadyDisplayed(city)) {
    //alert(`${city} is already in the list!`);
    return;
  }

  await addNewCityToStorage(city); //Adds the city to session storage if it's not there.

  const cityData = await fetchWeather(city);
  if (cityData) {
    const card = createCityCard(cityData);
    citiesContainer.prepend(card); // Add the new card to the top
    citySearch.value = ''; // Clear the search bar
  }
}

/**
 * Checks if the city is already displayed in the list of city cards.
 * @param {string} city The city name.
 * @returns {boolean} True if the city is already displayed, false otherwise.
 */
function isCityAlreadyDisplayed(city) {
  const cityCards = document.querySelectorAll('.card-title');
  return Array.from(cityCards).some(card => card.textContent.includes(city));
}

/**
 * Adds a new city to session storage if it's not already there.
 * @param {string} city The city name.
 */
async function addNewCityToStorage(city) {
  let cities = getFromSessionStorage('cities') || [];
  const cityExists = cities.some(c => c.name.toLowerCase() === city.toLowerCase());

  if (!cityExists) {
    // Fetch the city details from the API
    try {
      const response = await fetch(`${GEOCODING_API_URL}?name=${city}&count=1&language=${DEFAULT_LANGUAGE}&format=json`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const newCity = {
          name: data.results[0].name,
          country: data.results[0].country,
        };
        cities.push(newCity); // Add the new city to the list
        saveToSessionStorage('cities', cities); // Update session storage
      }
    } catch (error) {
      console.error('Error fetching city:', error);
    }
  }
}



// // --- Autocomplete Functionality ---

/**
 * Shows autocomplete suggestions based on the input.
 * @param {string} input - The input string.
 */
function showAutocompleteSuggestions(input) {
  const cities = getFromSessionStorage('cities') || [];
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(input.toLowerCase())
  );

  // Clear previous suggestions
  autocompleteDropdown.innerHTML = '';

  // Add new suggestions
  filteredCities.forEach((city, index) => {
    const suggestion = document.createElement('div');
    suggestion.className = `dropdown-item ${index === selectedIndex ? 'selected' : ''}`;
    suggestion.textContent = `${city.name}, ${city.country}`;
    suggestion.addEventListener('click', () => {
      citySearch.value = city.name; // Fill the search bar with the selected city
      autocompleteDropdown.style.display = 'none'; // Hide the dropdown
      handleSearch(); // Trigger search
    });
    autocompleteDropdown.appendChild(suggestion);
  });

  // Show the dropdown if there are suggestions
  autocompleteDropdown.style.display = filteredCities.length > 0 ? 'block' : 'none';
}

/**
 * Updates the selected suggestion in the autocomplete dropdown.
 * @param {NodeListOf<Element>} suggestions - A list of suggestion elements.
 */
function updateSelectedSuggestion(suggestions) {
  suggestions.forEach((suggestion, index) => {
    suggestion.classList.toggle('selected', index === selectedIndex);
  });

  // Scroll the selected suggestion into view
  if (selectedIndex >= 0 && suggestions[selectedIndex]) {
    suggestions[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// // --- Event Listeners ---

// Attach event listener to the search button
searchButton.addEventListener('click', handleSearch);

//  Handle keyboard navigation in the search bar
citySearch.addEventListener('keydown', (e) => {
  const suggestions = autocompleteDropdown.querySelectorAll('.dropdown-item');

  if (e.key === 'ArrowDown') {
    selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'ArrowUp') {
    selectedIndex = Math.max(selectedIndex - 1, -1);
    updateSelectedSuggestion(suggestions);
  } else if (e.key === 'Enter') {
    e.preventDefault(); // Prevent the default form submission behavior
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      citySearch.value = suggestions[selectedIndex].textContent.split(',')[0]; // Fill the search bar
      autocompleteDropdown.style.display = 'none'; // Hide the dropdown
      handleSearch(); // Trigger search
    } else {
      handleSearch(); // Trigger search if no suggestion is selected
    }
  }
});


// // Event listener for input changes in the search bar (for autocomplete)
citySearch.addEventListener('input', (e) => {
  const input = e.target.value.trim();
  if (input) {
    showAutocompleteSuggestions(input);
  } else {
    autocompleteDropdown.style.display = 'none'; // Hide the dropdown if the input is empty
  }
});
// // Hide the dropdown when clicking outside the search bar and dropdown
document.addEventListener('click', (e) => {
  if (!citySearch.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
    autocompleteDropdown.style.display = 'none';
  }
});

// // --- Electron Integration (if applicable) ---

// Check if running in Electron environment
if (typeof require === 'function') {
  const { ipcRenderer } = require('electron');

  // Close button functionality
  document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close-window');
  });

  // Minimize button functionality
  document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
  });

  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchBarContainer = document.getElementById('search-bar-container');

  // Toggle search bar visibility
  searchToggleBtn.addEventListener('click', () => {
    searchBarContainer.classList.toggle('d-none');
  });
}

const scrollableContainer = document.getElementById('scrollable-container');
if (scrollableContainer!=null){
  scrollableContainer.addEventListener('wheel', (event) => {
      event.preventDefault(); // Prevent default scrolling

      // Adjust the scroll position based on the mouse wheel delta
      scrollableContainer.scrollTop += event.deltaY;
  });
}

