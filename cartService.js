// ─── HIVERCAR · cartService.js ───────────────────────────────────────────────
// Lógica do carrinho — localStorage. Zero UI.
// Camada: Domain / Service — Loja.

import { CONFIG } from "./config.js"

const KEY = CONFIG.STORE.CART_KEY

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") }
  catch { return [] }
}
const save = cart => localStorage.setItem(KEY, JSON.stringify(cart))

export const CartService = {

  get()    { return load() },

  count()  { return load().reduce((s, i) => s + (Number(i.qty) || 1), 0) },

  total()  { return load().reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0) },

  add(product) {
    const cart = load()
    const idx  = cart.findIndex(i => i.$id === product.$id)
    if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + 1
    else          cart.push({ ...product, qty: 1 })
    save(cart)
  },

  remove(index) {
    const cart = load()
    cart.splice(index, 1)
    save(cart)
  },

  setQty(index, qty) {
    const cart = load()
    if (cart[index]) { cart[index].qty = Math.max(1, qty); save(cart) }
  },

  clear() { localStorage.removeItem(KEY) },
}
