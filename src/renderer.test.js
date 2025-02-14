const { render } = require('@testing-library/electron');
const { ipcRenderer } = require('electron');
const { fetchJson, saveToSessionStorage, getFromSessionStorage } = require('../renderer');

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [{ name: 'Tokyo', country: 'Japan' }] }),
  })
);

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
global.sessionStorage = sessionStorageMock;

describe('Renderer Functions', () => {
  test('fetchJson should fetch data from a URL', async () => {
    const data = await fetchJson('https://example.com/api');
    expect(fetch).toHaveBeenCalledWith('https://example.com/api');
    expect(data).toEqual({ results: [{ name: 'Tokyo', country: 'Japan' }] });
  });

  test('saveToSessionStorage should save data to sessionStorage', () => {
    saveToSessionStorage('testKey', { foo: 'bar' });
    expect(sessionStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ foo: 'bar' }));
  });

  test('getFromSessionStorage should retrieve data from sessionStorage', () => {
    sessionStorage.getItem.mockReturnValueOnce(JSON.stringify({ foo: 'bar' }));
    const data = getFromSessionStorage('testKey');
    expect(data).toEqual({ foo: 'bar' });
  });
});