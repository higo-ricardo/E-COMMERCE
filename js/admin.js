document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin(){

    console.log("Inicializando admin");

    try{

        const autorizado = await protectRoute(["admin"]);

        if(!autorizado){
            console.log("Usuário não autorizado");
            return;
        }

        console.log("Admin autorizado");

        loadDashboard();

    }catch(error){

        console.error("Erro ao iniciar admin:",error);

    }

}
const LOW_STOCK_LIMIT = 3;

function loadDashboard(){
console.log("Abrindo dashboard");
const response = await databases.listDocuments(
DATABASE_ID,
COLLECTION_PRODUCTS
);

let lowStock = response.documents.filter(
p=>p.stock <= LOW_STOCK_LIMIT
).length;

document.getElementById("content").innerHTML = `

<h1>Painel Administrativo</h1>

<div class="card-grid">

<div class="card dashboard-card" onclick="loadServices()">
<i class="fas fa-wrench"></i>
<h3>Serviços</h3>
<p>Gerenciar serviços</p>
</div>

<div class="card dashboard-card" onclick="loadInventory()">
<i class="fas fa-box"></i>
<h3>Inventário</h3>
<p>Controle de produtos</p>
</div>

<div class="card dashboard-card" onclick="loadBilling()">
<i class="fas fa-chart-line"></i>
<h3>Faturamento</h3>
<p>Relatórios de vendas</p>
</div>

<div class="card dashboard-card" onclick="loadSellers()">
<i class="fas fa-users"></i>
<h3>Vendedores</h3>
<p>Gerenciar vendedores</p>
</div>

</div>
`;
}

async function loadInventory(){
console.log("Abrindo inventário");
const response = await databases.listDocuments(
DATABASE_ID,
COLLECTION_PRODUCTS
);

let html = `
<h1>Inventário</h1>

<button onclick="createProduct()">Novo Produto</button>

<table>
<tr>
<th>Produto</th>
<th>Preço</th>
<th>Estoque</th>
<th>Status</th>
<th>Ações</th>
</tr>
`;

response.documents.forEach(product=>{

const lowStock = product.stock <= LOW_STOCK_LIMIT;

html+=`
<tr style="${lowStock ? 'background:#ffe5e5;' : ''}">

<td>${product.name}</td>

<td>R$ ${product.price}</td>

<td style="color:${lowStock ? 'red':'black'}">
${product.stock}
</td>

<td>${product.status ? "Ativo":"Inativo"}</td>

<td>

<button onclick="editProduct('${product.$id}')">
Atualizar
</button>

<button onclick="toggleProduct('${product.$id}',${product.status})">
Ativar/Desativar
</button>

<button onclick="deleteProduct('${product.$id}')">
Excluir
</button>

</td>

</tr>
`;
});

html+="</table>";

document.getElementById("content").innerHTML=html;

}

async function loadSellers(){
console.log("Abrindo vendedores");
const response = await databases.listDocuments(
DATABASE_ID,
COLLECTION_PROFILES,
[
Appwrite.Query.equal("role","seller")
]
);

let html=`

<h1>Vendedores</h1>

<button onclick="createSellerForm()">
Novo Vendedor
</button>

<table>
<tr>
<th>Nome</th>
<th>Status</th>
<th>Ações</th>
</tr>
`;

response.documents.forEach(seller=>{

html+=`

<tr>
<td>${seller.name}</td>
<td>${seller.status?"Ativo":"Inativo"}</td>

<td>

<button onclick="editSeller('${seller.$id}')">
Atualizar
</button>

<button onclick="toggleSeller('${seller.$id}',${seller.status})">
Ativar/Desativar
</button>

</td>

</tr>
`;

});

html+="</table>";

document.getElementById("content").innerHTML=html;

}

function loadServices(){
    console.log("Abrindo serviços");

document.getElementById("content").innerHTML=`

<h1>Serviços</h1>

<p>Módulo em desenvolvimento.</p>

`;

}

function loadBilling(){
console.log("Abrindo faturamento");
document.getElementById("content").innerHTML=`

<h1>Faturamento</h1>

<div class="card-grid">

<div class="card">
<h3>Vendas Totais</h3>
<p id="totalSales">R$ 0</p>
</div>

<div class="card">
<h3>Vendas por Vendedor</h3>
<div id="salesBySeller"></div>
</div>

</div>

`;

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
