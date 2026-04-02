// ─── HIVERCAR · cartService.js ───────────────────────────────────────────────
// Lógica do carrinho - localStorage. Zero UI.
// Camada: Domain / Service - Loja.

import { CONFIG } from "./config.js"

const KEY = CONFIG.STORE.CART_KEY

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") }
  catch { return [] }
}
const save = cart => localStorage.setItem(KEY, JSON.stringify(cart))
const COUPON_KEY = `${KEY}_coupon`

const loadCoupon = () => {
  try { return JSON.parse(localStorage.getItem(COUPON_KEY) || "null") }
  catch { return null }
}
const saveCoupon = coupon => {
  if (!coupon) return localStorage.removeItem(COUPON_KEY)
  localStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
}

export const CartService = {

  get()    { return load() },

  count()  { return load().reduce((s, i) => s + (Number(i.qty) || 1), 0) },

  total()  { return load().reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0) },

  getCoupon() { return loadCoupon() },

  /**
   * Salva um cupom aplicado no carrinho (um por vez).
   * @param {{code:string, discount:number, message?:string}} couponResult
   */
  setCoupon(couponResult) {
    if (!couponResult) { saveCoupon(null); return }
    const discount = Math.max(0, Number(couponResult.discount) || 0)
    saveCoupon({
      code: (couponResult.code || "").toUpperCase(),
      discount,
      message: couponResult.message || "",
      appliedAt: Date.now(),
    })
  },

  clearCoupon() { saveCoupon(null) },

  totalWithDiscount() {
    const subtotal = this.total()
    const coupon = this.getCoupon()
    const discount = coupon ? Math.min(subtotal, Number(coupon.discount) || 0) : 0
    return Math.max(0, subtotal - discount)
  },

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

  clear() { 
    localStorage.removeItem(KEY)
    localStorage.removeItem(COUPON_KEY)  // Remove cupom junto com carrinho
  },
}
