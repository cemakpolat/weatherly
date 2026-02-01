/**
 * ToastService - Single Responsibility: Handle all toast notification operations
 * 
 * This service manages the display of toast notifications. It follows the
 * Single Responsibility Principle by focusing solely on notification display.
 * 
 * Types: 'success', 'error', 'warning', 'info'
 */
export class ToastService {
  static #container = null;
  static #defaultDuration = 3000;

  /**
   * Initializes the toast container. Must be called before showing toasts.
   * @param {string} containerId - The ID of the container element.
   */
  static initialize(containerId = 'toast-container') {
    ToastService.#container = document.getElementById(containerId);
    if (!ToastService.#container) {
      console.warn(`Toast container with id "${containerId}" not found. Creating one.`);
      ToastService.#container = document.createElement('div');
      ToastService.#container.id = containerId;
      ToastService.#container.className = 'toast-container';
      document.body.appendChild(ToastService.#container);
    }
  }

  /**
   * Gets the toast container, initializing if necessary.
   * @returns {HTMLElement} The toast container element.
   */
  static #getContainer() {
    if (!ToastService.#container || !document.body.contains(ToastService.#container)) {
      ToastService.initialize();
    }
    return ToastService.#container;
  }

  /**
   * Shows a toast notification message.
   * @param {string} message - The message to display.
   * @param {string} type - The type of toast (success, error, warning, info).
   * @param {number} duration - How long to show the toast in milliseconds.
   * @returns {string} - The toast ID for programmatic removal if needed.
   */
  static show(message, type = 'info', duration = ToastService.#defaultDuration) {
    const container = ToastService.#getContainer();
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <div class="toast-body">
        ${message}
      </div>
    `;

    container.appendChild(toast);

    // Auto-remove toast after duration
    setTimeout(() => {
      ToastService.dismiss(toastId);
    }, duration);

    return toastId;
  }

  /**
   * Dismisses a toast by its ID.
   * @param {string} toastId - The ID of the toast to dismiss.
   */
  static dismiss(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }

  /**
   * Shows a success toast.
   * @param {string} message - The message to display.
   * @param {number} duration - How long to show the toast.
   */
  static success(message, duration = ToastService.#defaultDuration) {
    return ToastService.show(message, 'success', duration);
  }

  /**
   * Shows an error toast.
   * @param {string} message - The message to display.
   * @param {number} duration - How long to show the toast.
   */
  static error(message, duration = ToastService.#defaultDuration) {
    return ToastService.show(message, 'error', duration);
  }

  /**
   * Shows a warning toast.
   * @param {string} message - The message to display.
   * @param {number} duration - How long to show the toast.
   */
  static warning(message, duration = ToastService.#defaultDuration) {
    return ToastService.show(message, 'warning', duration);
  }

  /**
   * Shows an info toast.
   * @param {string} message - The message to display.
   * @param {number} duration - How long to show the toast.
   */
  static info(message, duration = ToastService.#defaultDuration) {
    return ToastService.show(message, 'info', duration);
  }

  /**
   * Clears all visible toasts.
   */
  static clearAll() {
    const container = ToastService.#getContainer();
    if (container) {
      container.innerHTML = '';
    }
  }
}

export default ToastService;
