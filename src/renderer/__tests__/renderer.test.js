// /**
//  * @jest-environment jsdom
//  */

// require('jest-environment-jsdom');

// global.TextEncoder = require('util').TextEncoder;
// require('@testing-library/jest-dom');
// const fs = require('fs'); 
// const path = require('path');

// //const ipcRenderer = require('electron');

// // Mock electron API *before* requiring renderer
// window.electron = {
//   send: jest.fn(),
//   readSettings: jest.fn().mockResolvedValue({
//       isSearchBarHidden: false,
//       cities: []
//   }),
//   writeSettings: jest.fn()
// };

// // 1. Load the HTML file
// const htmlFile = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8'); // Adjust path as 

// document.body.innerHTML = htmlFile;


// // 2. Require the renderer.js *after* the HTML is loaded.
// const renderer = require('../renderer'); // Require the entire module


// describe('Utility Functions', () => {
//   beforeEach(() => {
//       sessionStorage.clear();
//       jest.clearAllMocks();

//       // Optional: Reload the HTML before each test if the DOM is modified by tests.
//       // document.body.innerHTML = htmlFile;
//   });

//   test('fetchJson should fetch and return JSON data', async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         ok: true,
//         json: () => Promise.resolve({ key: 'value' }),
//       })
//     );

//     const data = await renderer.fetchJson('https://example.com/data.json');  // Access through renderer
//     expect(data).toEqual({ key: 'value' });
//     expect(fetch).toHaveBeenCalledWith('https://example.com/data.json');
//   });

// });


/**
 * @jest-environment jsdom
 */

require('jest-environment-jsdom');

global.TextEncoder = require('util').TextEncoder;
require('@testing-library/jest-dom');
const fs = require('fs');
const path = require('path');

//const ipcRenderer = require('electron');

// Mock electron API *before* requiring renderer
window.electron = {
    send: jest.fn(),
    readSettings: jest.fn().mockResolvedValue({
        isSearchBarHidden: false,
        cities: []
    }),
    writeSettings: jest.fn()
};

// 1. Load the HTML file
const htmlFile = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8'); // Adjust path as

document.body.innerHTML = htmlFile;


// 2. Require the renderer.js *after* the HTML is loaded.
const renderer = require('../renderer'); // Require the entire module


describe('Utility Functions', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.clearAllMocks();

        // Optional: Reload the HTML before each test if the DOM is modified by tests.
        // document.body.innerHTML = htmlFile;
    });

    test('fetchJson should fetch and return JSON data', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ key: 'value' }),
            })
        );

        const data = await renderer.fetchJson('https://example.com/data.json');  // Access through renderer
        expect(data).toEqual({ key: 'value' });
        expect(fetch).toHaveBeenCalledWith('https://example.com/data.json');
    });

    test('fetchJson should throw an error for non-ok responses', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 404,
            })
        );

        await expect(renderer.fetchJson('https://example.com/data.json')).rejects.toThrowError('HTTP error! Status: 404');
    });

    test('saveToSessionStorage should save data to session storage', () => {
        renderer.saveToSessionStorage('testKey', { test: 'value' });
        expect(sessionStorage.getItem('testKey')).toBe(JSON.stringify({ test: 'value' }));
    });

    test('getFromSessionStorage should retrieve data from session storage', () => {
        sessionStorage.setItem('testKey', JSON.stringify({ test: 'value' }));
        const data = renderer.getFromSessionStorage('testKey');
        expect(data).toEqual({ test: 'value' });
    });

    test('getFromSessionStorage should return null if data is not found', () => {
        const data = renderer.getFromSessionStorage('nonExistentKey');
        expect(data).toBeNull();
    });

    test('isSessionStorageAvailable should return true if session storage is available', () => {
        expect(renderer.isSessionStorageAvailable()).toBe(true);
    });

    // Mock sessionStorage to simulate unavailability
    // test('isSessionStorageAvailable should return false if session storage is unavailable', () => {
    //     const originalSessionStorage = global.sessionStorage;
    //     global.sessionStorage = {
    //         setItem: () => { throw new Error('Session storage is not available'); },
    //         getItem: () => null,
    //         removeItem: () => { },
    //         clear: () => { }
    //     };

    //     expect(renderer.isSessionStorageAvailable()).toBe(false);

    //     // Restore original sessionStorage
    //     global.sessionStorage = originalSessionStorage;
    // });
});

describe('Data Loading and Storage', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.clearAllMocks();
    });

    test('loadCities should load cities from JSON and save to session storage', async () => {
        const mockCities = [{ name: 'London', country: 'UK' }];
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockCities),
            })
        );

        await renderer.loadCities();
        expect(sessionStorage.getItem('cities')).toBe(JSON.stringify(mockCities));
    });

    test('loadCities should handle errors during fetching', async () => {
        console.error = jest.fn();  // Suppress error message in console
        global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));

        await renderer.loadCities();
        expect(console.error).toHaveBeenCalled(); // Verify the error was caught
    });
});

describe('Weather API Functions', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('fetchWeather should fetch weather data for a city', async () => {
        const mockGeocodingData = { results: [{ latitude: 51.5, longitude: 0.1, name: 'London', country_code: 'GB' }] };
        const mockWeatherData = { current_weather: { temperature: 10, weathercode: 0 } };

        global.fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeocodingData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockWeatherData) });

        const weatherData = await renderer.fetchWeather('London');
        console.log(weatherData)
        expect(weatherData).toEqual({
            name: 'London',
            country_code: 'GB',
            weather: mockWeatherData,
        });
    });

    test('fetchWeather should return null if location is not found', async () => {
        global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) }));
        const weatherData = await renderer.fetchWeather('InvalidCity');
        expect(weatherData).toBeNull();
    });

    test('fetchWeather should handle errors during fetching', async () => {
        console.error = jest.fn(); // Suppress error message
        global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));

        const weatherData = await renderer.fetchWeather('London');
        expect(weatherData).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    test('fetchGeocodingData should fetch geocoding data for a city', async () => {
        const mockGeocodingData = { results: [{ latitude: 51.5, longitude: 0.1 }] };
        global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeocodingData) }));

        const data = await renderer.fetchGeocodingData('London');
        expect(data).toEqual(mockGeocodingData);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('London'));
    });

    test('fetchWeatherData should fetch weather data for coordinates', async () => {
        const mockWeatherData = { current_weather: { temperature: 10, weathercode: 0 } };
        global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeatherData) }));

        const data = await renderer.fetchWeatherData(51.5, 0.1);
        expect(data).toEqual(mockWeatherData);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('latitude=51.5'));
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('longitude=0.1'));
    });
});

describe('UI Rendering Functions', () => {
    beforeEach(() => {
        document.body.innerHTML = htmlFile;
    });

    test('createCityCard should create a city card element', () => {
        const cityData = {
            name: 'London',
            country_code: 'GB',
            weather: {
                current_weather: { temperature: 10, weathercode: 0 },
                hourly: {
                    time: [new Date().toISOString()],
                    temperature_2m: [10]
                }
            },
        };

        const card = renderer.createCityCard(cityData);
        expect(card.classList.contains('col')).toBe(true);
        expect(card.innerHTML).toContain('London, GB');
    });

    test('getWeatherIcon should return the correct weather icon', () => {
        expect(renderer.getWeatherIcon(0)).toBe('<i class="fas fa-sun weather-icon"></i>');
        expect(renderer.getWeatherIcon(999)).toBe('<i class="fas fa-question weather-icon"></i>');
    });

    test('getWeatherDescription should return the correct weather description', () => {
        expect(renderer.getWeatherDescription(0)).toBe('Clear sky');
        expect(renderer.getWeatherDescription(999)).toBe('Unknown weather');
    });
});


describe('Search Functionality', () => {
    beforeEach(() => {
        document.body.innerHTML = htmlFile;
        renderer.citySearch = document.getElementById('citySearch');
        renderer.citiesContainer = document.getElementById('cities');
        jest.clearAllMocks();
    });

    test('handleSearch should not call fetchWeather if the city is empty', async () => {
        renderer.fetchWeather = jest.fn();
        renderer.citySearch.value = '';
        await renderer.handleSearch();
        expect(renderer.fetchWeather).not.toHaveBeenCalled();
    });

    // test('handleSearch should call fetchWeather if the city is not empty', async () => {
    //     renderer.fetchWeather = jest.fn().mockResolvedValue({ name: 'London', country_code: 'GB', weather: { current_weather: { temperature: 10, weathercode: 0 }, hourly: { time: [new Date().toISOString()], temperature_2m: [10] } } });
    //     renderer.createCityCard = jest.fn().mockReturnValue(document.createElement('div'));
    //     renderer.citySearch.value = 'London';
    //     await renderer.handleSearch();
    //     expect(renderer.fetchWeather).toHaveBeenCalledWith('London');
    // });

    

    test('isCityAlreadyDisplayed should return true if the city is already displayed', () => {
        document.getElementById('cities').innerHTML = '<div class="card h-100 p-3"><div class="card-body text-center position-relative"><h3 class="card-title">London, GB</h3></div></div>';

        const isDisplayed = renderer.isCityAlreadyDisplayed('London');
        expect(isDisplayed).toBe(true);
    });

    

    test('isCityAlreadyDisplayed should return false if the city is not already displayed', () => {
        document.getElementById('cities').innerHTML = '';
        const isDisplayed = renderer.isCityAlreadyDisplayed('London');
        expect(isDisplayed).toBe(false);
    });

    test('addNewCityToStorage should add a new city to session storage if it is not already there', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [{ name: 'London', country: 'UK' }] }) });
        await renderer.addNewCityToStorage('London');
        const cities = JSON.parse(sessionStorage.getItem('cities'));
        expect(cities).toEqual([{ name: 'London', country: 'UK' }]);
    });

    test('addNewCityToStorage should not add a city to session storage if it is already there', async () => {
        sessionStorage.setItem('cities', JSON.stringify([{ name: 'London', country: 'UK' }]));
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [{ name: 'London', country: 'UK' }] }) });
        await renderer.addNewCityToStorage('London');
        const cities = JSON.parse(sessionStorage.getItem('cities'));
        expect(cities).toEqual([{ name: 'London', country: 'UK' }]);
    });
});

describe('Autocomplete Functionality', () => {
    // beforeEach(() => {
    //     document.body.innerHTML = htmlFile;
    //     renderer.citySearch = document.getElementById('citySearch');
    //     renderer.autocompleteDropdown = document.getElementById('autocompleteDropdown');
    //     sessionStorage.clear();
    //     jest.clearAllMocks();
    // });

    // test('showAutocompleteSuggestions should display suggestions based on input', () => {
    //     const mockCities = [{ name: 'London', country: 'UK' }, { name: 'Paris', country: 'FR' }];
    //     sessionStorage.setItem('cities', JSON.stringify(mockCities));
    //     renderer.showAutocompleteSuggestions('Lon');
    //     expect(renderer.autocompleteDropdown.innerHTML).toContain('London, UK');
    // });

    // test('showAutocompleteSuggestions should hide the dropdown if there are no suggestions', () => {
    //     renderer.showAutocompleteSuggestions('InvalidCity');
    //     expect(renderer.autocompleteDropdown.style.display).toBe('none');
    // });

  //   test('updateSelectedSuggestion should update the selected suggestion in the dropdown', () => {
  //     document.body.innerHTML = `<div id="autocompleteDropdown">
  //         <div class="dropdown-item">London</div>
  //         <div class="dropdown-item">Paris</div>
  //     </div>`;
  
  //     renderer.autocompleteDropdown = document.getElementById('autocompleteDropdown');
  //     const suggestions = Array.from(renderer.autocompleteDropdown.querySelectorAll('.dropdown-item')); // Convert to array
  //     renderer.selectedIndex = 1;
  
  //     // Mock scrollIntoView - Important: Mock BEFORE updateSelectedSuggestion
  //     suggestions.forEach(s => s.scrollIntoView = jest.fn());  // Mock for ALL suggestions
  
  //     renderer.updateSelectedSuggestion(suggestions);
  
  //     // Need to re-query the element after the update, as jsdom may not immediately reflect the class change
  //     const updatedSuggestions = renderer.autocompleteDropdown.querySelectorAll('.dropdown-item');
  
  //     expect(updatedSuggestions[1].classList.contains('selected')).toBe(true);
  // });
});