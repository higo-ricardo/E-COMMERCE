// HIVERCAR - tests/setup.js
// Setup global para testes com Jest (jsdom environment)

beforeEach(() => {
  // Limpar localStorage antes de cada teste
  localStorage.clear();
  sessionStorage.clear();

  // Limpar document.body
  document.body.innerHTML = "";

  // Reset mocks
  if (global.mockFetch) {
    global.mockFetch.mockReset();
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});
