document.addEventListener("DOMContentLoaded", initSeller);

async function initSeller() {

    const autorizado = await protectRoute(["seller"]);

    if (!autorizado) return;

    loadDashboard();
}