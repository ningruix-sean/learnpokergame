// app.js - UI logic for the poker calculator

// State
let handCards = [null, null]; // ['As', 'Kh'] etc
let communityCards = [null, null, null, null, null];
let playerCount = 6;
let opponentRange = 'any';
let currentPickerTarget = null; // { type: 'hand'|'community', index: 0-4 }
let simulationTimeout = null;

const RANGE_NAMES = {
    any: '任意两张',
    top: '大牌范围',
    broadway: 'Broadway',
    pairs: '对子',
    suited: '同花牌',
    connectors: '同花连张'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderAllCards();
    buildCardGrid();
});

// ========== Card Display ==========

function getSuitSymbol(suit) {
    return SUIT_SYMBOLS[suit] || '';
}

function getRankDisplay(rank) {
    return RANK_DISPLAY[rank] || rank;
}

function renderCardSlot(elementId, card) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (card) {
        const { rank, suit } = parseCard(card);
        el.innerHTML = `
            <span class="card-rank">${getRankDisplay(rank)}</span>
            <span class="card-suit-icon">${getSuitSymbol(suit)}</span>
        `;
        el.classList.add('filled', 'suit-' + suit);
        el.classList.remove('dashed');
    } else {
        el.innerHTML = '<span class="card-placeholder">+</span>';
        el.classList.remove('filled', 'suit-s', 'suit-h', 'suit-c', 'suit-d');
        if (elementId.startsWith('comm') && parseInt(elementId[4]) >= 3) {
            el.classList.add('dashed');
        }
    }
}

function renderAllCards() {
    renderCardSlot('hand0', handCards[0]);
    renderCardSlot('hand1', handCards[1]);
    for (let i = 0; i < 5; i++) {
        renderCardSlot('comm' + i, communityCards[i]);
    }
    updateStreetLabel();
}

function updateStreetLabel() {
    const commCount = communityCards.filter(c => c !== null).length;
    const label = document.getElementById('streetLabel');
    if (commCount === 0) label.textContent = '翻牌前';
    else if (commCount <= 3) label.textContent = '翻牌圈';
    else if (commCount === 4) label.textContent = '转牌圈';
    else label.textContent = '河牌圈';
}

// ========== Card Picker ==========

function openCardPicker(type, index) {
    currentPickerTarget = { type, index };
    const currentCard = type === 'hand' ? handCards[index] : communityCards[index];

    buildCardGrid();
    highlightCurrentCard(currentCard);
    toggleRemoveBtn(currentCard !== null);

    document.getElementById('cardPickerModal').classList.add('active');
}

function closeCardPicker(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('cardPickerModal').classList.remove('active');
    currentPickerTarget = null;
}

function buildCardGrid() {
    const grid = document.getElementById('cardGrid');
    const usedCards = getUsedCards();
    const currentFilter = document.querySelector('.suit-tab.active')?.dataset.suit || 'all';

    grid.innerHTML = '';

    const displaySuits = currentFilter === 'all' ? SUITS : [currentFilter];

    for (const suit of displaySuits) {
        for (const rank of [...RANKS].reverse()) {
            const card = cardStr(rank, suit);
            const isUsed = usedCards.has(card);
            const isRed = suit === 'h' || suit === 'd';

            const btn = document.createElement('button');
            btn.className = `card-pick ${isRed ? 'red' : 'black'} ${isUsed ? 'used' : ''}`;
            btn.dataset.card = card;
            btn.innerHTML = `
                <span class="pick-rank">${getRankDisplay(rank)}</span>
                <span class="pick-suit">${getSuitSymbol(suit)}</span>
            `;
            btn.onclick = () => selectCard(card);
            grid.appendChild(btn);
        }
    }
}

function getUsedCards() {
    const used = new Set();
    for (const c of handCards) if (c) used.add(c);
    for (const c of communityCards) if (c) used.add(c);
    // Don't mark the current target's card as used
    if (currentPickerTarget) {
        const current = currentPickerTarget.type === 'hand'
            ? handCards[currentPickerTarget.index]
            : communityCards[currentPickerTarget.index];
        if (current) used.delete(current);
    }
    return used;
}

function highlightCurrentCard(card) {
    document.querySelectorAll('.card-pick').forEach(el => {
        el.classList.toggle('selected', el.dataset.card === card);
    });
}

function toggleRemoveBtn(show) {
    const btn = document.getElementById('removeCardBtn');
    btn.classList.toggle('visible', show);
}

function selectCard(card) {
    if (!currentPickerTarget) return;

    const { type, index } = currentPickerTarget;
    if (type === 'hand') {
        handCards[index] = card;
    } else {
        communityCards[index] = card;
    }

    closeCardPicker();
    renderAllCards();
    scheduleSimulation();
}

function removeSelectedCard() {
    if (!currentPickerTarget) return;

    const { type, index } = currentPickerTarget;
    if (type === 'hand') {
        handCards[index] = null;
    } else {
        communityCards[index] = null;
    }

    closeCardPicker();
    renderAllCards();
    scheduleSimulation();
}

function filterSuit(suit) {
    document.querySelectorAll('.suit-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.suit === suit);
    });
    buildCardGrid();
    // Re-highlight current card
    if (currentPickerTarget) {
        const current = currentPickerTarget.type === 'hand'
            ? handCards[currentPickerTarget.index]
            : communityCards[currentPickerTarget.index];
        highlightCurrentCard(current);
    }
}

// ========== Player Count ==========

function setPlayers(n) {
    playerCount = n;
    document.getElementById('playerSlider').value = n;
    updatePlayerDisplay();
    scheduleSimulation();
}

function updatePlayerCount(val) {
    playerCount = parseInt(val);
    updatePlayerDisplay();
    scheduleSimulation();
}

function updatePlayerDisplay() {
    document.getElementById('playerNumDisplay').textContent = playerCount + ' 人';
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const presets = { '单挑': 2, '6人桌': 6, '9人桌': 9 };
        btn.classList.toggle('active', presets[btn.textContent] === playerCount);
    });
}

// ========== Range Picker ==========

function openRangePicker() {
    document.querySelectorAll('.range-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.range === opponentRange);
    });
    document.getElementById('rangePickerModal').classList.add('active');
}

function closeRangePicker(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('rangePickerModal').classList.remove('active');
}

function selectRange(range) {
    opponentRange = range;
    document.getElementById('rangeDisplay').textContent = RANGE_NAMES[range];
    closeRangePicker();
    scheduleSimulation();
}

// ========== Simulation ==========

function scheduleSimulation() {
    if (simulationTimeout) clearTimeout(simulationTimeout);
    simulationTimeout = setTimeout(runSimulation, 200);
}

function runSimulation() {
    const validHand = handCards.filter(c => c !== null);
    if (validHand.length < 2) {
        resetDisplay();
        return;
    }

    const validComm = communityCards.filter(c => c !== null);

    // Run simulation
    const result = simulate(validHand, validComm, playerCount, opponentRange, 8000);

    // Update win rate
    document.getElementById('winRate').textContent = result.winRate + '%';
    document.getElementById('tieRate').textContent = '平' + result.tieRate + '%';

    // Color the win rate
    const winEl = document.getElementById('winRate');
    if (result.winRate >= 55) winEl.style.color = 'var(--green)';
    else if (result.winRate >= 35) winEl.style.color = 'var(--orange)';
    else winEl.style.color = 'var(--red)';

    // Update advice
    const advice = getAdvice(result.winRate, validHand, validComm);
    const titleEl = document.getElementById('adviceTitle');
    const descEl = document.getElementById('adviceDesc');
    titleEl.textContent = advice.title;
    titleEl.className = 'advice-title ' + advice.type;
    descEl.textContent = advice.desc;

    // Update hand probabilities
    renderProbabilities('handProbabilities', result.handProbs, 'green', validHand, validComm);

    // Update opponent probabilities
    renderProbabilities('opponentHands', result.opponentProbs, 'orange', null, null);
}

function renderProbabilities(containerId, probs, barColor, handCards, communityCards) {
    const container = document.getElementById(containerId);
    const entries = Object.entries(probs).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        container.innerHTML = '<div class="prob-placeholder">数据不足</div>';
        return;
    }

    // Determine current hand type for highlighting
    let currentType = null;
    if (handCards && communityCards && communityCards.length > 0) {
        currentType = getCurrentHandType(handCards, communityCards);
    }

    container.innerHTML = entries.map(([name, pct]) => {
        const isCurrent = name === currentType;
        return `
            <div class="prob-item">
                <span class="prob-name ${isCurrent ? 'current' : ''}">${name}</span>
                <div class="prob-bar-wrap">
                    <div class="prob-bar ${barColor}" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
                <span class="prob-value">${typeof pct === 'number' && pct % 1 !== 0 ? pct.toFixed(1) : pct}%</span>
            </div>
        `;
    }).join('');
}

function resetDisplay() {
    document.getElementById('winRate').textContent = '--';
    document.getElementById('winRate').style.color = 'var(--red)';
    document.getElementById('tieRate').textContent = '平--%';
    document.getElementById('adviceTitle').textContent = '选择手牌开始';
    document.getElementById('adviceTitle').className = 'advice-title';
    document.getElementById('adviceDesc').textContent = '请先选择你的两张手牌';
    document.getElementById('handProbabilities').innerHTML = '<div class="prob-placeholder">选择手牌后显示</div>';
    document.getElementById('opponentHands').innerHTML = '<div class="prob-placeholder">选择手牌后显示</div>';
}

// ========== Clear ==========

function clearAll() {
    handCards = [null, null];
    communityCards = [null, null, null, null, null];
    renderAllCards();
    resetDisplay();
}

// ========== Help & Feedback ==========

function showHelp() {
    document.getElementById('helpModal').classList.add('active');
}

function closeHelp(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('helpModal').classList.remove('active');
}

function showFeedback() {
    alert('感谢你的反馈！这是一个学习工具，祝你德州扑克越来越好！🃏');
}
