import { CouponService } from "./couponService.js"

const form = document.getElementById("formCupom")
const formMsg = document.getElementById("formMsg")
const listMsg = document.getElementById("listMsg")
const tableBody = document.getElementById("tableBody")
const statusText = document.getElementById("statusText")

const fmtBRL = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",")
const fmtDate = iso => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (!isFinite(d)) return "—"
  return d.toLocaleDateString("pt-BR")
}

const setStatus = txt => { if (statusText) statusText.textContent = txt }

const renderList = async () => {
  setStatus("Carregando…")
  listMsg.textContent = ""
  tableBody.innerHTML = `<tr><td colspan="7" class="muted">Carregando…</td></tr>`
  try {
    const list = await CouponService.list()
    if (!list.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="muted">Nenhum cupom cadastrado.</td></tr>`
      setStatus("Pronto")
      return
    }
    tableBody.innerHTML = list.map(c => {
      const now = new Date()
      const exp = c.expirationDate ? new Date(c.expirationDate) : null
      const isExpired = exp && isFinite(exp) && exp < now
      const limitHit = c.usageLimit != null && c.timesUsed >= c.usageLimit
      let status = { text:"Ativo", cls:"status-active", pill:"green" }
      if (!c.isActive) status = { text:"Inativo", cls:"status-inactive", pill:"red" }
      else if (isExpired) status = { text:"Expirado", cls:"status-expired", pill:"amber" }
      else if (limitHit) status = { text:"Limite", cls:"status-limit", pill:"blue" }

      return `<tr>
        <td><strong>${c.code}</strong></td>
        <td>${c.type === "percentual" ? "Percentual" : "Fixo"}</td>
        <td>${c.type === "percentual" ? c.value + "%" : fmtBRL(c.value)}</td>
        <td><span class="pill ${status.pill}"><span class="status-dot ${status.cls}"></span>${status.text}</span></td>
        <td>${c.timesUsed || 0}${c.usageLimit != null ? ` / ${c.usageLimit}` : ""}</td>
        <td>${fmtDate(c.expirationDate)}</td>
        <td>${c.cpf || "—"}</td>
      </tr>`
    }).join("")
    setStatus("Pronto")
  } catch (err) {
    console.error(err)
    listMsg.className = "msg err"
    listMsg.textContent = "Erro ao carregar cupons."
    setStatus("Erro")
  }
}

const resetForm = () => {
  form.reset()
  document.getElementById("isActive").checked = true
  formMsg.textContent = ""
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  formMsg.className = "msg"
  formMsg.textContent = ""

  const btn = document.getElementById("btnSalvar")
  btn.disabled = true
  const payload = {
    code: form.code.value.trim().toUpperCase(),
    type: form.type.value,
    value: Number(form.value.value),
    maxDiscount: form.maxDiscount.value ? Number(form.maxDiscount.value) : null,
    minOrderValue: form.minOrderValue.value ? Number(form.minOrderValue.value) : 50,
    expirationDate: form.expirationDate.value || null,
    usageLimit: form.usageLimit.value ? Number(form.usageLimit.value) : null,
    cpfLimit: form.cpfLimit.value ? Number(form.cpfLimit.value) : null,
    cpf: form.cpf.value.trim() || null,
    isActive: form.isActive.checked,
  }

  try {
    await CouponService.create(payload)
    formMsg.className = "msg ok"
    formMsg.textContent = "Cupom criado com sucesso."
    resetForm()
    await renderList()
  } catch (err) {
    console.error(err)
    formMsg.className = "msg err"
    formMsg.textContent = err?.message || "Erro ao salvar cupom."
  } finally {
    btn.disabled = false
  }
})

document.getElementById("btnResetForm")?.addEventListener("click", resetForm)
document.getElementById("btnReload")?.addEventListener("click", renderList)

renderList()
