
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
                            onclick="abrirReserva(
                            '${carro.marca_modelo}',
                            '${carro.foto_url}',
                            '${precoFormatado}'
                            )"
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

function abrirReserva(nome, foto, preco){

  document.getElementById('modalReserva')
  .style.display = 'flex';

  window.carroSelecionado = {
      nome,
      foto,
      preco
  };

}

function fecharReserva(){

    document.getElementById('modalReserva').style.display = 'none';

}

function confirmarReserva(){

  const retirada =
  document.getElementById('dataRetirada').value;

  const devolucao =
  document.getElementById('dataDevolucao').value;

  const agencia =
  document.getElementById('agenciaReserva').value;

  if(!retirada || !devolucao || !agencia){

      alert('Preencha todos os campos.');

      return;

  }

  reservas.push({

      nome: window.carroSelecionado.nome,

      foto: window.carroSelecionado.foto,

      preco: window.carroSelecionado.preco,

      retirada,
      devolucao,
      agencia

  });

  carrinho++;

  document.getElementById('cartCount')
  .innerText = carrinho;

  document.getElementById('cartFloating')
  .style.display = 'flex';

  fecharReserva();

  alert(
      'Reserva adicionada ao carrinho!'
  );

}

document.getElementById('cartFloating')
.addEventListener('click', abrirCarrinho);

function abrirCarrinho(){

    document.getElementById('modalCarrinho')
    .style.display = 'flex';

    const lista =
    document.getElementById('listaReservas');

    lista.innerHTML = '';

    reservas.forEach(reserva => {

        lista.innerHTML += `

        <div class="reserva-card">

            <img src="${reserva.foto}">

            <div class="reserva-info">

                <h3>${reserva.nome}</h3>

                <p>
                    <b>Diária:</b>
                    R$ ${reserva.preco}
                </p>

                <p>
                    <b>Retirada:</b>
                    ${reserva.retirada}
                </p>

                <p>
                    <b>Devolução:</b>
                    ${reserva.devolucao}
                </p>

                <p>
                    <b>Agência:</b>
                    ${reserva.agencia}
                </p>

                <p style="color:#bb86fc;">
                    Pagamento na retirada
                </p>

            </div>

        </div>

        `;

    });

}

function fecharCarrinho(){

    document.getElementById('modalCarrinho')
    .style.display = 'none';

}
// LÓGICA DE FILTRAGEM COM EXIBIÇÃO EM POPUP
document.querySelector(".search-btn").addEventListener("click", async () => {
    const locId = document.getElementById("retirada-select").value;
    const listaFiltrados = document.getElementById("listaCarrosFiltrados");

    if(!locId) {
        alert("Por favor, selecione uma Região e uma Agência de Retirada.");
        return;
    }

    listaFiltrados.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/3;">Buscando frota...</p>';
    document.getElementById("modalFiltro").style.display = "flex";

    try {
        const response = await fetch('../script/php/get_cars.php');
        const data = await response.json();

        if(data.status === 'success') {
            const carrosFiltrados = data.carros.filter(c => c.location_id == locId);

            if(carrosFiltrados.length === 0) {
                listaFiltrados.innerHTML = '<p style="color: #ff6b6b; text-align: center; grid-column: 1/3; padding: 20px;">Nenhum veículo nesta agência no momento.</p>';
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
                            <button class="confirm-btn" style="height: 40px; font-size: 14px; border-radius: 10px;" onclick="document.getElementById('modalFiltro').style.display='none'; abrirReserva('${carro.marca_modelo}', '${carro.foto_url}', '${precoFormatado}')">
                                Escolher
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            listaFiltrados.innerHTML = `<p style="color: white;">Erro: ${data.message}</p>`;
        }
    } catch(e) {
        listaFiltrados.innerHTML = '<p style="color: white;">Erro de conexão com o servidor.</p>';
    }
});