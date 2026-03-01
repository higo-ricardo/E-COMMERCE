document.addEventListener("DOMContentLoaded", initSeller);

async function initSeller() {

   	console.log("🟡 Iniciando painel do vendedor");
	try {

        const user = await account.get();
	console.log("🟡 Iniciando painel do vendedor");
   	console.log("🟢 Usuário autenticado:", user);

        const profiles = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROFILES
        );

        const profile = profiles.documents.find(
            p => p.$id === user.$id
        );
 	console.log("📦 Buscando profiles...");
      console.log("🎯 Profile do usuário:", profile);

        window.currentUser = user;

        loadDashboard();

    } catch (error) {
  	console.error("❌ Erro no initSeller:", error);
        window.location.href = "login.html";
    }
}

async function loadDashboard() {

    const orders = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ORDERS,
        [
            Appwrite.Query.equal("vendedor", window.currentUser.$id)
        ]
    );

    const totalVendas = orders.documents
        .filter(o => o.status === "confirmado")
        .reduce((total, o) => total + o.price, 0);

    document.getElementById("content").innerHTML = `
        <h1>Meu Dashboard</h1>
        <p>Total Pedidos: ${orders.total}</p>
        <p>Total Vendido: R$ ${totalVendas}</p>
    `;
}

async function logout() {
    await account.deleteSession("current");
    window.location.href = "login.html";
}