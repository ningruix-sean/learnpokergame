// challenge.js - 闯关模式 + 竞技场模式 + 经典案例模式

const CHALLENGE_STORAGE_KEY = 'poker_challenge_progress';
const ARENA_STORAGE_KEY = 'poker_arena_best';
const CLASSIC_STORAGE_KEY = 'poker_classic_progress';
const TOTAL_LEVELS = 300;
const ARENA_QUESTIONS = 10;

// 牌桌位置
const POSITION_NAMES = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'];
const POSITION_FULL_NAMES = {
    BTN: '庄家', SB: '小盲', BB: '大盲', UTG: '枪口',
    'UTG+1': '枪口+1', MP: '中位', 'MP+1': '中位+1', HJ: '劫持位', CO: '关煞位'
};

// ========== 共享状态 ==========

let challengeState = {
    currentLevel: 1, score: 0, completed: [],
    handCards: [], communityCards: [], fullCommunity: [],
    stage: '', numPlayers: 2, playerPosition: '',
    opponents: [], correctWinRate: 0, options: [],
    answered: false, selectedOption: -1
};

let arenaState = {
    currentQ: 0, score: 0, results: [],
    handCards: [], communityCards: [], fullCommunity: [],
    stage: '', numPlayers: 2, playerPosition: '',
    opponents: [], correctWinRate: 0, options: [],
    answered: false, selectedOption: -1
};

let classicState = {
    currentIdx: 0, score: 0, completed: [],
    handCards: [], communityCards: [], fullCommunity: [],
    stage: '', numPlayers: 2, playerPosition: '',
    opponents: [], correctWinRate: 0, options: [],
    answered: false, selectedOption: -1,
    currentHand: null // 当前经典手牌数据
};

// ========== 存储 ==========

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

function saveChallengeProgress() {
    try {
        localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({
            currentLevel: challengeState.currentLevel,
            score: challengeState.score,
            completed: challengeState.completed
        }));
    } catch (e) { /* ignore */ }
}

function resetChallengeProgress() {
    challengeState.currentLevel = 1;
    challengeState.score = 0;
    challengeState.completed = [];
    saveChallengeProgress();
}

function loadArenaBest() {
    try {
        const saved = localStorage.getItem(ARENA_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
}

function saveArenaBest(result) {
    try {
        const prev = loadArenaBest();
        if (!prev || result.score > prev.score) {
            localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(result));
        }
    } catch (e) { /* ignore */ }
}

function loadClassicProgress() {
    try {
        const saved = localStorage.getItem(CLASSIC_STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            classicState.currentIdx = data.currentIdx || 0;
            classicState.score = data.score || 0;
            classicState.completed = data.completed || [];
        }
    } catch (e) { /* ignore */ }
}

function saveClassicProgress() {
    try {
        localStorage.setItem(CLASSIC_STORAGE_KEY, JSON.stringify({
            currentIdx: classicState.currentIdx,
            score: classicState.score,
            completed: classicState.completed
        }));
    } catch (e) { /* ignore */ }
}

function resetClassicProgress() {
    classicState.currentIdx = 0;
    classicState.score = 0;
    classicState.completed = [];
    saveClassicProgress();
}

// ========== 难度配置（300关） ==========

function getLevelConfig(level) {
    let stages, playerRange, optionSpread;

    if (level <= 30) {
        stages = ['preflop', 'preflop', 'flop', 'flop', 'preflop'];
        playerRange = [2, 3];
        optionSpread = 22;
    } else if (level <= 60) {
        stages = ['preflop', 'preflop', 'flop', 'flop'];
        playerRange = [2, 4];
        optionSpread = 18;
    } else if (level <= 100) {
        stages = ['preflop', 'flop', 'flop', 'turn'];
        playerRange = [2, 5];
        optionSpread = 15;
    } else if (level <= 140) {
        stages = ['flop', 'flop', 'turn', 'turn'];
        playerRange = [3, 6];
        optionSpread = 13;
    } else if (level <= 180) {
        stages = ['flop', 'turn', 'turn', 'river'];
        playerRange = [3, 6];
        optionSpread = 11;
    } else if (level <= 220) {
        stages = ['flop', 'turn', 'river', 'river'];
        playerRange = [2, 7];
        optionSpread = 9;
    } else if (level <= 260) {
        stages = ['preflop', 'flop', 'turn', 'river'];
        playerRange = [2, 8];
        optionSpread = 7;
    } else {
        stages = ['preflop', 'flop', 'turn', 'river'];
        playerRange = [2, 9];
        optionSpread = 5;
    }

    const stage = stages[Math.floor(Math.random() * stages.length)];
    const numPlayers = playerRange[0] + Math.floor(Math.random() * (playerRange[1] - playerRange[0] + 1));

    return { stage, numPlayers, optionSpread };
}

// 竞技场的难度：混合各种难度
function getArenaConfig(questionIndex) {
    // 10题：2简单 + 3中等 + 3困难 + 2大师
    const configs = [
        { stages: ['preflop', 'flop'], playerRange: [2, 3], optionSpread: 20 },
        { stages: ['preflop', 'flop'], playerRange: [2, 4], optionSpread: 18 },
        { stages: ['flop', 'turn'], playerRange: [2, 5], optionSpread: 14 },
        { stages: ['flop', 'turn'], playerRange: [3, 6], optionSpread: 12 },
        { stages: ['turn', 'river'], playerRange: [2, 6], optionSpread: 10 },
        { stages: ['flop', 'turn', 'river'], playerRange: [3, 7], optionSpread: 9 },
        { stages: ['turn', 'river'], playerRange: [2, 7], optionSpread: 8 },
        { stages: ['flop', 'river'], playerRange: [3, 8], optionSpread: 7 },
        { stages: ['preflop', 'flop', 'turn', 'river'], playerRange: [2, 9], optionSpread: 6 },
        { stages: ['preflop', 'flop', 'turn', 'river'], playerRange: [3, 9], optionSpread: 5 },
    ];
    const c = configs[questionIndex] || configs[9];
    const stage = c.stages[Math.floor(Math.random() * c.stages.length)];
    const numPlayers = c.playerRange[0] + Math.floor(Math.random() * (c.playerRange[1] - c.playerRange[0] + 1));
    return { stage, numPlayers, optionSpread: c.optionSpread };
}

function getDifficultyLabel(level) {
    if (level <= 30) return { text: '入门', cls: 'diff-easy' };
    if (level <= 60) return { text: '基础', cls: 'diff-easy' };
    if (level <= 100) return { text: '初级', cls: 'diff-normal' };
    if (level <= 140) return { text: '中级', cls: 'diff-medium' };
    if (level <= 180) return { text: '进阶', cls: 'diff-medium' };
    if (level <= 220) return { text: '高级', cls: 'diff-hard' };
    if (level <= 260) return { text: '专家', cls: 'diff-hard' };
    return { text: '大师', cls: 'diff-master' };
}

// ========== 核心：生成题目 ==========

function simulateExact(myHand, oppHands, knownCommunity, iterations) {
    const usedCards = new Set([...myHand, ...knownCommunity]);
    for (const opp of oppHands) { usedCards.add(opp[0]); usedCards.add(opp[1]); }
    const remainDeck = buildDeck().filter(c => !usedCards.has(c));
    const communityNeeded = 5 - knownCommunity.length;

    if (communityNeeded === 0) {
        const myEval = evaluateHand([...myHand, ...knownCommunity]);
        let win = true, tie = false;
        for (const opp of oppHands) {
            const oppEval = evaluateHand([...opp, ...knownCommunity]);
            const cmp = compareHands(myEval, oppEval);
            if (cmp < 0) { return 0; }
            else if (cmp === 0) { tie = true; }
        }
        return win && !tie ? 100 : (tie ? 50 : 0);
    }

    let wins = 0, ties = 0;
    for (let i = 0; i < iterations; i++) {
        const deck = [...remainDeck];
        shuffle(deck);
        const simComm = [...knownCommunity];
        for (let c = 0; c < communityNeeded; c++) simComm.push(deck[c]);
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

function assignPositions(numPlayers) {
    let positions;
    if (numPlayers === 2) positions = ['BTN', 'BB'];
    else if (numPlayers === 3) positions = ['BTN', 'SB', 'BB'];
    else if (numPlayers <= 6) positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'].slice(0, numPlayers);
    else positions = POSITION_NAMES.slice(0, numPlayers);
    const shuffled = [...positions];
    shuffle(shuffled);
    return { playerPos: shuffled[0], oppPositions: shuffled.slice(1) };
}

function generateQuestion(config) {
    const deck = buildDeck();
    shuffle(deck);
    let idx = 0;

    const hand = [deck[idx++], deck[idx++]];
    const numOpponents = config.numPlayers - 1;
    const opponents = [];
    const { playerPos, oppPositions } = assignPositions(config.numPlayers);

    for (let i = 0; i < numOpponents; i++) {
        opponents.push({ position: oppPositions[i], cards: [deck[idx++], deck[idx++]] });
    }

    const fullCommunity = [];
    for (let i = 0; i < 5; i++) fullCommunity.push(deck[idx++]);

    let commCount = 0;
    switch (config.stage) {
        case 'preflop': commCount = 0; break;
        case 'flop': commCount = 3; break;
        case 'turn': commCount = 4; break;
        case 'river': commCount = 5; break;
    }
    const community = fullCommunity.slice(0, commCount);

    const oppHands = opponents.map(o => o.cards);
    const runs = 3, iterPerRun = 20000;
    let totalRate = 0;
    for (let r = 0; r < runs; r++) totalRate += simulateExact(hand, oppHands, community, iterPerRun);
    const correctRate = Math.round(totalRate / runs);

    for (const opp of opponents) {
        if (community.length > 0) {
            const eval_ = evaluateHand([...opp.cards, ...community]);
            opp.handType = HAND_NAMES[eval_[0]];
        } else {
            opp.handType = null;
        }
    }

    const options = generateOptions(correctRate, config.optionSpread);

    return { hand, community, fullCommunity, stage: config.stage, numPlayers: config.numPlayers,
        playerPos, opponents, correctRate, options };
}

function generateOptions(correctRate, spread) {
    const options = [];
    const correctIdx = Math.floor(Math.random() * 4);
    for (let i = 0; i < 4; i++) {
        if (i === correctIdx) {
            options.push({ rate: correctRate, isCorrect: true });
        } else {
            let fakeRate, attempts = 0;
            do {
                const offset = (Math.random() * spread * 2 + spread) * (Math.random() < 0.5 ? -1 : 1);
                fakeRate = Math.round(correctRate + offset);
                fakeRate = Math.max(1, Math.min(99, fakeRate));
                attempts++;
            } while (attempts < 50 && (Math.abs(fakeRate - correctRate) < spread * 0.5 ||
                options.some(o => Math.abs(o.rate - fakeRate) < spread * 0.4)));
            options.push({ rate: fakeRate, isCorrect: false });
        }
    }
    return options;
}

function getStageName(stage) {
    return { preflop: '翻牌前', flop: '翻牌圈', turn: '转牌圈', river: '河牌圈' }[stage] || stage;
}

// ========== UI 工具 ==========

function cardHTML(card, small) {
    const { rank, suit } = parseCard(card);
    const isRed = suit === 'h' || suit === 'd';
    const cls = small ? 'ch-card ch-card-sm' : 'ch-card';
    return `<div class="${cls} ${isRed ? 'ch-card-red' : 'ch-card-black'}">
        <span class="ch-card-rank">${getRankDisplay(rank)}</span>
        <span class="ch-card-suit">${getSuitSymbol(suit)}</span>
    </div>`;
}

function cardBackHTML() {
    return `<div class="ch-card ch-card-sm ch-card-back"><span class="ch-card-back-icon">?</span></div>`;
}

function renderQuestionUI(state, prefix) {
    document.getElementById(prefix + 'Stage').textContent = getStageName(state.stage);
    document.getElementById(prefix + 'Players').textContent = state.numPlayers + ' 人';

    // 手牌
    document.getElementById(prefix + 'HandCards').innerHTML = state.handCards.map(c => cardHTML(c, false)).join('');
    document.getElementById(prefix + 'PlayerPos').textContent =
        state.playerPosition + ' (' + POSITION_FULL_NAMES[state.playerPosition] + ')';

    // 公牌
    const commEl = document.getElementById(prefix + 'CommCards');
    if (state.communityCards.length === 0) {
        commEl.innerHTML = '<div class="ch-no-comm">无公牌（翻牌前）</div>';
    } else {
        commEl.innerHTML = state.communityCards.map(c => cardHTML(c, false)).join('');
    }

    // 当前牌型
    const handTypeEl = document.getElementById(prefix + 'HandType');
    if (state.communityCards.length > 0) {
        const eval_ = evaluateHand([...state.handCards, ...state.communityCards]);
        handTypeEl.textContent = '当前牌型：' + HAND_NAMES[eval_[0]];
        handTypeEl.style.display = 'block';
    } else {
        handTypeEl.style.display = 'none';
    }

    // 对手
    renderOpponentsUI(state.opponents, false, prefix + 'Opponents');

    // 选项
    const optContainer = document.getElementById(prefix + 'Options');
    optContainer.innerHTML = state.options.map((opt, idx) => {
        const fnMap = { arena: 'selectArenaOption', challenge: 'selectChallengeOption', classic: 'selectClassicOption' };
        const fn = fnMap[prefix] || 'selectChallengeOption';
        return `<button class="ch-option" id="${prefix}Opt${idx}" onclick="${fn}(${idx})">
            <span class="ch-option-label">选项 ${['A', 'B', 'C', 'D'][idx]}</span>
            <span class="ch-option-rate">${opt.rate}%</span>
        </button>`;
    }).join('');

    document.getElementById(prefix + 'Result').style.display = 'none';
}

function renderOpponentsUI(opponents, revealed, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = opponents.map(opp => {
        const posName = POSITION_FULL_NAMES[opp.position] || opp.position;
        let cardsHtml, typeHtml = '';
        if (revealed) {
            cardsHtml = opp.cards.map(c => cardHTML(c, true)).join('');
            if (opp.handType) typeHtml = `<span class="ch-opp-handtype">${opp.handType}</span>`;
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

function showAnswerResult(state, idx, prefix) {
    const selected = state.options[idx];
    const isCorrect = selected.isCorrect;

    state.options.forEach((opt, i) => {
        const el = document.getElementById(prefix + 'Opt' + i);
        if (opt.isCorrect) el.classList.add('ch-option-correct');
        if (i === idx && !isCorrect) el.classList.add('ch-option-wrong');
        el.disabled = true;
    });

    renderOpponentsUI(state.opponents, true, prefix + 'Opponents');

    const resultEl = document.getElementById(prefix + 'Result');
    resultEl.style.display = 'block';
    if (isCorrect) {
        resultEl.innerHTML = `<div class="ch-result-correct">
            <div class="ch-result-icon">&#10004;</div>
            <div class="ch-result-text">回答正确！</div>
            <div class="ch-result-detail">实际胜率: ${state.correctWinRate}%</div>
        </div>`;
    } else {
        resultEl.innerHTML = `<div class="ch-result-wrong">
            <div class="ch-result-icon">&#10008;</div>
            <div class="ch-result-text">回答错误</div>
            <div class="ch-result-detail">你选了 ${selected.rate}%，实际胜率: ${state.correctWinRate}%</div>
        </div>`;
    }

    return isCorrect;
}

// ========== 页面导航 ==========

function showHomeMode() {
    document.getElementById('homeApp').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    document.getElementById('challengeApp').style.display = 'none';
    document.getElementById('arenaApp').style.display = 'none';
    document.getElementById('classicApp').style.display = 'none';
    updateHomeStats();
}

function showCalculatorMode() {
    document.getElementById('homeApp').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('challengeApp').style.display = 'none';
    document.getElementById('arenaApp').style.display = 'none';
}

function showCampaignMode() {
    document.getElementById('homeApp').style.display = 'none';
    document.getElementById('challengeApp').style.display = 'block';
    document.getElementById('arenaApp').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    loadChallengeProgress();
    renderChallengeLevel();
}

function updateHomeStats() {
    loadChallengeProgress();
    const el = document.getElementById('campaignProgress');
    if (el) el.textContent = `${challengeState.completed.length}/${TOTAL_LEVELS}`;

    // 经典案例进度
    loadClassicProgress();
    const classicTag = document.getElementById('classicProgressTag');
    if (classicTag) {
        if (classicState.completed.length > 0) {
            classicTag.textContent = `${classicState.completed.length}/${CLASSIC_HANDS.length}`;
        } else {
            classicTag.textContent = `${CLASSIC_HANDS.length}题`;
        }
    }

    const statsEl = document.getElementById('homeStats');
    const best = loadArenaBest();
    if (best) {
        const eval_ = getArenaEvaluation(best.score);
        statsEl.innerHTML = `
            <div class="home-best-card">
                <div class="home-best-title">竞技场最佳</div>
                <div class="home-best-row">
                    <span class="home-best-grade ${eval_.gradeClass}">${eval_.grade}</span>
                    <span class="home-best-score">${best.score}/${ARENA_QUESTIONS} 正确</span>
                    <span class="home-best-label">${eval_.title}</span>
                </div>
            </div>`;
    } else {
        statsEl.innerHTML = '';
    }
}

// ========== 竞技场模式 ==========

function startArena() {
    arenaState = {
        currentQ: 0, score: 0, results: [],
        handCards: [], communityCards: [], fullCommunity: [],
        stage: '', numPlayers: 2, playerPosition: '',
        opponents: [], correctWinRate: 0, options: [],
        answered: false, selectedOption: -1
    };

    document.getElementById('homeApp').style.display = 'none';
    document.getElementById('arenaApp').style.display = 'block';
    document.getElementById('arenaContent').style.display = 'block';
    document.getElementById('arenaResultPage').style.display = 'none';

    renderArenaQuestion();
}

function exitArena() {
    showHomeMode();
}

function renderArenaQuestion() {
    if (arenaState.currentQ >= ARENA_QUESTIONS) {
        showArenaResult();
        return;
    }

    const config = getArenaConfig(arenaState.currentQ);
    const q = generateQuestion(config);

    arenaState.handCards = q.hand;
    arenaState.communityCards = q.community;
    arenaState.fullCommunity = q.fullCommunity;
    arenaState.stage = q.stage;
    arenaState.numPlayers = q.numPlayers;
    arenaState.playerPosition = q.playerPos;
    arenaState.opponents = q.opponents;
    arenaState.correctWinRate = q.correctRate;
    arenaState.options = q.options;
    arenaState.answered = false;
    arenaState.selectedOption = -1;

    document.getElementById('arenaProgress').textContent = `${arenaState.currentQ + 1}/${ARENA_QUESTIONS}`;

    // 进度点
    const dotsHtml = Array.from({ length: ARENA_QUESTIONS }, (_, i) => {
        let cls = 'arena-dot';
        if (i < arenaState.results.length) {
            cls += arenaState.results[i] ? ' dot-correct' : ' dot-wrong';
        } else if (i === arenaState.currentQ) {
            cls += ' dot-current';
        }
        return `<span class="${cls}"></span>`;
    }).join('');
    document.getElementById('arenaDots').innerHTML = dotsHtml;

    renderQuestionUI(arenaState, 'arena');
    document.getElementById('arenaNextBtn').style.display = 'none';
}

function selectArenaOption(idx) {
    if (arenaState.answered) return;
    arenaState.answered = true;
    arenaState.selectedOption = idx;

    const isCorrect = showAnswerResult(arenaState, idx, 'arena');
    if (isCorrect) arenaState.score++;
    arenaState.results.push(isCorrect);

    // 更新点
    const dots = document.getElementById('arenaDots').children;
    const dotIdx = arenaState.currentQ;
    if (dots[dotIdx]) {
        dots[dotIdx].className = 'arena-dot ' + (isCorrect ? 'dot-correct' : 'dot-wrong');
    }

    document.getElementById('arenaNextBtn').style.display = 'block';
    document.getElementById('arenaNextBtn').textContent =
        arenaState.currentQ + 1 >= ARENA_QUESTIONS ? '查看结果' : '下一题 →';
}

function nextArenaQuestion() {
    arenaState.currentQ++;
    renderArenaQuestion();
    document.getElementById('arenaApp').scrollTo(0, 0);
}

function getArenaEvaluation(score) {
    const pct = (score / ARENA_QUESTIONS) * 100;
    if (pct >= 90) return { grade: 'S', gradeClass: 'grade-s', title: '扑克大师', desc: '你对胜率的直觉非常精准，可以在高级牌局中自信决策！' };
    if (pct >= 80) return { grade: 'A', gradeClass: 'grade-a', title: '高手玩家', desc: '你对牌面局势有很强的判断力，继续保持！' };
    if (pct >= 70) return { grade: 'B', gradeClass: 'grade-b', title: '进阶玩家', desc: '你已经能较准确地判断胜率，多加练习会更好。' };
    if (pct >= 50) return { grade: 'C', gradeClass: 'grade-c', title: '业余玩家', desc: '胜率判断还有提升空间，建议多玩闯关模式练习。' };
    if (pct >= 30) return { grade: 'D', gradeClass: 'grade-d', title: '新手上路', desc: '胜率估算偏差较大，通过闯关模式逐步提升吧！' };
    return { grade: 'F', gradeClass: 'grade-d', title: '萌新阶段', desc: '别灰心！扑克直觉需要积累，多练习就会进步。' };
}

function showArenaResult() {
    document.getElementById('arenaContent').style.display = 'none';
    document.getElementById('arenaResultPage').style.display = 'block';

    const eval_ = getArenaEvaluation(arenaState.score);
    const pct = Math.round((arenaState.score / ARENA_QUESTIONS) * 100);

    saveArenaBest({ score: arenaState.score, date: new Date().toISOString() });

    const dotsHtml = arenaState.results.map((r, i) =>
        `<span class="arena-dot-lg ${r ? 'dot-correct' : 'dot-wrong'}">${i + 1}</span>`
    ).join('');

    document.getElementById('arenaResultPage').innerHTML = `
        <div class="arena-result-container">
            <div class="arena-result-grade ${eval_.gradeClass}">${eval_.grade}</div>
            <div class="arena-result-title">${eval_.title}</div>
            <div class="arena-result-desc">${eval_.desc}</div>
            <div class="arena-result-stats">
                <div class="ch-stat"><div class="ch-stat-num">${arenaState.score}</div><div class="ch-stat-label">答对</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${ARENA_QUESTIONS - arenaState.score}</div><div class="ch-stat-label">答错</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${pct}%</div><div class="ch-stat-label">正确率</div></div>
            </div>
            <div class="arena-result-dots">${dotsHtml}</div>
            <button class="arena-share-btn" onclick="shareArenaResult()">📤 分享成绩</button>
            <button class="ch-restart-btn" onclick="startArena()">再来一局</button>
            <button class="ch-back-btn" onclick="showHomeMode()">返回首页</button>
        </div>
    `;
}

function shareArenaResult() {
    const eval_ = getArenaEvaluation(arenaState.score);
    const pct = Math.round((arenaState.score / ARENA_QUESTIONS) * 100);
    const dots = arenaState.results.map(r => r ? '🟢' : '🔴').join('');

    const text = `🃏 德州扑克训练营 - 竞技场\n` +
        `评级: ${eval_.grade} - ${eval_.title}\n` +
        `得分: ${arenaState.score}/${ARENA_QUESTIONS} (${pct}%)\n` +
        `${dots}\n` +
        `来挑战你的扑克直觉吧！`;

    if (navigator.share) {
        navigator.share({ title: '德州扑克训练营', text: text }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.arena-share-btn');
        if (btn) {
            btn.textContent = '✅ 已复制到剪贴板';
            setTimeout(() => { btn.textContent = '📤 分享成绩'; }, 2000);
        }
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const btn = document.querySelector('.arena-share-btn');
        if (btn) {
            btn.textContent = '✅ 已复制到剪贴板';
            setTimeout(() => { btn.textContent = '📤 分享成绩'; }, 2000);
        }
    });
}

// ========== 闯关模式 ==========

function renderChallengeLevel() {
    if (challengeState.currentLevel > TOTAL_LEVELS) {
        renderChallengeComplete();
        return;
    }

    const config = getLevelConfig(challengeState.currentLevel);
    const q = generateQuestion(config);

    challengeState.handCards = q.hand;
    challengeState.communityCards = q.community;
    challengeState.fullCommunity = q.fullCommunity;
    challengeState.stage = q.stage;
    challengeState.numPlayers = q.numPlayers;
    challengeState.playerPosition = q.playerPos;
    challengeState.opponents = q.opponents;
    challengeState.correctWinRate = q.correctRate;
    challengeState.options = q.options;
    challengeState.answered = false;
    challengeState.selectedOption = -1;

    const diff = getDifficultyLabel(challengeState.currentLevel);

    document.getElementById('challengeLevelNum').textContent = `第 ${challengeState.currentLevel} 关`;
    document.getElementById('challengeDifficulty').textContent = diff.text;
    document.getElementById('challengeDifficulty').className = 'challenge-diff-badge ' + diff.cls;
    document.getElementById('challengeScore').textContent = `${challengeState.score}/${challengeState.completed.length}`;

    const progressPct = ((challengeState.currentLevel - 1) / TOTAL_LEVELS) * 100;
    document.getElementById('challengeProgressFill').style.width = progressPct + '%';
    document.getElementById('challengeProgressText').textContent = `${challengeState.currentLevel - 1}/${TOTAL_LEVELS}`;

    renderQuestionUI(challengeState, 'challenge');
    document.getElementById('challengeNextBtn').style.display = 'none';
}

function selectChallengeOption(idx) {
    if (challengeState.answered) return;
    challengeState.answered = true;
    challengeState.selectedOption = idx;

    const selected = challengeState.options[idx];
    const isCorrect = showAnswerResult(challengeState, idx, 'challenge');

    if (isCorrect) challengeState.score++;

    challengeState.completed.push({
        level: challengeState.currentLevel,
        correct: isCorrect,
        playerAnswer: selected.rate,
        correctAnswer: challengeState.correctWinRate
    });

    saveChallengeProgress();
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
    const accuracy = challengeState.completed.length > 0
        ? Math.round((challengeState.score / challengeState.completed.length) * 100) : 0;
    const eval_ = getArenaEvaluation(Math.round(challengeState.score / challengeState.completed.length * ARENA_QUESTIONS));

    const content = document.getElementById('challengeLevelContent');
    content.innerHTML = `
        <div class="ch-complete">
            <div class="ch-complete-grade ${eval_.gradeClass}">${eval_.grade}</div>
            <div class="ch-complete-title">恭喜通关 ${TOTAL_LEVELS} 关！</div>
            <div class="ch-complete-stats">
                <div class="ch-stat"><div class="ch-stat-num">${challengeState.score}</div><div class="ch-stat-label">答对</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${challengeState.completed.length - challengeState.score}</div><div class="ch-stat-label">答错</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${accuracy}%</div><div class="ch-stat-label">正确率</div></div>
            </div>
            <button class="ch-restart-btn" onclick="restartChallenge()">重新挑战</button>
            <button class="ch-back-btn" onclick="showHomeMode()">返回首页</button>
        </div>
    `;
}

function restartChallenge() {
    resetChallengeProgress();
    showCampaignMode();
}

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
        html += `<button class="${cls}" onclick="jumpToLevel(${i})" title="${getDifficultyLabel(i).text}">${i}</button>`;
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

// ========== 经典案例模式 ==========

function showClassicMode() {
    document.getElementById('homeApp').style.display = 'none';
    document.getElementById('classicApp').style.display = 'block';
    document.getElementById('arenaApp').style.display = 'none';
    document.getElementById('challengeApp').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    loadClassicProgress();
    renderClassicQuestion();
}

function exitClassic() {
    showHomeMode();
}

function renderClassicQuestion() {
    if (classicState.currentIdx >= CLASSIC_HANDS.length) {
        renderClassicComplete();
        return;
    }

    const hand = CLASSIC_HANDS[classicState.currentIdx];
    classicState.currentHand = hand;

    // 用经典手牌数据构建题目
    const opponents = hand.villains.map(v => ({
        position: v.position,
        cards: v.cards,
        handType: hand.community.length > 0 ? HAND_NAMES[evaluateHand([...v.cards, ...hand.community])[0]] : null
    }));

    const oppHands = opponents.map(o => o.cards);
    const runs = 3, iterPerRun = 20000;
    let totalRate = 0;
    for (let r = 0; r < runs; r++) {
        totalRate += simulateExact(hand.heroCards, oppHands, hand.community, iterPerRun);
    }
    const correctRate = Math.round(totalRate / runs);

    // 经典案例用较小的选项间距（更有挑战）
    const optionSpread = 12;
    const options = generateOptions(correctRate, optionSpread);

    classicState.handCards = hand.heroCards;
    classicState.communityCards = hand.community;
    classicState.fullCommunity = hand.community;
    classicState.stage = hand.stage;
    classicState.numPlayers = hand.numPlayers;
    classicState.playerPosition = hand.heroPos;
    classicState.opponents = opponents;
    classicState.correctWinRate = correctRate;
    classicState.options = options;
    classicState.answered = false;
    classicState.selectedOption = -1;

    // 更新UI
    document.getElementById('classicContent').style.display = 'block';
    document.getElementById('classicResultPage').style.display = 'none';

    document.getElementById('classicProgress').textContent = `${classicState.currentIdx + 1}/${CLASSIC_HANDS.length}`;
    document.getElementById('classicScoreDisplay').textContent = `${classicState.score}/${classicState.completed.length}`;

    // 进度条
    const pct = (classicState.currentIdx / CLASSIC_HANDS.length) * 100;
    document.getElementById('classicProgressFill').style.width = pct + '%';

    // 比赛信息
    document.getElementById('classicTournament').textContent = hand.tournament;
    document.getElementById('classicDescription').textContent = hand.description;

    // 渲染题目UI
    renderQuestionUI(classicState, 'classic');
    document.getElementById('classicNextBtn').style.display = 'none';
}

function selectClassicOption(idx) {
    if (classicState.answered) return;
    classicState.answered = true;
    classicState.selectedOption = idx;

    const selected = classicState.options[idx];
    const isCorrect = showAnswerResult(classicState, idx, 'classic');

    if (isCorrect) classicState.score++;

    classicState.completed.push({
        id: classicState.currentHand.id,
        correct: isCorrect,
        playerAnswer: selected.rate,
        correctAnswer: classicState.correctWinRate
    });

    classicState.currentIdx++;
    saveClassicProgress();

    document.getElementById('classicNextBtn').style.display = 'block';
    document.getElementById('classicNextBtn').textContent =
        classicState.currentIdx >= CLASSIC_HANDS.length ? '查看结果' : '下一题 →';
    document.getElementById('classicScoreDisplay').textContent = `${classicState.score}/${classicState.completed.length}`;
}

function nextClassicQuestion() {
    renderClassicQuestion();
    document.getElementById('classicApp').scrollTo(0, 0);
}

function renderClassicComplete() {
    document.getElementById('classicContent').style.display = 'none';
    const page = document.getElementById('classicResultPage');
    page.style.display = 'block';

    const total = classicState.completed.length;
    const accuracy = total > 0 ? Math.round((classicState.score / total) * 100) : 0;
    const eval_ = getArenaEvaluation(Math.round(classicState.score / total * ARENA_QUESTIONS));

    page.innerHTML = `
        <div class="arena-result-container">
            <div class="arena-result-grade ${eval_.gradeClass}">${eval_.grade}</div>
            <div class="arena-result-title">${eval_.title}</div>
            <div class="arena-result-desc">你完成了全部 ${CLASSIC_HANDS.length} 个经典案例！</div>
            <div class="arena-result-stats">
                <div class="ch-stat"><div class="ch-stat-num">${classicState.score}</div><div class="ch-stat-label">答对</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${total - classicState.score}</div><div class="ch-stat-label">答错</div></div>
                <div class="ch-stat"><div class="ch-stat-num">${accuracy}%</div><div class="ch-stat-label">正确率</div></div>
            </div>
            <button class="ch-restart-btn" onclick="restartClassic()">重新挑战</button>
            <button class="ch-back-btn" onclick="showHomeMode()">返回首页</button>
        </div>
    `;
}

function restartClassic() {
    resetClassicProgress();
    showClassicMode();
}
