// ==========================================
// INICIALIZAÇÃO DO PAINEL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Mostrar nome do Admin logado
    const adminName = document.getElementById("admin-name");
    const userStr = localStorage.getItem('nitro_user');
    if(userStr && adminName) {
        const user = JSON.parse(userStr);
        adminName.innerText = `Olá, ${user.nome}`;
    }

    // 2. Carregar as tabelas do banco
    loadAdminCars();
    loadAdminUsers();

    // 3. Lógica das Abas (Sidebar)
    const menuItems = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".admin-section");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(btn => btn.classList.remove("active"));
            sections.forEach(sec => sec.classList.remove("active"));
            
            item.classList.add("active");
            const targetId = item.getAttribute("data-target");
            document.getElementById(targetId).classList.add("active");
        });
    });

    // ==========================================
    // LÓGICA: ADICIONAR VEÍCULO
    // ==========================================
    const imgInput = document.getElementById('add-c-img');
    const imgPreviewContainer = document.getElementById('img-preview-container');
    const imgPreview = document.getElementById('car-img-preview');

    if(imgInput) {
        imgInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if(url) {
                imgPreview.src = url;
                imgPreviewContainer.style.display = 'block';
            } else {
                imgPreviewContainer.style.display = 'none';
            }
        });
    }

    const formAddCar = document.getElementById('form-add-car');
    if(formAddCar) {
        formAddCar.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita recarregar a tela (e o bug do clique duplo)
            
            const formData = new FormData();
            formData.append('action', 'add_car');
            formData.append('foto_url', document.getElementById('add-c-img').value);
            formData.append('marca_modelo', document.getElementById('add-c-modelo').value);
            formData.append('placa', document.getElementById('add-c-placa').value);
            formData.append('valor_aluguel_dia', document.getElementById('add-c-valor').value);
            formData.append('ano', document.getElementById('add-c-ano').value);
            formData.append('cor', document.getElementById('add-c-cor').value);
            formData.append('km', document.getElementById('add-c-km').value);
            formData.append('estado_de_uso', document.getElementById('add-c-estado').value);
            formData.append('location_id', document.getElementById('add-c-location').value);
            formData.append('detalhes_tecnicos', document.getElementById('add-c-detalhes').value);
            formData.append('acessorios', document.getElementById('add-c-acessorios').value);

            try {
                const res = await fetch('../script/php/admin_actions.php', { method: 'POST', body: formData });
                const data = await res.json();
                
                if(data.status === 'success') {
                    alert(data.message);
                    closeModal('modal-car');
                    formAddCar.reset();
                    imgPreviewContainer.style.display = 'none';
                    loadAdminCars();
                } else {
                    alert("Erro: " + data.message);
                }
            } catch(err) {
                console.error(err);
                alert("Erro de conexão ao salvar veículo.");
            }
        });
    }

    // ==========================================
    // LÓGICA: ADICIONAR USUÁRIO
    // ==========================================
    const addUTermo = document.getElementById('add-u-termo');
    const addUCnh = document.getElementById('add-u-cnh');
    const addUVenc = document.getElementById('add-u-venc');

    if(addUTermo) {
        addUTermo.addEventListener('change', () => {
            if(addUTermo.checked) {
                addUCnh.disabled = true; addUCnh.value = '';
                addUVenc.disabled = true; addUVenc.value = '';
            } else {
                addUCnh.disabled = false; addUVenc.disabled = false;
            }
        });
    }

    const formAddUser = document.getElementById('form-add-user');
    if(formAddUser) {
        formAddUser.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const formData = new FormData();
            formData.append('action', 'add_user');
            formData.append('nome', document.getElementById('add-u-nome').value);
            formData.append('email', document.getElementById('add-u-email').value);
            formData.append('senha', document.getElementById('add-u-senha').value);
            formData.append('carteira', document.getElementById('add-u-cnh').value);
            formData.append('vencimento', document.getElementById('add-u-venc').value);
            formData.append('termo', document.getElementById('add-u-termo').checked);
            formData.append('eh_admin', document.getElementById('add-u-admin').value);

            try {
                const res = await fetch('../script/php/admin_actions.php', { method: 'POST', body: formData });
                const data = await res.json();
                
                if(data.status === 'success') {
                    alert(data.message);
                    closeModal('modal-user');
                    formAddUser.reset();
                    loadAdminUsers(); 
                } else {
                    alert("Erro: " + data.message);
                }
            } catch(err) {
                console.error(err);
                alert("Erro de conexão ao salvar usuário.");
            }
        });
    }
});

// ==========================================
// FUNÇÕES GLOBAIS (Modais, Excluir, Sair)
// ==========================================
function openModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }
function logout() { localStorage.removeItem('nitro_user'); window.location.href = '../index.html'; }

async function loadAdminUsers() {
    const tbody = document.getElementById('users-tbody');
    if(!tbody) return;
    try {
        const res = await fetch('../script/php/admin_actions.php?action=get_users');
        const data = await res.json();
        if (data.status === 'success') {
            tbody.innerHTML = '';
            data.users.forEach(u => {
                const isCnh = u.carteira ? u.carteira : '<span style="color:#ff6b6b">S/ CNH (Assinou Termo)</span>';
                const isAdmin = u.eh_admin == 1 ? '<b style="color:#a855ff">Admin</b>' : 'Cliente';
                tbody.innerHTML += `
                    <tr>
                        <td>#${u.id}</td><td>${u.nome}</td><td>${u.email}</td><td>${isCnh}</td><td>${isAdmin}</td>
                        <td><button class="action-btn btn-delete" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button></td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error("Erro", e); }
}

async function loadAdminCars() {
    const grid = document.getElementById('admin-cars-grid');
    if(!grid) return;
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
                            <button class="action-btn btn-delete" onclick="deleteCar(${c.id})"><i class="fa-solid fa-trash"></i> Remover</button>
                        </div>
                    </div>
                `;
            });
        }
    } catch(e) { console.error("Erro", e); }
}

async function deleteUser(id) {
    if(confirm("Deseja apagar este usuário definitivamente?")) {
        const formData = new FormData(); formData.append('action', 'delete_user'); formData.append('id', id);
        const res = await fetch('../script/php/admin_actions.php', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') { loadAdminUsers(); } else { alert(data.message); }
    }
}

async function deleteCar(id) {
    if(confirm("Deseja apagar este veículo da frota?")) {
        const formData = new FormData(); formData.append('action', 'delete_car'); formData.append('id', id);
        const res = await fetch('../script/php/admin_actions.php', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') { loadAdminCars(); } else { alert(data.message); }
    }
}