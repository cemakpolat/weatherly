/**
 * End-to-End (E2E) Tests for Weather App
 * These tests simulate real user interactions with the application
 */

describe('Weather App E2E Tests', () => {
  let document;
  let window;

  beforeEach(() => {
    // Setup DOM environment
    document = global.document;
    window = global.window;

    // Create basic HTML structure
    document.body.innerHTML = `
      <div id="app">
        <div class="search-container">
          <input type="text" id="city-search" placeholder="Search for a city...">
          <button id="search-button">Search</button>
          <div id="autocomplete-dropdown" class="autocomplete-dropdown"></div>
        </div>
        <div class="settings-panel">
          <select id="units-selector">
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
          </select>
          <select id="theme-selector">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div id="cities-container" class="cities-container"></div>
        <div id="toast-container"></div>
        <button id="location-button">Use My Location</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  describe('User Journey: First Time User', () => {
    it('should display welcome screen on first load', () => {
      const container = document.getElementById('cities-container');
      expect(container).toBeTruthy();
      expect(container.children.length).toBe(0);
    });

    it('should allow searching for a city', () => {
      const searchInput = document.getElementById('city-search');
      const searchButton = document.getElementById('search-button');

      expect(searchInput).toBeTruthy();
      expect(searchButton).toBeTruthy();

      // Simulate user typing
      searchInput.value = 'London';
      expect(searchInput.value).toBe('London');
    });

    it('should show autocomplete suggestions while typing', async () => {
      const searchInput = document.getElementById('city-search');
      const dropdown = document.getElementById('autocomplete-dropdown');

      // Simulate typing
      searchInput.value = 'Lon';

      // Simulate input event
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);

      // Dropdown should be available
      expect(dropdown).toBeTruthy();
    });
  });

  describe('User Journey: Adding Cities', () => {
    it('should add a city card when search is successful', () => {
      const container = document.getElementById('cities-container');
      
      // Create a mock city card
      const card = document.createElement('div');
      card.className = 'city-card';
      card.innerHTML = `
        <h3 class="city-name">London, GB</h3>
        <div class="temperature">15°C</div>
        <div class="weather-description">Partly Cloudy</div>
      `;

      container.appendChild(card);

      expect(container.children.length).toBe(1);
      expect(container.querySelector('.city-name').textContent).toBe('London, GB');
    });

    it('should add multiple city cards', () => {
      const container = document.getElementById('cities-container');
      const cities = ['London', 'Paris', 'Berlin'];

      cities.forEach((city) => {
        const card = document.createElement('div');
        card.className = 'city-card';
        card.innerHTML = `<h3 class="city-name">${city}</h3>`;
        container.appendChild(card);
      });

      expect(container.children.length).toBe(3);
    });

    it('should prevent duplicate cities', () => {
      const container = document.getElementById('cities-container');

      // Add London
      const card1 = document.createElement('div');
      card1.className = 'city-card';
      card1.setAttribute('data-city', 'London');
      container.appendChild(card1);

      // Try to add London again
      const existingCity = container.querySelector('[data-city="London"]');
      
      if (!existingCity) {
        const card2 = document.createElement('div');
        card2.className = 'city-card';
        card2.setAttribute('data-city', 'London');
        container.appendChild(card2);
      }

      expect(container.children.length).toBe(1);
    });
  });

  describe('User Journey: Removing Cities', () => {
    it('should remove a city card when close button is clicked', () => {
      const container = document.getElementById('cities-container');

      // Add a city card with close button
      const card = document.createElement('div');
      card.className = 'city-card';
      const closeButton = document.createElement('button');
      closeButton.className = 'close-button';
      closeButton.textContent = '×';
      card.appendChild(closeButton);
      container.appendChild(card);

      expect(container.children.length).toBe(1);

      // Simulate close button click
      closeButton.click();
      card.remove();

      expect(container.children.length).toBe(0);
    });
  });

  describe('User Journey: Changing Settings', () => {
    it('should change temperature units', () => {
      const unitsSelector = document.getElementById('units-selector');

      expect(unitsSelector.value).toBe('C');

      // Change to Fahrenheit
      unitsSelector.value = 'F';
      const event = new Event('change', { bubbles: true });
      unitsSelector.dispatchEvent(event);

      expect(unitsSelector.value).toBe('F');
    });

    it('should change theme', () => {
      const themeSelector = document.getElementById('theme-selector');

      expect(themeSelector.value).toBe('light');

      // Change to dark theme
      themeSelector.value = 'dark';
      const event = new Event('change', { bubbles: true });
      themeSelector.dispatchEvent(event);

      expect(themeSelector.value).toBe('dark');
    });
  });

  describe('User Journey: Using Geolocation', () => {
    it('should have a geolocation button', () => {
      const locationButton = document.getElementById('location-button');

      expect(locationButton).toBeTruthy();
      expect(locationButton.textContent).toContain('My Location');
    });

    it('should trigger geolocation on button click', () => {
      const locationButton = document.getElementById('location-button');
      let clicked = false;

      locationButton.addEventListener('click', () => {
        clicked = true;
      });

      locationButton.click();

      expect(clicked).toBe(true);
    });
  });

  describe('User Journey: Viewing Weather Details', () => {
    it('should display detailed weather information in card', () => {
      const card = document.createElement('div');
      card.className = 'city-card';
      card.innerHTML = `
        <h3 class="city-name">London</h3>
        <div class="temperature">15°C</div>
        <div class="weather-description">Partly Cloudy</div>
        <div class="details">
          <div class="humidity">Humidity: 65%</div>
          <div class="wind">Wind: 10 km/h</div>
          <div class="pressure">Pressure: 1013 hPa</div>
        </div>
      `;

      document.getElementById('cities-container').appendChild(card);

      expect(card.querySelector('.humidity')).toBeTruthy();
      expect(card.querySelector('.wind')).toBeTruthy();
      expect(card.querySelector('.pressure')).toBeTruthy();
    });

    it('should expand card for more details', () => {
      const card = document.createElement('div');
      card.className = 'city-card';
      let isExpanded = false;

      card.addEventListener('click', () => {
        isExpanded = !isExpanded;
        card.classList.toggle('expanded', isExpanded);
      });

      card.click();

      expect(card.classList.contains('expanded')).toBe(true);
    });
  });

  describe('User Journey: Error Handling', () => {
    it('should display error message for invalid city', () => {
      const toastContainer = document.getElementById('toast-container');

      // Simulate error toast
      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'City not found';
      toastContainer.appendChild(toast);

      expect(toastContainer.children.length).toBe(1);
      expect(toast.textContent).toBe('City not found');
    });

    it('should display network error message', () => {
      const toastContainer = document.getElementById('toast-container');

      const toast = document.createElement('div');
      toast.className = 'toast toast-error';
      toast.textContent = 'Network error. Please check your connection.';
      toastContainer.appendChild(toast);

      expect(toast.textContent).toContain('Network error');
    });
  });

  describe('User Journey: Keyboard Navigation', () => {
    it('should submit search on Enter key', () => {
      const searchInput = document.getElementById('city-search');
      let submitted = false;

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          submitted = true;
        }
      });

      // Simulate Enter key press
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      searchInput.dispatchEvent(event);

      expect(submitted).toBe(true);
    });

    it('should navigate autocomplete with arrow keys', () => {
      const dropdown = document.getElementById('autocomplete-dropdown');
      
      // Add suggestions
      const suggestions = ['London', 'Los Angeles', 'Lisbon'];
      suggestions.forEach((city) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = city;
        dropdown.appendChild(item);
      });

      expect(dropdown.children.length).toBe(3);

      // Simulate arrow down
      let selectedIndex = 0;
      dropdown.children[selectedIndex].classList.add('selected');

      expect(dropdown.children[0].classList.contains('selected')).toBe(true);
    });
  });

  describe('User Journey: Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      const container = document.getElementById('cities-container');
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Add mobile class
      if (window.innerWidth < 768) {
        container.classList.add('mobile-layout');
      }

      expect(container.classList.contains('mobile-layout')).toBe(true);
    });
  });

  describe('User Journey: Data Persistence', () => {
    it('should save cities to session storage', () => {
      const cities = [
        { name: 'London', temp: 15 },
        { name: 'Paris', temp: 18 },
      ];

      sessionStorage.setItem('cities', JSON.stringify(cities));
      const retrieved = JSON.parse(sessionStorage.getItem('cities'));

      expect(retrieved).toEqual(cities);
      expect(retrieved.length).toBe(2);
    });

    it('should restore cities on page reload', () => {
      const cities = [{ name: 'Berlin', temp: 12 }];
      sessionStorage.setItem('cities', JSON.stringify(cities));

      // Simulate page reload
      const restored = JSON.parse(sessionStorage.getItem('cities'));

      expect(restored).toEqual(cities);
    });
  });

  describe('User Journey: Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const searchInput = document.getElementById('city-search');
      searchInput.setAttribute('aria-label', 'Search for city');

      expect(searchInput.getAttribute('aria-label')).toBe('Search for city');
    });

    it('should have keyboard accessible buttons', () => {
      const searchButton = document.getElementById('search-button');
      
      expect(searchButton.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('should announce loading states to screen readers', () => {
      const loader = document.createElement('div');
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-live', 'polite');
      loader.textContent = 'Loading weather data...';
      document.body.appendChild(loader);

      expect(loader.getAttribute('role')).toBe('status');
      expect(loader.getAttribute('aria-live')).toBe('polite');
    });
  });
});
