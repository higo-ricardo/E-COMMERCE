document.addEventListener("DOMContentLoaded", initSeller);

async function initSeller() {

    console.log("🟡 Iniciando painel do vendedor");

    try {

        const user = await account.get();
        console.log("🟢 Usuário autenticado:", user);

        // 🔥 BUSCA PROFILE CORRETO USANDO user_id
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROFILES,
            [
                Appwrite.Query.equal("user_id", user.$id)
            ]
        );

        const profile = response.documents[0];

        console.log("📦 Profile encontrado:", profile);

        if (!profile) {
            console.error("❌ Perfil não encontrado.");
            alert("Perfil não encontrado.");
            return;
        }

        if (profile.role !== "seller") {
            console.warn("⚠ Usuário não é vendedor.");
            alert("Acesso não autorizado.");
            return;
        }

        window.currentUser = user;

        loadDashboard();

    } catch (error) {

        console.error("❌ Erro no initSeller:", error);

        // 🔥 Só redireciona se realmente não houver sessão
        window.location.href = "login.html";
    }
}

async function loadDashboard() {

    console.log("📊 Carregando dashboard...");

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