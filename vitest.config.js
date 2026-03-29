// â”€â”€â”€ HIVERCAR Â· vitest.config.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// US-26: ConfiguraÃ§Ã£o do Vitest com cobertura mÃ­nima 70% em Domain + Infrastructure.
//
// Ambiente jsdom (global) para todos os testes â€” necessÃ¡rio porque cartService.js
// usa localStorage. ServiÃ§os que nÃ£o precisam de DOM nÃ£o sÃ£o afetados por isso.
//
// Sprint 05: + taxEngine.js (US-44), + nfService.js (US-43)

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // jsdom emula localStorage, window, document para todos os testes.
    // cartService.test.js e orderService.test.js dependem de localStorage.
    environment: "jsdom",

    // Setup global executado antes de cada arquivo de teste.
    setupFiles: ["./tests/setup.js"],

    // Glob de arquivos de teste
    include: ["tests/**/*.test.js"],

    // Globals: permite describe/it/expect sem import (comportamento Jest-like)
    globals: true,

    // â”€â”€ Cobertura â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",

      // Thresholds mÃ­nimos â€” US-26 Task 6: 70%
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   70,
        statements: 70,
      },

      // Arquivos que entram na contagem de cobertura (Domain + Infrastructure)
      include: [
        "./js/cartService.js",
        "./js/orderService.js",
        "./js/userService.js",
        "./js/authService.js",
        "./js/stockService.js",
        "./js/productService.js",
        "./js/orderHistoryService.js",
        "./js/orderRepository.js",
        "./js/productRepository.js",
        "./js/adminService.js",
        // Sprint 05
        "./js/taxEngine.js",          // US-44: Motor TributÃ¡rio
        "./js/nfService.js",          // US-43: EmissÃ£o NF-e
        "./js/fiscalReportService.js",// US-45: RelatÃ³rios Fiscais
      ],

      // ExcluÃ­dos da contagem
      exclude: [
        "**/*.html",
        "**/*.css",
        "node_modules/**",
        "tests/**",
        "functions/**",
        "coverage/**",
      ],
    },
  },
})



