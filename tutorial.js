// tutorial.js - 新手教程：10道初级经典题目 + 知识点讲解

const TUTORIAL_LESSONS = [
    {
        id: 1,
        title: '认识起手牌：口袋A是最强起手牌',
        knowledgePoint: '翻牌前策略',
        teachBefore: '在德州扑克中，翻牌前你拿到的两张底牌决定了起点。口袋对子（两张相同的牌）是强牌，其中 AA 是最强起手牌，翻牌前对任何单个对手的胜率都超过80%。',
        heroPos: 'UTG',
        heroCards: ['As', 'Ah'],
        villains: [{ position: 'BB', cards: ['Kh', 'Qd'] }],
        community: [],
        stage: 'preflop',
        numPlayers: 2,
        explainAfter: 'AA 翻牌前对 KQ 的胜率约为83%。即使 KQ 是两张大牌，面对口袋A依然处于绝对劣势。这就是为什么拿到 AA 要在翻牌前加注——你希望尽量多的筹码进入底池。'
    },
    {
        id: 2,
        title: '位置的力量：后位优势',
        knowledgePoint: '位置优势',
        teachBefore: '位置是德州扑克最重要的概念之一。BTN（庄家位）是最好的位置，因为你最后行动，能看到所有人的决策再做判断。UTG（枪口位）最早行动，需要更强的牌才能入池。',
        heroPos: 'BTN',
        heroCards: ['Ac', 'Jh'],
        villains: [{ position: 'UTG', cards: ['Kd', 'Ts'] }],
        community: ['Ah', '7c', '3d'],
        stage: 'flop',
        numPlayers: 2,
        explainAfter: 'AJ 在翻牌圈击中了顶对（A），而且踢脚牌J也不错。对手KT没有中对，只有一个K高牌。你在BTN位置的优势在于：如果对手check，你可以选择下注或者免费看牌；如果对手下注，你可以根据信息决策。位置给了你更多信息和更灵活的选择。'
    },
    {
        id: 3,
        title: '同花的威力：同花 > 顺子',
        knowledgePoint: '牌型大小',
        teachBefore: '德州扑克牌型从小到大：高牌 < 一对 < 两对 < 三条 < 顺子 < 同花 < 葫芦 < 四条 < 同花顺。同花（5张同花色）比顺子（5张连续）更大，因为同花更难凑成。同花牌（两张底牌同花色）比杂色牌多了约3%的胜率。',
        heroPos: 'CO',
        heroCards: ['Kh', 'Th'],
        villains: [{ position: 'BB', cards: ['Qc', 'Jd'] }],
        community: ['9h', '5h', '2c'],
        stage: 'flop',
        numPlayers: 2,
        explainAfter: '你的 KhTh 在翻牌后有两张红心公牌，形成了同花听牌（还差一张红心就成同花）。同花听牌有大约35%的几率在转牌或河牌完成。对手QJ目前只有高牌，虽然也有顺子听牌潜力。你的同花听牌加上K高牌给了你不错的胜率。'
    },
    {
        id: 4,
        title: '被压制的危险：踢脚牌陷阱',
        knowledgePoint: '手牌压制',
        teachBefore: '当两个玩家共享一张高牌时，另一张牌（踢脚牌/Kicker）决定胜负。比如 AK vs AQ，两人都会中一对A，但K踢脚牌压制了Q。被压制的手牌胜率只有25-30%，非常危险。',
        heroPos: 'BTN',
        heroCards: ['Ad', 'Kc'],
        villains: [{ position: 'BB', cards: ['As', '7h'] }],
        community: ['Ac', '9d', '4s'],
        stage: 'flop',
        numPlayers: 2,
        explainAfter: '两人都中了一对A，但你的踢脚牌是K，对手只有7。这就是经典的"压制"局面——对手被你的AK压制了，他需要翻出7才能翻盘。在这种局面下你的胜率超过90%。记住：玩大A牌时，踢脚牌越大越好，A2-A6这样的弱A牌容易被压制。'
    },
    {
        id: 5,
        title: '翻牌前经典对决：对子 vs 两高牌',
        knowledgePoint: '翻牌前对决',
        teachBefore: '翻牌前有三种经典对决：①对子 vs 对子（大对子约80%胜率）②对子 vs 两高牌（约55%对45%，也叫"抛硬币"）③高牌 vs 被压制牌（约70%对30%）。中等对子对上两张高牌几乎是五五开。',
        heroPos: 'CO',
        heroCards: ['Td', 'Tc'],
        villains: [{ position: 'BTN', cards: ['Ah', 'Kd'] }],
        community: [],
        stage: 'preflop',
        numPlayers: 2,
        explainAfter: 'TT vs AK 是经典的"抛硬币"对决。TT翻牌前约有55%的胜率——略微领先但优势不大。AK需要在公牌中翻出A或K才能超越，而这大约有45%的概率。这就是为什么你经常看到这两手牌在翻牌前全下对决——双方都有理由入池。'
    },
    {
        id: 6,
        title: '河牌圈的确定性：所有牌已翻开',
        knowledgePoint: '河牌决策',
        teachBefore: '河牌圈（5张公牌全部翻开）是最终决策点。此时不再有"听牌"概念，你的牌型已经确定。判断胜率变成了精确计算：要么赢，要么输，要么平。这时需要根据已知信息精确判断对手可能的牌型。',
        heroPos: 'BTN',
        heroCards: ['Jh', 'Jd'],
        villains: [{ position: 'BB', cards: ['9c', '8c'] }],
        community: ['Js', '6c', '2d', 'Tc', '4h'],
        stage: 'river',
        numPlayers: 2,
        explainAfter: '你中了三条J（暗三），这是一个非常强的牌型。对手98虽然在转牌拿到了同花听牌（4张梅花），但河牌4h没有帮到他，最终只有一个T高牌。河牌圈胜率是100%或0%——你的三条J赢定了。暗三条是德州扑克中最赚钱的牌型之一，因为对手很难发现你有三条。'
    },
    {
        id: 7,
        title: '多人底池：人越多胜率越低',
        knowledgePoint: '多人底池策略',
        teachBefore: '单挑时AA有85%胜率，但3人底池降到73%，6人底池只有约50%。人数越多，被某个人击败的概率越高。在多人底池中，你需要更强的牌才能有信心，听牌的价值相对提升。',
        heroPos: 'UTG',
        heroCards: ['Qs', 'Qd'],
        villains: [
            { position: 'MP', cards: ['Ah', '5h'] },
            { position: 'BTN', cards: ['9c', '8c'] }
        ],
        community: ['7d', '4c', '2h'],
        stage: 'flop',
        numPlayers: 3,
        explainAfter: '你的QQ在翻牌后是超对（大于公牌上所有牌的对子），但面对两个对手。A5有一张A，如果转牌或河牌来A就能超越你；98有顺子听牌潜力。在3人底池中，你的QQ虽然领先但胜率不如单挑时那么高。多人底池的关键策略：大底池下注保护自己的牌，减少对手追牌的赔率。'
    },
    {
        id: 8,
        title: '诈唬识别：公牌面分析',
        knowledgePoint: '公牌面分析',
        teachBefore: '好的玩家不只看自己的牌，还要分析公牌面的"纹理"。比如三张同花色的公牌意味着有人可能成了同花；连续的公牌可能让人成了顺子。公牌面越"干"（不连续、不同花），你的一对就越安全。',
        heroPos: 'BB',
        heroCards: ['Kd', 'Ks'],
        villains: [{ position: 'BTN', cards: ['7h', '6h'] }],
        community: ['Kh', '5h', '3h'],
        stage: 'flop',
        numPlayers: 2,
        explainAfter: '你中了顶三条K，这通常是超强牌。但看看公牌面：三张红心！这意味着任何持有两张红心的人已经成了同花。对手76红心正好已经成了同花，你的三条K反而落后了。这道题告诉我们：永远要关注公牌面的同花和顺子可能性，即使你有很强的牌型。'
    },
    {
        id: 9,
        title: '听牌的价值：成牌概率',
        knowledgePoint: '听牌与赔率',
        teachBefore: '听牌是指还差一张牌就能成某种牌型。同花听牌（差一张同花）约有35%的概率在两张牌中完成，约19%在一张牌中完成。顺子听牌（两头顺子）约有31%/17%。听牌的价值取决于底池赔率——如果底池足够大，追牌是有利可图的。',
        heroPos: 'CO',
        heroCards: ['8d', '7d'],
        villains: [{ position: 'BB', cards: ['As', 'Ah'] }],
        community: ['6d', '5c', '2d'],
        stage: 'flop',
        numPlayers: 2,
        explainAfter: '你的87方块有同花听牌（差一张方块）和顺子听牌（差一张4或9），这叫"组合听牌"，非常有价值。面对AA这样的超强牌，你仍然有接近40%的胜率！因为你有大量的"出牌"（Outs）：9张方块 + 额外的顺子牌。组合听牌是翻牌后最有价值的听牌类型。'
    },
    {
        id: 10,
        title: '综合应用：读懂整个局面',
        knowledgePoint: '综合判断',
        teachBefore: '成为好的扑克玩家需要综合考虑：①你的手牌强度 ②位置优势 ③公牌面纹理 ④对手可能的牌型范围 ⑤底池大小和赔率。当你能同时分析这些因素时，你的胜率判断会越来越准确。',
        heroPos: 'BTN',
        heroCards: ['Ac', 'Qc'],
        villains: [
            { position: 'SB', cards: ['Kh', 'Jh'] },
            { position: 'BB', cards: ['9d', '9s'] }
        ],
        community: ['Qh', 'Tc', '4d', '3h'],
        stage: 'turn',
        numPlayers: 3,
        explainAfter: '综合分析：你在BTN（最佳位置）拿着AQ中了顶对顶踢脚。公牌面 Q-T-4-3 有两张红心，SB的KJ红心有同花听牌+顺子听牌（如果来A或9可成顺子）。BB的99只是一个中等对子。你目前领先但并不安全——如果河牌来了红心或特定的牌，SB可能反超。这就是德州扑克的魅力：需要在不确定中做出最优决策。'
    }
];
