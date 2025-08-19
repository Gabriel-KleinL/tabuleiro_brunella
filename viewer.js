// Visualizador - Tela para mostrar o tabuleiro para todos
const player = document.getElementById('player');
const currentTeamElement = document.getElementById('current-team');
const statusContent = document.getElementById('status-content');
const scoreboard = document.getElementById('scoreboard');

// Controles
// Controles removidos da UI nesta versão
const newGameBtn = null;
const nextTurnBtn = null;
const resetGameBtn = null;

// Estado do jogo
// Sala (room) handling: múltiplas partidas por código de 4 dígitos
const salaParam = new URLSearchParams(window.location.search).get('sala');
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

// Grafo de movimentos permitidos
const caminhos = new Map([
    [1, [2, 11]], [2, [3]], [3, [4, 13]], [4, [5, 14, 19]], [5, [6]], [6, [7, 15]], [7, [8, 15]], [8, [9, 17]], [9, [10]], [10, [17]], [11, [12, 18]], [12, [18, 13]], [13, [19]], [14, [6, 20]], [15, [16, 21]], [16, [17, 22]], [17, [10, 23]], [18, [31, 24]], [19, [20, 26]], [20, [14, 15, 27]], [21, [16, 29]], [22, [23, 29]], [23, [17, 30]], [24, [25, 32]], [25, [26, 33]], [26, [27, 33, 34]], [27, [21, 28]], [28, [29, 35]], [29, [22, 36]], [30, [23, 37]], [31, [32]], [32, [33]], [33, [25, 26]], [34, [28, 35]], [35, [29, 36]], [36, [37]], [37, []]
]);

// Cores definidas pelo usuário
const casasPredefinidas = {
    roxo: new Set([2, 3, 6, 11, 13, 25, 28, 30, 36]),
    verde: new Set([4, 7, 18, 21, 22]),
    azul: new Set([9, 20, 32]),
    laranja: new Set([15, 17, 26, 35])
};

// Casas especiais (eventos)
const casasEspeciais = {
    vulcao: new Set([3, 33]),
    tubaroes: new Set([8, 12]),
    tornado: new Set([19, 23]),
    nevoeiro: new Set([24, 34]),
    ilhaTesouro: new Set([14, 31]),
    suicida: new Set([27]),
    iceberg: new Set([16]),
    tempestadeArcoIris: new Set([10, 29]),
    atalho: new Set([5])
};

// Mapa direto casa -> evento
const eventoPorCasa = new Map([
    [3, 'vulcao'], [33, 'vulcao'], [8, 'tubaroes'], [12, 'tubaroes'], [19, 'tornado'], [23, 'tornado'], [24, 'nevoeiro'], [34, 'nevoeiro'], [14, 'ilhaTesouro'], [31, 'ilhaTesouro'], [27, 'suicida'], [16, 'iceberg'], [10, 'tempestadeArcoIris'], [29, 'tempestadeArcoIris'], [5, 'atalho']
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

// Função para atualizar a interface
function atualizarInterface() {
    const container = document.getElementById('game-container');
    const overlay = document.getElementById('start-overlay');
    if (container && overlay) {
        if (jogoIniciado) {
            container.style.visibility = 'visible';
            overlay.style.display = 'none';
        } else {
            container.style.visibility = 'hidden';
            overlay.style.display = 'flex';
        }
    }
    // Atualizar posição do jogador atual
    if (equipes.length > 0 && indiceEquipeAtual < equipes.length) {
        const equipeAtual = equipes[indiceEquipeAtual];
        const casaAtual = (equipeAtual && (equipeAtual.casa != null ? equipeAtual.casa : equipeAtual.pos));
        if (casaAtual) {
            const posicao = posicoesSelecionadas.find(p => p.id === casaAtual);
            if (posicao) {
                player.style.left = posicao.xRelativo + '%';
                player.style.top = posicao.yRelativo + '%';
            }
        }
    }

    // Atualizar equipe atual
    if (equipes.length > 0 && indiceEquipeAtual < equipes.length) {
        const equipeAtual = equipes[indiceEquipeAtual];
        currentTeamElement.textContent = `🎯 ${equipeAtual.nome} (${equipeAtual.casa})`;
        currentTeamElement.style.color = equipeAtual.cor || '#fff';
    } else {
        currentTeamElement.textContent = 'Aguardando...';
        currentTeamElement.style.color = '#fff';
    }

    // Status do jogo removido da tela
    if (statusContent) statusContent.textContent = '';

    // Atualizar scoreboard
    atualizarScoreboard();

    // Desenhar números das casas
    desenharNumerosCasas();

    // Posicionar peões de todas as equipes
    posicionarPeoesViewer();

    // Exibir setas/opções de movimento possíveis para cada equipe (jogo simultâneo)
    desenharSugestoesMovimento();
}

// Função para atualizar o scoreboard
function atualizarScoreboard() {
    if (equipes.length === 0) {
        scoreboard.innerHTML = '<p>Nenhuma equipe adicionada</p>';
        return;
    }

    let html = '<div class="score-header"><h3>🏆 Placar</h3><button id="reset-inline" class="reset-btn" title="Resetar">↻</button></div>';
    equipes.forEach((equipe, index) => {
        const isCurrent = index === indiceEquipeAtual && !jogoEncerrado;
        const status = isCurrent ? ' (Atual)' : '';
        const casaInfo = equipe.casa ? ` - Casa ${equipe.casa}` : '';
        html += `
            <div class="team-score ${isCurrent ? 'current' : ''}" style="color: ${equipe.cor || '#000'}">
                <strong>${equipe.nome}${status}</strong>
                <span>💰 ${equipe.moedas} | 📅 ${equipe.dias}${casaInfo}</span>
            </div>
        `;
    });
    scoreboard.innerHTML = html;

    // Liga o botão de reset no placar
    const resetInline = document.getElementById('reset-inline');
    if (resetInline) {
        resetInline.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('Tem certeza que deseja resetar a partida desta sala?')) return;
            novoJogo();
        });
    }
}

// Função para próximo turno
function proximoTurno() {
    if (jogoEncerrado || equipes.length === 0) return;
    
    indiceEquipeAtual = (indiceEquipeAtual + 1) % equipes.length;
    salvarEstado();
    atualizarInterface();
}

// Função para novo jogo
function novoJogo() {
    equipes = [];
    indiceEquipeAtual = 0;
    turnoEmResolucao = false;
    jogoEncerrado = false;
    salvarEstado();
    atualizarInterface();
}

// Função para resetar jogo
function resetarJogo() {
    if (confirm('Tem certeza que deseja resetar o jogo? Todas as equipes serão removidas.')) {
        novoJogo();
    }
}

// Event listeners
// Nenhum controle visível nesta versão

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
                jogoIniciado !== !!estado.jogoIniciado ||
                rodada !== (estado.rodada || 1) ||
                JSON.stringify(propostas) !== JSON.stringify(estado.propostas || {});
            
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

    // Reposicionar números ao redimensionar
    window.addEventListener('resize', () => { desenharNumerosCasas(); posicionarPeoesViewer(); });
    window.addEventListener('resize', desenharSugestoesMovimento);

    // Botão flutuante de reset
    const resetFab = document.getElementById('reset-fab');
    if (resetFab) {
        resetFab.addEventListener('click', () => {
            if (!confirm('Tem certeza que deseja resetar a partida desta sala?')) return;
            novoJogo();
        });
    }

    // Botão de começar partida
    const startBtn = document.getElementById('start-game');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            jogoIniciado = true;
            rodada = 1;
            propostas = {};
            salvarEstado();
            atualizarInterface();
        });
    }
});

// Aplicar propostas quando todas as equipes tiverem escolhido
setInterval(() => {
    try {
        if (!jogoIniciado) return;
        const total = equipes.length;
        if (total === 0) return;
        const chaves = Object.keys(propostas || {});
        if (chaves.length < total) return; // ainda falta alguém
        // aplica todas as propostas ao mesmo tempo
        chaves.forEach(k => {
            const idx = Number(k);
            const destino = propostas[k];
            if (!Number.isInteger(idx) || idx < 0 || idx >= equipes.length) return;
            const eq = equipes[idx];
            const casaAtual = eq.casa || eq.pos || 1;
            const proximas = caminhos.get(casaAtual) || [];
            if (!proximas.includes(destino)) return;
            eq.casa = destino;
        });
        propostas = {};
        rodada += 1;
        salvarEstado();
        atualizarInterface();
    } catch (_) {}
}, 500);

// Event listener para mudanças no localStorage (para sincronização entre abas)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        carregarEstado();
        atualizarInterface();
    }
});

function desenharNumerosCasas() {
    try {
        const container = document.getElementById('game-container');
        if (!container) return;
        // Remove existentes
        container.querySelectorAll('.numero-casa').forEach(el => el.remove());
        if (!Array.isArray(posicoesSelecionadas) || posicoesSelecionadas.length === 0) return;
        // Cria bolinhas numeradas nas posições relativas
        posicoesSelecionadas.forEach(p => {
            const badge = document.createElement('div');
            badge.className = 'numero-casa';
            badge.textContent = p.id;
            badge.style.left = p.xRelativo + '%';
            badge.style.top = p.yRelativo + '%';
            container.appendChild(badge);
        });
    } catch (_) {}
}

function posicionarPeoesViewer() {
    const container = document.getElementById('game-container');
    if (!container) return;
    // Remove peões antigos
    container.querySelectorAll('.peao').forEach(p => p.remove());
    if (!Array.isArray(equipes) || equipes.length === 0) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const baseOffset = Math.min(containerWidth, containerHeight) / 100;
    const offsets = [
        { dx: -1.5 * baseOffset, dy: -1.5 * baseOffset },
        { dx: 1.5 * baseOffset, dy: -1.5 * baseOffset },
        { dx: 0, dy: 1.2 * baseOffset },
        { dx: 2.2 * baseOffset, dy: 0 },
        { dx: -2.2 * baseOffset, dy: 0 }
    ];

    equipes.forEach((eq, i) => {
        const casaId = (eq && (eq.casa != null ? eq.casa : eq.pos));
        const casa = posicoesSelecionadas.find(p => p.id === casaId);
        if (!casa) return;
        const peao = document.createElement('div');
        peao.className = 'peao';
        peao.dataset.teamIndex = String(i);
        peao.style.backgroundColor = eq.cor || '#333';
        const off = offsets[i % offsets.length];
        const offsetX = off?.dx || 0;
        const offsetY = off?.dy || 0;
        peao.style.left = `calc(${casa.xRelativo}% + ${offsetX}px)`;
        peao.style.top = `calc(${casa.yRelativo}% + ${offsetY}px)`;
        container.appendChild(peao);
    });
}

function desenharSugestoesMovimento() {
    const container = document.getElementById('game-container');
    if (!container) return;
    // Remove sugestões antigas
    container.querySelectorAll('.sugestao-mov').forEach(el => el.remove());
    if (!Array.isArray(equipes) || equipes.length === 0) return;
    // Para cada equipe, marca destinos válidos a partir da sua casa atual
    equipes.forEach((eq, idx) => {
        const casaId = (eq && (eq.casa != null ? eq.casa : eq.pos));
        if (!casaId) return;
        const proximas = caminhos.get(casaId) || [];
        proximas.forEach(dest => {
            const pos = posicoesSelecionadas.find(p => p.id === dest);
            if (!pos) return;
            const dot = document.createElement('div');
            dot.className = 'sugestao-mov';
            dot.style.left = pos.xRelativo + '%';
            dot.style.top = pos.yRelativo + '%';
            dot.style.borderColor = eq.cor || '#000';
            dot.textContent = String(dest);
            container.appendChild(dot);
        });
    });
}
