// 1. CHECAR USUÁRIO EM CACHE LOGO QUE A TELA ABRIR
document.addEventListener("DOMContentLoaded", () => {
    const userDataStr = localStorage.getItem('nitro_user');
    const userContainer = document.getElementById('user-container');

    if(userDataStr && userContainer) {
        const user = JSON.parse(userDataStr);
        userContainer.innerHTML = `
            <span style="color:#d7c7ff; font-weight:500; margin-right: 15px;">
              Olá, <b style="color: white;">${user.nome}</b>
            </span>
            <button class="login-header" onclick="logout()" style="background: transparent; border: 1px solid #bb86fc;">
              Sair
            </button>
        `;
    }

    // Carregar os carros do banco
    loadCars();
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
                        <button onclick="alert('Iniciando reserva do veículo ${carro.marca_modelo} (ID: ${carro.id})')">
                          Reservar
                        </button>
                      </div>
                    </div>
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