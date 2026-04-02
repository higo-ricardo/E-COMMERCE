// ─── HIVERCAR · vitest.config.js ─────────────────────────────────────────────
// US-26: Configuração do Vitest com cobertura mínima 70% em Domain + Infrastructure.
//
// Ambiente jsdom (global) para todos os testes - necessário porque cartService.js
// usa localStorage. Serviços que não precisam de DOM não são afetados por isso.
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

    // ── Cobertura ─────────────────────────────────────────────────────────────
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",

      // Thresholds mínimos - US-26 Task 6: 70%
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
        "./js/couponService.js",
        "./js/couponRepository.js",
        "./js/couponUsageRepository.js",
        // Sprint 05
        "./js/taxEngine.js",          // US-44: Motor Tributário
        "./js/nfService.js",          // US-43: Emissão NF-e
        "./js/fiscalReportService.js",// US-45: Relatórios Fiscais
      ],

      // Excluídos da contagem
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


