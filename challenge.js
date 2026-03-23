// challenge.js - 闯关模式：100关德州扑克胜率训练

const CHALLENGE_STORAGE_KEY = 'poker_challenge_progress';
const TOTAL_LEVELS = 100;

// 牌桌位置名（按顺序排列）
const POSITION_NAMES = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'];
const POSITION_FULL_NAMES = {
    BTN: '庄家', SB: '小盲', BB: '大盲', UTG: '枪口',
    'UTG+1': '枪口+1', MP: '中位', 'MP+1': '中位+1', HJ: '劫持位', CO: '关煞位'
};

// 闯关状态
let challengeState = {
    currentLevel: 1,
    score: 0,
    completed: [],
    // 当前关卡
    handCards: [],
    communityCards: [],
    fullCommunity: [],  // 完整的5张公牌（用于翻牌后揭晓）
    stage: '',
    numPlayers: 2,
    playerPosition: '',
    opponents: [],      // [{position, cards: [c1, c2], handType}]
    correctWinRate: 0,
    options: [],
    answered: false,
    selectedOption: -1
};

// 加载进度
function loadChallengeProgress() {
    try {
        const saved = localStorage.getItem(CHALLENGE_STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            challengeState.currentLevel = data.currentLevel || 1;
            challengeState.score = data.score || 0;
            challengeState.completed = data.completed || [];
        }
    } catch (e) { /* ignore */ }
}

// 保存进度
function saveChallengeProgress() {
    try {
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({
            currentLevel: challengeState.currentLevel,
            score: challengeState.score,
            completed: challengeState.completed
        }));
    } catch (e) { /* ignore */ }
}

// 重置进度
function resetChallengeProgress() {
    challengeState.currentLevel = 1;
    challengeState.score = 0;
    challengeState.completed = [];
    saveChallengeProgress();
}

// 根据关卡难度决定参数
function getLevelConfig(level) {
    let stages, playerRange, optionSpread;

    if (level <= 20) {
        stages = ['preflop', 'preflop', 'flop', 'flop', 'preflop'];
        playerRange = [2, 4];
        optionSpread = 20;
    } else if (level <= 40) {
        stages = ['preflop', 'flop', 'flop', 'turn'];
        playerRange = [2, 6];
        optionSpread = 15;
    } else if (level <= 60) {
        stages = ['flop', 'turn', 'turn', 'river'];
        playerRange = [3, 6];
        optionSpread = 12;
    } else if (level <= 80) {
        stages = ['flop', 'turn', 'river', 'river'];
        playerRange = [2, 9];
        optionSpread = 9;
    } else {
        stages = ['preflop', 'flop', 'turn', 'river'];
        playerRange = [2, 9];
        optionSpread = 7;
    }

    const stage = stages[Math.floor(Math.random() * stages.length)];
    const numPlayers = playerRange[0] + Math.floor(Math.random() * (playerRange[1] - playerRange[0] + 1));

    return { stage, numPlayers, optionSpread };
}

// 针对已知对手手牌计算精确胜率（蒙特卡洛模拟剩余公牌）
function simulateExact(myHand, oppHands, knownCommunity, iterations) {
    const usedCards = new Set([...myHand, ...knownCommunity]);
    for (const opp of oppHands) {
        usedCards.add(opp[0]);
        usedCards.add(opp[1]);
    }
    const remainDeck = buildDeck().filter(c => !usedCards.has(c));
    const communityNeeded = 5 - knownCommunity.length;

    let wins = 0, ties = 0;

    for (let i = 0; i < iterations; i++) {
        const deck = [...remainDeck];
        shuffle(deck);

        // 补全公牌
        const simComm = [...knownCommunity];
        for (let c = 0; c < communityNeeded; c++) {
            simComm.push(deck[c]);
        }

        const myEval = evaluateHand([...myHand, ...simComm]);

        let iWin = true, isTie = false;
        for (const opp of oppHands) {
            const oppEval = evaluateHand([...opp, ...simComm]);
            const cmp = compareHands(myEval, oppEval);
            if (cmp < 0) { iWin = false; isTie = false; break; }
            else if (cmp === 0) { isTie = true; }
        }

        if (iWin && !isTie) wins++;
        else if (isTie && iWin) ties++;
    }

    return Math.round((wins / iterations) * 100);
}

// 分配位置
function assignPositions(numPlayers) {
    // 根据人数选择合理的位置
    let positions;
    if (numPlayers === 2) {
        positions = ['BTN', 'BB'];
    } else if (numPlayers === 3) {
        positions = ['BTN', 'SB', 'BB'];
    } else if (numPlayers <= 6) {
        positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'].slice(0, numPlayers);
    } else {
        positions = POSITION_NAMES.slice(0, numPlayers);
    }
    // 随机分配玩家位置
    const shuffled = [...positions];
    shuffle(shuffled);
    return { playerPos: shuffled[0], oppPositions: shuffled.slice(1) };
}

// 生成一关的题目
function generateLevel(level) {
    const config = getLevelConfig(level);
    const deck = buildDeck();
    shuffle(deck);

    let idx = 0;

    // 发手牌
    const hand = [deck[idx++], deck[idx++]];

    // 发对手手牌
    const numOpponents = config.numPlayers - 1;
    const opponents = [];
    const { playerPos, oppPositions } = assignPositions(config.numPlayers);

    for (let i = 0; i < numOpponents; i++) {
        opponents.push({
            position: oppPositions[i],
            cards: [deck[idx++], deck[idx++]]
        });
    }

    // 发完整5张公牌
    const fullCommunity = [];
    for (let i = 0; i < 5; i++) {
        fullCommunity.push(deck[idx++]);
    }

    // 根据阶段截取可见公牌
    let commCount = 0;
    switch (config.stage) {
        case 'preflop': commCount = 0; break;
        case 'flop': commCount = 3; break;
        case 'turn': commCount = 4; break;
        case 'river': commCount = 5; break;
    }
    const community = fullCommunity.slice(0, commCount);

    // 计算精确胜率
    const oppHands = opponents.map(o => o.cards);
    const correctRate = simulateExact(hand, oppHands, community, 10000);

    // 计算对手牌型（基于当前可见公牌）
    for (const opp of opponents) {
        if (community.length > 0) {
            const allCards = [...opp.cards, ...community];
            const eval_ = evaluateHand(allCards);
            opp.handType = HAND_NAMES[eval_[0]];
        } else {
            opp.handType = null;
        }
    }

    // 生成4个选项
    const options = generateOptions(correctRate, config.optionSpread);

    challengeState.handCards = hand;
    challengeState.communityCards = community;
    challengeState.fullCommunity = fullCommunity;
    challengeState.stage = config.stage;
    challengeState.numPlayers = config.numPlayers;
    challengeState.playerPosition = playerPos;
    challengeState.opponents = opponents;
    challengeState.correctWinRate = correctRate;
    challengeState.options = options;
    challengeState.answered = false;
    challengeState.selectedOption = -1;
}

// 生成4个选项，其中一个是正确答案
function generateOptions(correctRate, spread) {
    const options = [];
    const correctIdx = Math.floor(Math.random() * 4);

    for (let i = 0; i < 4; i++) {
        if (i === correctIdx) {
            options.push({ rate: correctRate, isCorrect: true });
        } else {
            let fakeRate;
            let attempts = 0;
            do {
                const offset = (Math.random() * spread * 2 + spread) * (Math.random() < 0.5 ? -1 : 1);
                fakeRate = Math.round(correctRate + offset);
                fakeRate = Math.max(1, Math.min(99, fakeRate));
                attempts++;
            } while (
                attempts < 50 &&
                (Math.abs(fakeRate - correctRate) < spread * 0.5 ||
                 options.some(o => Math.abs(o.rate - fakeRate) < spread * 0.4))
            );
            options.push({ rate: fakeRate, isCorrect: false });
        }
    }

    return options;
}

// 获取阶段中文名
function getStageName(stage) {
    const names = { preflop: '翻牌前', flop: '翻牌圈', turn: '转牌圈', river: '河牌圈' };
    return names[stage] || stage;
}

// 获取难度标签
function getDifficultyLabel(level) {
    if (level <= 20) return { text: '入门', cls: 'diff-easy' };
    if (level <= 40) return { text: '初级', cls: 'diff-normal' };
    if (level <= 60) return { text: '中级', cls: 'diff-medium' };
    if (level <= 80) return { text: '高级', cls: 'diff-hard' };
    return { text: '大师', cls: 'diff-master' };
}

// 生成一张牌的HTML
function cardHTML(card, small) {
    const { rank, suit } = parseCard(card);
    const isRed = suit === 'h' || suit === 'd';
    const cls = small ? 'ch-card ch-card-sm' : 'ch-card';
    return `<div class="${cls} ${isRed ? 'ch-card-red' : 'ch-card-black'}">
        <span class="ch-card-rank">${getRankDisplay(rank)}</span>
        <span class="ch-card-suit">${getSuitSymbol(suit)}</span>
    </div>`;
}

// 生成牌背HTML
function cardBackHTML() {
    return `<div class="ch-card ch-card-sm ch-card-back">
        <span class="ch-card-back-icon">?</span>
    </div>`;
}

// ========== UI 渲染 ==========

function showChallengeMode() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('challengeApp').style.display = 'block';
    loadChallengeProgress();
    renderChallengeLevel();
}

function showCalculatorMode() {
    document.getElementById('app').style.display = 'block';
    document.getElementById('challengeApp').style.display = 'none';
}

function renderChallengeLevel() {
    if (challengeState.currentLevel > TOTAL_LEVELS) {
        renderChallengeComplete();
        return;
    }

    generateLevel(challengeState.currentLevel);

    const diff = getDifficultyLabel(challengeState.currentLevel);

    document.getElementById('challengeLevelNum').textContent = `第 ${challengeState.currentLevel} 关`;
    document.getElementById('challengeDifficulty').textContent = diff.text;
    document.getElementById('challengeDifficulty').className = 'challenge-diff-badge ' + diff.cls;
    document.getElementById('challengeScore').textContent = `${challengeState.score}/${challengeState.completed.length}`;

    const progressPct = ((challengeState.currentLevel - 1) / TOTAL_LEVELS) * 100;
    document.getElementById('challengeProgressFill').style.width = progressPct + '%';
    document.getElementById('challengeProgressText').textContent = `${challengeState.currentLevel - 1}/${TOTAL_LEVELS}`;

    document.getElementById('challengeStage').textContent = getStageName(challengeState.stage);
    document.getElementById('challengePlayers').textContent = challengeState.numPlayers + ' 人';

    renderChallengeCards();
    renderOpponents(false);
    renderChallengeOptions();

    document.getElementById('challengeResult').style.display = 'none';
    document.getElementById('challengeNextBtn').style.display = 'none';
}

function renderChallengeCards() {
    // 玩家手牌
    const handContainer = document.getElementById('challengeHandCards');
    handContainer.innerHTML = challengeState.handCards.map(c => cardHTML(c, false)).join('');

    // 玩家位置
    document.getElementById('challengePlayerPos').textContent =
        challengeState.playerPosition + ' (' + POSITION_FULL_NAMES[challengeState.playerPosition] + ')';

    // 公牌
    const commContainer = document.getElementById('challengeCommCards');
    if (challengeState.communityCards.length === 0) {
        commContainer.innerHTML = '<div class="ch-no-comm">无公牌（翻牌前）</div>';
    } else {
        commContainer.innerHTML = challengeState.communityCards.map(c => cardHTML(c, false)).join('');
    }

    // 当前牌型
    const handTypeEl = document.getElementById('challengeHandType');
    if (challengeState.communityCards.length > 0) {
        const allCards = [...challengeState.handCards, ...challengeState.communityCards];
        const eval_ = evaluateHand(allCards);
        handTypeEl.textContent = '当前牌型：' + HAND_NAMES[eval_[0]];
        handTypeEl.style.display = 'block';
    } else {
        handTypeEl.style.display = 'none';
    }
}

function renderOpponents(revealed) {
    const container = document.getElementById('challengeOpponents');
    const opps = challengeState.opponents;

    container.innerHTML = opps.map((opp, i) => {
        const posName = POSITION_FULL_NAMES[opp.position] || opp.position;
        let cardsHtml, typeHtml = '';

        if (revealed) {
            cardsHtml = opp.cards.map(c => cardHTML(c, true)).join('');
            if (opp.handType) {
                typeHtml = `<span class="ch-opp-handtype">${opp.handType}</span>`;
            }
        } else {
            cardsHtml = cardBackHTML() + cardBackHTML();
        }

        return `<div class="ch-opponent">
            <div class="ch-opp-pos">${opp.position} <span class="ch-opp-pos-name">${posName}</span></div>
            <div class="ch-opp-cards">${cardsHtml}</div>
            ${typeHtml}
        </div>`;
    }).join('');
}

function renderChallengeOptions() {
    const container = document.getElementById('challengeOptions');
    container.innerHTML = challengeState.options.map((opt, idx) => {
        return `<button class="ch-option" id="chOpt${idx}" onclick="selectChallengeOption(${idx})">
            <span class="ch-option-label">选项 ${['A', 'B', 'C', 'D'][idx]}</span>
            <span class="ch-option-rate">${opt.rate}%</span>
        </button>`;
    }).join('');
}

function selectChallengeOption(idx) {
    if (challengeState.answered) return;

    challengeState.answered = true;
    challengeState.selectedOption = idx;

    const selected = challengeState.options[idx];
    const isCorrect = selected.isCorrect;

    if (isCorrect) {
        challengeState.score++;
    }

    challengeState.completed.push({
        level: challengeState.currentLevel,
        correct: isCorrect,
        playerAnswer: selected.rate,
        correctAnswer: challengeState.correctWinRate
    });

    saveChallengeProgress();

    // 高亮选项
    challengeState.options.forEach((opt, i) => {
        const el = document.getElementById('chOpt' + i);
        if (opt.isCorrect) el.classList.add('ch-option-correct');
        if (i === idx && !isCorrect) el.classList.add('ch-option-wrong');
        el.disabled = true;
    });

    // 翻开对手手牌
    renderOpponents(true);

    // 显示结果
    const resultEl = document.getElementById('challengeResult');
    resultEl.style.display = 'block';

    if (isCorrect) {
        resultEl.innerHTML = `
            <div class="ch-result-correct">
                <div class="ch-result-icon">&#10004;</div>
                <div class="ch-result-text">回答正确！</div>
                <div class="ch-result-detail">实际胜率: ${challengeState.correctWinRate}%</div>
            </div>`;
    } else {
        resultEl.innerHTML = `
            <div class="ch-result-wrong">
                <div class="ch-result-icon">&#10008;</div>
                <div class="ch-result-text">回答错误</div>
                <div class="ch-result-detail">你选了 ${selected.rate}%，实际胜率: ${challengeState.correctWinRate}%</div>
            </div>`;
    }

    document.getElementById('challengeNextBtn').style.display = 'block';
    document.getElementById('challengeScore').textContent = `${challengeState.score}/${challengeState.completed.length}`;
}

function nextChallengeLevel() {
    challengeState.currentLevel++;
    saveChallengeProgress();
    renderChallengeLevel();
    document.getElementById('challengeApp').scrollTo(0, 0);
}

function renderChallengeComplete() {
    const container = document.getElementById('challengeApp');
    const accuracy = challengeState.completed.length > 0
        ? Math.round((challengeState.score / challengeState.completed.length) * 100) : 0;

    let grade, gradeClass;
    if (accuracy >= 90) { grade = 'S'; gradeClass = 'grade-s'; }
    else if (accuracy >= 80) { grade = 'A'; gradeClass = 'grade-a'; }
    else if (accuracy >= 70) { grade = 'B'; gradeClass = 'grade-b'; }
    else if (accuracy >= 60) { grade = 'C'; gradeClass = 'grade-c'; }
    else { grade = 'D'; gradeClass = 'grade-d'; }

    container.innerHTML = `
        <header class="header">
            <button class="header-btn" onclick="showCalculatorMode()">&#8592; 计算器</button>
            <h1>闯关完成！</h1>
            <div style="width:60px"></div>
        </header>
        <div class="ch-complete">
            <div class="ch-complete-grade ${gradeClass}">${grade}</div>
            <div class="ch-complete-title">恭喜通关！</div>
            <div class="ch-complete-stats">
                <div class="ch-stat">
                    <div class="ch-stat-num">${challengeState.score}</div>
                    <div class="ch-stat-label">答对</div>
                </div>
                <div class="ch-stat">
                    <div class="ch-stat-num">${challengeState.completed.length - challengeState.score}</div>
                    <div class="ch-stat-label">答错</div>
                </div>
                <div class="ch-stat">
                    <div class="ch-stat-num">${accuracy}%</div>
                    <div class="ch-stat-label">正确率</div>
                </div>
            </div>
            <button class="ch-restart-btn" onclick="restartChallenge()">重新挑战</button>
            <button class="ch-back-btn" onclick="showCalculatorMode()">返回计算器</button>
        </div>
    `;
}

function restartChallenge() {
    resetChallengeProgress();
    showChallengeMode();
}

// 闯关关卡选择
function showLevelSelect() {
    document.getElementById('challengeLevelContent').style.display = 'none';
    document.getElementById('challengeLevelSelect').style.display = 'block';
    renderLevelSelect();
}

function hideLevelSelect() {
    document.getElementById('challengeLevelContent').style.display = 'block';
    document.getElementById('challengeLevelSelect').style.display = 'none';
}

function renderLevelSelect() {
    const grid = document.getElementById('levelSelectGrid');
    const completedLevels = new Map();
    challengeState.completed.forEach(c => completedLevels.set(c.level, c.correct));

    let html = '';
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const done = completedLevels.has(i);
        const correct = completedLevels.get(i);
        const isCurrent = i === challengeState.currentLevel;
        let cls = 'lvl-btn';
        if (done && correct) cls += ' lvl-correct';
        else if (done && !correct) cls += ' lvl-wrong';
        if (isCurrent) cls += ' lvl-current';

        const diff = getDifficultyLabel(i);
        html += `<button class="${cls}" onclick="jumpToLevel(${i})" title="${diff.text}">${i}</button>`;
    }
    grid.innerHTML = html;
}

function jumpToLevel(level) {
    challengeState.currentLevel = level;
    challengeState.completed = challengeState.completed.filter(c => c.level < level);
    challengeState.score = challengeState.completed.filter(c => c.correct).length;
    saveChallengeProgress();
    hideLevelSelect();
    renderChallengeLevel();
}
