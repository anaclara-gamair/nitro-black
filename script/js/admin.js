// Verificar se é admin (Opcional, mas recomendado)
document.addEventListener("DOMContentLoaded", () => {
    const adminName = document.getElementById("admin-name");
    const userStr = localStorage.getItem('nitro_user');
    if(userStr) {
        const user = JSON.parse(userStr);
        adminName.innerText = `Olá, ${user.nome}`;
    }

    loadAdminCars();
    loadAdminUsers();
});

function logout() {
    localStorage.removeItem('nitro_user');
    window.location.href = '../index.html';
}

// ----------------------------------------
// LÓGICA DE TROCA DE ABAS (SIDEBAR)
// ----------------------------------------
const menuItems = document.querySelectorAll(".menu-item");
const sections = document.querySelectorAll(".admin-section");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        // Remove active de todos os botões e oculta todas as seções
        menuItems.forEach(btn => btn.classList.remove("active"));
        sections.forEach(sec => sec.classList.remove("active"));

        // Adiciona active no botão clicado
        item.classList.add("active");
        
        // Pega o ID da seção que deve aparecer e mostra
        const targetId = item.getAttribute("data-target");
        document.getElementById(targetId).classList.add("active");
    });
});

// ----------------------------------------
// LÓGICA DOS MODAIS E PREVIEW DE IMAGEM
// ----------------------------------------
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Preview da imagem do Carro
const imgInput = document.getElementById('add-c-img');
const imgPreviewContainer = document.getElementById('img-preview-container');
const imgPreview = document.getElementById('car-img-preview');

imgInput.addEventListener('input', (e) => {
    const url = e.target.value;
    if(url) {
        imgPreview.src = url;
        imgPreviewContainer.style.display = 'block';
    } else {
        imgPreviewContainer.style.display = 'none';
    }
});

// ----------------------------------------
// CARREGAR USUÁRIOS DO BANCO
// ----------------------------------------
async function loadAdminUsers() {
    const tbody = document.getElementById('users-tbody');
    try {
        const res = await fetch('../script/php/admin_actions.php?action=get_users');
        const data = await res.json();

        if (data.status === 'success') {
            tbody.innerHTML = '';
            data.users.forEach(u => {
                const isCnh = u.carteira ? u.carteira : '<span style="color:red">S/ CNH (Assinou Termo)</span>';
                const isAdmin = u.eh_admin == 1 ? '<b style="color:#a855ff">Admin</b>' : 'Cliente';

                tbody.innerHTML += `
                    <tr>
                        <td>#${u.id}</td>
                        <td>${u.nome}</td>
                        <td>${u.email}</td>
                        <td>${isCnh}</td>
                        <td>${isAdmin}</td>
                        <td>
                            <button class="action-btn btn-delete" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) {
        console.error("Erro ao carregar usuários", e);
    }
}

// ----------------------------------------
// CARREGAR CARROS DO BANCO (Usando o mesmo arquivo que fizemos pra home)
// ----------------------------------------
async function loadAdminCars() {
    const grid = document.getElementById('admin-cars-grid');
    try {
        const res = await fetch('../script/php/get_cars.php');
        const data = await res.json();

        if (data.status === 'success') {
            grid.innerHTML = '';
            data.carros.forEach(c => {
                grid.innerHTML += `
                    <div class="admin-car-card">
                        <img src="${c.foto_url}" alt="${c.marca_modelo}">
                        <h3 style="margin-top:10px;">${c.marca_modelo}</h3>
                        <p style="color:#a7a7c7; font-size:14px;">Placa: ${c.placa} | Diária: R$ ${c.valor_aluguel_dia}</p>
                        <div class="admin-car-actions">
                            <button class="action-btn btn-edit" onclick="alert('Atualizar veículo ID: ${c.id}')"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                            <button class="action-btn btn-delete" onclick="deleteCar(${c.id})"><i class="fa-solid fa-trash"></i> Remover</button>
                        </div>
                    </div>
                `;
            });
        }
    } catch(e) {
        console.error("Erro ao carregar carros", e);
    }
}

// ----------------------------------------
// FUNÇÕES DE EXCLUSÃO
// ----------------------------------------
async function deleteUser(id) {
    if(confirm("Tem certeza que deseja apagar este usuário?")) {
        // Aqui faríamos um fetch para o backend para fazer o DELETE FROM users WHERE id = ?
        alert(`Usuário ${id} deletado. (Necessário endpoint PHP)`);
    }
}

async function deleteCar(id) {
    if(confirm("Tem certeza que deseja apagar este veículo?")) {
         // Aqui faríamos um fetch para o backend para fazer o DELETE FROM Carros WHERE id = ?
        alert(`Veículo ${id} deletado. (Necessário endpoint PHP)`);
    }
}
// ----------------------------------------
// FUNÇÕES DE EXCLUSÃO (Agora conectadas ao PHP)
// ----------------------------------------
async function deleteUser(id) {
    if(confirm("Tem certeza que deseja apagar este usuário definitivamente?")) {
        
        const formData = new FormData();
        formData.append('action', 'delete_user');
        formData.append('id', id);

        try {
            const res = await fetch('../script/php/admin_actions.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                alert(data.message);
                loadAdminUsers(); // Recarrega a tabela na hora, fazendo o usuário sumir
            } else {
                alert("Erro: " + data.message);
            }
        } catch(e) {
            console.error("Erro na requisição:", e);
            alert("Erro de conexão com o servidor.");
        }
    }
}

async function deleteCar(id) {
    if(confirm("Tem certeza que deseja apagar este veículo da frota?")) {
        
        const formData = new FormData();
        formData.append('action', 'delete_car');
        formData.append('id', id);

        try {
            const res = await fetch('../script/php/admin_actions.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                alert(data.message);
                loadAdminCars(); // Recarrega a tela de carros na hora, fazendo o carro sumir
            } else {
                alert("Erro: " + data.message);
            }
        } catch(e) {
            console.error("Erro na requisição:", e);
            alert("Erro de conexão com o servidor.");
        }
    }
}