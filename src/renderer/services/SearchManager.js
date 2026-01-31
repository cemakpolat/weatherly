/**
 * SearchManager - Single Responsibility: Handle search and autocomplete operations
 * 
 * This service manages city search and autocomplete functionality.
 * It follows the Single Responsibility Principle by focusing solely on
 * search-related operations.
 */
import { StorageService } from './StorageService.js';
import { ToastService } from './ToastService.js';
import { GEOCODING_API_URL, DEFAULT_LANGUAGE } from '../utils/constants.js';

export class SearchManager {
  static #selectedIndex = -1;
  static #lastSearchTerm = '';
  static #debounceTimer = null;
  static #autocompleteDropdown = null;
  static #searchInput = null;
  static #onSearchCallback = null;

  /**
   * Initializes the search manager with DOM elements.
   * @param {HTMLElement} searchInput - The search input element.
   * @param {HTMLElement} autocompleteDropdown - The autocomplete dropdown element.
   * @param {Function} onSearchCallback - Callback function when search is performed.
   */
  static initialize(searchInput, autocompleteDropdown, onSearchCallback) {
    SearchManager.#searchInput = searchInput;
    SearchManager.#autocompleteDropdown = autocompleteDropdown;
    SearchManager.#onSearchCallback = onSearchCallback;
    SearchManager.#setupEventListeners();
  }

  /**
   * Sets up event listeners for search functionality.
   * @private
   */
  static #setupEventListeners() {
    if (!SearchManager.#searchInput) return;

    // Keyboard navigation
    SearchManager.#searchInput.addEventListener('keydown', e => {
      SearchManager.#handleKeydown(e);
    });

    // Input for autocomplete
    SearchManager.#searchInput.addEventListener('input', e => {
      SearchManager.#handleInput(e);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      if (
        SearchManager.#searchInput &&
        SearchManager.#autocompleteDropdown &&
        !SearchManager.#searchInput.contains(e.target) &&
        !SearchManager.#autocompleteDropdown.contains(e.target)
      ) {
        SearchManager.#autocompleteDropdown.style.display = 'none';
      }
    });
  }

  /**
   * Handles keydown events for search input.
   * @private
   */
  static #handleKeydown(e) {
    const suggestions = SearchManager.#autocompleteDropdown?.querySelectorAll('.dropdown-item');
    if (!suggestions) return;

    if (e.key === 'ArrowDown') {
      SearchManager.#selectedIndex = Math.min(
        SearchManager.#selectedIndex + 1,
        suggestions.length - 1
      );
      SearchManager.#updateSelectedSuggestion(suggestions);
    } else if (e.key === 'ArrowUp') {
      SearchManager.#selectedIndex = Math.max(SearchManager.#selectedIndex - 1, -1);
      SearchManager.#updateSelectedSuggestion(suggestions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (SearchManager.#selectedIndex >= 0 && suggestions[SearchManager.#selectedIndex]) {
        const selectedCity = suggestions[SearchManager.#selectedIndex].textContent.split(',')[0];
        SearchManager.#searchInput.value = selectedCity;
        SearchManager.#autocompleteDropdown.style.display = 'none';
        SearchManager.search();
      } else {
        SearchManager.search();
      }
    } else if (e.key === 'Escape') {
      SearchManager.#autocompleteDropdown.style.display = 'none';
    }
  }

  /**
   * Handles input events for autocomplete.
   * @private
   */
  static #handleInput(e) {
    clearTimeout(SearchManager.#debounceTimer);
    SearchManager.#debounceTimer = setTimeout(() => {
      const input = e.target.value.trim();
      if (input) {
        SearchManager.showAutocompleteSuggestions(input);
      } else {
        SearchManager.#autocompleteDropdown.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Updates the visual state of selected suggestion.
   * @private
   */
  static #updateSelectedSuggestion(suggestions) {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle('selected', index === SearchManager.#selectedIndex);
      suggestion.setAttribute('aria-selected', index === SearchManager.#selectedIndex);
    });

    if (SearchManager.#selectedIndex >= 0 && suggestions[SearchManager.#selectedIndex]) {
      suggestions[SearchManager.#selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  /**
   * Shows autocomplete suggestions based on input.
   * @param {string} input - The input string.
   */
  static showAutocompleteSuggestions(input) {
    const cities = StorageService.get('cities') || [];
    const filteredCities = cities.filter(city =>
      city.name.toLowerCase().includes(input.toLowerCase())
    );

    SearchManager.#autocompleteDropdown.innerHTML = '';
    SearchManager.#selectedIndex = -1;

    filteredCities.forEach((city, index) => {
      const suggestion = document.createElement('div');
      suggestion.className = `dropdown-item ${index === SearchManager.#selectedIndex ? 'selected' : ''}`;
      suggestion.textContent = `${city.name}, ${city.country}`;
      suggestion.setAttribute('role', 'option');
      suggestion.setAttribute('aria-selected', index === SearchManager.#selectedIndex);
      suggestion.addEventListener('click', () => {
        SearchManager.#searchInput.value = city.name;
        SearchManager.#autocompleteDropdown.style.display = 'none';
        SearchManager.search();
      });
      SearchManager.#autocompleteDropdown.appendChild(suggestion);
    });

    SearchManager.#autocompleteDropdown.style.display = filteredCities.length > 0 ? 'block' : 'none';
  }

  /**
   * Performs a city search.
   * @returns {Promise<string|null>} - The search term if valid, null otherwise.
   */
  static async search() {
    const city = SearchManager.#searchInput?.value.trim();
    
    if (!city || city === SearchManager.#lastSearchTerm) {
      return null;
    }

    SearchManager.#lastSearchTerm = city;

    if (SearchManager.#onSearchCallback) {
      await SearchManager.#onSearchCallback(city);
    }

    SearchManager.#lastSearchTerm = '';
    return city;
  }

  /**
   * Adds a city to session storage if not already present.
   * @param {string} cityName - The city name.
   */
  static async addCityToStorage(cityName) {
    const cities = StorageService.get('cities') || [];
    const cityExists = cities.some(c => c.name.toLowerCase() === cityName.toLowerCase());

    if (!cityExists) {
      try {
        const response = await fetch(
          `${GEOCODING_API_URL}?name=${cityName}&count=1&language=${DEFAULT_LANGUAGE}&format=json`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const newCity = {
            name: data.results[0].name,
            country: data.results[0].country,
          };
          cities.push(newCity);
          StorageService.save('cities', cities);
        }
      } catch (error) {
        console.error('Error fetching city:', error);
      }
    }
  }

  /**
   * Clears the search input.
   */
  static clearInput() {
    if (SearchManager.#searchInput) {
      SearchManager.#searchInput.value = '';
    }
  }

  /**
   * Focuses the search input.
   */
  static focus() {
    if (SearchManager.#searchInput) {
      SearchManager.#searchInput.focus();
      SearchManager.#searchInput.select();
    }
  }

  /**
   * Gets the current search value.
   * @returns {string} - The current search value.
   */
  static getValue() {
    return SearchManager.#searchInput?.value.trim() || '';
  }

  /**
   * Resets the search state.
   */
  static reset() {
    SearchManager.#selectedIndex = -1;
    SearchManager.#lastSearchTerm = '';
    if (SearchManager.#autocompleteDropdown) {
      SearchManager.#autocompleteDropdown.style.display = 'none';
    }
  }
}

export default SearchManager;
