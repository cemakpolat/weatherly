# Weather-Based Background Animations

This document explains the weather animation system implemented in the atmos sphere application.

## Overview

The application features **dynamic, weather-based background animations** that change based on real-time weather conditions. The system follows **SOLID principles** and is fully extensible.

## Features

### 🌧️ Rain Animation
- Animated raindrops falling from top to bottom
- Intensity adjustable based on weather severity
- Smooth CSS animations with GPU acceleration

**Weather Codes**: 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82

### ❄️ Snow Animation
- Floating snowflakes with rotation
- Gentle drift movement simulating wind
- Multiple snowflake sizes for depth perception

**Weather Codes**: 71, 73, 75, 77, 85, 86

### ☀️ Sunny Animation
- Pulsing sun rays effect
- Floating dust particles in sunlight
- Warm, bright atmosphere

**Weather Codes**: 0, 1

### ☁️ Clouds Animation
- Drifting clouds across the screen
- Multi-bubble cloud shapes for realism
- Varied opacity and sizes

**Weather Codes**: 2, 3, 45, 48

### ⛈️ Thunderstorm Animation
- Heavy rain with increased intensity
- Realistic lightning flashes
- Random timing for authentic effect
- Dark, dramatic background

**Weather Codes**: 95, 96, 99

## Architecture

### SOLID Principles

The animation system follows all five SOLID principles:

#### 1. Single Responsibility Principle
Each animation class has ONE responsibility:
- `RainAnimation` - Only handles rain effects
- `SnowAnimation` - Only handles snow effects
- `SunnyAnimation` - Only handles sunny effects
- `CloudsAnimation` - Only handles cloud effects
- `ThunderstormAnimation` - Only handles thunderstorm effects

#### 2. Open/Closed Principle
The system is **open for extension**, **closed for modification**:
```javascript
// Adding a new animation is easy - no existing code changes needed!
export class FogAnimation extends IWeatherAnimation {
  getName() { return 'Fog'; }
  getWeatherCodes() { return [45, 48]; }
  start(container) { /* implementation */ }
  stop() { /* implementation */ }
  setIntensity(intensity) { /* implementation */ }
}
```

#### 3. Liskov Substitution Principle
All animations implement `IWeatherAnimation` and are **interchangeable**:
```javascript
// Any animation can replace another
const animation = new RainAnimation(); // or SnowAnimation, etc.
animation.start(container);
```

#### 4. Interface Segregation Principle
The `IWeatherAnimation` interface contains **only essential methods**:
- `getName()` - Get animation name
- `getWeatherCodes()` - Get applicable weather codes
- `start(container)` - Start animation
- `stop()` - Stop animation
- `setIntensity(intensity)` - Adjust intensity

#### 5. Dependency Inversion Principle
`WeatherAnimationManager` depends on **abstraction** (`IWeatherAnimation`), not concrete classes:
```javascript
class WeatherAnimationManager {
  #animations = []; // Array of IWeatherAnimation
  // Manager works with interface, not concrete implementations
}
```

## File Structure

```
src/renderer/
├── services/
│   └── animations/
│       ├── IWeatherAnimation.js           # Interface definition
│       ├── RainAnimation.js               # Rain implementation
│       ├── SnowAnimation.js               # Snow implementation
│       ├── SunnyAnimation.js              # Sunny implementation
│       ├── CloudsAnimation.js             # Clouds implementation
│       ├── ThunderstormAnimation.js       # Thunderstorm implementation
│       └── WeatherAnimationManager.js     # Animation manager (Factory + Facade)
└── styles.css                             # Animation CSS
```

## Usage

### Basic Usage

```javascript
import { WeatherAnimationManager } from './services/animations/WeatherAnimationManager.js';

// Create manager
const animationManager = new WeatherAnimationManager();

// Set container (usually document.body)
animationManager.setContainer(document.body);

// Start animation for a weather code
animationManager.startForWeatherCode(65); // Heavy rain

// Adjust intensity
animationManager.setIntensity(0.8); // 0-1 range

// Stop all animations
animationManager.stopAll();
```

### Integration with Weather Data

```javascript
// Automatically show animation based on current weather
function updateWeatherDisplay(weatherData) {
  const weatherCode = weatherData.current_weather.weathercode;

  // Start appropriate animation
  animationManager.startForWeatherCode(weatherCode, 0.6);

  // Update background gradient
  updateBackgroundGradient(weatherCode);
}
```

## Dynamic Backgrounds

The system includes **weather-specific background gradients** that complement the animations:

### Clear Sky
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Cloudy
```css
background: linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%);
```

### Rainy
```css
background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
```

### Snowy
```css
background: linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%);
```

### Thunderstorm
```css
background: linear-gradient(135deg, #232526 0%, #414345 100%);
```

## Adding a New Animation

### Step 1: Create Animation Class

Create `src/renderer/services/animations/YourAnimation.js`:

```javascript
import { IWeatherAnimation } from './IWeatherAnimation.js';

export class YourAnimation extends IWeatherAnimation {
  #container = null;
  #elements = [];
  #animationFrame = null;
  #intensity = 0.5;

  getName() {
    return 'YourAnimationName';
  }

  getWeatherCodes() {
    return [/* weather codes */];
  }

  start(container) {
    this.stop(); // Clean up first
    this.#container = container;

    // Create animation container
    const animContainer = document.createElement('div');
    animContainer.className = 'your-animation-container';
    animContainer.id = 'your-animation';
    this.#container.appendChild(animContainer);

    // Create animation elements
    this.#createElements(animContainer);

    // Start animation loop
    this.#animate();
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }

    const container = document.getElementById('your-animation');
    if (container) {
      container.remove();
    }

    this.#elements = [];
    this.#container = null;
  }

  setIntensity(intensity) {
    this.#intensity = Math.max(0, Math.min(1, intensity));
  }

  #createElements(container) {
    // Create your animation elements
  }

  #animate() {
    // Update animation
    this.#animationFrame = requestAnimationFrame(() => this.#animate());
  }
}
```

### Step 2: Register in Manager

Update `WeatherAnimationManager.js`:

```javascript
import { YourAnimation } from './YourAnimation.js';

#initializeAnimations() {
  this.#animations = [
    new ThunderstormAnimation(),
    new RainAnimation(),
    new SnowAnimation(),
    new SunnyAnimation(),
    new CloudsAnimation(),
    new YourAnimation(), // Add your animation
  ];
  // ... rest of code
}
```

### Step 3: Add CSS Styles

Add to `styles.css`:

```css
.your-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* Your animation styles */
.your-animation-element {
  /* styles */
}

@keyframes your-animation {
  /* keyframes */
}
```

## Performance Optimizations

### 1. GPU Acceleration
All animations use `transform` and `opacity` properties for GPU acceleration:

```css
.raindrop {
  will-change: transform, opacity;
  transform: translateY(-100vh); /* GPU accelerated */
}
```

### 2. RequestAnimationFrame
Animations use `requestAnimationFrame` for smooth, browser-optimized updates:

```javascript
#animate() {
  this.#animationFrame = requestAnimationFrame(() => this.#animate());
}
```

### 3. Pointer Events None
Animation elements don't interfere with user interaction:

```css
.rain-container {
  pointer-events: none; /* Pass through clicks */
}
```

### 4. Layering
Content is properly layered above animations:

```css
#cities,
.container {
  position: relative;
  z-index: 1; /* Above animations */
}
```

## Weather Code Mapping

| Weather Condition | Codes | Animation |
|------------------|-------|-----------|
| Clear sky | 0, 1 | Sunny |
| Cloudy | 2, 3 | Clouds |
| Fog | 45, 48 | Clouds |
| Drizzle | 51, 53, 55, 56, 57 | Rain |
| Rain | 61, 63, 65, 66, 67 | Rain |
| Rain showers | 80, 81, 82 | Rain |
| Snow | 71, 73, 75, 77 | Snow |
| Snow showers | 85, 86 | Snow |
| Thunderstorm | 95, 96, 99 | Thunderstorm |

## Future Enhancements

Possible additions to the animation system:

- 🌫️ **Fog Animation** - Misty overlay effect
- 🌪️ **Tornado Animation** - Spinning vortex effect
- 🌈 **Rainbow Animation** - After rain effects
- ☔ **Wind Animation** - Swaying elements
- 🌅 **Sunset/Sunrise** - Time-of-day gradients
- ⚡ **Thunder Sound** - Audio effects (optional)

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Electron (Desktop app)

All animations use standard CSS3 and JavaScript features with broad browser support.

## Benefits

### ✅ Immersive Experience
Real-time visual feedback based on actual weather conditions

### ✅ Extensible Architecture
Easy to add new animation types following SOLID principles

### ✅ Performance Optimized
GPU-accelerated, smooth 60fps animations

### ✅ Customizable
Adjustable intensity levels for each animation

### ✅ Non-Intrusive
Animations don't interfere with app functionality

## Example Integration

```javascript
// When weather data is loaded
async function loadWeatherForCity(cityName) {
  const weatherData = await weatherService.getWeatherByCity(cityName);

  if (weatherData) {
    // Display weather information
    displayWeatherInfo(weatherData);

    // Start appropriate animation
    const weatherCode = weatherData.weather.current_weather.weathercode;
    animationManager.startForWeatherCode(weatherCode, 0.7);

    // Update background
    updateBackgroundGradient(weatherCode);
  }
}
```

The animation system enhances the user experience by creating a visually engaging, weather-responsive interface that makes checking the weather more enjoyable!
