// Dados dos filmes e sessões
const filmesData = {
    1: {
        nome: "Vingadores: Ultimato",
        genero: "Ação, Aventura",
        duracao: "181 min",
        salas: [
            { id: 1, nome: "Sala 1", horarios: ["14:00", "17:00", "20:00"] },
            { id: 2, nome: "Sala 2", horarios: ["15:30", "18:30", "21:30"] }
        ]
    },
    2: {
        nome: "Coringa",
        genero: "Drama, Crime",
        duracao: "122 min",
        salas: [
            { id: 3, nome: "Sala 3", horarios: ["16:00", "19:00", "22:00"] },
            { id: 4, nome: "Sala 4", horarios: ["14:30", "17:30", "20:30"] }
        ]
    },
    3: {
        nome: "Parasita",
        genero: "Thriller, Drama",
        duracao: "132 min",
        salas: [
            { id: 5, nome: "Sala 5", horarios: ["15:00", "18:00", "21:00"] }
        ]
    },
    4: {
        nome: "1917",
        genero: "Guerra, Drama",
        duracao: "119 min",
        salas: [
            { id: 6, nome: "Sala 6", horarios: ["13:30", "16:30", "19:30"] }
        ]
    },
    5: {
        nome: "Toy Story 4",
        genero: "Animação, Família",
        duracao: "100 min",
        salas: [
            { id: 7, nome: "Sala 7", horarios: ["14:00", "16:00", "18:00"] }
        ]
    },
    6: {
        nome: "Frozen 2",
        genero: "Animação, Musical",
        duracao: "103 min",
        salas: [
            { id: 8, nome: "Sala 8", horarios: ["15:00", "17:00", "19:00"] }
        ]
    }
};

// Variáveis globais para armazenar a seleção
let selecaoAtual = {
    filmeId: null,
    filmeNome: null,
    salaId: null,
    salaNome: null,
    horario: null,
    poltronas: []
};

// Preço do ingresso
const PRECO_INGRESSO = 25;

// Função para selecionar filme
function selecionarFilme(filmeId, filmeNome) {
    // Limpar seleção anterior
    selecaoAtual = {
        filmeId: filmeId,
        filmeNome: filmeNome,
        salaId: null,
        salaNome: null,
        horario: null,
        poltronas: []
    };
    
    // Adicionar efeito visual
    const cards = document.querySelectorAll(".movie-card");
    cards.forEach(card => card.classList.remove("selected"));
    
    const cardSelecionado = document.querySelector(`[data-filme="${filmeId}"]`);
    if (cardSelecionado) {
        cardSelecionado.classList.add("selected");
    }
    
    // Aguardar um pouco para o efeito visual
    setTimeout(() => {
        window.location.href = `sessoes.html?filme=${filmeId}`;
    }, 300);
}

// Função para carregar sessões (para a página sessoes.html)
function carregarSessoes() {
    const urlParams = new URLSearchParams(window.location.search);
    const filmeId = urlParams.get("filme");
    
    if (!filmeId || !filmesData[filmeId]) {
        mostrarErro("Filme não encontrado!");
        setTimeout(() => window.location.href = "index.html", 2000);
        return;
    }
    
    const filme = filmesData[filmeId];
    selecaoAtual.filmeId = filmeId;
    selecaoAtual.filmeNome = filme.nome;
    
    document.getElementById("filme-nome").textContent = filme.nome;
    
    const sessoesContainer = document.getElementById("sessoes-container");
    sessoesContainer.innerHTML = "";
    
    filme.salas.forEach(sala => {
        const salaDiv = document.createElement("div");
        salaDiv.className = "session-card";
        
        const horariosHtml = sala.horarios.map(horario => 
            `<button class="time-btn" onclick="selecionarSessao(${sala.id}, '${sala.nome}', '${horario}')">${horario}</button>`
        ).join("");
        
        salaDiv.innerHTML = `
            <h3>${sala.nome}</h3>
            <p>Capacidade: 80 lugares</p>
            <div class="time-list">
                ${horariosHtml}
            </div>
        `;
        
        sessoesContainer.appendChild(salaDiv);
    });
}

// Função para selecionar sessão
function selecionarSessao(salaId, salaNome, horario) {
    // Remover seleção anterior
    document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("selected"));
    
    // Adicionar seleção atual
    event.target.classList.add("selected");
    
    selecaoAtual.salaId = salaId;
    selecaoAtual.salaNome = salaNome;
    selecaoAtual.horario = horario;
    
    // Aguardar um pouco para o efeito visual
    setTimeout(() => {
        window.location.href = `poltronas.html?filme=${selecaoAtual.filmeId}&sala=${salaId}&horario=${horario}`;
    }, 300);
}

// Função para carregar poltronas (para a página poltronas.html)
function carregarPoltronas() {
    const urlParams = new URLSearchParams(window.location.search);
    const filmeId = urlParams.get("filme");
    const salaId = urlParams.get("sala");
    const horario = urlParams.get("horario");
    
    if (!filmeId || !salaId || !horario) {
        mostrarErro("Informações da sessão não encontradas!");
        setTimeout(() => window.location.href = "index.html", 2000);
        return;
    }
    
    // Atualizar informações da seleção
    const filme = filmesData[filmeId];
    const sala = filme.salas.find(s => s.id == salaId);
    
    if (!filme || !sala) {
        mostrarErro("Sessão não encontrada!");
        setTimeout(() => window.location.href = "index.html", 2000);
        return;
    }
    
    selecaoAtual.filmeId = filmeId;
    selecaoAtual.filmeNome = filme.nome;
    selecaoAtual.salaId = salaId;
    selecaoAtual.salaNome = sala.nome;
    selecaoAtual.horario = horario;
    
    // Atualizar informações na página
    document.getElementById("sessao-info").innerHTML = `
        <strong>Filme:</strong> ${filme.nome}<br>
        <strong>Gênero:</strong> ${filme.genero}<br>
        <strong>Duração:</strong> ${filme.duracao}<br>
        <strong>Sala:</strong> ${sala.nome}<br>
        <strong>Horário:</strong> ${horario}
    `;
    
    // Gerar poltronas
    gerarPoltronas();
}

// Função para gerar poltronas
function gerarPoltronas() {
    const poltronasContainer = document.getElementById("poltronas-container");
    poltronasContainer.innerHTML = "";
    
    // Simular poltronas ocupadas aleatoriamente (diferentes para cada sala)
    const poltronasOcupadasPorSala = {
        1: [5, 12, 18, 23, 31, 44, 52],
        2: [3, 15, 22, 28, 35, 41, 58],
        3: [7, 14, 19, 26, 33, 47, 55],
        4: [2, 11, 17, 24, 32, 43, 51],
        5: [6, 13, 20, 27, 34, 45, 53],
        6: [4, 16, 21, 25, 36, 42, 56],
        7: [8, 10, 16, 29, 37, 46, 54],
        8: [1, 9, 15, 30, 38, 48, 57]
    };
    
    const poltronasOcupadas = poltronasOcupadasPorSala[selecaoAtual.salaId] || [];
    
    for (let fileira = 1; fileira <= 8; fileira++) {
        const fileiraDiv = document.createElement("div");
        fileiraDiv.className = "seat-row";
        
        const letraFileira = String.fromCharCode(64 + fileira); // A, B, C, etc.
        
        // Adicionar letra da fileira
        const letraSpan = document.createElement("span");
        letraSpan.className = "row-letter";
        letraSpan.textContent = letraFileira;
        fileiraDiv.appendChild(letraSpan);
        
        for (let numero = 1; numero <= 10; numero++) {
            const poltronaId = `${letraFileira}${numero}`;
            const poltronaNumero = (fileira - 1) * 10 + numero;
            
            const poltronaBtn = document.createElement("button");
            poltronaBtn.className = "seat";
            poltronaBtn.textContent = numero;
            poltronaBtn.dataset.poltrona = poltronaId;
            poltronaBtn.title = `Poltrona ${poltronaId}`;
            
            if (poltronasOcupadas.includes(poltronaNumero)) {
                poltronaBtn.classList.add("occupied");
                poltronaBtn.disabled = true;
                poltronaBtn.title = `Poltrona ${poltronaId} - Ocupada`;
            } else {
                poltronaBtn.onclick = () => togglePoltrona(poltronaId, poltronaBtn);
            }
            
            fileiraDiv.appendChild(poltronaBtn);
        }
        
        poltronasContainer.appendChild(fileiraDiv);
    }
}

// Função para alternar seleção de poltrona
function togglePoltrona(poltronaId, elemento) {
    const index = selecaoAtual.poltronas.indexOf(poltronaId);
    
    if (index > -1) {
        // Remover seleção
        selecaoAtual.poltronas.splice(index, 1);
        elemento.classList.remove("selected");
    } else {
        // Adicionar seleção (máximo 6 poltronas)
        if (selecaoAtual.poltronas.length < 6) {
            selecaoAtual.poltronas.push(poltronaId);
            elemento.classList.add("selected");
        } else {
            mostrarAviso("Máximo de 6 poltronas por compra!");
            return;
        }
    }
    
    atualizarResumo();
}

// Função para atualizar resumo
function atualizarResumo() {
    const resumoElement = document.getElementById("resumo-selecao");
    const finalizarBtn = document.getElementById("finalizar-btn");
    
    if (selecaoAtual.poltronas.length > 0) {
        const total = selecaoAtual.poltronas.length * PRECO_INGRESSO;
        
        resumoElement.innerHTML = `
            <h3>Resumo da Compra</h3>
            <p><strong>Poltronas selecionadas:</strong> ${selecaoAtual.poltronas.join(", ")}</p>
            <p><strong>Quantidade:</strong> ${selecaoAtual.poltronas.length} ingresso(s)</p>
            <p><strong>Valor unitário:</strong> R$ ${PRECO_INGRESSO},00</p>
            <p><strong>Valor total:</strong> R$ ${total},00</p>
        `;
        
        finalizarBtn.style.display = "block";
    } else {
        resumoElement.innerHTML = "<p>Nenhuma poltrona selecionada</p>";
        finalizarBtn.style.display = "none";
    }
}

// Função para finalizar compra
async function finalizarCompra() {
    if (selecaoAtual.poltronas.length === 0) {
        mostrarAviso("Selecione pelo menos uma poltrona!");
        return;
    }
    
    // Verificar se usuário está logado
    const user = await window.authUtils.checkAuth();
    if (!user) {
        const confirmar = confirm("Você precisa estar logado para finalizar a compra. Deseja fazer login agora?");
        if (confirmar) {
            // Salvar seleção atual no localStorage
            localStorage.setItem('selecaoAtual', JSON.stringify(selecaoAtual));
            window.location.href = 'login.html';
        }
        return;
    }
    
    const total = selecaoAtual.poltronas.length * PRECO_INGRESSO;
    
    const confirmacao = confirm(`
Confirmar compra?

Filme: ${selecaoAtual.filmeNome}
Sala: ${selecaoAtual.salaNome}
Horário: ${selecaoAtual.horario}
Poltronas: ${selecaoAtual.poltronas.join(", ")}
Quantidade: ${selecaoAtual.poltronas.length} ingresso(s)
Total: R$ ${total},00
    `);
    
    if (confirmacao) {
        // Simular processamento
        mostrarCarregamento("Processando compra...");
        
        try {
            // Registrar compra no backend
            const compraData = {
                filme_id: parseInt(selecaoAtual.filmeId),
                filme_nome: selecaoAtual.filmeNome,
                sala_id: parseInt(selecaoAtual.salaId),
                sala_nome: selecaoAtual.salaNome,
                horario: selecaoAtual.horario,
                data_sessao: new Date().toISOString().split('T')[0], // Data atual
                poltronas: selecaoAtual.poltronas,
                valor_total: total
            };
            
            const response = await fetch('/api/compras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(compraData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                esconderCarregamento();
                mostrarSucesso("Compra realizada com sucesso! Obrigado pela preferência.");
                
                setTimeout(() => {
                    window.location.href = "perfil.html";
                }, 2000);
            } else {
                esconderCarregamento();
                mostrarErro(result.error || "Erro ao processar compra.");
            }
        } catch (error) {
            esconderCarregamento();
            mostrarErro("Erro de conexão. Tente novamente.");
        }
    }
}

// Função para voltar
function voltar() {
    window.history.back();
}

// Funções de utilidade para mensagens
function mostrarErro(mensagem) {
    mostrarMensagem(mensagem, "error");
}

function mostrarAviso(mensagem) {
    mostrarMensagem(mensagem, "warning");
}

function mostrarSucesso(mensagem) {
    mostrarMensagem(mensagem, "success");
}

function mostrarMensagem(mensagem, tipo) {
    // Remover mensagem anterior se existir
    const mensagemAnterior = document.querySelector(".system-message");
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    const div = document.createElement("div");
    div.className = `system-message ${tipo}`;
    div.textContent = mensagem;
    
    document.body.appendChild(div);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (div.parentNode) {
            div.remove();
        }
    }, 3000);
}

function mostrarCarregamento(mensagem) {
    const div = document.createElement("div");
    div.id = "loading";
    div.className = "loading-overlay";
    div.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${mensagem}</p>
        </div>
    `;
    
    document.body.appendChild(div);
}

function esconderCarregamento() {
    const carregamento = document.getElementById("loading");
    if (carregamento) {
        carregamento.remove();
    }
}



// Verificar se há seleção salva no localStorage (para usuários que foram redirecionados para login)
document.addEventListener('DOMContentLoaded', () => {
    const selecaoSalva = localStorage.getItem('selecaoAtual');
    if (selecaoSalva && window.location.pathname.includes('poltronas.html')) {
        selecaoAtual = JSON.parse(selecaoSalva);
        localStorage.removeItem('selecaoAtual');
        
        // Recarregar a página com os parâmetros corretos se necessário
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('filme')) {
            window.location.href = `poltronas.html?filme=${selecaoAtual.filmeId}&sala=${selecaoAtual.salaId}&horario=${selecaoAtual.horario}`;
        }
    }
});

