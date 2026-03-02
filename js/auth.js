/* ================================================= */
/* CORE DE AUTENTICAÇÃO E AUTORIZAÇÃO */
/* ================================================= */

let currentUser = null;
let currentProfile = null;

/* ============================= */
/* Verifica sessão ativa */
/* ============================= */

async function getCurrentUser() {

    try {
        currentUser = await account.get();
        console.log("🟢 Sessão válida:", currentUser);
        return currentUser;
    } catch (error) {
        console.warn("🔴 Nenhuma sessão ativa.");
        return null;
    }
}

/* ============================= */
/* Busca profile vinculado */
/* ============================= */

async function getCurrentProfile() {

    if (!currentUser) return null;

    try {

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_PROFILES,
            [
                Appwrite.Query.equal("user_id", currentUser.$id)
            ]
        );

        currentProfile = response.documents[0];

        console.log("📦 Profile carregado:", currentProfile);

        return currentProfile;

    } catch (error) {
        console.error("❌ Erro ao buscar profile:", error);
        return null;
    }
}

/* ============================= */
/* Middleware de proteção por role */
/* ============================= */

async function protectRoute(allowedRoles = []) {

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const profile = await getCurrentProfile();

    if (!profile) {
        alert("Perfil não encontrado.");
        return false;
    }

    if (!allowedRoles.includes(profile.role)) {
        alert("Acesso não autorizado.");
        return false;
    }

    return true;
}

/* ============================= */
/* Logout centralizado */
/* ============================= */

async function logout() {
    await account.deleteSession("current");
    window.location.href = "login.html";
}