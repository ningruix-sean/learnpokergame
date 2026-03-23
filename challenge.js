// challenge.js - 闯关模式：100关德州扑克胜率训练

const CHALLENGE_STORAGE_KEY = 'poker_challenge_progress';
const TOTAL_LEVELS = 100;

// 闯关状态
let challengeState = {
    currentLevel: 1,
    score: 0,
    completed: [],   // [{level, correct, playerAnswer, correctAnswer}]
    // 当前关卡
    handCards: [],
    communityCards: [],
    stage: '',
    numPlayers: 2,
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
    // 难度递增：前面关卡选项差距大，后面差距小
    // 阶段分布也随难度变化
    let stages, playerRange, optionSpread;

    if (level <= 20) {
        // 入门：翻牌前为主，选项差距大
        stages = ['preflop', 'preflop', 'flop', 'flop', 'preflop'];
        playerRange = [2, 4];
        optionSpread = 20; // 选项间距大
    } else if (level <= 40) {
        // 初级：混合阶段
        stages = ['preflop', 'flop', 'flop', 'turn'];
        playerRange = [2, 6];
        optionSpread = 15;
    } else if (level <= 60) {
        // 中级：更多翻牌后
        stages = ['flop', 'turn', 'turn', 'river'];
        playerRange = [3, 6];
        optionSpread = 12;
    } else if (level <= 80) {
        // 高级：河牌为主，选项差距小
        stages = ['flop', 'turn', 'river', 'river'];
        playerRange = [2, 9];
        optionSpread = 9;
    } else {
        // 大师：全阶段，选项差距很小
        stages = ['preflop', 'flop', 'turn', 'river'];
        playerRange = [2, 9];
        optionSpread = 7;
    }

    const stage = stages[Math.floor(Math.random() * stages.length)];
    const numPlayers = playerRange[0] + Math.floor(Math.random() * (playerRange[1] - playerRange[0] + 1));

    return { stage, numPlayers, optionSpread };
}

// 生成一关的题目
function generateLevel(level) {
    const config = getLevelConfig(level);
    const deck = buildDeck();
    shuffle(deck);

    let idx = 0;

    // 发手牌
    const hand = [deck[idx++], deck[idx++]];

    // 发公牌
    let commCount = 0;
    switch (config.stage) {
        case 'preflop': commCount = 0; break;
        case 'flop': commCount = 3; break;
        case 'turn': commCount = 4; break;
        case 'river': commCount = 5; break;
    }
    const community = [];
    for (let i = 0; i < commCount; i++) {
        community.push(deck[idx++]);
    }

    // 计算实际胜率（多次模拟取平均，提高准确度）
    const simResult = simulate(hand, community, config.numPlayers, 'any', 10000);
    const correctRate = simResult.winRate;

    // 生成4个选项
    const options = generateOptions(correctRate, config.optionSpread);

    challengeState.handCards = hand;
    challengeState.communityCards = community;
    challengeState.stage = config.stage;
    challengeState.numPlayers = config.numPlayers;
    challengeState.correctWinRate = correctRate;
    challengeState.options = options;
    challengeState.answered = false;
    challengeState.selectedOption = -1;
}

// 生成4个选项，其中一个是正确答案
function generateOptions(correctRate, spread) {
    const options = [];
    // 正确答案的位置随机
    const correctIdx = Math.floor(Math.random() * 4);

    for (let i = 0; i < 4; i++) {
        if (i === correctIdx) {
            options.push({ rate: correctRate, isCorrect: true });
        } else {
            let fakeRate;
            let attempts = 0;
            do {
                // 生成一个偏离正确答案的值
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
    const names = {
        preflop: '翻牌前',
        flop: '翻牌圈',
        turn: '转牌圈',
        river: '河牌圈'
    };
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
    // 如果已经通关全部
    if (challengeState.currentLevel > TOTAL_LEVELS) {
        renderChallengeComplete();
        return;
    }

    // 生成题目
    generateLevel(challengeState.currentLevel);

    const diff = getDifficultyLabel(challengeState.currentLevel);

    // 更新顶部信息
    document.getElementById('challengeLevelNum').textContent = `第 ${challengeState.currentLevel} 关`;
    document.getElementById('challengeDifficulty').textContent = diff.text;
    document.getElementById('challengeDifficulty').className = 'challenge-diff-badge ' + diff.cls;
    document.getElementById('challengeScore').textContent = `${challengeState.score}/${challengeState.completed.length}`;

    // 进度条
    const progressPct = ((challengeState.currentLevel - 1) / TOTAL_LEVELS) * 100;
    document.getElementById('challengeProgressFill').style.width = progressPct + '%';
    document.getElementById('challengeProgressText').textContent = `${challengeState.currentLevel - 1}/${TOTAL_LEVELS}`;

    // 场景信息
    document.getElementById('challengeStage').textContent = getStageName(challengeState.stage);
    document.getElementById('challengePlayers').textContent = challengeState.numPlayers + ' 人';

    // 渲染手牌
    renderChallengeCards();

    // 渲染选项
    renderChallengeOptions();

    // 隐藏结果区域
    document.getElementById('challengeResult').style.display = 'none';
    document.getElementById('challengeNextBtn').style.display = 'none';
}

function renderChallengeCards() {
    const handContainer = document.getElementById('challengeHandCards');
    handContainer.innerHTML = challengeState.handCards.map(card => {
        const { rank, suit } = parseCard(card);
        const isRed = suit === 'h' || suit === 'd';
        return `<div class="ch-card ${isRed ? 'ch-card-red' : 'ch-card-black'}">
            <span class="ch-card-rank">${getRankDisplay(rank)}</span>
            <span class="ch-card-suit">${getSuitSymbol(suit)}</span>
        </div>`;
    }).join('');

    const commContainer = document.getElementById('challengeCommCards');
    if (challengeState.communityCards.length === 0) {
        commContainer.innerHTML = '<div class="ch-no-comm">无公牌（翻牌前）</div>';
    } else {
        commContainer.innerHTML = challengeState.communityCards.map(card => {
            const { rank, suit } = parseCard(card);
            const isRed = suit === 'h' || suit === 'd';
            return `<div class="ch-card ${isRed ? 'ch-card-red' : 'ch-card-black'}">
                <span class="ch-card-rank">${getRankDisplay(rank)}</span>
                <span class="ch-card-suit">${getSuitSymbol(suit)}</span>
            </div>`;
        }).join('');
    }

    // 显示当前牌型（如果有公牌）
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

    // 记录结果
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
        if (opt.isCorrect) {
            el.classList.add('ch-option-correct');
        }
        if (i === idx && !isCorrect) {
            el.classList.add('ch-option-wrong');
        }
        el.disabled = true;
    });

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

    // 显示下一关按钮
    document.getElementById('challengeNextBtn').style.display = 'block';

    // 更新得分
    document.getElementById('challengeScore').textContent = `${challengeState.score}/${challengeState.completed.length}`;
}

function nextChallengeLevel() {
    challengeState.currentLevel++;
    saveChallengeProgress();
    renderChallengeLevel();
    // 滚动到顶部
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
    // 移除该关之后的记录
    challengeState.completed = challengeState.completed.filter(c => c.level < level);
    challengeState.score = challengeState.completed.filter(c => c.correct).length;
    saveChallengeProgress();
    hideLevelSelect();
    renderChallengeLevel();
}
