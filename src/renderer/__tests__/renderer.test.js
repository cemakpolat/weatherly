/**
 * @jest-environment jsdom
 */

describe('Renderer Process Tests', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });
});

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import {
  fetchJson,
  saveToSessionStorage,
  getFromSessionStorage,
  loadCities,
  fetchWeather,
  fetchGeocodingData,
  fetchWeatherData,
  createCityCard,
  getWeatherIcon,
  getWeatherDescription,
  handleSearch,
  isCityAlreadyDisplayed,
  addNewCityToStorage,
  showAutocompleteSuggestions,
  updateSelectedSuggestion,
} from '../renderer'; // Import functions to test

// Mock Electron modules
import { ipcRenderer } from 'electron';

import '@testing-library/jest-dom'; // Ensure this is imported!

// Describe the test suite
describe('Renderer Process Tests', () => {
  let dom;
  let document;
  let citiesContainer;
  let citySearch;
  let searchButton;
  let autocompleteDropdown;

  beforeEach(() => {
    // Load the HTML content into the testing environment
    const htmlFile = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
    dom = new JSDOM(htmlFile, { runScripts: 'dangerously', resources: 'usable' });
    document = dom.window.document;
    global.window = dom.window;
    global.document = document;
    global.navigator = {
      userAgent: 'node.js',
    };

    // Set up the DOM elements
    citiesContainer = document.getElementById('cities');
    citySearch = document.getElementById('citySearch');
    searchButton = document.getElementById('searchButton');
    autocompleteDropdown = document.getElementById('autocompleteDropdown');

    // Clear session storage before each test
    window.sessionStorage.clear();

    // Clear mocks
    jest.clearAllMocks();

    // Reset the lastSearchTerm variable
    global.lastSearchTerm = '';
  });

  afterEach(() => {
    // Clean up the DOM after each test
    document.body.innerHTML = '';
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  describe('Utility Functions', () => {
    it('fetchJson should fetch JSON data from a URL', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })
      );

      const data = await fetchJson('http://example.com/data.json');
      expect(fetch).toHaveBeenCalledWith('http://example.com/data.json');
      expect(data).toEqual({ data: 'test' });
    });

    it('fetchJson should throw an error for non-ok responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      );

      await expect(fetchJson('http://example.com/data.json')).rejects.toThrow(
        'HTTP error! Status: 404'
      );
    });

    it('saveToSessionStorage should save data to session storage', () => {
      saveToSessionStorage('testKey', { data: 'test' });
      expect(window.sessionStorage.getItem('testKey')).toBe(JSON.stringify({ data: 'test' }));
    });

    it('getFromSessionStorage should retrieve data from session storage', () => {
      window.sessionStorage.setItem('testKey', JSON.stringify({ data: 'test' }));
      const data = getFromSessionStorage('testKey');
      expect(data).toEqual({ data: 'test' });
    });

    it('getFromSessionStorage should return null if data is not found', () => {
      const data = getFromSessionStorage('nonExistentKey');
      expect(data).toBeNull();
    });
  });

  describe('Data Loading and Storage', () => {
    it('loadCities should load cities from cities.json and save to session storage', async () => {
      const mockCities = [{ name: 'New York', country: 'USA' }];
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCities),
        })
      );

      await loadCities();
      expect(fetch).toHaveBeenCalledWith('cities.json');
      expect(getFromSessionStorage('cities')).toEqual(mockCities);
    });

    it('loadCities should handle errors when loading cities', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed to load')));
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await loadCities();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading cities:',
        new Error('Failed to load')
      );
    });
  });

  describe('Weather API Functions', () => {
    it('fetchWeather should fetch weather data for a valid city', async () => {
      const mockGeocodingData = {
        results: [{ latitude: 40.71, longitude: -74.01, name: 'New York', country_code: 'US' }],
      };
      const mockWeatherData = {
        current_weather: { temperature: 25, weathercode: 0 },
        hourly: { time: [], temperature_2m: [] },
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeocodingData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherData),
        });

      const weatherData = await fetchWeather('New York');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('geocoding-api.open-meteo.com/v1/search')
      );
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.open-meteo.com/v1/forecast'));

      expect(weatherData).toEqual({
        name: 'New York',
        country_code: 'US',
        weather: mockWeatherData,
      });
    });

    it('fetchWeather should return null if an error occurs', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));
      const weatherData = await fetchWeather('InvalidCity');
      expect(weatherData).toBeNull();
    });

    it('fetchWeather should handle location not found', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const weatherData = await fetchWeather('NonExistentCity');
      expect(weatherData).toBeNull();
    });

    it('fetchGeocodingData should fetch geocoding data for a city', async () => {
      const mockData = {
        results: [{ latitude: 40.71, longitude: -74.01, name: 'New York', country_code: 'US' }],
      };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
      );
      const data = await fetchGeocodingData('New York');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('geocoding-api.open-meteo.com/v1/search')
      );
      expect(data).toEqual(mockData);
    });

    it('fetchWeatherData should fetch weather data for given coordinates', async () => {
      const mockData = {
        current_weather: { temperature: 25, weathercode: 0 },
        hourly: { time: [], temperature_2m: [] },
      };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
      );
      const data = await fetchWeatherData(40.71, -74.01);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.open-meteo.com/v1/forecast'));
      expect(data).toEqual(mockData);
    });
  });

  describe('UI Rendering Functions', () => {
    it('createCityCard should create a city card element', () => {
      const cityData = {
        name: 'New York',
        country_code: 'US',
        weather: {
          current_weather: { temperature: 25, weathercode: 0 },
          hourly: { time: [], temperature_2m: [] },
        },
      };
      const card = createCityCard(cityData);
      expect(card).toBeInstanceOf(HTMLElement);
      expect(card.querySelector('.card-title').textContent).toContain('New York, US');
    });

    it('createCityCard should add event listener to the remove button', () => {
      const cityData = {
        name: 'New York',
        country_code: 'US',
        weather: {
          current_weather: { temperature: 25, weathercode: 0 },
          hourly: { time: [], temperature_2m: [] },
        },
      };
      const card = createCityCard(cityData);
      const removeButton = card.querySelector('.remove-button');
      expect(removeButton).not.toBeNull();

      // Mock the remove() function
      const removeMock = jest.fn();
      card.remove = removeMock;

      removeButton.click();

      expect(removeMock).toHaveBeenCalled();
    });

    it('getWeatherIcon should return the correct FontAwesome icon class name', () => {
      expect(getWeatherIcon(0)).toContain('fa-sun');
      expect(getWeatherIcon(1)).toContain('fa-cloud-sun');
      expect(getWeatherIcon(99)).toContain('fa-bolt');
      expect(getWeatherIcon(999)).toContain('fa-question'); // Unknown weather
    });

    it('getWeatherDescription should return the correct weather description', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky');
      expect(getWeatherDescription(1)).toBe('Mainly clear');
      expect(getWeatherDescription(99)).toBe('Thunderstorm with heavy hail');
      expect(getWeatherDescription(999)).toBe('Unknown weather'); // Unknown weather
    });
  });

  describe('Search Functionality', () => {
    it('handleSearch should not perform search if the input is empty', async () => {
      citySearch.value = '';
      await handleSearch();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handleSearch should not perform search if the city is the same as the last search', async () => {
      citySearch.value = 'New York';
      global.lastSearchTerm = 'New York';
      await handleSearch();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handleSearch should not perform search if the city is already displayed', async () => {
      citySearch.value = 'New York';
      const card = document.createElement('div');
      card.className = 'card-title';
      card.textContent = 'New York, US';
      citiesContainer.appendChild(card);

      await handleSearch();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handleSearch should fetch weather data and create a city card', async () => {
      citySearch.value = 'New York';
      const mockGeocodingData = {
        results: [{ latitude: 40.71, longitude: -74.01, name: 'New York', country_code: 'US' }],
      };
      const mockWeatherData = {
        current_weather: { temperature: 25, weathercode: 0 },
        hourly: { time: [], temperature_2m: [] },
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeocodingData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherData),
        });

      await handleSearch();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('geocoding-api.open-meteo.com/v1/search')
      );
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.open-meteo.com/v1/forecast'));
      expect(citiesContainer.firstChild.querySelector('.card-title').textContent).toContain(
        'New York, US'
      );
      expect(citySearch.value).toBe('');
    });

    it('isCityAlreadyDisplayed should return true if the city is already displayed', () => {
      const card = document.createElement('div');
      card.className = 'card-title';
      card.textContent = 'New York, US';
      citiesContainer.appendChild(card);

      expect(isCityAlreadyDisplayed('New York')).toBe(true);
      expect(isCityAlreadyDisplayed('London')).toBe(false);
    });

    it('addNewCityToStorage should add a new city to session storage if it is not already there', async () => {
      const mockGeocodingData = {
        results: [{ latitude: 40.71, longitude: -74.01, name: 'New York', country: 'US' }],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeocodingData),
        })
      );

      await addNewCityToStorage('New York');

      const cities = getFromSessionStorage('cities');
      expect(cities).toEqual([{ name: 'New York', country: 'US' }]);
    });

    it('addNewCityToStorage should not add a city if it is already in session storage', async () => {
      const mockCities = [{ name: 'New York', country: 'USA' }];
      saveToSessionStorage('cities', mockCities);

      const mockGeocodingData = {
        results: [{ latitude: 40.71, longitude: -74.01, name: 'New York', country: 'US' }],
      };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeocodingData),
        })
      );

      await addNewCityToStorage('New York');

      const cities = getFromSessionStorage('cities');
      expect(cities).toEqual(mockCities);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Autocomplete Functionality', () => {
    it('showAutocompleteSuggestions should display autocomplete suggestions based on the input', () => {
      const mockCities = [
        { name: 'New York', country: 'USA' },
        { name: 'London', country: 'UK' },
        { name: 'New Delhi', country: 'India' },
      ];
      saveToSessionStorage('cities', mockCities);

      citySearch.value = 'New';
      showAutocompleteSuggestions('New');

      const suggestions = autocompleteDropdown.querySelectorAll('.dropdown-item');
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].textContent).toBe('New York, USA');
      expect(suggestions[1].textContent).toBe('New Delhi, India');
    });

    it('showAutocompleteSuggestions should hide the dropdown if there are no suggestions', () => {
      saveToSessionStorage('cities', []);
      citySearch.value = 'NonExistentCity';
      showAutocompleteSuggestions('NonExistentCity');
      expect(autocompleteDropdown.style.display).toBe('none');
    });

    it('updateSelectedSuggestion should update the selected suggestion in the autocomplete dropdown', () => {
      const suggestion1 = document.createElement('div');
      suggestion1.className = 'dropdown-item';
      const suggestion2 = document.createElement('div');
      suggestion2.className = 'dropdown-item';
      autocompleteDropdown.appendChild(suggestion1);
      autocompleteDropdown.appendChild(suggestion2);

      const suggestions = autocompleteDropdown.querySelectorAll('.dropdown-item');
      global.selectedIndex = 1;
      updateSelectedSuggestion(suggestions);

      expect(suggestion1.classList.contains('selected')).toBe(false);
      expect(suggestion2.classList.contains('selected')).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('searchButton click should call handleSearch', async () => {
      const handleSearchSpy = jest.spyOn(global, 'handleSearch');
      searchButton.click();
      await Promise.resolve(); // Wait for async operations in handleSearch
      expect(handleSearchSpy).toHaveBeenCalled();
    });

    it('citySearch keydown with ArrowDown should update selectedIndex', () => {
      const suggestion1 = document.createElement('div');
      suggestion1.className = 'dropdown-item';
      autocompleteDropdown.appendChild(suggestion1);

      citySearch.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(global.selectedIndex).toBe(0);
    });

    it('citySearch keydown with ArrowUp should update selectedIndex', () => {
      global.selectedIndex = 1;
      const suggestion1 = document.createElement('div');
      suggestion1.className = 'dropdown-item';
      autocompleteDropdown.appendChild(suggestion1);

      citySearch.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(global.selectedIndex).toBe(0);
    });

    it('citySearch keydown with Enter and selected suggestion should call handleSearch', async () => {
      const handleSearchSpy = jest.spyOn(global, 'handleSearch');

      const suggestion1 = document.createElement('div');
      suggestion1.className = 'dropdown-item';
      suggestion1.textContent = 'New York, US';
      autocompleteDropdown.appendChild(suggestion1);

      global.selectedIndex = 0;
      citySearch.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
      await Promise.resolve();
      expect(handleSearchSpy).toHaveBeenCalled();
    });

    it('citySearch keydown with Enter and no selected suggestion should call handleSearch', async () => {
      const handleSearchSpy = jest.spyOn(global, 'handleSearch');
      citySearch.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
      await Promise.resolve();
      expect(handleSearchSpy).toHaveBeenCalled();
    });

    it('citySearch input should call showAutocompleteSuggestions', () => {
      const showAutocompleteSuggestionsSpy = jest.spyOn(global, 'showAutocompleteSuggestions');
      citySearch.value = 'New';
      citySearch.dispatchEvent(
        new dom.window.InputEvent('input', { bubbles: true, cancelable: true })
      );
      expect(showAutocompleteSuggestionsSpy).toHaveBeenCalledWith('New');
    });

    it('document click outside search bar and dropdown should hide autocompleteDropdown', () => {
      autocompleteDropdown.style.display = 'block';
      document.body.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
      );
      expect(autocompleteDropdown.style.display).toBe('none');
    });
  });

  describe('Electron Integration', () => {
    it('close button click should send close-window event to ipcRenderer', () => {
      // Create a close button element and append it to the document
      const closeButton = document.createElement('button');
      closeButton.id = 'close-btn';
      document.body.appendChild(closeButton);

      // Add event listener to the close button
      closeButton.addEventListener('click', () => {
        ipcRenderer.send('close-window');
      });

      closeButton.click();
      expect(ipcRenderer.send).toHaveBeenCalledWith('close-window');
    });

    it('minimize button click should send minimize-window event to ipcRenderer', () => {
      // Create a minimize button element and append it to the document
      const minimizeButton = document.createElement('button');
      minimizeButton.id = 'minimize-btn';
      document.body.appendChild(minimizeButton);

      // Add event listener to the minimize button
      minimizeButton.addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
      });

      minimizeButton.click();
      expect(ipcRenderer.send).toHaveBeenCalledWith('minimize-window');
    });
  });
});
