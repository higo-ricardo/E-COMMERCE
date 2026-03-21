// ─── HIVERCAR · tests/setup.js ───────────────────────────────────────────────
// Setup global executado antes de cada arquivo de teste.
//
// Com environment:"jsdom" no vitest.config.js, localStorage já existe nativamente.
// Este arquivo apenas garante que o localStorage é limpo antes de cada teste,
// evitando vazamento de estado entre testes do cartService.

beforeEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear()
  }
})
