// ADMIN JS

console.log("Painel NitroBlack carregado com sucesso!");

// MENU LATERAL

const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(btn => {
            btn.classList.remove("active");
        });

        item.classList.add("active");

    });

});

// BOTÃO EXPORTAR

const exportBtn = document.querySelector(".excel-btn");

exportBtn.addEventListener("click", () => {

    alert("Exportação para Excel será implementada futuramente.");

});

// FORM USER

const userForm = document.querySelectorAll("form")[0];

userForm.addEventListener("submit", (e) => {

    e.preventDefault();

    alert("Usuário cadastrado com sucesso!");

});

// FORM CARRO

const carForm = document.querySelectorAll("form")[1];

carForm.addEventListener("submit", (e) => {

    e.preventDefault();

    alert("Veículo adicionado com sucesso!");

});