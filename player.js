// Jogador - Tela para cada equipe fazer suas jogadas
const player = document.getElementById('player');
const teamSelect = document.getElementById('team-select');
const infoContent = document.getElementById('info-content');
const rollDiceBtn = document.getElementById('roll-dice');
const endTurnBtn = document.getElementById('end-turn');
const diceResult = document.getElementById('dice-result');
const diceNumber = document.getElementById('dice-number');
const diceOkBtn = document.getElementById('dice-ok');
const movementOptions = document.getElementById('movement-options');
const movementButtons = document.getElementById('movement-buttons');
const movementCancelBtn = document.getElementById('movement-cancel');
const waitingMessage = document.getElementById('waiting-message');
// Painel lateral de equipes
const teamsPanel = document.getElementById('teams-panel');
const teamsList = document.getElementById('teams-list');
// Modal de escolha central
const choiceModal = document.getElementById('choice-modal');
const choiceTitle = document.getElementById('choice-title');
const choiceButtons = document.getElementById('choice-buttons');
const teamPickModal = document.getElementById('team-pick-modal');
const teamPickList = document.getElementById('team-pick-list');
// Elementos do modal de equipe (mesmo layout do modo 1 tela)
const teamModal = document.getElementById('team-modal');
const tmName = document.getElementById('tm-name');
const tmCoins = document.getElementById('tm-coins');
const tmDays = document.getElementById('tm-days');
const tmCasa = document.getElementById('tm-casa');
const tmSave = document.getElementById('tm-save');
const tmCancel = document.getElementById('tm-cancel');

function abrirTeamModal() {
    if (!teamModal) return;
    tmName && (tmName.value = `Equipe ${String.fromCharCode(65 + equipes.length)}`);
    tmCoins && (tmCoins.value = 5);
    tmDays && (tmDays.value = 1);
    tmCasa && (tmCasa.value = '');
    teamModal.setAttribute('aria-hidden', 'false');
}

function fecharTeamModal() {
    if (!teamModal) return;
    teamModal.setAttribute('aria-hidden', 'true');
}

tmCancel && tmCancel.addEventListener('click', fecharTeamModal);
tmSave && tmSave.addEventListener('click', () => {
    const nome = (tmName && tmName.value.trim()) || `Equipe ${String.fromCharCode(65 + equipes.length)}`;
    const moedas = Math.max(0, Number((tmCoins && tmCoins.value) || 0));
    const dias = Math.max(0, Number((tmDays && tmDays.value) || 0));
    const casa = Number((tmCasa && tmCasa.value) || 1);
    if (!Number.isInteger(casa) || casa < 1 || casa > 37) return;
    const cores = ['#e53935', '#1e88e5', '#43a047', '#8e24aa', '#fb8c00', '#00897b'];
    const cor = cores[equipes.length % cores.length];
    const nova = { nome, cor, moedas, dias, casa };
    equipes.push(nova);
    fecharTeamModal();
    salvarEstado();
    equipeSelecionada = equipes.length - 1;
    atualizarInterface();
});

// Estado do jogo
// Sala (room) handling: múltiplas partidas por código de 4 dígitos
const urlParams = new URLSearchParams(window.location.search);
const salaParam = urlParams.get('sala');
const salaCodigo = (salaParam && /^\d{4}$/.test(salaParam))
    ? salaParam
    : (localStorage.getItem('tabuleiro_sala_recente') || '0000');
localStorage.setItem('tabuleiro_sala_recente', salaCodigo);
const STORAGE_KEY = `tabuleiro_estado@sala:${salaCodigo}`;

let equipes = [];
let indiceEquipeAtual = 0;
let turnoEmResolucao = false;
let jogoEncerrado = false;
let jogoIniciado = false;
let rodada = 1;
let propostas = {}; // { [teamIndex]: destino }
let equipeSelecionada = null;
let resultadoDado = 0;
let opcoesMovimento = [];

// Grafo de movimentos permitidos
const caminhos = new Map([
    [1, [2, 11]], [2, [3]], [3, [4, 13]], [4, [5, 14, 19]], [5, [6]], [6, [7, 15]], [7, [8, 15]], [8, [9, 17]], [9, [10]], [10, [17]], [11, [12, 18]], [12, [18, 13]], [13, [19]], [14, [6, 20]], [15, [16, 21]], [16, [17, 22]], [17, [10, 23]], [18, [31, 24]], [19, [20, 26]], [20, [14, 15, 27]], [21, [16, 29]], [22, [23, 29]], [23, [17, 30]], [24, [25, 32]], [25, [26, 33]], [26, [27, 33, 34]], [27, [21, 28]], [28, [29, 35]], [29, [22, 36]], [30, [23, 37]], [31, [32]], [32, [33]], [33, [25, 26]], [34, [28, 35]], [35, [29, 36]], [36, [37]], [37, []]
]);

// Carregar posições
let posicoesSelecionadas = [];
try {
    const posicoesEmbed = document.getElementById('posicoes-embed');
    if (posicoesEmbed) {
        posicoesSelecionadas = JSON.parse(posicoesEmbed.textContent);
    }
} catch (e) {
    console.error('Erro ao carregar posições:', e);
}

// Função para carregar estado do localStorage
function carregarEstado() {
    try {
        const estadoSalvo = localStorage.getItem(STORAGE_KEY);
        if (estadoSalvo) {
            const estado = JSON.parse(estadoSalvo);
            equipes = estado.equipes || [];
            indiceEquipeAtual = estado.indiceEquipeAtual || 0;
            turnoEmResolucao = estado.turnoEmResolucao || false;
            jogoEncerrado = estado.jogoEncerrado || false;
            jogoIniciado = !!estado.jogoIniciado;
            rodada = estado.rodada || 1;
            propostas = estado.propostas || {};
        }
    } catch (e) {
        console.error('Erro ao carregar estado:', e);
    }
}

// Função para salvar estado no localStorage
function salvarEstado() {
    try {
        const estado = {
            equipes,
            indiceEquipeAtual,
            turnoEmResolucao,
            jogoEncerrado,
            jogoIniciado,
            rodada,
            propostas,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
        console.error('Erro ao salvar estado:', e);
    }
}

// Remove fallback antigo por prompt (não é mais necessário)

// Função para atualizar a interface
function atualizarInterface() {
    // Atualizar posição do jogador atual
    if (equipes.length > 0 && indiceEquipeAtual < equipes.length) {
        const equipeAtual = equipes[indiceEquipeAtual];
        if (equipeAtual && equipeAtual.casa) {
            const posicao = posicoesSelecionadas.find(p => p.id === equipeAtual.casa);
            if (posicao) {
                player.style.left = posicao.xRelativo + '%';
                player.style.top = posicao.yRelativo + '%';
            }
        }
    }

    // Modo jogador simplificado: não renderiza seletor/infos/controles
    
    // Atualizar mensagem de espera
    atualizarMensagemEspera();

    // Atualizar modal de escolha da rodada
    atualizarPainelEquipes();
}

// Função para atualizar o seletor de equipes
function atualizarSeletorEquipes() {
    const currentValue = teamSelect.value;
    teamSelect.innerHTML = '<option value="">Selecione uma equipe</option>';
    
    equipes.forEach((equipe, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = equipe.nome;
        teamSelect.appendChild(option);
    });
    
    // Restaurar seleção anterior se ainda existir
    if (currentValue && equipes[currentValue]) {
        teamSelect.value = currentValue;
        equipeSelecionada = parseInt(currentValue);
    }
}

// Função para atualizar informações da equipe
function atualizarInfoEquipe() {
    if (!equipeSelecionada || !equipes[equipeSelecionada]) {
        infoContent.innerHTML = '';
        return;
    }
    
    const equipe = equipes[equipeSelecionada];
    const isMyTurn = equipeSelecionada === indiceEquipeAtual && !jogoEncerrado && !turnoEmResolucao;
    
    let html = `
        <div style="color: ${equipe.cor || '#000'}">
            <h4>${equipe.nome}</h4>
            <p>💰 Moedas: ${equipe.moedas}</p>
            <p>📅 Dias: ${equipe.dias}</p>
            <p>🏠 Casa: ${equipe.casa || 'Não definida'}</p>
            <p><strong>${isMyTurn ? '🎯 É seu turno!' : '⏳ Aguardando turno...'}</strong></p>
        </div>
    `;
    
    infoContent.innerHTML = html;
}

// Função para atualizar controles
function atualizarControles() {}

// Função para atualizar mensagem de espera
function atualizarMensagemEspera() {
    // Sem turnos: todos escolhem simultaneamente por rodada
    if (!jogoIniciado) {
        waitingMessage.style.display = 'block';
        waitingMessage.innerHTML = `
            <h2>⏳ Aguardando início da partida...</h2>
            <p>O visualizador ainda não começou o jogo.</p>
        `;
        return;
    }

    const total = Array.isArray(equipes) ? equipes.length : 0;
    const feitas = Object.keys(propostas || {}).length;
    const todasEscolheram = total > 0 && feitas >= total;
    waitingMessage.style.display = 'block';
    if (todasEscolheram) {
        waitingMessage.innerHTML = `
            <h2>✅ Rodada ${rodada}</h2>
            <p>Todas as equipes escolheram. O tabuleiro será atualizado em instantes.</p>
        `;
    } else {
        waitingMessage.innerHTML = `
            <h2>🎯 Rodada ${rodada}</h2>
            <p>${feitas}/${total} equipes já escolheram.</p>
            <p>Clique nos botões ao lado da sua equipe para escolher o destino desta rodada.</p>
        `;
    }
}

function atualizarPainelEquipes() {
    // Exibição centralizada apenas para a equipe selecionada
    if (!Array.isArray(equipes) || equipes.length === 0) {
        if (choiceModal) choiceModal.setAttribute('aria-hidden', 'true');
        return;
    }
    const idx = typeof equipeSelecionada === 'number' ? equipeSelecionada : null;
    if (idx == null || !equipes[idx]) {
        // Se nenhuma equipe selecionada localmente, pedir para escolher uma
        if (teamPickModal && Array.isArray(equipes) && equipes.length > 0) {
            teamPickList.innerHTML = equipes.map((eq, i) => `<button class=\"pick-btn\" data-idx=\"${i}\" style=\"padding:10px 14px;border:none;border-radius:8px;cursor:pointer;background:${eq.cor};color:#fff;font-weight:700\">${eq.nome}</button>`).join('');
            teamPickList.onclick = (ev) => {
                const t = ev.target;
                if (!(t && t.classList && t.classList.contains('pick-btn'))) return;
                const i = Number(t.getAttribute('data-idx'));
                equipeSelecionada = i;
                teamPickModal.setAttribute('aria-hidden', 'true');
                atualizarInterface();
            };
            teamPickModal.setAttribute('aria-hidden', 'false');
        }
        if (choiceModal) choiceModal.setAttribute('aria-hidden', 'true');
        return;
    }
    const eq = equipes[idx];
    const casaId = eq.casa || eq.pos || 1;
    const proximas = (caminhos.get(casaId) || []).sort((a, b) => a - b);
    const jaProp = propostas && Object.prototype.hasOwnProperty.call(propostas, String(idx));

    if (choiceTitle) choiceTitle.textContent = `Escolha para ${eq.nome} (Casa ${casaId})`;
    if (choiceButtons) {
        choiceButtons.innerHTML = proximas.map(d => `<button class="dest-btn" data-dest="${d}" ${jaProp ? 'disabled' : ''}>${d}</button>`).join('');
        choiceButtons.onclick = (ev) => {
            const t = ev.target;
            if (!(t && t.classList && t.classList.contains('dest-btn'))) return;
            const dest = Number(t.getAttribute('data-dest'));
            proporMovimento(idx, dest);
            choiceModal.setAttribute('aria-hidden', 'true');
        };
    }
    if (choiceModal) choiceModal.setAttribute('aria-hidden', jaProp ? 'true' : 'false');
}

function proporMovimento(teamIndex, destinoId) {
    try {
        if (!jogoIniciado) {
            alert('Aguardando o visualizador começar a partida.');
            return;
        }
        if (teamIndex < 0 || teamIndex >= equipes.length) return;
        const equipe = equipes[teamIndex];
        const casaAtual = equipe.casa || equipe.pos || 1;
        const proximas = caminhos.get(casaAtual) || [];
        if (!proximas.includes(destinoId)) return; // inválido
        // registra proposta para rodada atual
        propostas[String(teamIndex)] = destinoId;
        salvarEstado();
        atualizarPainelEquipes();
    } catch (e) {
        console.error('Falha ao propor movimento:', e);
    }
}

// Função para jogar dado
function jogarDado() {
    if (!equipeSelecionada || equipeSelecionada !== indiceEquipeAtual) return;
    
    resultadoDado = Math.floor(Math.random() * 6) + 1;
    diceNumber.textContent = resultadoDado;
    diceResult.classList.add('show');
    
    // Calcular opções de movimento
    calcularOpcoesMovimento();
}

// Função para calcular opções de movimento
function calcularOpcoesMovimento() {
    if (!equipeSelecionada || !equipes[equipeSelecionada]) return;
    
    const equipe = equipes[equipeSelecionada];
    const casaAtual = equipe.casa || 1;
    
    // Encontrar todas as casas alcançáveis em 'resultadoDado' passos
    opcoesMovimento = encontrarCasasAlcancaveis(casaAtual, resultadoDado);
}

// Função para encontrar casas alcançáveis
function encontrarCasasAlcancaveis(casaInicial, passos) {
    if (passos === 0) return [casaInicial];
    
    const casasAlcancaveis = new Set();
    const fila = [{casa: casaInicial, passosRestantes: passos}];
    
    while (fila.length > 0) {
        const {casa, passosRestantes} = fila.shift();
        
        if (passosRestantes === 0) {
            casasAlcancaveis.add(casa);
            continue;
        }
        
        const proximasCasas = caminhos.get(casa) || [];
        for (const proximaCasa of proximasCasas) {
            fila.push({casa: proximaCasa, passosRestantes: passosRestantes - 1});
        }
    }
    
    return Array.from(casasAlcancaveis).sort((a, b) => a - b);
}

// Função para mostrar opções de movimento
function mostrarOpcoesMovimento() {
    if (opcoesMovimento.length === 0) {
        alert('Nenhuma opção de movimento disponível!');
        return;
    }
    
    movementButtons.innerHTML = '';
    
    opcoesMovimento.forEach(casa => {
        const posicao = posicoesSelecionadas.find(p => p.id === casa);
        const button = document.createElement('button');
        button.textContent = `Casa ${casa}${posicao ? ` - ${posicao.nome}` : ''}`;
        button.onclick = () => moverParaCasa(casa);
        movementButtons.appendChild(button);
    });
    
    movementOptions.classList.add('show');
}

// Função para mover para uma casa
function moverParaCasa(casa) {
    if (!equipeSelecionada || !equipes[equipeSelecionada]) return;
    
    const equipe = equipes[equipeSelecionada];
    equipe.casa = casa;
    
    // Atualizar posição visual
    const posicao = posicoesSelecionadas.find(p => p.id === casa);
    if (posicao) {
        player.style.left = posicao.xRelativo + '%';
        player.style.top = posicao.yRelativo + '%';
    }
    
    // Salvar estado
    salvarEstado();
    
    // Fechar modais
    diceResult.classList.remove('show');
    movementOptions.classList.remove('show');
    
    // Atualizar interface
    atualizarInterface();
    
    alert(`Movido para a casa ${casa}!`);
}

// Função para finalizar turno
function finalizarTurno() {
    if (!equipeSelecionada || equipeSelecionada !== indiceEquipeAtual) return;
    
    // Avançar para o próximo turno
    indiceEquipeAtual = (indiceEquipeAtual + 1) % equipes.length;
    salvarEstado();
    atualizarInterface();
    
    alert('Turno finalizado!');
}

// Event listeners
teamSelect.addEventListener('change', (e) => {
    equipeSelecionada = e.target.value ? parseInt(e.target.value) : null;
    atualizarInterface();
});

rollDiceBtn.addEventListener('click', jogarDado);
endTurnBtn.addEventListener('click', finalizarTurno);

diceOkBtn.addEventListener('click', () => {
    diceResult.classList.remove('show');
    mostrarOpcoesMovimento();
});

movementCancelBtn.addEventListener('click', () => {
    movementOptions.classList.remove('show');
    diceResult.classList.remove('show');
});

// Função para verificar mudanças no localStorage
function verificarMudancas() {
    try {
        const estadoSalvo = localStorage.getItem(STORAGE_KEY);
        if (estadoSalvo) {
            const estado = JSON.parse(estadoSalvo);
            const mudou = 
                JSON.stringify(equipes) !== JSON.stringify(estado.equipes) ||
                indiceEquipeAtual !== estado.indiceEquipeAtual ||
                turnoEmResolucao !== estado.turnoEmResolucao ||
                jogoEncerrado !== estado.jogoEncerrado ||
                jogoIniciado !== !!estado.jogoIniciado;
            
            if (mudou) {
                carregarEstado();
                atualizarInterface();
            }
        }
    } catch (e) {
        console.error('Erro ao verificar mudanças:', e);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEstado();
    atualizarInterface();
    
    // Verificar mudanças a cada 500ms
    setInterval(verificarMudancas, 500);

    // Se veio do menu pedindo novo jogador, abre o modal de equipe
    try {
        const novo = urlParams.get('novo');
        if (novo === '1') {
            const open = () => {
                const modal = document.getElementById('team-modal');
                if (modal) {
                    modal.setAttribute('aria-hidden', 'false');
                } else {
                    // Fallback simples via prompt se não existir modal nesta página
                    criarEquipeViaPrompt();
                }
            };
            // Se a UI ainda não criou os elementos, tenta abrir após pequeno delay
            setTimeout(open, 50);
        }
    } catch (_) {}
});

// Event listener para mudanças no localStorage (para sincronização entre abas)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        carregarEstado();
        atualizarInterface();
    }
});
