# Atmos Sphere Architecture - SOLID & Modular Design

This document explains the SOLID architecture and modular design implemented in the Atmos Sphere application.

## Overview

The application has been refactored to follow **SOLID principles** and a **modular architecture**, making it:
- ✅ Easy to maintain and extend
- ✅ Testable with isolated components
- ✅ Scalable for new features
- ✅ Well-organized with clear separation of concerns

## Code Reduction Achievement

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `renderer.js` | 2,651 lines | ~450 lines | **83%** |

The functionality has been distributed across specialized services, each averaging 100-200 lines.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each class/service has one, and only one, reason to change.

| Service | Responsibility |
|---------|----------------|
| `StorageService` | Session storage operations |
| `ToastService` | Toast notification display |
| `SettingsManager` | Application settings management |
| `TemperatureService` | Temperature conversion and formatting |
| `CardManager` | City card creation and management |
| `SearchManager` | Search and autocomplete functionality |
| `ChartService` | Chart rendering and data visualization |
| `RadarService` | Radar map initialization and control |
| `HistoryService` | Historical weather data |
| `ForecastService` | Forecast data formatting |
| `ThemeManager` | Theme management |
| `MasonryLayoutManager` | Masonry grid layout |
| `DragDropManager` | Drag and drop operations |
| `GeolocationManager` | User location detection |
| `AutoRefreshManager` | Automatic data refresh |
| `WeatherAlertService` | Weather alert detection and notification |
| `OpenMeteoProvider` | Open-Meteo API integration |
| `WeatherService` | Weather operations facade |

### 2. Open/Closed Principle (OCP)
Software entities should be open for extension, but closed for modification.

- **Adding a new provider** - No need to modify existing code
- **New providers** - Just implement `IWeatherProvider` interface
- **Factory pattern** - Handles provider instantiation

```javascript
// Adding a new provider is easy:
export class WeatherAPIProvider extends IWeatherProvider {
  async getWeatherByCity(cityName) {
    // WeatherAPI.com specific implementation
  }
  // ... implement other interface methods
}

// Register in factory:
case WeatherProviderType.WEATHER_API:
  return new WeatherAPIProvider();
```

### 3. Liskov Substitution Principle (LSP)
Objects of a superclass should be replaceable with objects of its subclasses.

- All providers extend `IWeatherProvider`
- Any provider can replace another without breaking the app
- `WeatherService` works with any provider implementing the interface

```javascript
// These are interchangeable:
const service1 = new WeatherService(WeatherProviderType.OPEN_METEO);
const service2 = new WeatherService(WeatherProviderType.WEATHER_API);
// Both work identically from the client's perspective
```

### 4. Interface Segregation Principle (ISP)
Clients should not be forced to depend on interfaces they don't use.

- `IWeatherProvider` defines only essential weather operations
- No bloated interface with unnecessary methods
- Each method has a clear, specific purpose

### 5. Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions.

- `WeatherService` depends on `IWeatherProvider` (abstraction)
- Not dependent on `OpenMeteoProvider` (concrete implementation)
- High-level modules don't depend on low-level modules

```javascript
// Good: Depends on abstraction
class WeatherService {
  #provider; // IWeatherProvider

  constructor(providerType) {
    this.#provider = WeatherProviderFactory.createProvider(providerType);
  }
}

// Bad: Would depend on concrete class
// class WeatherService {
//   #provider = new OpenMeteoProvider(); // Tightly coupled!
// }
```

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Renderer (UI Layer)             │
│         renderer.js                     │
└─────────────────┬───────────────────────┘
                  │ uses
                  ▼
┌─────────────────────────────────────────┐
│      Service Layer (Facade)             │
│         WeatherService                  │
│         GeolocationService              │
│         ConfigService                   │
└─────────────────┬───────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────┐
│    Abstraction Layer (Interface)        │
│         IWeatherProvider                │
└─────────────────┬───────────────────────┘
                  │ implemented by
                  ▼
┌─────────────────────────────────────────┐
│    Provider Layer (Implementations)     │
│      - OpenMeteoProvider                │
│      - WeatherAPIProvider (future)      │
│      - OpenWeatherMapProvider (future)  │
└─────────────────────────────────────────┘
                  ▲
                  │ created by
┌─────────────────┴───────────────────────┐
│         Factory Layer                   │
│      WeatherProviderFactory             │
└─────────────────────────────────────────┘
```

## File Structure

```
src/renderer/
├── services/
│   ├── providers/
│   │   ├── IWeatherProvider.js          # Interface definition
│   │   └── OpenMeteoProvider.js         # Open-Meteo implementation
│   ├── WeatherService.js                # Main weather facade
│   ├── WeatherProviderFactory.js        # Factory for providers
│   ├── ConfigService.js                 # Configuration management
│   └── weatherApi.js                    # Legacy compatibility layer
├── utils/
│   ├── constants.js                     # Application constants
│   └── weatherUtils.js                  # Weather utility functions
└── renderer.js                          # Main UI logic
```

## How to Add a New Weather Provider

### Step 1: Create Provider Class

Create a new file: `src/renderer/services/providers/YourProvider.js`

```javascript
import { IWeatherProvider } from './IWeatherProvider.js';

export class YourProvider extends IWeatherProvider {
  getProviderName() {
    return 'YourProviderName';
  }

  async geocodeCity(cityName) {
    // Implement using your API
  }

  async getWeatherByCoordinates(latitude, longitude) {
    // Implement using your API
  }

  async getWeatherByCity(cityName) {
    // Implement using your API
  }

  async reverseGeocode(latitude, longitude) {
    // Implement using your API
  }
}
```

### Step 2: Register in Factory

Update `WeatherProviderFactory.js`:

```javascript
import { YourProvider } from './providers/YourProvider.js';

export const WeatherProviderType = {
  OPEN_METEO: 'openmeteo',
  YOUR_PROVIDER: 'yourprovider', // Add this
};

export class WeatherProviderFactory {
  static createProvider(providerType) {
    switch (providerType) {
      case WeatherProviderType.OPEN_METEO:
        return new OpenMeteoProvider();
      case WeatherProviderType.YOUR_PROVIDER: // Add this
        return new YourProvider();
      // ...
    }
  }

  static getAvailableProviders() {
    return [
      {
        value: WeatherProviderType.OPEN_METEO,
        name: 'Open-Meteo',
        description: 'Free weather API',
      },
      {                                      // Add this
        value: WeatherProviderType.YOUR_PROVIDER,
        name: 'Your Provider',
        description: 'Your API description',
      },
    ];
  }
}
```

### Step 3: Use It

```javascript
import { WeatherService } from './services/WeatherService.js';
import { WeatherProviderType } from './services/WeatherProviderFactory.js';

// Create service with your provider
const weatherService = new WeatherService(WeatherProviderType.YOUR_PROVIDER);

// Or switch at runtime
await ConfigService.setWeatherProvider(WeatherProviderType.YOUR_PROVIDER);
```

## Benefits

### ✅ Extensibility
Adding new weather providers doesn't require modifying existing code.

### ✅ Testability
Each component can be tested independently. Providers can be mocked easily.

### ✅ Maintainability
Clear separation of concerns makes code easier to understand and maintain.

### ✅ Flexibility
Users can choose their preferred weather API provider.

### ✅ Reusability
Providers implement a common interface, making them reusable.

## Example Usage

```javascript
// Initialize with default provider
const weatherService = new WeatherService();

// Get weather by city
const cityWeather = await weatherService.getWeatherByCity('London');

// Get weather by coordinates
const coordWeather = await weatherService.getWeatherByCoordinates(51.5074, -0.1278);

// Switch provider at runtime
weatherService.switchProvider(WeatherProviderType.WEATHER_API);

// Get current location weather
const currentWeather = await weatherService.getWeatherForCurrentLocation();
```

## Future Providers

The architecture is ready for these providers to be added:

- 🌐 **WeatherAPI.com** - Commercial API with free tier
- 🌐 **OpenWeatherMap** - Popular weather API
- 🌐 **Visual Crossing** - Enterprise weather data
- 🌐 **AccuWeather** - Detailed weather forecasts
- 🌐 **Weatherbit** - Global weather data

Each provider only needs to implement the `IWeatherProvider` interface!

## Backward Compatibility

The `weatherApi.js` file maintains backward compatibility by wrapping the new architecture. Existing code using the old API will continue to work without modifications.

```javascript
// Old API still works:
import { fetchWeather } from './services/weatherApi.js';
const weather = await fetchWeather('Paris');

// New API also available:
import { WeatherService } from './services/weatherApi.js';
const service = new WeatherService();
const weather = await service.getWeatherByCity('Paris');
```
