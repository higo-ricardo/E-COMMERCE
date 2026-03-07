document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin(){

    console.log("Inicializando admin...");

    try{

        const autorizado = await protectRoute(["admin"]);

        if(!autorizado){
            console.log("Usuário não autorizado");
            return;
        }

        console.log("Admin autorizado");

        loadDashboard();

    }catch(error){

        console.error("Erro ao iniciar o painel administrativo:",error);

    }

}
const LOW_STOCK_LIMIT = 3;

/* ===== DASHBOARD ===== */
async function loadDashboard() {
    console.log("Carregamento do Dashboard... ");
    document.getElementById("content").innerHTML = `<p>Carregando as informações do sistema... Aguarde alguns instantes!</p>`;
    try {
        const [resProducts, resOrders, resSellers] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTION_PRODUCTS),
            databases.listDocuments(DATABASE_ID, COLLECTION_ORDERS),
            databases.listDocuments(DATABASE_ID, COLLECTION_PROFILES, [Appwrite.Query.equal("role","seller")])
        ]);
        const lowStock = resProducts.documents.filter(p => p.stock <= LOW_STOCK_LIMIT).length;
        const totalRevenue = resOrders.documents.filter(o=>o.status==="fechado").reduce((s,o)=>s+(Number(o.total)||0),0);
        const openOrders = resOrders.documents.filter(o=>o.status==="aberto").length;

        document.getElementById("content").innerHTML = `
            <h1>Painel Administrativo</h1>
            <div class="card-grid" style="margin-bottom:30px;">
                <div class="card" style="text-align:center;"><h3 style="color:#5cb85c;">R$ ${totalRevenue.toFixed(2)}</h3><p>Faturamento Total</p></div>
                <div class="card" style="text-align:center;"><h3>${resProducts.documents.length}</h3><p>Produtos Cadastrados</p></div>
                <div class="card" style="text-align:center;"><h3 style="color:#fb1230;">${lowStock}</h3><p>Estoque Crítico</p></div>
                <div class="card" style="text-align:center;"><h3 style="color:orange;">${openOrders}</h3><p>Pedidos em Aberto</p></div>
            </div>
            <div class="card-grid">
                <div class="card dashboard-card" onclick="loadServices()"><i class="fas fa-wrench"></i><h3>Serviços</h3><p>Gerenciar serviços</p></div>
                <div class="card dashboard-card" onclick="loadInventory()"><i class="fas fa-box"></i><h3>Inventário</h3><p>Controle de produtos</p></div>
                <div class="card dashboard-card" onclick="loadBilling()"><i class="fas fa-chart-line"></i><h3>Faturamento</h3><p>Relatórios de vendas</p></div>
                <div class="card dashboard-card" onclick="loadSellers()"><i class="fas fa-users"></i><h3>Vendedores</h3><p>Gerenciar vendedores</p></div>
                <div class="card dashboard-card" onclick="loadOrders()"><i class="fas fa-clipboard-list"></i><h3>Pedidos</h3><p>Todos os pedidos</p></div>
                <div class="card dashboard-card" onclick="loadLowStock()"><i class="fas fa-exclamation-triangle" style="color:#fb1230;"></i><h3>Estoque Baixo</h3><p>${lowStock} crítico(s)</p></div>
            </div>`;
    } catch(e) {
        document.getElementById("content").innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
    }
}

/* ===== INVENTÁRIO ===== */
async function loadInventory(){
console.log("Abrindo inventário...");
  document.getElementById("content").innerHTML = `<p>Carregando...</p>`;
    try {
        const r = await databases.listDocuments(DATABASE_ID, COLLECTION_PRODUCTS);
        let html = `<h1>Inventário</h1>
            <button onclick="showProductForm()" style="margin-bottom:15px;"><i class="fas fa-plus"></i> Novo Produto</button>
            <table><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr>`;
        r.documents.forEach(p=>{
            const low = p.stock<=LOW_STOCK_LIMIT;
            html+=`<tr style="${low?'background:#ffe5e5;':''}">
                <td>${p.name}</td>
                <td>R$ ${Number(p.price).toFixed(2)}</td>
                <td style="color:${low?'red':'black'};font-weight:${low?'bold':'normal'}">${p.stock}${low?' ⚠':''}</td>
                <td><span style="color:${p.status?'green':'red'}">${p.status?"Ativo":"Inativo"}</span></td>
                <td>
                    <button onclick="showProductForm('${p.$id}')">Editar</button>
                    <button onclick="toggleProduct('${p.$id}',${p.status})">${p.status?'Desativar':'Ativar'}</button>
                    <button onclick="deleteProduct('${p.$id}')" style="background:#fb1230;">Excluir</button>
                </td></tr>`;
        });
        html+="</table>";
        document.getElementById("content").innerHTML = html;
    } catch(e) { document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`; }
}

function showProductForm(productId=null) {
    const isEdit = !!productId;
    document.getElementById("content").innerHTML = `
        <h1>${isEdit?'Editar Produto':'Novo Produto'}</h1>
        <div class="card" style="max-width:500px;">
            <input type="text" id="pName" placeholder="Nome do produto">
            <input type="number" id="pPrice" placeholder="Preço (ex: 49.90)" step="0.01">
            <input type="number" id="pStock" placeholder="Quantidade em estoque">
            <input type="text" id="pImage" placeholder="URL da imagem (opcional)">
            <textarea id="pDesc" placeholder="Descrição" rows="3" style="width:100%;padding:8px;margin-bottom:10px;"></textarea>
            <button onclick="${isEdit?`saveProduct('${productId}')`:'createProduct()'}">${isEdit?'Salvar':'Cadastrar'}</button>
            <button onclick="loadInventory()" style="margin-left:10px;background:#888;">Cancelar</button>
        </div>`;
    if(isEdit) loadProductForEdit(productId);
}

async function loadProductForEdit(id) {
    try {
        const p = await databases.getDocument(DATABASE_ID, COLLECTION_PRODUCTS, id);
        document.getElementById("pName").value = p.name||"";
        document.getElementById("pPrice").value = p.price||"";
        document.getElementById("pStock").value = p.stock||"";
        document.getElementById("pImage").value = p.image||"";
        document.getElementById("pDesc").value = p.description||"";
    } catch(e) { alert("Erro: "+e.message); }
}

async function createProduct() {
    const name=document.getElementById("pName").value.trim();
    const price=parseFloat(document.getElementById("pPrice").value);
    const stock=parseInt(document.getElementById("pStock").value);
    const image=document.getElementById("pImage").value.trim();
    const description=document.getElementById("pDesc").value.trim();
    if(!name||isNaN(price)||isNaN(stock)){alert("Preencha nome, preço e estoque.");return;}
    try {
        await databases.createDocument(DATABASE_ID,COLLECTION_PRODUCTS,Appwrite.ID.unique(),{name,price,stock,image:image||"",description:description||"",status:true});
        alert("✅ Produto cadastrado!");
        loadInventory();
    } catch(e){alert("❌ Erro: "+e.message);}
}

async function saveProduct(id) {
    const name=document.getElementById("pName").value.trim();
    const price=parseFloat(document.getElementById("pPrice").value);
    const stock=parseInt(document.getElementById("pStock").value);
    const image=document.getElementById("pImage").value.trim();
    const description=document.getElementById("pDesc").value.trim();
    if(!name||isNaN(price)||isNaN(stock)){alert("Preencha nome, preço e estoque.");return;}
    try {
        await databases.updateDocument(DATABASE_ID,COLLECTION_PRODUCTS,id,{name,price,stock,image:image||"",description:description||""});
        alert("✅ Produto atualizado!");
        loadInventory();
    } catch(e){alert("❌ Erro: "+e.message);}
}

async function toggleProduct(id,status) {
    try { await databases.updateDocument(DATABASE_ID,COLLECTION_PRODUCTS,id,{status:!status}); loadInventory(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

async function deleteProduct(id) {
    if(!confirm("Excluir este produto?"))return;
    try { await databases.deleteDocument(DATABASE_ID,COLLECTION_PRODUCTS,id); loadInventory(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

async function editStock(id) {
    const qty=prompt("Nova quantidade em estoque:");
    if(qty===null)return;
    const stock=parseInt(qty);
    if(isNaN(stock)||stock<0){alert("Quantidade inválida.");return;}
    try { await databases.updateDocument(DATABASE_ID,COLLECTION_PRODUCTS,id,{stock}); alert("✅ Estoque atualizado!"); loadLowStock(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

/* ===== VENDEDORES ===== */
async function loadSellers(){
console.log("Abrindo o Painel de Vendas");
  document.getElementById("content").innerHTML=`<p>Carregando...</p>`;
    try {
        const r=await databases.listDocuments(DATABASE_ID,COLLECTION_PROFILES,[Appwrite.Query.equal("role","seller")]);
        let html=`<h1>Vendedores</h1>
            <table><tr><th>Nome</th><th>Status</th><th>Ações</th></tr>`;
        if(r.documents.length===0) html+=`<tr><td colspan="3">Nenhum vendedor.</td></tr>`;
        r.documents.forEach(s=>{
            html+=`<tr>
                <td>${s.name}</td>
                <td><span style="color:${s.status?'green':'red'}">${s.status?"Ativo":"Inativo"}</span></td>
                <td>
                    <button onclick="toggleSeller('${s.$id}',${s.status})">${s.status?'Desativar':'Ativar'}</button>
                    <button onclick="viewSellerOrders('${s.user_id}','${s.name}')">Ver Pedidos</button>
                </td></tr>`;
        });
        html+="</table>";
        document.getElementById("content").innerHTML=html;
    } catch(e){document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}
}

async function toggleSeller(id,status) {
    try { await databases.updateDocument(DATABASE_ID,COLLECTION_PROFILES,id,{status:!status}); loadSellers(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

async function viewSellerOrders(userId,name) {
    document.getElementById("content").innerHTML=`<p>Carregando...</p>`;
    try {
        const r=await databases.listDocuments(DATABASE_ID,COLLECTION_ORDERS,[Appwrite.Query.equal("seller_id",userId)]);
        let html=`<h1>Pedidos de ${name}</h1>
            <button onclick="loadSellers()" style="margin-bottom:15px;">← Voltar</button>
            <table><tr><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr>`;
        if(r.documents.length===0) html+=`<tr><td colspan="4">Nenhum pedido.</td></tr>`;
        r.documents.forEach(o=>{
            html+=`<tr>
                <td>${o.client_name||"—"}</td>
                <td>R$ ${Number(o.total||0).toFixed(2)}</td>
                <td style="color:${o.status==='fechado'?'green':'orange'}">${o.status}</td>
                <td>${new Date(o.$createdAt).toLocaleDateString("pt-BR")}</td></tr>`;
        });
        html+="</table>";
        document.getElementById("content").innerHTML=html;
    } catch(e){document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}
}

/* ===== FATURAMENTO ===== */
async function loadBilling() {
     console.log("Carregando o Painel de Faturamento...");
    document.getElementById("content").innerHTML=`<p>Carregando...</p>`;
    try {
        const [resOrders,resSellers]=await Promise.all([
            databases.listDocuments(DATABASE_ID,COLLECTION_ORDERS),
            databases.listDocuments(DATABASE_ID,COLLECTION_PROFILES,[Appwrite.Query.equal("role","seller")])
        ]);
        const closed=resOrders.documents.filter(o=>o.status==="fechado");
        const total=closed.reduce((s,o)=>s+(Number(o.total)||0),0);
        const open=resOrders.documents.filter(o=>o.status==="aberto");
        const map={};
        closed.forEach(o=>{if(!map[o.seller_id])map[o.seller_id]=0;map[o.seller_id]+=Number(o.total)||0;});
        let rows="";
        resSellers.documents.forEach(s=>{
            const t=map[s.user_id]||0;
            rows+=`<tr><td>${s.name}</td><td>R$ ${t.toFixed(2)}</td><td>${closed.filter(o=>o.seller_id===s.user_id).length}</td></tr>`;
        });
        document.getElementById("content").innerHTML=`
            <h1>Faturamento</h1>
            <div class="card-grid" style="margin-bottom:30px;">
                <div class="card" style="text-align:center;"><h2 style="color:#5cb85c;">R$ ${total.toFixed(2)}</h2><p>Total Faturado</p></div>
                <div class="card" style="text-align:center;"><h2>${closed.length}</h2><p>Pedidos Fechados</p></div>
                <div class="card" style="text-align:center;"><h2 style="color:orange;">${open.length}</h2><p>Pedidos em Aberto</p></div>
            </div>
            <h2 style="margin-bottom:15px;">Por Vendedor</h2>
            <table><tr><th>Vendedor</th><th>Total Vendido</th><th>Pedidos Fechados</th></tr>
                ${rows||'<tr><td colspan="3">Sem dados.</td></tr>'}
            </table>
            <h2 style="margin-top:30px;margin-bottom:15px;">Últimos Pedidos</h2>
            <table><tr><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr>
                ${resOrders.documents.slice(0,20).map(o=>`<tr>
                    <td>${o.client_name||"—"}</td>
                    <td>R$ ${Number(o.total||0).toFixed(2)}</td>
                    <td style="color:${o.status==='fechado'?'green':'orange'}">${o.status}</td>
                    <td>${new Date(o.$createdAt).toLocaleDateString("pt-BR")}</td></tr>`).join("")||'<tr><td colspan="4">Nenhum pedido.</td></tr>'}
            </table>`;
    } catch(e){document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}
}


/* ===== PEDIDOS (visão admin) ===== */
async function loadOrders() {
    document.getElementById("content").innerHTML=`<p>Carregando...</p>`;
    try {
        const r=await databases.listDocuments(DATABASE_ID,COLLECTION_ORDERS);
        let html=`<h1>Todos os Pedidos</h1>
            <table><tr><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th><th>Ações</th></tr>`;
        if(r.documents.length===0) html+=`<tr><td colspan="5">Nenhum pedido.</td></tr>`;
        r.documents.forEach(o=>{
            html+=`<tr>
                <td>${o.client_name||"—"}</td>
                <td>R$ ${Number(o.total||0).toFixed(2)}</td>
                <td style="color:${o.status==='fechado'?'green':'orange'}">${o.status}</td>
                <td>${new Date(o.$createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                    ${o.status==="aberto"?`<button onclick="adminCloseOrder('${o.$id}')">Fechar</button>`:""}
                    <button onclick="deleteOrder('${o.$id}')" style="background:#fb1230;">Excluir</button>
                </td></tr>`;
        });
        html+="</table>";
        document.getElementById("content").innerHTML=html;
    } catch(e){document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}
}

async function adminCloseOrder(id) {
    try { await databases.updateDocument(DATABASE_ID,COLLECTION_ORDERS,id,{status:"fechado"}); loadOrders(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

async function deleteOrder(id) {
    if(!confirm("Excluir este pedido?"))return;
    try { await databases.deleteDocument(DATABASE_ID,COLLECTION_ORDERS,id); loadOrders(); }
    catch(e){alert("❌ Erro: "+e.message);}
}

/* ===== SERVIÇOS ===== */
function loadServices() {
    document.getElementById("content").innerHTML=`<h1>Serviços</h1><p style="color:#888;">Módulo em desenvolvimento.</p>`;
}

/* ===== ESTOQUE BAIXO ===== */
async function loadLowStock() {
    document.getElementById("content").innerHTML=`<p>Carregando...</p>`;
    try {
        const r=await databases.listDocuments(DATABASE_ID,COLLECTION_PRODUCTS);
        const low=r.documents.filter(p=>p.stock<=LOW_STOCK_LIMIT);
        let html=`<h1>⚠ Estoque Baixo</h1><p style="margin-bottom:15px;">Produtos com ${LOW_STOCK_LIMIT} ou menos unidades.</p>
            <table><tr><th>Produto</th><th>Estoque</th><th>Ação</th></tr>`;
        if(low.length===0) html+=`<tr><td colspan="3" style="color:green;">✅ Nenhum produto crítico!</td></tr>`;
        low.forEach(p=>{
            html+=`<tr><td>${p.name}</td><td style="color:red;font-weight:bold">${p.stock}</td>
                <td><button onclick="editStock('${p.$id}')">Repor Estoque</button></td></tr>`;
        });
        html+="</table>";
        document.getElementById("content").innerHTML=html;
    } catch(e){document.getElementById("content").innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}
}


async function loadLowStock(){
console.log("Abrindo estoque baixo");
const response = await databases.listDocuments(
DATABASE_ID,
COLLECTION_PRODUCTS
);

let html=`
<h1>⚠ Estoque Baixo</h1>

<table>
<tr>
<th>Produto</th>
<th>Estoque</th>
<th>Ação</th>
</tr>
`;

response.documents.forEach(product=>{

if(product.stock <= LOW_STOCK_LIMIT){

html+=`
<tr>

<td>${product.name}</td>

<td style="color:red;font-weight:bold">
${product.stock}
</td>

<td>
<button onclick="editStock('${product.$id}')">
Repor estoque
</button>
</td>

</tr>
`;

}

});

html+="</table>";

document.getElementById("content").innerHTML=html;

}
