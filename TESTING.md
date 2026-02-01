# Testing Guide for Atmos-Sphere Weather App

## Overview

This guide explains how to run and write tests for the Atmos-Sphere weather application.

## Test Structure

```
src/
├── main/
│   └── __tests__/
│       └── main.test.js              # Electron main process tests
├── renderer/
    ├── __tests__/
    │   ├── e2e.test.js               # End-to-end user journey tests
    │   ├── integration.test.js       # Integration tests
    │   ├── keyboardShortcuts.test.js # Keyboard shortcuts
    │   ├── renderer.test.js          # Main renderer tests
    │   └── themeSystem.test.js       # Theme system tests
    ├── services/
    │   ├── __tests__/
    │   │   ├── DynamicBackgroundManager.test.js
    │   │   ├── SettingsManager.test.js
    │   │   ├── StorageService.test.js
    │   │   ├── TemperatureService.test.js
    │   │   ├── ThemeManager.test.js
    │   │   ├── ToastService.test.js
    │   │   ├── WeatherAlertService.test.js
    │   │   └── WeatherService.test.js
    │   └── animations/
    │       └── __tests__/
    │           ├── CloudsAnimation.test.js
    │           ├── RainAnimation.test.js
    │           ├── SnowAnimation.test.js
    │           ├── SunnyAnimation.test.js
    │           ├── ThunderstormAnimation.test.js
    │           └── WeatherAnimationManager.test.js
    └── utils/
        └── __tests__/
            └── weatherUtils.test.js
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only (exclude E2E and integration)
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Test Suites
```bash
npm run test:all
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Run Specific Test File
```bash
npm test -- StorageService.test.js
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

### Update Snapshots (if using snapshot testing)
```bash
npm test -- -u
```

## Coverage Reports

### Generate Coverage Report
```bash
npm test
```

Coverage reports are generated in:
- `coverage/` - HTML reports (open `coverage/lcov-report/index.html`)
- Terminal output shows coverage summary

### View Coverage Report
```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

## Writing Tests

### Test File Naming Convention
- Unit tests: `ComponentName.test.js`
- Integration tests: `integration.test.js`
- E2E tests: `e2e.test.js`

### Basic Test Structure

```javascript
import { ServiceName } from '../ServiceName';

describe('ServiceName', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = ServiceName.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking Example

```javascript
// Mock external dependencies
jest.mock('../ExternalService');

beforeEach(() => {
  ExternalService.someMethod.mockReturnValue('mocked value');
});
```

### Testing Async Code

```javascript
it('should fetch data', async () => {
  const data = await ServiceName.fetchData();
  expect(data).toBeDefined();
});
```

### Testing DOM Elements

```javascript
it('should create element', () => {
  const element = document.createElement('div');
  element.className = 'test-class';
  document.body.appendChild(element);
  
  expect(document.querySelector('.test-class')).toBeTruthy();
});
```

## Test Categories

### 1. Unit Tests
- Test individual functions/methods in isolation
- Mock all external dependencies
- Fast execution
- High coverage

**Example:**
```javascript
// TemperatureService.test.js
it('should convert Celsius to Fahrenheit', () => {
  expect(TemperatureService.convert(0, 'C', 'F')).toBe(32);
});
```

### 2. Integration Tests
- Test multiple services working together
- Test real interactions between components
- Verify data flow

**Example:**
```javascript
// integration.test.js
it('should fetch weather and create a card', async () => {
  const weatherData = await WeatherService.fetchWeatherByCityName('London');
  const card = CardManager.createCard(weatherData);
  expect(card).toBeTruthy();
});
```

### 3. E2E Tests
- Test complete user workflows
- Simulate real user interactions
- Test full application behavior

**Example:**
```javascript
// e2e.test.js
it('should allow searching for a city', () => {
  const searchInput = document.getElementById('city-search');
  searchInput.value = 'London';
  expect(searchInput.value).toBe('London');
});
```

## Best Practices

### ✅ DO
- Write clear, descriptive test names
- Test one thing per test
- Use meaningful assertions
- Mock external dependencies
- Clean up after tests
- Test edge cases and error scenarios
- Maintain test independence

### ❌ DON'T
- Test implementation details
- Create dependent tests
- Use hard-coded delays
- Skip cleanup
- Test multiple things in one test
- Rely on test execution order

## Debugging Tests

### Debug Single Test
```bash
npm test -- --testNamePattern="test name"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Console Logging in Tests
```javascript
it('should debug', () => {
  const value = someFunction();
  console.log('Debug value:', value);
  expect(value).toBe(expected);
});
```

## CI/CD Integration

Tests should be run in CI/CD pipeline:
```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Failing Due to Missing Mocks
Ensure all external dependencies are mocked:
```javascript
jest.mock('../ExternalService');
```

### DOM Not Available
Ensure `testEnvironment` is set to `jsdom` in jest.config.js

### Async Tests Timing Out
Increase timeout:
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Module Import Errors
Check that file paths use correct extensions (.js)

## Test Coverage Goals

| Category | Goal |
|----------|------|
| Services | 80%+ |
| Utils | 85%+ |
| Integration | Critical paths |
| E2E | Main user flows |

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Electron Testing](https://www.electronjs.org/docs/latest/tutorial/automated-testing)

## Quick Reference

```bash
# Run all tests
npm test

# Run specific suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- ServiceName.test.js

# Update snapshots
npm test -- -u

# Verbose
npm test -- --verbose
```
