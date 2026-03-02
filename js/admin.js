document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {

    const autorizado = await protectRoute(["admin"]);

    if (!autorizado) return;

    loadDashboard();
}