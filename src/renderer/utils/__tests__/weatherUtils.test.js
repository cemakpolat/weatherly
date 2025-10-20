/**
 * @jest-environment jsdom
 */

import {
  celsiusToFahrenheit,
  formatTemperature,
  getCurrentHourIndex,
  formatWindDirection,
  formatWindSpeed,
  getUVRecommendation,
  formatTime,
  getWeatherIcon,
  getWeatherDescription,
  detectSevereWeather,
} from '../weatherUtils.js';

describe('Weather Utilities', () => {
  describe('Temperature Functions', () => {
    it('should convert Celsius to Fahrenheit correctly', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
      expect(celsiusToFahrenheit(100)).toBe(212);
      expect(celsiusToFahrenheit(25)).toBe(77);
      expect(celsiusToFahrenheit(-40)).toBe(-40);
    });

    it('should format temperature in Celsius by default', () => {
      expect(formatTemperature(25, 'celsius')).toBe('<span class="temp-value">25</span><span class="temp-unit">°C</span>');
      expect(formatTemperature(0, 'celsius')).toBe('<span class="temp-value">0</span><span class="temp-unit">°C</span>');
      expect(formatTemperature(-10, 'celsius')).toBe('<span class="temp-value">-10</span><span class="temp-unit">°C</span>');
    });

    it('should format temperature in Fahrenheit when specified', () => {
      expect(formatTemperature(25, 'fahrenheit')).toBe('<span class="temp-value">77</span><span class="temp-unit">°F</span>');
      expect(formatTemperature(0, 'fahrenheit')).toBe('<span class="temp-value">32</span><span class="temp-unit">°F</span>');
    });
  });

  describe('Wind Functions', () => {
    it('should format wind direction correctly', () => {
      expect(formatWindDirection(0)).toBe('N');
      expect(formatWindDirection(45)).toBe('NE');
      expect(formatWindDirection(90)).toBe('E');
      expect(formatWindDirection(135)).toBe('SE');
      expect(formatWindDirection(180)).toBe('S');
      expect(formatWindDirection(225)).toBe('SW');
      expect(formatWindDirection(270)).toBe('W');
      expect(formatWindDirection(315)).toBe('NW');
      expect(formatWindDirection(360)).toBe('N');
    });

    it('should format wind speed in km/h by default', () => {
      expect(formatWindSpeed(15, 'celsius')).toBe('15 km/h');
      expect(formatWindSpeed(30, 'celsius')).toBe('30 km/h');
    });

    it('should format wind speed in mph when using fahrenheit', () => {
      expect(formatWindSpeed(16.09, 'fahrenheit')).toBe('10 mph');
      expect(formatWindSpeed(32.18, 'fahrenheit')).toBe('20 mph');
    });
  });

  describe('UV Index Functions', () => {
    it('should return Low for UV index 0-2', () => {
      expect(getUVRecommendation(0)).toEqual({ text: 'Low', class: 'uv-low' });
      expect(getUVRecommendation(2)).toEqual({ text: 'Low', class: 'uv-low' });
    });

    it('should return Moderate for UV index 3-5', () => {
      expect(getUVRecommendation(3)).toEqual({ text: 'Moderate', class: 'uv-moderate' });
      expect(getUVRecommendation(5)).toEqual({ text: 'Moderate', class: 'uv-moderate' });
    });

    it('should return High for UV index 6-7', () => {
      expect(getUVRecommendation(6)).toEqual({ text: 'High', class: 'uv-high' });
      expect(getUVRecommendation(7)).toEqual({ text: 'High', class: 'uv-high' });
    });

    it('should return Very High for UV index 8-10', () => {
      expect(getUVRecommendation(8)).toEqual({ text: 'Very High', class: 'uv-very-high' });
      expect(getUVRecommendation(10)).toEqual({ text: 'Very High', class: 'uv-very-high' });
    });

    it('should return Extreme for UV index 11+', () => {
      expect(getUVRecommendation(11)).toEqual({ text: 'Extreme', class: 'uv-extreme' });
      expect(getUVRecommendation(15)).toEqual({ text: 'Extreme', class: 'uv-extreme' });
    });
  });

  describe('Time Functions', () => {
    it('should format ISO time to HH:MM', () => {
      expect(formatTime('2025-01-19T14:30:00')).toBe('14:30');
      expect(formatTime('2025-01-19T09:05:00')).toBe('09:05');
      expect(formatTime('2025-01-19T00:00:00')).toBe('00:00');
    });

    it('should get current hour index from hourly data', () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.getDate();

      const times = [
        new Date(now.getFullYear(), now.getMonth(), currentDate, currentHour - 1).toISOString(),
        new Date(now.getFullYear(), now.getMonth(), currentDate, currentHour).toISOString(),
        new Date(now.getFullYear(), now.getMonth(), currentDate, currentHour + 1).toISOString(),
      ];

      expect(getCurrentHourIndex(times)).toBe(1);
    });

    it('should return 0 if current hour not found', () => {
      const times = ['2020-01-01T00:00:00', '2020-01-01T01:00:00'];
      expect(getCurrentHourIndex(times)).toBe(0);
    });
  });

  describe('Weather Icon and Description', () => {
    it('should return correct weather icon HTML', () => {
      expect(getWeatherIcon(0)).toContain('fa-sun');
      expect(getWeatherIcon(1)).toContain('fa-cloud-sun');
      expect(getWeatherIcon(95)).toContain('fa-bolt');
      expect(getWeatherIcon(999)).toContain('fa-question');
    });

    it('should return correct weather description', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky');
      expect(getWeatherDescription(1)).toBe('Mainly clear');
      expect(getWeatherDescription(95)).toBe('Thunderstorm');
      expect(getWeatherDescription(999)).toBe('Unknown weather');
    });
  });

  describe('Severe Weather Detection', () => {
    const mockFormatTemp = (temp) => `${temp}°C`;

    it('should detect thunderstorm', () => {
      const weatherData = {
        current_weather: { weathercode: 95, temperature: 20 },
        daily: { precipitation_probability_max: [0] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('thunderstorm');
      expect(alerts[0].message).toContain('Thunderstorm alert');
    });

    it('should detect heavy rain', () => {
      const weatherData = {
        current_weather: { weathercode: 65, temperature: 15 },
        daily: { precipitation_probability_max: [0] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts[0].type).toBe('heavyRain');
      expect(alerts[0].message).toContain('Heavy rain alert');
    });

    it('should detect heavy snow', () => {
      const weatherData = {
        current_weather: { weathercode: 75, temperature: -5 },
        daily: { precipitation_probability_max: [0] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts[0].type).toBe('heavySnow');
      expect(alerts[0].message).toContain('Heavy snow alert');
    });

    it('should detect extreme heat', () => {
      const weatherData = {
        current_weather: { weathercode: 0, temperature: 40 },
        daily: { precipitation_probability_max: [0] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts[0].type).toBe('extremeTemperature');
      expect(alerts[0].message).toContain('Extreme heat alert');
    });

    it('should detect extreme cold', () => {
      const weatherData = {
        current_weather: { weathercode: 0, temperature: -20 },
        daily: { precipitation_probability_max: [0] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts[0].type).toBe('extremeTemperature');
      expect(alerts[0].message).toContain('Extreme cold alert');
    });

    it('should detect high precipitation probability', () => {
      const weatherData = {
        current_weather: { weathercode: 0, temperature: 20 },
        daily: { precipitation_probability_max: [85] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts[0].type).toBe('highPrecipitation');
      expect(alerts[0].message).toContain('High precipitation probability');
    });

    it('should return empty array for normal weather', () => {
      const weatherData = {
        current_weather: { weathercode: 0, temperature: 20 },
        daily: { precipitation_probability_max: [30] },
      };
      const alerts = detectSevereWeather(weatherData, 'TestCity', mockFormatTemp);
      expect(alerts).toEqual([]);
    });
  });
});
