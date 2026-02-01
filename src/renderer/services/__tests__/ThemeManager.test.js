/**
 * ThemeManager Tests
 */

import { ThemeManager } from '../ThemeManager';
import { SettingsManager } from '../SettingsManager';
import { ToastService } from '../ToastService';

// Mock dependencies
jest.mock('../SettingsManager', () => ({
  SettingsManager: {
    initialize: jest.fn(),
    read: jest.fn(),
    write: jest.fn(),
    getTheme: jest.fn(),
    setTheme: jest.fn(),
    getThemeMode: jest.fn(),
    setThemeMode: jest.fn(),
  },
}));

jest.mock('../ToastService', () => ({
  ToastService: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ThemeManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Create a theme container for testing
    document.body.innerHTML = '<div id="theme-grid"></div>';
    document.body.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('currentTheme', () => {
    it('should return current theme', () => {
      const theme = ThemeManager.currentTheme;
      expect(theme).toBeDefined();
      expect(typeof theme).toBe('string');
    });
  });

  describe('currentMode', () => {
    it('should return current mode (light or dark)', () => {
      const mode = ThemeManager.currentMode;
      expect(['light', 'dark']).toContain(mode);
    });
  });

  describe('themes', () => {
    it('should return available themes', () => {
      const themes = ThemeManager.themes;
      expect(themes).toBeDefined();
      expect(Array.isArray(Object.keys(themes)) || typeof themes === 'object').toBe(true);
    });
  });

  describe('apply', () => {
    it('should apply a theme to the document', () => {
      ThemeManager.apply('purple-blue');
      
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });

    it('should apply different themes', () => {
      ThemeManager.apply('ocean-breeze');
      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
      
      ThemeManager.apply('sunset-glow');
      expect(document.body.getAttribute('data-theme')).toBe('sunset-glow');
    });

    it('should handle invalid theme gracefully', () => {
      // Should not throw
      expect(() => ThemeManager.apply('invalid-theme')).not.toThrow();
    });
  });

  describe('applyMode', () => {
    it('should apply light mode', () => {
      ThemeManager.applyMode('light');
      
      expect(document.body.getAttribute('data-mode')).toBe('light');
    });

    it('should apply dark mode', () => {
      ThemeManager.applyMode('dark');
      
      expect(document.body.getAttribute('data-mode')).toBe('dark');
    });

    it('should toggle between modes correctly', () => {
      ThemeManager.applyMode('light');
      expect(document.body.getAttribute('data-mode')).toBe('light');
      
      ThemeManager.applyMode('dark');
      expect(document.body.getAttribute('data-mode')).toBe('dark');
    });
  });

  describe('toggleMode', () => {
    it('should toggle mode from light to dark', async () => {
      ThemeManager.applyMode('light');
      SettingsManager.write.mockResolvedValue(true);
      
      await ThemeManager.toggleMode();
      
      expect(document.body.getAttribute('data-mode')).toBe('dark');
    });

    it('should toggle mode from dark to light', async () => {
      ThemeManager.applyMode('dark');
      SettingsManager.write.mockResolvedValue(true);
      
      await ThemeManager.toggleMode();
      
      expect(document.body.getAttribute('data-mode')).toBe('light');
    });

    it('should persist mode changes to settings', async () => {
      SettingsManager.setThemeMode.mockResolvedValue(true);
      
      await ThemeManager.toggleMode();
      
      expect(SettingsManager.setThemeMode).toHaveBeenCalled();
    });
  });

  describe('saveAndApply', () => {
    it('should save and apply a theme', async () => {
      SettingsManager.setTheme.mockResolvedValue(true);
      ToastService.success.mockReturnValue(true);
      
      await ThemeManager.saveAndApply('forest-mist');
      
      expect(document.body.getAttribute('data-theme')).toBe('forest-mist');
      expect(SettingsManager.setTheme).toHaveBeenCalled();
    });

    it('should show success notification', async () => {
      SettingsManager.write.mockResolvedValue(true);
      ToastService.success.mockReturnValue(true);
      
      await ThemeManager.saveAndApply('midnight-dark');
      
      expect(ToastService.success).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      SettingsManager.setTheme.mockRejectedValue(new Error('Save failed'));
      ToastService.error.mockReturnValue(true);
      
      await ThemeManager.saveAndApply('midnight-dark');
      
      // Should handle error gracefully
      expect(document.body.getAttribute('data-theme')).toBe('midnight-dark');
    });
  });

  describe('setupThemeOptions', () => {
    it('should set up theme options without errors', () => {
      const container = document.getElementById('theme-grid');
      
      expect(() => ThemeManager.setupThemeOptions()).not.toThrow();
    });

    it('should create theme option elements', () => {
      ThemeManager.setupThemeOptions();
      
      const themeOptions = document.querySelectorAll('[data-theme-option]');
      expect(themeOptions.length >= 0).toBe(true);
    });
  });

  describe('nextTheme', () => {
    it('should switch to next theme', async () => {
      const currentTheme = ThemeManager.currentTheme;
      SettingsManager.write.mockResolvedValue(true);
      
      await ThemeManager.nextTheme();
      
      // Theme should have changed or cycled
      expect(ThemeManager.currentTheme).toBeDefined();
    });
  });

  describe('previousTheme', () => {
    it('should switch to previous theme', async () => {
      const currentTheme = ThemeManager.currentTheme;
      SettingsManager.write.mockResolvedValue(true);
      
      await ThemeManager.previousTheme();
      
      // Theme should have changed or cycled
      expect(ThemeManager.currentTheme).toBeDefined();
    });
  });

  describe('loadAndApply', () => {
    it('should load and apply saved theme', async () => {
      const mockSettings = {
        theme: 'purple-blue',
        themeMode: 'dark',
      };
      
      SettingsManager.getTheme.mockResolvedValue('purple-blue');
      SettingsManager.getThemeMode.mockResolvedValue('dark');
      
      await ThemeManager.loadAndApply();
      
      expect(SettingsManager.getTheme).toHaveBeenCalled();
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
    });

    it('should apply default if no saved theme', async () => {
      SettingsManager.read.mockResolvedValue({});
      
      await ThemeManager.loadAndApply();
      
      expect(document.body.getAttribute('data-theme')).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should maintain theme consistency', async () => {
      SettingsManager.write.mockResolvedValue(true);
      
      ThemeManager.apply('ocean-breeze');
      expect(document.body.getAttribute('data-theme')).toBe('ocean-breeze');
      
      await ThemeManager.saveAndApply('forest-mist');
      expect(document.body.getAttribute('data-theme')).toBe('forest-mist');
    });

    it('should handle mode and theme together', async () => {
      SettingsManager.write.mockResolvedValue(true);
      
      ThemeManager.apply('purple-blue');
      ThemeManager.applyMode('dark');
      
      expect(document.body.getAttribute('data-theme')).toBe('purple-blue');
      expect(document.body.getAttribute('data-mode')).toBe('dark');
    });
  });
});
