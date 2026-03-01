document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {

    try {

        const user = await account.get();

        const profiles = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROFILES
        );

        const profile = profiles.documents.find(
            p => p.$id === user.$id
        );

        if (!profile || profile.role.toLowerCase() !== "admin") {
            window.location.href = "login.html";
            return;
        }

        loadDashboard();

    } catch {
        window.location.href = "login.html";
    }
}

async function loadDashboard() {

    const products = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_PRODUCTS
    );

    const categories = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_CATEGORIES
    );

    document.getElementById("content").innerHTML = `
        <h1>Dashboard</h1>
        <p>Produtos: ${products.total}</p>
        <p>Categorias: ${categories.total}</p>
    `;
}

async function logout() {
    await account.deleteSession("current");
    window.location.href = "login.html";
}