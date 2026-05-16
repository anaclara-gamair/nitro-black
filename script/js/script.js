
document.addEventListener("DOMContentLoaded", () => {
    const userDataStr = localStorage.getItem('nitro_user');
    const userContainer = document.getElementById('user-container');

    if(userDataStr && userContainer) {
        const user = JSON.parse(userDataStr);
        userContainer.innerHTML = `
            ${(user.eh_admin == 1 || user.eh_admin == "1") ? `
              <a href="admin.html" style="color: #bb86fc; font-size: 20px; margin-right: 18px; text-decoration: none; transition: 0.3s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#bb86fc'">
                <i class="fa-solid fa-gear"></i>
              </a>
            ` : ''}
            <span style="color:#d7c7ff; font-weight:500; margin-right: 15px; font-size: 14px;">
              Olá, <b style="color: white;">${user.nome}</b>
            </span>
            <button class="login-header" onclick="logout()" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(187,134,252,0.4); padding: 8px 20px; font-size: 14px; border-radius: 12px; color: white; cursor: pointer; transition: 0.3s;">
              Sair
            </button>
        `;
    }

    // Carregar os carros do banco
    loadCars();
    // Bloqueia datas anteriores a hoje
    const hoje = new Date().toISOString().split('T')[0];
    const dataRetirada = document.getElementById("data-busca-retirada");
    const dataDevolucao = document.getElementById("data-busca-devolucao");
    
    if(dataRetirada && dataDevolucao) {
        dataRetirada.min = hoje;
        dataRetirada.addEventListener('change', (e) => {
            dataDevolucao.min = e.target.value; // Devolução não pode ser antes da retirada
        });
    }
});




function logout() {
    localStorage.removeItem('nitro_user');
    window.location.reload();
}

// 2. BUSCAR CARROS NO BANCO E RENDERIZAR NA TELA
async function loadCars() {
    const grid = document.getElementById('cars-grid');
    if(!grid) return;

    try {
        // Aponta para o get_cars.php
        const response = await fetch('../script/php/get_cars.php');
        const data = await response.json();

        if(data.status === 'success') {
            grid.innerHTML = ''; // Limpa o texto "Carregando..."
            
            data.carros.forEach(carro => {
                // Formata o preço para R$ 0.000,00
                const precoFormatado = parseFloat(carro.valor_aluguel_dia).toLocaleString('pt-BR', {minimumFractionDigits: 2});

                // HTML de cada Card (injetando os dados do banco, incluindo cor, km, etc)
                grid.innerHTML += `
                <div class="car-card">
                    <div class="car-image">
                      <img src="${carro.foto_url}" alt="${carro.marca_modelo}">
                    </div>
                    <div class="car-content">
                      <h3>${carro.marca_modelo}</h3>
                      <span class="car-type">Cor: ${carro.cor} | Ano: ${carro.ano}</span>
                      
                      <div class="car-info">
                        <span><i class="fa-solid fa-gauge-high"></i> ${carro.km} km</span>
                        <span><i class="fa-solid fa-star"></i> Estado: ${carro.estado_de_uso}/5</span>
                      </div>

                      <p style="font-size: 12px; color: #bca9d6; height: 35px; overflow: hidden; margin-bottom: 15px;">
                        ${carro.detalhes_tecnicos}
                      </p>

                      <div class="car-footer">
                          <div>
                            <small>Diária</small>
                            <h4>R$ ${precoFormatado}</h4>
                          </div>

                          <button
                            onclick="abrirReserva(${carro.id}, '${carro.marca_modelo}', '${carro.foto_url}', '${precoFormatado}', ${carro.location_id})"
                            >
                                Reservar
                            </button>
                        </div>
                `;
            });
        } else {
            grid.innerHTML = `<p style="color: white;">Erro ao carregar veículos: ${data.message}</p>`;
        }
    } catch(e) {
        console.error("Erro no fetch: ", e);
        grid.innerHTML = '<p style="color: white;">Erro de conexão com o servidor.</p>';
    }
}

// 3. LÓGICA DE LOCALIZAÇÃO (REGIÃO -> AGÊNCIAS)
const agencies = {
    'MG': [
      { id: 1, name: 'Agência Centro - Divinópolis' },
      { id: 2, name: 'Agência Aeroporto - BH' }
    ],
    'SP': [
      { id: 3, name: 'Agência Paulista - SP' },
      { id: 4, name: 'Agência Guarulhos - SP' }
    ]
};

const regiaoSelect = document.getElementById('regiao-select');
let reservas = [];
const retiradaSelect = document.getElementById('retirada-select');
const devolucaoSelect = document.getElementById('devolucao-select');

if(regiaoSelect) {
    regiaoSelect.addEventListener('change', (e) => {
        const regiao = e.target.value;
        retiradaSelect.innerHTML = '<option value="">Selecione a agência...</option>';
        devolucaoSelect.innerHTML = '<option value="">Selecione a agência...</option>';

        if(regiao && agencies[regiao]) {
            agencies[regiao].forEach(agencia => {
                retiradaSelect.innerHTML += `<option value="${agencia.id}">${agencia.name}</option>`;
                devolucaoSelect.innerHTML += `<option value="${agencia.id}">${agencia.name}</option>`;
            });
            retiradaSelect.disabled = false;
            devolucaoSelect.disabled = false;
        } else {
            retiradaSelect.disabled = true;
            devolucaoSelect.disabled = true;
            retiradaSelect.innerHTML = '<option value="">Escolha a região primeiro</option>';
            devolucaoSelect.innerHTML = '<option value="">Escolha a região primeiro</option>';
        }
    });
}

let carrinho = 0;



function abrirReserva(car_id, nome, foto, preco, loc_id) {
    document.getElementById('modalReserva').style.display = 'flex';

    window.carroSelecionado = { car_id, nome, foto, preco, loc_id };

    // Aplica o bloqueio de datas no modal normal também
    const hoje = new Date().toISOString().split('T')[0];
    const dataRet = document.getElementById('dataRetirada');
    const dataDev = document.getElementById('dataDevolucao');
    
    dataRet.min = hoje;
    dataRet.addEventListener('change', (e) => {
        dataDev.min = e.target.value;
    });
}

function fecharReserva() {
    document.getElementById('modalReserva').style.display = 'none';
}

async function confirmarReserva() {
    const retirada = document.getElementById('dataRetirada').value;
    const devolucao = document.getElementById('dataDevolucao').value;

    if(!retirada || !devolucao) {
        alert('Preencha as datas de retirada e devolução.');
        return;
    }

    const userDataStr = localStorage.getItem('nitro_user');
    if(!userDataStr) {
        alert("Você precisa estar logado para fazer uma reserva!");
        window.location.href = '../index.html';
        return;
    }

    const user = JSON.parse(userDataStr);
    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('car_id', window.carroSelecionado.car_id);
    formData.append('data_retirada', retirada);
    formData.append('data_devolucao', devolucao);
    formData.append('loc_id', window.carroSelecionado.loc_id);

    try {
        const res = await fetch('../script/php/fazer_reserva.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if(data.status === 'success') {
            alert('Reserva confirmada e salva com sucesso!');
            fecharReserva();
            carregarCarrinhoDoBanco(user.id); // Atualiza o carrinho imediatamente
        } else {
            alert("Erro do servidor: " + data.message);
        }
    } catch(e) {
        alert('Erro de conexão ao confirmar reserva.');
    }
}
document.getElementById('cartFloating')
.addEventListener('click', abrirCarrinho);
async function carregarCarrinhoDoBanco(userId) {
    try {
        const response = await fetch(`../script/php/obter_reservas.php?user_id=${userId}`);
        const data = await response.json();

        if (data.status === 'success') {
            // Mapeia adicionando o ID da reserva (booking_id) retornado pelo PHP
            reservas = data.reservas.map(res => ({
                id: res.booking_id, 
                nome: res.marca_modelo,
                foto: res.foto_url,
                preco: parseFloat(res.valor_aluguel_dia).toLocaleString('pt-BR', {minimumFractionDigits: 2}),
                retirada: res.data_retirada,
                devolucao: res.data_devolucao,
                agencia: res.nome_agencia
            }));

            carrinho = reservas.length;
            document.getElementById('cartCount').innerText = carrinho;
            document.getElementById('cartFloating').style.display = carrinho > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.error("Erro ao sincronizar carrinho persistente:", e);
    }
}

function abrirCarrinho() {
    document.getElementById('modalCarrinho').style.display = 'flex';
    const lista = document.getElementById('listaReservas');
    lista.innerHTML = '';

    if(reservas.length === 0) {
        lista.innerHTML = '<p style="color: #bca9d6; text-align: center; padding: 20px;">Você não possui nenhuma reserva ativa.</p>';
        return;
    }

    // Calcula a data de Hoje à meia-noite para comparações justas
    const hojeObj = new Date();
    hojeObj.setHours(0, 0, 0, 0);

    reservas.forEach(reserva => {
        const dRetirada = reserva.retirada.split('-').reverse().join('/');
        const dDevolucao = reserva.devolucao.split('-').reverse().join('/');

        // Logica para permitir ou bloquear cancelamento (Mínimo 1 dia)
        const retObj = new Date(reserva.retirada + "T00:00:00");
        const diffTime = retObj - hojeObj;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let htmlCancelamento = '';
        if (diffDays >= 1) {
            htmlCancelamento = `
                <button onclick="cancelarReserva(${reserva.id})" style="background: rgba(255, 47, 117, 0.2); border: 1px solid #ff2f75; padding: 8px 15px; border-radius: 10px; color: #ff2f75; cursor: pointer; font-size: 13px; margin-top: 15px; transition: 0.3s; width: 100%;">
                    <i class="fa-solid fa-xmark"></i> Cancelar Reserva
                </button>
            `;
        } else {
            htmlCancelamento = `
                <p style="color: #ff6b6b; font-size: 12px; margin-top: 15px; background: rgba(255, 107, 107, 0.1); padding: 8px; border-radius: 8px; text-align: center;">
                    <i class="fa-solid fa-lock"></i> Cancelamento bloqueado (faltam menos de 24h)
                </p>
            `;
        }

        lista.innerHTML += `
        <div class="reserva-card" style="position: relative;">
            <img src="${reserva.foto}">
            <div class="reserva-info">
                <h3>${reserva.nome}</h3>
                <p><b>Diária:</b> R$ ${reserva.preco}</p>
                <p><b>Retirada:</b> ${dRetirada}</p>
                <p><b>Devolução:</b> ${dDevolucao}</p>
                <p><b>Agência:</b> ${reserva.agencia}</p>
                ${htmlCancelamento}
            </div>
        </div>
        `;
    });
}

// Função de exclusão no Banco com atualização do Carrinho
async function cancelarReserva(booking_id) {
    if(!confirm("Atenção: Tem certeza que deseja cancelar esta reserva?")) return;

    const formData = new FormData();
    formData.append('booking_id', booking_id);

    try {
        const res = await fetch('../script/php/cancelar_reserva.php', { method: 'POST', body: formData });
        const data = await res.json();

        if(data.status === 'success') {
            alert('Reserva cancelada com sucesso!');
            const user = JSON.parse(localStorage.getItem('nitro_user'));
            
            // Recarrega os dados do banco e redesenha o carrinho
            await carregarCarrinhoDoBanco(user.id);
            abrirCarrinho(); 
        } else {
            alert('Erro ao cancelar: ' + data.message);
        }
    } catch(e) {
        alert('Erro de conexão ao tentar cancelar a reserva.');
    }
}

// Função de exclusão no Banco com atualização do Carrinho
async function cancelarReserva(booking_id) {
    if(!confirm("Atenção: Tem certeza que deseja cancelar esta reserva?")) return;

    const formData = new FormData();
    formData.append('booking_id', booking_id);

    try {
        const res = await fetch('../script/php/cancelar_reserva.php', { method: 'POST', body: formData });
        const data = await res.json();

        if(data.status === 'success') {
            alert('Reserva cancelada com sucesso!');
            const user = JSON.parse(localStorage.getItem('nitro_user'));
            
            // Recarrega os dados do banco e redesenha o carrinho
            await carregarCarrinhoDoBanco(user.id);
            abrirCarrinho(); 
        } else {
            alert('Erro ao cancelar: ' + data.message);
        }
    } catch(e) {
        alert('Erro de conexão ao tentar cancelar a reserva.');
    }
}
document.querySelector(".search-btn").addEventListener("click", async () => {
    const locId = document.getElementById("retirada-select").value;
    const retirada = document.getElementById("data-busca-retirada").value;
    const devolucao = document.getElementById("data-busca-devolucao").value;
    const listaFiltrados = document.getElementById("listaCarrosFiltrados");
    const userDataStr = localStorage.getItem('nitro_user');
    
    if(!locId || !retirada || !devolucao) {
        alert("Selecione a agência, data de retirada e devolução!");
        return;
    }

    listaFiltrados.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/3;">Buscando frota disponível nas datas escolhidas...</p>';
    document.getElementById("modalFiltro").style.display = "flex";

    try {
        // Manda as datas pro PHP verificar quem já tá alugado
        const response = await fetch(`../script/php/get_cars.php?retirada=${retirada}&devolucao=${devolucao}`);
        const data = await response.json();

        if(data.status === 'success') {
            const carrosFiltrados = data.carros.filter(c => c.location_id == locId);

            if(carrosFiltrados.length === 0) {
                listaFiltrados.innerHTML = '<p style="color: #ff6b6b; text-align: center; grid-column: 1/3; padding: 20px;">Nenhum veículo disponível para essas datas nesta agência.</p>';
                return;
            }

            listaFiltrados.innerHTML = '';
            carrosFiltrados.forEach(carro => {
                const precoFormatado = parseFloat(carro.valor_aluguel_dia).toLocaleString('pt-BR', {minimumFractionDigits: 2});
                
                listaFiltrados.innerHTML += `
                    <div class="reserva-card" style="margin-top: 0; display: flex; flex-direction: column; justify-content: space-between; background: rgba(255,255,255,0.02); border-radius: 18px;">
                        <img src="${carro.foto_url}" style="height: 140px; object-fit: cover;">
                        <div class="reserva-info" style="padding: 15px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <h3 style="font-size: 18px; margin-bottom: 5px;">${carro.marca_modelo}</h3>
                                <p style="font-size: 13px; color: #bca9d6; margin-bottom: 10px;">R$ ${precoFormatado} / dia</p>
                            </div>
                            <button class="confirm-btn" style="height: 40px; font-size: 14px; border-radius: 10px;" onclick="fazerReservaReal(${carro.id}, '${retirada}', '${devolucao}', ${locId})">
                                Confirmar Reserva
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    } catch(e) {
        listaFiltrados.innerHTML = '<p style="color: white;">Erro de conexão com o servidor.</p>';
    }
});

// Função para fazer a reserva no Banco de Dados
async function fazerReservaReal(car_id, retirada, devolucao, loc_id) {
    const userDataStr = localStorage.getItem('nitro_user');
    if(!userDataStr) {
        alert("Você precisa estar logado para fazer uma reserva!");
        window.location.href = '../index.html';
        return;
    }

    const user = JSON.parse(userDataStr);
    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('car_id', car_id);
    formData.append('data_retirada', retirada);
    formData.append('data_devolucao', devolucao);
    formData.append('loc_id', loc_id);

    try {
        const res = await fetch('../script/php/fazer_reserva.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if(data.status === 'success') {
            alert("Reserva confirmada com sucesso! O carro já é seu nessas datas.");
            document.getElementById("modalFiltro").style.display = "none";
            carregarCarrinhoDoBanco(user.id);
        } else {
            alert(data.message);
        }
    } catch(e) {
        alert("Erro ao confirmar reserva.");
    }
}

// FUNÇÃO NOVA: Puxa as reservas ativas direto do banco de dados ao iniciar
async function carregarCarrinhoDoBanco(userId) {
    try {
        const response = await fetch(`../script/php/obter_reservas.php?user_id=${userId}`);
        const data = await response.json();

        if (data.status === 'success' && data.reservas.length > 0) {
            // Sincroniza a memória do app com os dados reais do banco
            reservas = data.reservas.map(res => ({
                nome: res.marca_modelo,
                foto: res.foto_url,
                preco: parseFloat(res.valor_aluguel_dia).toLocaleString('pt-BR', {minimumFractionDigits: 2}),
                retirada: res.data_retirada,
                devolucao: res.data_devolucao,
                agencia: res.nome_agencia
            }));

            // Atualiza o contador flutuante na tela
            carrinho = reservas.length;
            document.getElementById('cartCount').innerText = carrinho;
            document.getElementById('cartFloating').style.display = 'flex';
        }
    } catch (e) {
        console.error("Erro ao sincronizar carrinho persistente:", e);
    }
}

// FUNÇÃO REESCRITA: Renderiza as informações limpas vindas do banco de dados
function abrirCarrinho(){
    document.getElementById('modalCarrinho').style.display = 'flex';
    const lista = document.getElementById('listaReservas');
    lista.innerHTML = '';

    if(reservas.length === 0) {
        lista.innerHTML = '<p style="color: #bca9d6; text-align: center; padding: 20px;">Você não possui nenhuma reserva ativa.</p>';
        return;
    }

    reservas.forEach(reserva => {
        // Formata as datas vindas do banco (AAAA-MM-DD) para o padrão visual (DD/MM/AAAA)
        const dRetirada = reserva.retirada.split('-').reverse().join('/');
        const dDevolucao = reserva.devolucao.split('-').reverse().join('/');

        lista.innerHTML += `
        <div class="reserva-card">
            <img src="${reserva.foto}">
            <div class="reserva-info">
                <h3>${reserva.nome}</h3>
                <p><b>Diária:</b> R$ ${reserva.preco}</p>
                <p><b>Retirada:</b> ${dRetirada}</p>
                <p><b>Devolução:</b> ${dDevolucao}</p>
                <p><b>Agência:</b> ${reserva.agencia}</p>
                <p style="color:#bb86fc; font-weight: 600; margin-top: 5px;">
                    <i class="fa-solid fa-circle-info"></i> Pagamento presencial na retirada
                </p>
            </div>
        </div>
        `;
    });
}
// FUNÇÃO NOVA: Puxa as reservas ativas direto do banco de dados ao iniciar
async function carregarCarrinhoDoBanco(userId) {
    try {
        const response = await fetch(`../script/php/obter_reservas.php?user_id=${userId}`);
        const data = await response.json();

        if (data.status === 'success' && data.reservas.length > 0) {
            // Sincroniza a memória do app com os dados reais do banco
            reservas = data.reservas.map(res => ({
                nome: res.marca_modelo,
                foto: res.foto_url,
                preco: parseFloat(res.valor_aluguel_dia).toLocaleString('pt-BR', {minimumFractionDigits: 2}),
                retirada: res.data_retirada,
                devolucao: res.data_devolucao,
                agencia: res.nome_agencia
            }));

            // Atualiza o contador flutuante na tela
            carrinho = reservas.length;
            document.getElementById('cartCount').innerText = carrinho;
            document.getElementById('cartFloating').style.display = 'flex';
        }
    } catch (e) {
        console.error("Erro ao sincronizar carrinho persistente:", e);
    }
}
