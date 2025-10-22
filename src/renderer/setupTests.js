import '@testing-library/jest-dom'; // Import jest-dom for better assertions
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder and TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
