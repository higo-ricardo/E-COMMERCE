export const CheckoutValidator = {
  isEmailValid(email = "") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  },

  isCpfValid(raw = "") {
    const cpf = raw.replace(/\D/g, "")
    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i)
    let d1 = (sum * 10) % 11
    if (d1 === 10 || d1 === 11) d1 = 0
    if (d1 !== parseInt(cpf[9], 10)) return false

    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i)
    let d2 = (sum * 10) % 11
    if (d2 === 10 || d2 === 11) d2 = 0
    return d2 === parseInt(cpf[10], 10)
  },

  isNomeValid(nome = "") {
    const parts = nome.trim().split(/\s+/)
    return parts.length >= 2 && parts.every(p => p.length >= 2)
  },
}
