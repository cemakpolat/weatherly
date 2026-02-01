import '@testing-library/jest-dom'; // Import jest-dom for better assertions
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder and TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure JSDOM to not load external resources
const { ResourceLoader } = require('jsdom');
class NoOpResourceLoader extends ResourceLoader {
  fetch() {
    return Promise.resolve(null);
  }
}
global.resourceLoader = new NoOpResourceLoader();

// Suppress JSDOM errors about loading external resources
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Error: Could not load') ||
     message.includes('Encoding not recognized') ||
     message.includes('Cannot log after tests are done'))
  ) {
    return; // Suppress these errors
  }
  originalConsoleError(...args);
};

// Suppress all console outputs during tests to avoid clutter
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Mock Electron's ipcRenderer
jest.mock('electron', () => {
  return {
    ipcRenderer: {
      send: jest.fn(),
      on: jest.fn(), // Mock the 'on' method
      removeListener: jest.fn(), // Mock the 'removeListener' method
    },
    contextBridge: {
      exposeInMainWorld: jest.fn(),
    },
  };
});

// Mock fetch API - You can use a more sophisticated mocking library if needed
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [] }), // Default mock response
  })
);

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};

  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// (No polyfills for CSSStyleDeclaration.background — keep JSDOM defaults)
