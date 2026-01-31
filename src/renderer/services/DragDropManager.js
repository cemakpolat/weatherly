/**
 * DragDropManager - Single Responsibility: Handle drag and drop operations
 * 
 * This service manages drag and drop functionality for city cards.
 * It follows the Single Responsibility Principle by focusing solely on
 * drag and drop operations.
 */
export class DragDropManager {
  static #draggedCard = null;
  static #draggedIndex = null;
  static #container = null;
  static #onReorderCallback = null;

  /**
   * Initializes the drag and drop manager.
   * @param {HTMLElement} container - The container element for draggable items.
   * @param {Function} onReorderCallback - Callback when items are reordered.
   */
  static initialize(container, onReorderCallback) {
    DragDropManager.#container = container;
    DragDropManager.#onReorderCallback = onReorderCallback;
  }

  /**
   * Sets up drag and drop event listeners for a card.
   * @param {HTMLElement} card - The card element to make draggable.
   */
  static setupCard(card) {
    card.setAttribute('draggable', 'true');

    // Drag start
    card.addEventListener('dragstart', e => {
      DragDropManager.#handleDragStart(card, e);
    });

    // Drag end
    card.addEventListener('dragend', () => {
      DragDropManager.#handleDragEnd(card);
    });

    // Drag over
    card.addEventListener('dragover', e => {
      DragDropManager.#handleDragOver(card, e);
    });

    // Drop
    card.addEventListener('drop', e => {
      DragDropManager.#handleDrop(e);
    });
  }

  /**
   * Handles drag start event.
   * @private
   */
  static #handleDragStart(card, e) {
    DragDropManager.#draggedCard = card;
    DragDropManager.#draggedIndex = Array.from(
      DragDropManager.#container.children
    ).indexOf(card);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', card.innerHTML);
  }

  /**
   * Handles drag end event.
   * @private
   */
  static #handleDragEnd(card) {
    card.classList.remove('dragging');
    DragDropManager.#draggedCard = null;
    DragDropManager.#draggedIndex = null;
  }

  /**
   * Handles drag over event.
   * @private
   */
  static #handleDragOver(card, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (DragDropManager.#draggedCard && DragDropManager.#draggedCard !== card) {
      const cards = Array.from(DragDropManager.#container.children);
      const currentIndex = cards.indexOf(card);

      if (DragDropManager.#draggedIndex < currentIndex) {
        // Insert after current card
        DragDropManager.#container.insertBefore(
          DragDropManager.#draggedCard,
          card.nextSibling
        );
      } else {
        // Insert before current card
        DragDropManager.#container.insertBefore(DragDropManager.#draggedCard, card);
      }

      DragDropManager.#draggedIndex = cards.indexOf(DragDropManager.#draggedCard);
    }
  }

  /**
   * Handles drop event.
   * @private
   */
  static #handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    // Trigger reorder callback
    if (DragDropManager.#onReorderCallback) {
      DragDropManager.#onReorderCallback();
    }
  }

  /**
   * Gets the current order of cards.
   * @returns {Array} - Array of card data in current order.
   */
  static getCurrentOrder() {
    if (!DragDropManager.#container) return [];

    return Array.from(DragDropManager.#container.children).map(card => ({
      name: card.getAttribute('data-city-name'),
      element: card,
    }));
  }

  /**
   * Disables drag and drop for a specific card.
   * @param {HTMLElement} card - The card element.
   */
  static disableCard(card) {
    card.setAttribute('draggable', 'false');
  }

  /**
   * Enables drag and drop for a specific card.
   * @param {HTMLElement} card - The card element.
   */
  static enableCard(card) {
    card.setAttribute('draggable', 'true');
  }

  /**
   * Checks if a drag operation is in progress.
   * @returns {boolean} - True if dragging.
   */
  static isDragging() {
    return DragDropManager.#draggedCard !== null;
  }
}

export default DragDropManager;
