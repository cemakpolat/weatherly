const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Get the user data path
const userDataPath = app.getPath('userData');
const settingsFilePath = path.join(userDataPath, 'settings.json');

// Default settings
const defaultSettings = {
  isSearchBarHidden: false,
  temperatureUnit: 'celsius',
  cities: [],
  weatherAlerts: {
    enabled: true,
    thunderstorm: true,
    heavyRain: true,
    heavySnow: true,
    extremeTemperature: true,
    highPrecipitation: true,
  },
};

// Read settings from file
function readSettings() {
  try {
    const data = fs.readFileSync(settingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist or is invalid, return default settings
    return defaultSettings;
  }
}

// Write settings to file
function writeSettings(settings) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing settings file:', error);
  }
}

module.exports = { readSettings, writeSettings };
