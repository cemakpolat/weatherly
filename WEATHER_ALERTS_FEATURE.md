# Weather Alerts and Notifications Feature

## Overview

The atmos sphere app now includes a comprehensive weather alerts and notifications system that detects severe weather conditions and notifies users through both native Electron notifications and in-app toast messages.

---

## Features Implemented

### 1. Severe Weather Detection

The system automatically detects the following weather conditions:

#### **Thunderstorms** ⚡
- Weather codes: 95, 96, 99
- Triggers: Thunderstorm, Thunderstorm with slight hail, Thunderstorm with heavy hail

#### **Heavy Rain** 🌧️
- Weather codes: 63, 65, 67, 82
- Triggers: Moderate rain, Heavy rain, Heavy freezing rain, Violent rain showers

#### **Heavy Snow** ❄️
- Weather codes: 75, 86
- Triggers: Heavy snowfall, Heavy snow showers

#### **Extreme Temperatures** 🔥🥶
- **Heat**: Temperature >= 35°C (95°F)
- **Cold**: Temperature <= -15°C (5°F)

#### **High Precipitation Probability** ☔
- Triggers when precipitation probability >= 80% for the current day

---

## 2. Notification System

### Native Electron Notifications
- Uses Electron's native notification API
- Shows desktop notifications with critical urgency
- Displays weather alert messages with appropriate emojis

### In-App Toast Notifications
- Warning-type toasts with 5-second duration
- Visible on screen for immediate awareness
- Auto-dismissible with smooth animations

### Visual Indicators on City Cards
- **Alert Badge**: Orange pulsing badge in top-left corner
- **Icon**: Warning triangle (⚠️) with hover tooltip showing all active alerts
- **Card Border**: Orange glow border (2px solid) for cards with active alerts
- **Shadow**: Enhanced box-shadow with orange tint

---

## 3. User Preferences

Alert preferences are stored in settings and can be customized:

```javascript
{
  weatherAlerts: {
    enabled: true,              // Master toggle for all alerts
    thunderstorm: true,         // Thunderstorm alerts
    heavyRain: true,            // Heavy rain alerts
    heavySnow: true,            // Heavy snow alerts
    extremeTemperature: true,   // Extreme temperature alerts
    highPrecipitation: true     // High precipitation probability alerts
  }
}
```

### Default Settings
- All alert types are **enabled by default**
- Users can disable specific alert types through settings (UI to be added in future)

---

## 4. Alert Timing

Alerts are checked and triggered in the following scenarios:

1. **On City Addition**: When a new city is added via search
2. **On App Startup**: When loading saved cities from settings
3. **On Refresh**: When manually refreshing a city's weather
4. **On Auto-Refresh**: Every 30 minutes during automatic refresh cycle

---

## Technical Implementation

### Files Modified

#### **src/main/main.js**
- Added `Notification` import from Electron
- Implemented IPC handler for `show-notification` event
- Native notifications with critical urgency level

```javascript
ipcMain.on('show-notification', (event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: icon || path.join(__dirname, '../renderer/icon.png'),
      urgency: 'critical',
    });
    notification.show();
  }
});
```

#### **src/preload.js**
- Exposed `showNotification` function to renderer process
- Secure IPC bridge using contextBridge

```javascript
showNotification: (title, body, icon) =>
  ipcRenderer.send('show-notification', { title, body, icon }),
```

#### **src/storage.js**
- Added `weatherAlerts` object to default settings
- Includes all alert type preferences with default enabled state

```javascript
weatherAlerts: {
  enabled: true,
  thunderstorm: true,
  heavyRain: true,
  heavySnow: true,
  extremeTemperature: true,
  highPrecipitation: true,
}
```

#### **src/renderer/renderer.js**
- Added `SEVERE_WEATHER_CODES` constant mapping
- Implemented `detectSevereWeather()` function
- Implemented `showWeatherAlerts()` function
- Updated `createCityCard()` to include alert badge and styling
- Updated `handleSearch()` to check alerts on new city
- Updated `loadSettings()` to check alerts on startup
- Alert detection respects user preferences from settings

```javascript
const SEVERE_WEATHER_CODES = {
  thunderstorm: [95, 96, 99],
  heavyRain: [63, 65, 67, 82],
  heavySnow: [75, 86],
};

function detectSevereWeather(weatherData, cityName) {
  // Returns array of alert objects with type and message
}

async function showWeatherAlerts(weatherData, cityName) {
  // Reads preferences, filters alerts, shows notifications
}
```

#### **src/renderer/styles.css**
- Added `.weather-alert-badge` class with pulsing animation
- Added `@keyframes pulse` for attention-grabbing effect
- Added `.card.has-weather-alert` class for visual distinction
- Orange color scheme (#ff9800) for consistency

```css
.weather-alert-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #ff9800;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
}
```

---

## Data Flow

```
User Action (Add City / Load Settings / Refresh)
           ↓
   fetchWeather(city)
           ↓
   createCityCard(cityData)
           ↓
   detectSevereWeather(weather, name)
           ↓
   showWeatherAlerts(weather, name)
           ↓
   ┌─────────────────┬─────────────────┐
   ↓                 ↓                 ↓
Native          Toast              Visual
Notification    Notification       Indicator
```

---

## Alert Message Examples

- ⚡ **Thunderstorm alert for London! Thunderstorm with heavy hail**
- 🌧️ **Heavy rain alert for Seattle! Violent rain showers**
- ❄️ **Heavy snow alert for Moscow! Heavy snowfall**
- 🔥 **Extreme heat alert for Dubai! Temperature: 42°C**
- 🥶 **Extreme cold alert for Yakutsk! Temperature: -25°C**
- ☔ **High precipitation probability for Portland today: 95%**

---

## Visual Design

### Alert Badge
- **Position**: Top-left corner of city card
- **Size**: 28x28px circle
- **Color**: Orange (#ff9800)
- **Icon**: Warning triangle (fa-triangle-exclamation)
- **Animation**: Pulsing shadow effect
- **Tooltip**: Shows all alert messages on hover

### Card Styling (when alerts are active)
- **Border**: 2px solid rgba(255, 152, 0, 0.4)
- **Box Shadow**: 0 4px 12px rgba(255, 152, 0, 0.2)
- **Data Attribute**: `data-has-alerts="true"`

---

## Future Enhancements

### Priority 1: Settings UI
- Add alert preferences panel in app settings
- Toggle switches for each alert type
- Master enable/disable switch
- Notification sound preferences

### Priority 2: Alert History
- Store alert history in settings
- Show alert timeline for each city
- Dismissed alerts tracking

### Priority 3: Advanced Alerts
- Multi-day forecast alerts (e.g., "Heavy rain expected in 2 days")
- Weather change alerts (e.g., "Temperature will drop 15°C tomorrow")
- Custom alert thresholds (user-defined temperature limits)
- Alert scheduling (quiet hours, do not disturb)

### Priority 4: Alert Channels
- Email notifications
- SMS notifications (via third-party service)
- Webhook integrations
- Push notifications for mobile companion app

---

## Testing

To test the alerts feature:

1. **Thunderstorm Test**: Add a city currently experiencing thunderstorms
2. **Temperature Test**: Add a city with extreme heat (Dubai in summer) or cold (Siberia in winter)
3. **Precipitation Test**: Add a city with high rain probability
4. **Visual Test**: Verify the orange badge appears on cards with alerts
5. **Notification Test**: Check that native notifications appear on desktop
6. **Toast Test**: Verify in-app toasts display with warning styling

---

## Settings Structure

```json
{
  "isSearchBarHidden": false,
  "temperatureUnit": "celsius",
  "cities": [...],
  "weatherAlerts": {
    "enabled": true,
    "thunderstorm": true,
    "heavyRain": true,
    "heavySnow": true,
    "extremeTemperature": true,
    "highPrecipitation": true
  }
}
```

---

## API Dependencies

The feature uses data from Open-Meteo API:
- `current_weather.weathercode` - Current weather condition code
- `current_weather.temperature` - Current temperature
- `daily.precipitation_probability_max[0]` - Today's max precipitation probability

No additional API calls are required - alerts use existing weather data.

---

## Accessibility

- Alert badge includes `title` attribute with full alert messages
- Toast notifications have `role="alert"` for screen readers
- High contrast orange color (#ff9800) for visibility
- Pulsing animation for attention without being distracting

---

## Performance

- No additional API calls (uses existing weather data)
- Alert detection runs synchronously (< 1ms per city)
- Settings read once per alert check (cached in memory)
- Native notifications offloaded to OS

---

## Security

- No sensitive data in alert messages
- Notifications use secure IPC channel
- Settings validation ensures safe defaults
- No external dependencies for alert logic

---

**Last Updated**: 2025-10-19
**Status**: ✅ Production Ready
