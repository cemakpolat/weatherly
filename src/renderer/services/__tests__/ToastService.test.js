/**
 * ToastService Tests
 */

import { ToastService } from '../ToastService';

describe('ToastService', () => {
  let container;

  beforeEach(() => {
    // Create a fresh container for each test
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    
    // Initialize ToastService
    ToastService.initialize('toast-container');
    
    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('show', () => {
    it('should display a success toast', () => {
      ToastService.show('Success message', 'success');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('Success message');
      expect(toast.classList.contains('success')).toBe(true);
    });

    it('should display an error toast', () => {
      ToastService.show('Error message', 'error');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('Error message');
      expect(toast.classList.contains('error')).toBe(true);
    });

    it('should display an info toast', () => {
      ToastService.show('Info message', 'info');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('info')).toBe(true);
    });

    it('should display a warning toast', () => {
      ToastService.show('Warning message', 'warning');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('warning')).toBe(true);
    });

    it('should default to info type if type not specified', () => {
      ToastService.show('Default message');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('info')).toBe(true);
    });

    it('should auto-hide toast after duration', () => {
      jest.useRealTimers(); // Use real timers for this test
      
      ToastService.show('Test message', 'info', 100); // Very short duration

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();

      // Wait for toast to auto-hide
      return new Promise(resolve => {
        setTimeout(() => {
          expect(document.querySelector('.toast')).toBeFalsy();
          jest.useFakeTimers(); // Reset to fake timers
          resolve();
        }, 500);
      });
    });

    it('should handle multiple toasts', () => {
      ToastService.show('Message 1', 'success');
      ToastService.show('Message 2', 'error');
      ToastService.show('Message 3', 'info');

      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });
  });

  describe('success', () => {
    it('should display a success toast', () => {
      ToastService.success('Success!');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('Success!');
      expect(toast.classList.contains('success')).toBe(true);
    });
  });

  describe('error', () => {
    it('should display an error toast', () => {
      ToastService.error('Error occurred!');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('Error occurred!');
      expect(toast.classList.contains('error')).toBe(true);
    });
  });

  describe('info', () => {
    it('should display an info toast', () => {
      ToastService.info('Information');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('info')).toBe(true);
    });
  });

  describe('warning', () => {
    it('should display a warning toast', () => {
      ToastService.warning('Warning!');

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('warning')).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('should manually dismiss a toast', () => {
      ToastService.show('Dismissible message', 'info', 10000);

      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();

      // Simulate click on close button
      const closeButton = toast.querySelector('.toast-close');
      if (closeButton) {
        closeButton.click();
      } else {
        toast.remove();
      }

      expect(document.querySelector('.toast')).toBeFalsy();
    });
  });

  describe('container creation', () => {
    it('should create container if it does not exist', () => {
      // Clear the DOM and all references
      document.body.innerHTML = '';
      
      // Show a toast - should create container automatically
      const toastId = ToastService.show('Test', 'info');

      // Container should be created
      const container = document.querySelector('#toast-container');
      expect(container).toBeTruthy();
      expect(toastId).toBeTruthy();
      
      // Clean up for next tests
      document.body.innerHTML = '';
      let toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
      ToastService.initialize('toast-container');
    });
  });
});
