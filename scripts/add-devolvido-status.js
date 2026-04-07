// ─── HIVERCAR · add-devolvido-status.js ──────────────────────────────────────
// Script para adicionar "DEVOLVIDO" ao ENUM do campo "status" na collection "orders"
// Executar uma vez via console do navegador ou Node.js com Appwrite SDK
//
// Pré-requisitos:
//   - Appwrite SDK instalado (npm i appwrite)
//   - Credenciais de ADMIN configuradas
//
// Uso:
//   node scripts/add-devolvido-status.js

import { Client, Databases } from "appwrite"

const CONFIG = {
  ENDPOINT:   "https://tor.cloud.appwrite.io/v1",
  PROJECT_ID: "69c7e94a003a1c86b7ca",
  API_KEY:    process.env.APPWRITE_API_KEY,  // Defina esta variável de ambiente
  DB:         "69c7e9af00296b17179e",
  COLLECTION: "orders",
}

async function addDevolvidoStatus() {
  if (!CONFIG.API_KEY) {
    console.error("❌ Erro: Defina a variável de ambiente APPWRITE_API_KEY")
    console.log("   Export APPWRITE_API_KEY='sua-api-key-aqui'")
    process.exit(1)
  }

  const client = new Client()
    .setEndpoint(CONFIG.ENDPOINT)
    .setProject(CONFIG.PROJECT_ID)
    .setKey(CONFIG.API_KEY)

  const databases = new Databases(client)

  console.log("🔄 Adicionando 'DEVOLVIDO' ao ENUM do campo 'status'...")

  try {
    // Atualiza o atributo 'status' com novo ENUM incluindo DEVOLVIDO
    await databases.updateEnumAttribute(
      CONFIG.DB,
      CONFIG.COLLECTION,
      "status",  // key do atributo
      [
        "NOVO",
        "PAGO",
        "EM SEPARAÇÃO",
        "ENVIADO",
        "ENTREGUE",
        "CANCELADO",
        "DEVOLVIDO",  // ← Novo status adicionado
      ]
    )

    console.log("✅ 'DEVOLVIDO' adicionado com sucesso ao ENUM!")
    console.log("📋 Novos valores permitidos:")
    console.log("   NOVO, PAGO, EM SEPARAÇÃO, ENVIADO, ENTREGUE, CANCELADO, DEVOLVIDO")
  } catch (error) {
    console.error("❌ Erro ao atualizar ENUM:", error.message)
    
    if (error.code === 404) {
      console.log("\n💡 Alternativa: Recrie o atributo 'status' com o novo ENUM")
      console.log("   1. Delete o atributo antigo")
      console.log("   2. Crie um novo com os valores atualizados")
    }
    
    process.exit(1)
  }
}

addDevolvidoStatus()
