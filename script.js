const player = document.getElementById('player');
const status = document.getElementById('status');
let posX = 45;
let posY = 45;

// Remapeamento
let isRemapMode = false;
const remapModal = document.getElementById('remap-modal');
const inputId = document.getElementById('map-id');
const inputName = document.getElementById('map-name');
const inputX = document.getElementById('map-x');
const inputY = document.getElementById('map-y');
const btnSave = document.getElementById('map-save');
const btnCancel = document.getElementById('map-cancel');
const btnCopy = document.getElementById('map-copy');
const btnDownload = document.getElementById('map-download');

// Array para armazenar as posições do tabuleiro
let posicoesSelecionadas = [];
let equipes = [];
let indiceEquipeAtual = 0;
let turnoEmResolucao = false;
let equipeRemovidaNoTurno = false;
let jogoEncerrado = false;

// Grafo de movimentos permitidos
const caminhos = new Map([
    [1, [2, 11]],
    [2, [3]],
    [3, [4, 13]],
    [4, [5, 14, 19]],
    [5, [6]],
    [6, [7, 15]],
    [7, [8, 15]],
    [8, [9, 17]],
    [9, [10]],
    [10, [17]],
    [11, [12, 18]],
    [12, [18, 13]],
    [13, [19]],
    [14, [6, 20]],
    [15, [16, 21]],
    [16, [17, 22]],
    [17, [10, 23]],
    [18, [31, 24]],
    [19, [20, 26]],
    [20, [14, 15, 27]],
    [21, [16, 29]],
    [22, [23, 29]],
    [23, [17, 30]],
    [24, [25, 32]],
    [25, [26, 33]],
    [26, [27, 33, 34]],
    [27, [21, 28]],
    [28, [29, 35]],
    [29, [22, 36]],
    [30, [23, 37]],
    [31, [32]],
    [32, [33]],
    [33, [25, 26]],
    [34, [28, 35]],
    [35, [29, 36]],
    [36, [37]],
    [37, []]
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

// Mapa direto casa -> evento (evita falhas de checagem)
const eventoPorCasa = new Map([
    [3, 'vulcao'], [33, 'vulcao'],
    [8, 'tubaroes'], [12, 'tubaroes'],
    [19, 'tornado'], [23, 'tornado'],
    [24, 'nevoeiro'], [34, 'nevoeiro'],
    [14, 'ilhaTesouro'], [31, 'ilhaTesouro'],
    [27, 'suicida'],
    [16, 'iceberg'],
    [10, 'tempestadeArcoIris'], [29, 'tempestadeArcoIris'],
    [5, 'atalho']
]);

// Removido o mapa antigo para começar do zero
const tabuleiroBolinhas = [];

// Função para encontrar uma bolinha por ID
function encontrarBolinha(id) {
    return tabuleiroBolinhas.find(bolinha => bolinha.id === id);
}

// Função para mover o jogador para uma bolinha específica
function moverParaBolinha(id) {
    const bolinha = encontrarBolinha(id);
    if (bolinha) {
        movePlayer(bolinha.x, bolinha.y);
        status.textContent = `Posição: ${bolinha.x}, ${bolinha.y} - ${bolinha.nome}`;
    }
}

function movePlayer(newX, newY) {
    posX = Math.max(0, Math.min(newX, 780));
    posY = Math.max(0, Math.min(newY, 580));
    player.style.left = posX + 'px';
    player.style.top = posY + 'px';
    status.textContent = `Posição: ${posX}, ${posY}`;
}

// Função para atualizar contador de posições
function atualizarContador() {
    const totalElement = document.getElementById('total-posicoes');
    if (totalElement) {
        totalElement.textContent = posicoesSelecionadas.length;
    }
}

// Função para criar marcador visual
function criarMarcador(posicao) {
    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.position = 'absolute';
    marcador.style.left = posicao.xRelativo + '%';
    marcador.style.top = posicao.yRelativo + '%';
    marcador.style.transform = 'translate(-50%, -50%)';
    marcador.style.boxSizing = 'border-box';
    marcador.style.width = '20px';
    marcador.style.height = '20px';
    marcador.style.backgroundColor = '#ffeb3b';
    marcador.style.border = '2px solid #f57f17';
    marcador.style.borderRadius = '50%';
    marcador.style.zIndex = '10';
    marcador.style.display = 'flex';
    marcador.style.justifyContent = 'center';
    marcador.style.alignItems = 'center';
    marcador.style.fontSize = '10px';
    marcador.style.fontWeight = 'bold';
    marcador.style.color = '#000';
    marcador.style.cursor = 'pointer';
    marcador.textContent = posicao.id;
    marcador.title = `${posicao.nome} (${posicao.xRelativo + 2}%, ${posicao.yRelativo}%)`;
    
    document.getElementById('game-container').appendChild(marcador);
}

// Função para carregar posições do tabuleiro
async function carregarPosicoes() {
    let loaded = false;
    try {
        const response = await fetch('posições-relativas.txt', { cache: 'no-store' });
        if (!response.ok) throw new Error('Falha ao carregar posições');
        const text = await response.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            posicoesSelecionadas = data;
            loaded = true;
        }
    } catch (e) {
        // Ignora para tentar fallback embutido
    }

    if (!loaded) {
        const embed = document.getElementById('posicoes-embed');
        if (embed) {
            try {
                const data = JSON.parse(embed.textContent || '[]');
                if (Array.isArray(data)) {
                    posicoesSelecionadas = data;
                    loaded = true;
                }
            } catch (_) {}
        }
    }

    if (!loaded) {
        posicoesSelecionadas = [];
    }

    atualizarMarcadores();
    atualizarContador();
    posicionarPeoesIniciais();
    destacarEquipeAtual();
}

// Carregar posições ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarPosicoes();
    configurarRemapeamento();
    inicializarScoreboard();
});

function configurarRemapeamento() {
    // Teclas: M alterna remapeamento; S salva JSON; Esc sai
    document.addEventListener('keydown', (ev) => {
        const key = ev.key.toLowerCase();
        if (key === 'm') {
            alternarRemap();
        } else if (key === 's') {
            if (!isRemapMode) return;
            salvarJsonAtual();
        } else if (key === 'escape') {
            if (isRemapMode) alternarRemap();
        }
    });

    // Clique no mapa captura coordenadas relativas
    const container = document.getElementById('game-container');
    container.addEventListener('click', (ev) => {
        if (!isRemapMode) return;
        const rect = container.getBoundingClientRect();
        const xPercent = ((ev.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((ev.clientY - rect.top) / rect.height) * 100;
        const xRelativo = Math.round((xPercent + Number.EPSILON) * 1000) / 1000;
        const yRelativo = Math.round((yPercent + Number.EPSILON) * 1000) / 1000;
        const id = posicoesSelecionadas.length + 1;
        const ponto = { id, xRelativo, yRelativo, nome: `Posição ${id}` };
        posicoesSelecionadas.push(ponto);
        atualizarContador();
        // Exibe marcador imediatamente
        criarMarcador(ponto);
    });

    // Botões do modal
    btnCancel.addEventListener('click', () => fecharModal());
    btnSave.addEventListener('click', () => {
        const id = Number(inputId.value || 0);
        const nome = inputName.value || `Posição ${id || posicoesSelecionadas.length + 1}`;
        const xRelativo = Number(inputX.value);
        const yRelativo = Number(inputY.value);
        if (!Number.isFinite(xRelativo) || !Number.isFinite(yRelativo)) return;
        const existenteIdx = posicoesSelecionadas.findIndex(p => p.id === id);
        const nova = { id: id || (posicoesSelecionadas.length + 1), xRelativo, yRelativo, nome };
        if (existenteIdx >= 0) {
            posicoesSelecionadas[existenteIdx] = nova;
        } else {
            posicoesSelecionadas.push(nova);
        }
        fecharModal();
        atualizarMarcadores();
        atualizarContador();
    });

    btnCopy.addEventListener('click', () => {
        const json = JSON.stringify(posicoesSelecionadas, null, 2);
        navigator.clipboard.writeText(json);
    });

    btnDownload.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(posicoesSelecionadas, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posicoes-remapeadas.json';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    });
}

function alternarRemap() {
    isRemapMode = !isRemapMode;
    document.body.classList.toggle('remap-active', isRemapMode);
    if (isRemapMode) {
        // Inicia do zero
        posicoesSelecionadas = [];
        atualizarContador();
        // Remove qualquer marcador existente
        document.querySelectorAll('.marcador').forEach(m => m.remove());
    }
    // Fecha modal ao sair
    if (!isRemapMode) fecharModal();
}

function abrirModal(xPercent, yPercent) {
    inputX.value = String(xPercent);
    inputY.value = String(yPercent);
    if (!inputId.value) inputId.value = String(posicoesSelecionadas.length + 1);
    remapModal.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
    remapModal.setAttribute('aria-hidden', 'true');
}

function atualizarMarcadores() {
    // remove antigos
    document.querySelectorAll('.marcador').forEach(m => m.remove());
    // recria
    posicoesSelecionadas.forEach(p => criarMarcador(p));
}

function salvarJsonAtual() {
    const blob = new Blob([JSON.stringify(posicoesSelecionadas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posicoes-remapeadas.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    // Tenta copiar para área de transferência também
    const json = JSON.stringify(posicoesSelecionadas, null, 2);
    navigator.clipboard && navigator.clipboard.writeText(json).catch(() => {});
}

function posicionarPeoesIniciais() {
    const container = document.getElementById('game-container');
    // remove peões antigos
    container.querySelectorAll('.peao').forEach(p => p.remove());
    const offsets = [
        { dx: -10, dy: -10 },
        { dx: 10, dy: -10 },
        { dx: 0, dy: 8 }
    ];
    equipes.forEach((eq, i) => {
        const casa = posicoesSelecionadas.find(p => p.id === eq.pos);
        if (!casa) return;
        const peao = document.createElement('div');
        peao.className = 'peao';
        peao.dataset.team = eq.id;
        peao.style.backgroundColor = eq.cor;
        peao.style.left = `calc(${casa.xRelativo}% + ${offsets[i].dx}px)`;
        peao.style.top = `calc(${casa.yRelativo}% + ${offsets[i].dy}px)`;
        container.appendChild(peao);
    });
}

function inicializarScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;
    // Cabeçalho/handle para arrastar
    const handle = document.createElement('div');
    handle.className = 'handle';
    scoreboard.appendChild(handle);
    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = equipes.map(eq => `
        <div class="team-row">
            <div class="team-name" style="color:${eq.cor}">${eq.nome}</div>
            <div class="pill coin">${eq.moedas} moedas</div>
            <div class="pill day">${eq.dias} dia</div>
        </div>
    `).join('');
    scoreboard.appendChild(content);

    // Controles de equipes
    const controls = document.createElement('div');
    controls.className = 'score-controls';
    const btnAdd = document.createElement('button');
    btnAdd.textContent = 'Adicionar equipe';
    btnAdd.addEventListener('click', abrirTeamModal);
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'Remover equipe';
    btnRemove.addEventListener('click', () => {
        if (equipes.length === 0) return;
        const nomes = equipes.map((e, i) => `${i + 1} - ${e.nome}`).join('\n');
        const sel = prompt(`Qual equipe remover?\n${nomes}`, '1');
        const idx = Number(sel) - 1;
        if (!Number.isInteger(idx) || idx < 0 || idx >= equipes.length) return;
        const idRem = equipes[idx].id;
        equipes.splice(idx, 1);
        // Remove peão do mapa
        const container = document.getElementById('game-container');
        const peao = container.querySelector(`.peao[data-team="${idRem}"]`);
        if (peao) peao.remove();
        if (indiceEquipeAtual >= equipes.length) indiceEquipeAtual = 0;
        renderScoreboard();
        destacarEquipeAtual();
    });
    controls.appendChild(btnAdd);
    controls.appendChild(btnRemove);
    scoreboard.appendChild(controls);

    // Restaura posição/tamanho
    const saved = JSON.parse(localStorage.getItem('scoreboard@ui') || '{}');
    if (saved.left != null && saved.top != null) {
        scoreboard.style.left = saved.left + 'px';
        scoreboard.style.top = saved.top + 'px';
        scoreboard.style.right = 'auto';
    }
    if (saved.width) scoreboard.style.width = saved.width + 'px';
    if (saved.height) scoreboard.style.height = saved.height + 'px';

    // Drag
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, dragging = false;
    handle.addEventListener('mousedown', (e) => {
        dragging = true;
        scoreboard.classList.add('dragging');
        startX = e.clientX; startY = e.clientY;
        const rect = scoreboard.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
        e.preventDefault();
    });
    function onMove(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const left = Math.max(0, startLeft + dx);
        const top = Math.max(0, startTop + dy);
        scoreboard.style.left = left + 'px';
        scoreboard.style.top = top + 'px';
        scoreboard.style.right = 'auto';
    }
    function onUp() {
        dragging = false;
        scoreboard.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        const rect = scoreboard.getBoundingClientRect();
        localStorage.setItem('scoreboard@ui', JSON.stringify({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        }));
    }

    // Salva tamanho ao terminar de redimensionar (debounce simples)
    let resizeObserver;
    if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => {
            const rect = scoreboard.getBoundingClientRect();
            const saved = JSON.parse(localStorage.getItem('scoreboard@ui') || '{}');
            saved.width = rect.width; saved.height = rect.height;
            localStorage.setItem('scoreboard@ui', JSON.stringify(saved));
        });
        resizeObserver.observe(scoreboard);
    }
}

function destacarEquipeAtual() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;
    const rows = scoreboard.querySelectorAll('.team-row');
    rows.forEach(r => r.classList.remove('active'));
    if (rows[indiceEquipeAtual]) rows[indiceEquipeAtual].classList.add('active');
}

function verificarPerda(indexEquipe) {
    const eq = equipes[indexEquipe];
    if (!eq) return;
    // Dias não podem ficar negativos
    if (eq.dias < 0) eq.dias = 0;
    // Perde apenas se moedas ficarem negativas
    if (eq.moedas < 0) {
        // remove peão
        const container = document.getElementById('game-container');
        const peao = container.querySelector(`.peao[data-team="${eq.id}"]`);
        if (peao) peao.remove();
        // remove equipe da lista
        equipes.splice(indexEquipe, 1);
        // ajustar índice da vez
        if (indiceEquipeAtual >= equipes.length) indiceEquipeAtual = 0;
        renderScoreboard();
        destacarEquipeAtual();
    }
}

function avancarParaProximaEquipe() {
    if (equipes.length === 0) return;
    // tenta achar próxima equipe que não chegou
    const maxTentativas = equipes.length;
    let tentativas = 0;
    do {
        indiceEquipeAtual = (indiceEquipeAtual + 1) % equipes.length;
        tentativas++;
        if (equipes[indiceEquipeAtual] && equipes[indiceEquipeAtual].pos !== 37) {
            destacarEquipeAtual();
            return;
        }
    } while (tentativas < maxTentativas);
    // todas chegaram
    jogoEncerrado = true;
    destacarEquipeAtual();
    openActionModal('Fim do jogo', 'Todas as equipes chegaram ao destino!', [{ label: 'OK', value: true }]);
}

// Interação: clique em uma casa válida move o peão da equipe atual
document.getElementById('game-container').addEventListener('click', (ev) => {
    // Se estiver selecionando casa inicial no modal de equipe
    if (pickingCasa) {
        const alvo = ev.target;
        if (alvo && alvo.classList.contains('marcador')) {
            tmCasa.value = alvo.textContent;
            pickingCasa = false;
            // Reabre o modal para concluir
            teamModal.setAttribute('aria-hidden', 'false');
        }
        return;
    }
    if (isRemapMode) return; // remapeando, ignorar
    if (turnoEmResolucao) return; // impede múltiplas ações no mesmo turno
    if (jogoEncerrado) return; // jogo terminou
    if (equipes.length === 0) return; // sem equipes
    const alvo = ev.target;
    if (!(alvo && alvo.classList.contains('marcador'))) return;
    const destinoId = Number(alvo.textContent);
    const equipe = equipes[indiceEquipeAtual];
    // Se a equipe já chegou, pula para a próxima
    if (equipe.pos === 37) {
        avancarParaProximaEquipe();
        return;
    }
    const vizinhos = caminhos.get(equipe.pos) || [];
    if (!vizinhos.includes(destinoId)) return; // movimento inválido
    // mover e aplicar regra da casa
    turnoEmResolucao = true;
    equipe.pos = destinoId;
    posicionarPeoesIniciais();
    aplicarRegraDaCasa(destinoId).then(() => {
        // passa a vez no final
        avancarParaProximaEquipe();
        renderScoreboard();
        turnoEmResolucao = false;
    }).catch(() => { turnoEmResolucao = false; });
});

// Modal helpers
const actionModal = document.getElementById('action-modal');
const actionTitle = document.getElementById('action-title');
const actionBody = document.getElementById('action-body');
const actionButtons = document.getElementById('action-buttons');

function openActionModal(title, bodyHTML, buttons) {
    return new Promise((resolve) => {
        actionTitle.textContent = title;
        actionBody.innerHTML = bodyHTML;
        actionButtons.innerHTML = '';
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.textContent = btn.label;
            b.addEventListener('click', () => {
                closeActionModal();
                resolve(btn.value);
            });
            actionButtons.appendChild(b);
        });
        actionModal.setAttribute('aria-hidden', 'false');
    });
}

function closeActionModal() {
    actionModal.setAttribute('aria-hidden', 'true');
}

function renderScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (!scoreboard) return;
    const content = scoreboard.querySelector('.content');
    if (!content) return;
    // Rebuild rows to reflect current teams
    content.innerHTML = equipes.map(eq => `
        <div class="team-row">
            <div class="team-name" style="color:${eq.cor}">${eq.nome}</div>
            <div class="pill coin">${eq.moedas} moedas</div>
            <div class="pill day">${eq.dias} dia${eq.dias === 1 ? '' : 's'}</div>
        </div>
    `).join('');
    destacarEquipeAtual();

    // Permitir renomear clicando no nome
    scoreboard.addEventListener('click', (e) => {
        const el = e.target;
        if (!(el && el.classList.contains('team-name'))) return;
        const rows = Array.from(scoreboard.querySelectorAll('.team-row'));
        const idx = rows.indexOf(el.closest('.team-row'));
        if (idx < 0 || idx >= equipes.length) return;
        const novoNome = prompt('Novo nome da equipe:', equipes[idx].nome || 'Equipe');
        if (!novoNome) return;
        equipes[idx].nome = novoNome;
        renderScoreboard();
    });
}

// Modal de equipe
const teamModal = document.getElementById('team-modal');
const tmName = document.getElementById('tm-name');
const tmCoins = document.getElementById('tm-coins');
const tmDays = document.getElementById('tm-days');
const tmCasa = document.getElementById('tm-casa');
const tmPick = document.getElementById('tm-pick');
const tmSave = document.getElementById('tm-save');
const tmCancel = document.getElementById('tm-cancel');
let pickingCasa = false;

function abrirTeamModal() {
    tmName.value = `Equipe ${String.fromCharCode(65 + equipes.length)}`;
    tmCoins.value = 5;
    tmDays.value = 1;
    tmCasa.value = '';
    pickingCasa = false;
    teamModal.setAttribute('aria-hidden', 'false');
}

function fecharTeamModal() {
    teamModal.setAttribute('aria-hidden', 'true');
    pickingCasa = false;
}

tmCancel && tmCancel.addEventListener('click', fecharTeamModal);
tmPick && tmPick.addEventListener('click', () => {
    // Habilita seleção no mapa e fecha o modal para não bloquear os cliques
    pickingCasa = true;
    teamModal.setAttribute('aria-hidden', 'true');
});
tmSave && tmSave.addEventListener('click', () => {
    const nome = tmName.value.trim() || `Equipe ${String.fromCharCode(65 + equipes.length)}`;
    const moedas = Math.max(0, Number(tmCoins.value || 0));
    const dias = Math.max(0, Number(tmDays.value || 0));
    const casa = Number(tmCasa.value || 1);
    if (!Number.isInteger(casa) || casa < 1 || casa > 37) return;
    const cores = ['#e53935', '#1e88e5', '#43a047', '#8e24aa', '#fb8c00', '#00897b'];
    const cor = cores[equipes.length % cores.length];
    const nova = { id: String.fromCharCode(65 + equipes.length), nome, cor, pos: casa, moedas, dias };
    equipes.push(nova);
    fecharTeamModal();
    renderScoreboard();
    posicionarPeoesIniciais();
});

// Detectar cor da casa
const colorSampler = {
    canvas: document.createElement('canvas'),
    ctx: null,
    ready: false,
};

function prepararAmostragem() {
    return new Promise((resolve) => {
        if (colorSampler.ready) return resolve();
        const img = new Image();
        img.src = 'mapa.png';
        img.onload = () => {
            colorSampler.canvas.width = img.width;
            colorSampler.canvas.height = img.height;
            colorSampler.ctx = colorSampler.canvas.getContext('2d');
            colorSampler.ctx.drawImage(img, 0, 0);
            colorSampler.ready = true;
            resolve();
        };
        img.onerror = () => resolve();
    });
}

async function obterCorDaCasa(casaId) {
    await prepararAmostragem();
    if (!colorSampler.ready) return null;
    const casa = posicoesSelecionadas.find(p => p.id === casaId);
    if (!casa) return null;
    // Coords relativas no mapa original
    const x = Math.round((casa.xRelativo / 100) * colorSampler.canvas.width);
    const y = Math.round((casa.yRelativo / 100) * colorSampler.canvas.height);
    const data = colorSampler.ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = data;
    return { r, g, b };
}

function classificarCor({ r, g, b }) {
    // thresholds aproximados para cores do tabuleiro (verde, laranja, azul, roxo)
    if (g > 160 && r < 200 && b < 120) return 'verde';
    if (r > 220 && g > 120 && g < 200 && b < 120) return 'laranja';
    if (b > 180 && r < 160 && g < 200) return 'azul';
    if (r > 150 && b > 200 && g < 160) return 'roxo';
    return null;
}

async function aplicarRegraDaCasa(casaId) {
    // FIM não tem regra
    if (casaId === 37) return;
    let cor = null;
    if (casasPredefinidas.roxo.has(casaId)) cor = 'roxo';
    else if (casasPredefinidas.verde.has(casaId)) cor = 'verde';
    else if (casasPredefinidas.azul.has(casaId)) cor = 'azul';
    else if (casasPredefinidas.laranja.has(casaId)) cor = 'laranja';
    const equipeAtual = equipes[indiceEquipeAtual];

    // Eventos especiais têm prioridade sobre cor
    // Agora o PRÓ e o CONTRA acontecem juntos
    const evento = eventoPorCasa.get(casaId);
    if (evento === 'vulcao') {
        equipeAtual.dias = Math.max(0, equipeAtual.dias - 1);
        equipeAtual.moedas -= 3; // ajuste solicitado
        await openActionModal('Vulcão', 'Efeitos aplicados: -1 dia e -3 moedas (conserto).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'tubaroes') {
        equipeAtual.dias += 2; // PRÓ não tem efeito
        await openActionModal('Tubarões', 'Efeitos aplicados: +2 dias (passagem devagar).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'tornado') {
        equipeAtual.moedas += 1;
        equipeAtual.dias += 2;
        await openActionModal('Tornado', 'Efeitos aplicados: +1 moeda e +2 dias.', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'nevoeiro') {
        equipeAtual.dias = Math.max(0, equipeAtual.dias - 1);
        equipeAtual.moedas -= 2;
        await openActionModal('Nevoeiro', 'Efeitos aplicados: -1 dia e -2 moedas (conserto).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'ilhaTesouro') {
        equipeAtual.moedas += 5;
        equipeAtual.dias += 3;
        await openActionModal('Ilha do Tesouro', 'Efeitos aplicados: +5 moedas (tesouro) e +3 dias (desvio).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'suicida') {
        equipeAtual.dias = Math.max(0, equipeAtual.dias - 1);
        equipeAtual.moedas -= 2;
        await openActionModal('Suicida', 'Efeitos aplicados: -1 dia e -2 moedas (indenização).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'iceberg') {
        equipeAtual.dias = Math.max(0, equipeAtual.dias - 2);
        equipeAtual.moedas -= 3;
        await openActionModal('Iceberg', 'Efeitos aplicados: -2 dias e -3 moedas (conserto).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'tempestadeArcoIris') {
        equipeAtual.moedas += 3;
        equipeAtual.dias += 2;
        await openActionModal('Tempestade com Arco-íris', 'Efeitos aplicados: +3 moedas e +2 dias.', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }

    if (evento === 'atalho') {
        equipeAtual.dias = Math.max(0, equipeAtual.dias - 3);
        equipeAtual.moedas -= 5;
        await openActionModal('Atalho', 'Efeitos aplicados: -3 dias e -5 moedas (piratas).', [{ label: 'OK', value: true }]);
        renderScoreboard();
        verificarPerda(indiceEquipeAtual);
        return;
    }
    if (cor === 'verde') {
        // A equipe da vez ganha 2 moedas
        equipeAtual.moedas += 2;
        await openActionModal('Casa Verde', `${equipeAtual.nome} ganhou 2 moedas.`, [
            { label: 'OK', value: true }
        ]);
        renderScoreboard();
    } else if (cor === 'laranja') {
        // A equipe da vez atrasa 1 dia
        equipeAtual.dias += 1;
        await openActionModal('Casa Laranja', `${equipeAtual.nome} atrasou 1 dia.`, [
            { label: 'OK', value: true }
        ]);
        renderScoreboard();
    } else if (cor === 'azul') {
        // Ganhe 3 moedas OU adiante 1 dia de viagem
        const escolha = await openActionModal('Casa Azul', 'Escolha uma recompensa:', [
            { label: '+3 moedas', value: 'moedas' },
            { label: '-1 dia', value: 'dia' }
        ]);
        if (escolha === 'moedas') equipeAtual.moedas += 3;
        if (escolha === 'dia') equipeAtual.dias = Math.max(0, equipeAtual.dias - 1);
        renderScoreboard();
    } else if (cor === 'roxo') {
        // Pagando 2 moedas, pode mover um grupo que também esteja em roxo
        const jogador = equipeAtual;
        // Checa antes se existe pelo menos uma outra equipe em casa roxa
        const elegiveis = [];
        for (let i = 0; i < equipes.length; i++) {
            if (i === indiceEquipeAtual) continue;
            const posEq = equipes[i].pos;
            if (casasPredefinidas.roxo.has(posEq)) {
                elegiveis.push({ label: equipes[i].nome, value: i });
            }
        }
        if (elegiveis.length === 0) return; // ninguém em roxo: nada a fazer

        if (jogador.moedas >= 2) {
            const confirmar = await openActionModal('Casa Roxa', 'Pagar 2 moedas para mover outro grupo que esteja em casa roxa?', [
                { label: 'Sim', value: true },
                { label: 'Não', value: false }
            ]);
            if (!confirmar) return;
            jogador.moedas -= 2;
            renderScoreboard();
            verificarPerda(indiceEquipeAtual);
            // Escolhe equipe alvo obrigatoriamente
            const idxEq = await openActionModal('Casa Roxa', 'Escolha a outra equipe para mover:', elegiveis);
            if (idxEq == null) return;
            const eqAlvo = equipes[idxEq];
            // Pode mover para QUALQUER casa roxa (lista predefinida), exceto a atual
            const destinos = Array.from(casasPredefinidas.roxo).filter(id => id !== eqAlvo.pos).sort((a,b)=>a-b);
            if (destinos.length) {
                const escolhaDest = await openActionModal('Casa Roxa', 'Escolha para onde mover:', destinos.map(v => ({ label: String(v), value: v })));
                if (escolhaDest != null) {
                    eqAlvo.pos = escolhaDest;
                    posicionarPeoesIniciais();
                }
            }
        }
    }
}
