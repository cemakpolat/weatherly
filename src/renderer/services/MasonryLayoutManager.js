/**
 * MasonryLayoutManager - Single Responsibility: Handle masonry grid layout
 * 
 * This service manages the masonry layout for city cards.
 * It follows the Single Responsibility Principle by focusing solely on
 * layout calculations and positioning.
 */
export class MasonryLayoutManager {
  static #columnGap = 12;
  static #cardWidth = 320;
  static #container = null;
  static #resizeTimeout = null;

  /**
   * Initializes the masonry layout manager.
   * @param {HTMLElement|string} container - The container element or its ID.
   * @param {object} options - Layout options.
   */
  static initialize(container, options = {}) {
    if (typeof container === 'string') {
      MasonryLayoutManager.#container = document.getElementById(container);
    } else {
      MasonryLayoutManager.#container = container;
    }

    if (options.columnGap !== undefined) {
      MasonryLayoutManager.#columnGap = options.columnGap;
    }
    if (options.cardWidth !== undefined) {
      MasonryLayoutManager.#cardWidth = options.cardWidth;
    }

    // Set up resize listener
    MasonryLayoutManager.#setupResizeListener();
  }

  /**
   * Sets up window resize listener for responsive layout.
   * @private
   */
  static #setupResizeListener() {
    window.addEventListener('resize', () => {
      clearTimeout(MasonryLayoutManager.#resizeTimeout);
      MasonryLayoutManager.#resizeTimeout = setTimeout(() => {
        MasonryLayoutManager.apply();
      }, 250);
    });
  }

  /**
   * Calculates the number of columns based on container width.
   * @returns {number} - Number of columns.
   */
  static #calculateColumns() {
    const containerWidth = MasonryLayoutManager.#container?.offsetWidth || 0;
    return Math.max(
      1,
      Math.floor(
        (containerWidth + MasonryLayoutManager.#columnGap) /
          (MasonryLayoutManager.#cardWidth + MasonryLayoutManager.#columnGap)
      )
    );
  }

  /**
   * Applies masonry layout to the container.
   */
  static apply() {
    const container = MasonryLayoutManager.#container;
    if (!container) {
      console.warn('[Masonry] Container not initialized');
      return;
    }

    const items = Array.from(container.querySelectorAll('.col'));
    console.log(`[Masonry] Applying layout with ${items.length} items`);

    if (items.length === 0) {
      container.style.height = '0px';
      console.log('[Masonry] No items to layout, setting height to 0');
      return;
    }

    // Calculate layout dimensions
    const containerWidth = container.offsetWidth;
    const numColumns = MasonryLayoutManager.#calculateColumns();
    const columnGap = MasonryLayoutManager.#columnGap;
    const cardWidth = MasonryLayoutManager.#cardWidth;

    console.log(`[Masonry] Container width: ${containerWidth}px, Columns: ${numColumns}`);

    // Calculate total grid width and centering offset
    const gridWidth = numColumns * cardWidth + (numColumns - 1) * columnGap;
    const leftOffset = Math.max(0, (containerWidth - gridWidth) / 2);

    console.log(`[Masonry] Grid width: ${gridWidth}px, Left offset: ${leftOffset}px`);

    // Create column height trackers
    const columnHeights = new Array(numColumns).fill(0);

    // Position each item
    items.forEach((item, index) => {
      // Ensure item is visible
      item.style.opacity = '1';

      // Find shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

      // Calculate position with centering offset
      const x = leftOffset + shortestColumn * (cardWidth + columnGap);
      const y = columnHeights[shortestColumn];

      // Apply position
      item.style.position = 'absolute';
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.width = `${cardWidth}px`;
      item.style.transition = 'top 0.3s ease, left 0.3s ease, opacity 0.3s ease';

      if (index === 0) {
        console.log(
          `[Masonry] First card positioned at (${x}, ${y}), height: ${item.offsetHeight}px`
        );
      }

      // Update column height
      columnHeights[shortestColumn] += item.offsetHeight + columnGap;
    });

    // Set container height
    const maxHeight = Math.max(...columnHeights);
    container.style.height = `${maxHeight}px`;
    container.style.position = 'relative';

    console.log(
      `[Masonry] Layout complete. Container height: ${maxHeight}px, Column heights:`,
      columnHeights
    );
  }

  /**
   * Schedules a layout update with a delay.
   * @param {number} delay - Delay in milliseconds.
   */
  static scheduleUpdate(delay = 100) {
    setTimeout(() => {
      MasonryLayoutManager.apply();
    }, delay);
  }

  /**
   * Updates layout options.
   * @param {object} options - New layout options.
   */
  static setOptions(options = {}) {
    if (options.columnGap !== undefined) {
      MasonryLayoutManager.#columnGap = options.columnGap;
    }
    if (options.cardWidth !== undefined) {
      MasonryLayoutManager.#cardWidth = options.cardWidth;
    }
    MasonryLayoutManager.apply();
  }

  /**
   * Gets the current layout metrics.
   * @returns {object} - Current layout metrics.
   */
  static getMetrics() {
    return {
      columnGap: MasonryLayoutManager.#columnGap,
      cardWidth: MasonryLayoutManager.#cardWidth,
      columns: MasonryLayoutManager.#calculateColumns(),
      containerWidth: MasonryLayoutManager.#container?.offsetWidth || 0,
    };
  }
}

export default MasonryLayoutManager;
