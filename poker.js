// poker.js - Texas Hold'em hand evaluation and Monte Carlo simulation

const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['s','h','c','d'];
const SUIT_SYMBOLS = { s: '♠', h: '♥', c: '♣', d: '♦' };
const RANK_DISPLAY = { 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A' };

const HAND_NAMES = [
    '高牌', '一对', '两对', '三条', '顺子',
    '同花', '葫芦', '四条', '同花顺', '皇家同花顺'
];

function rankValue(r) {
    return RANKS.indexOf(r);
}

function cardStr(rank, suit) {
    return rank + suit;
}

function parseCard(c) {
    return { rank: c[0], suit: c[1] };
}

// Build a full 52-card deck
function buildDeck() {
    const deck = [];
    for (const s of SUITS) {
        for (const r of RANKS) {
            deck.push(cardStr(r, s));
        }
    }
    return deck;
}

// Shuffle array in place (Fisher-Yates)
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Evaluate the best 5-card hand from 7 cards
// Returns [handRank, ...tiebreakers] for comparison
function evaluateHand(cards) {
    // cards is array of 5-7 card strings
    const parsed = cards.map(parseCard);
    const ranks = parsed.map(c => rankValue(c.rank)).sort((a, b) => b - a);
    const suits = parsed.map(c => c.suit);

    // Count ranks and suits
    const rankCount = {};
    const suitCount = {};
    const suitCards = {};

    for (const c of parsed) {
        const rv = rankValue(c.rank);
        rankCount[rv] = (rankCount[rv] || 0) + 1;
        suitCount[c.suit] = (suitCount[c.suit] || 0) + 1;
        if (!suitCards[c.suit]) suitCards[c.suit] = [];
        suitCards[c.suit].push(rv);
    }

    // Find flush suit
    let flushSuit = null;
    for (const s of SUITS) {
        if ((suitCount[s] || 0) >= 5) {
            flushSuit = s;
            break;
        }
    }

    // Find straights from sorted unique ranks
    function findBestStraight(rankList) {
        const unique = [...new Set(rankList)].sort((a, b) => b - a);
        // Check for A-2-3-4-5 (wheel)
        if (unique.includes(12) && unique.includes(0) && unique.includes(1) && unique.includes(2) && unique.includes(3)) {
            // wheel straight, high card is 3 (index)
            let hasWheel = true;
            if (hasWheel) {
                return 3; // 5-high straight
            }
        }
        for (let i = 0; i <= unique.length - 5; i++) {
            if (unique[i] - unique[i + 4] === 4) {
                let consecutive = true;
                for (let j = 1; j < 5; j++) {
                    if (unique[i] - unique[i + j] !== j) { consecutive = false; break; }
                }
                if (consecutive) return unique[i];
            }
        }
        return -1;
    }

    // Check for straight flush
    let bestStraightFlush = -1;
    if (flushSuit) {
        const flushRanks = suitCards[flushSuit].sort((a, b) => b - a);
        bestStraightFlush = findBestStraight(flushRanks);
    }

    if (bestStraightFlush >= 0) {
        if (bestStraightFlush === 12) {
            return [9, 12]; // Royal flush
        }
        return [8, bestStraightFlush]; // Straight flush
    }

    // Group by count
    const groups = [];
    for (const [rv, cnt] of Object.entries(rankCount)) {
        groups.push({ rank: parseInt(rv), count: cnt });
    }
    groups.sort((a, b) => b.count - a.count || b.rank - a.rank);

    // Four of a kind
    if (groups[0].count === 4) {
        const kicker = groups.filter(g => g.rank !== groups[0].rank).sort((a, b) => b.rank - a.rank)[0];
        return [7, groups[0].rank, kicker ? kicker.rank : 0];
    }

    // Full house
    if (groups[0].count === 3) {
        // Find best pair from remaining
        const pairs = groups.filter(g => g.count >= 2 && g.rank !== groups[0].rank).sort((a, b) => b.rank - a.rank);
        if (pairs.length > 0) {
            return [6, groups[0].rank, pairs[0].rank];
        }
        // Check if there's another three of a kind that can serve as pair
        const otherTrips = groups.filter(g => g.count === 3 && g.rank !== groups[0].rank).sort((a, b) => b.rank - a.rank);
        if (otherTrips.length > 0) {
            return [6, groups[0].rank, otherTrips[0].rank];
        }
    }

    // Flush
    if (flushSuit) {
        const flushRanks = suitCards[flushSuit].sort((a, b) => b - a).slice(0, 5);
        return [5, ...flushRanks];
    }

    // Straight
    const bestStraight = findBestStraight(ranks);
    if (bestStraight >= 0) {
        return [4, bestStraight];
    }

    // Three of a kind
    if (groups[0].count === 3) {
        const kickers = groups.filter(g => g.rank !== groups[0].rank).sort((a, b) => b.rank - a.rank).slice(0, 2);
        return [3, groups[0].rank, ...kickers.map(k => k.rank)];
    }

    // Two pair
    const pairGroups = groups.filter(g => g.count === 2).sort((a, b) => b.rank - a.rank);
    if (pairGroups.length >= 2) {
        const kicker = groups.filter(g => g.count === 1).sort((a, b) => b.rank - a.rank)[0];
        return [2, pairGroups[0].rank, pairGroups[1].rank, kicker ? kicker.rank : 0];
    }

    // One pair
    if (pairGroups.length === 1) {
        const kickers = groups.filter(g => g.count === 1).sort((a, b) => b.rank - a.rank).slice(0, 3);
        return [1, pairGroups[0].rank, ...kickers.map(k => k.rank)];
    }

    // High card
    const topCards = ranks.slice(0, 5);
    return [0, ...topCards];
}

// Compare two hand evaluations
// Returns 1 if a wins, -1 if b wins, 0 if tie
function compareHands(a, b) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
        const va = a[i] || 0;
        const vb = b[i] || 0;
        if (va > vb) return 1;
        if (va < vb) return -1;
    }
    return 0;
}

// Generate opponent hand based on range
function generateOpponentHand(available, range) {
    if (range === 'any') {
        // Any two cards
        const i = Math.floor(Math.random() * available.length);
        let j = Math.floor(Math.random() * (available.length - 1));
        if (j >= i) j++;
        return [available[i], available[j]];
    }

    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const i = Math.floor(Math.random() * available.length);
        let j = Math.floor(Math.random() * (available.length - 1));
        if (j >= i) j++;
        const c1 = parseCard(available[i]);
        const c2 = parseCard(available[j]);
        const r1 = rankValue(c1.rank);
        const r2 = rankValue(c2.rank);
        const suited = c1.suit === c2.suit;
        const highRank = Math.max(r1, r2);
        const lowRank = Math.min(r1, r2);

        let match = false;
        switch (range) {
            case 'top':
                // TT+, AQ+
                match = (r1 === r2 && r1 >= 8) || // TT+ (T=8)
                        (highRank === 12 && lowRank >= 10); // AQ+
                break;
            case 'broadway':
                // Both cards T or higher
                match = r1 >= 8 && r2 >= 8;
                break;
            case 'pairs':
                match = r1 === r2;
                break;
            case 'suited':
                match = suited;
                break;
            case 'connectors':
                match = suited && Math.abs(r1 - r2) === 1;
                break;
            default:
                match = true;
        }

        if (match) {
            return [available[i], available[j]];
        }
    }

    // Fallback to any two cards
    const i = Math.floor(Math.random() * available.length);
    let j = Math.floor(Math.random() * (available.length - 1));
    if (j >= i) j++;
    return [available[i], available[j]];
}

// Monte Carlo simulation
// Returns { winRate, tieRate, handProbs, opponentProbs }
function simulate(handCards, communityCards, numPlayers, opponentRange, iterations = 8000) {
    const usedCards = new Set([...handCards, ...communityCards]);
    const fullDeck = buildDeck().filter(c => !usedCards.has(c));
    const communityNeeded = 5 - communityCards.length;
    const numOpponents = numPlayers - 1;

    let wins = 0;
    let ties = 0;
    const handTypeCount = new Array(10).fill(0);
    const oppHandTypeCount = new Array(10).fill(0);
    let oppTotal = 0;

    for (let i = 0; i < iterations; i++) {
        const deck = [...fullDeck];
        shuffle(deck);

        let deckIdx = 0;

        // Deal community cards
        const simComm = [...communityCards];
        for (let c = 0; c < communityNeeded; c++) {
            simComm.push(deck[deckIdx++]);
        }

        // Evaluate my hand
        const myCards = [...handCards, ...simComm];
        const myEval = evaluateHand(myCards);
        handTypeCount[myEval[0]]++;

        // Deal and evaluate opponents
        let iWin = true;
        let isTie = false;
        const usedInSim = new Set([...handCards, ...simComm]);
        const availableForOpponents = deck.slice(deckIdx).filter(c => !usedInSim.has(c));

        for (let o = 0; o < numOpponents; o++) {
            let oppHand;
            if (opponentRange === 'any' && availableForOpponents.length >= 2) {
                oppHand = [availableForOpponents[o * 2], availableForOpponents[o * 2 + 1]];
                if (!oppHand[0] || !oppHand[1]) continue;
            } else {
                oppHand = generateOpponentHand(availableForOpponents, opponentRange);
            }

            const oppCards = [...oppHand, ...simComm];
            const oppEval = evaluateHand(oppCards);
            oppHandTypeCount[oppEval[0]]++;
            oppTotal++;

            const cmp = compareHands(myEval, oppEval);
            if (cmp < 0) {
                iWin = false;
                isTie = false;
                break;
            } else if (cmp === 0) {
                isTie = true;
            }
        }

        if (iWin && !isTie) wins++;
        else if (isTie && iWin) ties++;
    }

    const winRate = Math.round((wins / iterations) * 100);
    const tieRate = Math.round((ties / iterations) * 100);

    // Hand probabilities
    const handProbs = {};
    for (let h = 0; h < 10; h++) {
        const pct = (handTypeCount[h] / iterations) * 100;
        if (pct >= 0.5) {
            handProbs[HAND_NAMES[h]] = Math.round(pct);
        }
    }

    // Opponent probabilities
    const opponentProbs = {};
    if (oppTotal > 0) {
        for (let h = 0; h < 10; h++) {
            const pct = (oppHandTypeCount[h] / oppTotal) * 100;
            if (pct >= 0.5) {
                opponentProbs[HAND_NAMES[h]] = parseFloat(pct.toFixed(1));
            }
        }
    }

    return { winRate, tieRate, handProbs, opponentProbs };
}

// Determine the current best hand type for display highlighting
function getCurrentHandType(handCards, communityCards) {
    if (communityCards.length === 0) return null;
    const allCards = [...handCards, ...communityCards];
    const eval_ = evaluateHand(allCards);
    return HAND_NAMES[eval_[0]];
}

// Generate action advice
function getAdvice(winRate, handCards, communityCards) {
    const currentHand = communityCards.length > 0 ? getCurrentHandType(handCards, communityCards) : null;
    const isPreflop = communityCards.length === 0;

    // Check for draws
    let hasFlushDraw = false;
    let hasStraightDraw = false;

    if (communityCards.length >= 3) {
        const allCards = [...handCards, ...communityCards].map(parseCard);
        const suitCount = {};
        for (const c of allCards) {
            suitCount[c.suit] = (suitCount[c.suit] || 0) + 1;
        }
        hasFlushDraw = Object.values(suitCount).some(v => v === 4);

        const uniqueRanks = [...new Set(allCards.map(c => rankValue(c.rank)))].sort((a, b) => a - b);
        for (let i = 0; i <= uniqueRanks.length - 4; i++) {
            if (uniqueRanks[i + 3] - uniqueRanks[i] <= 4) {
                hasStraightDraw = true;
                break;
            }
        }
    }

    let title, desc, type;

    if (winRate >= 70) {
        title = '强力加注';
        type = 'raise';
        desc = '牌力很强，积极加注争取更大底池';
    } else if (winRate >= 55) {
        title = '加注';
        type = 'raise';
        desc = '胜率优势明显，可以加注施压';
    } else if (winRate >= 40) {
        title = '跟注';
        type = 'call';
        if (hasFlushDraw) desc = '听同花，有提升空间';
        else if (hasStraightDraw) desc = '听顺子，有提升空间';
        else desc = '胜率尚可，跟注观察';
    } else if (winRate >= 25) {
        title = '谨慎跟注';
        type = 'call';
        if (hasFlushDraw) desc = '听同花，但胜率偏低';
        else if (hasStraightDraw) desc = '听顺子，但胜率偏低';
        else desc = '胜率一般，谨慎行动';
    } else {
        title = '考虑弃牌';
        type = 'fold';
        desc = '胜率较低，除非底池赔率合适否则弃牌';
    }

    if (isPreflop) {
        if (winRate >= 65) {
            title = '翻牌前加注';
            type = 'raise';
            desc = '优质起手牌，开局加注';
        } else if (winRate >= 40) {
            title = '可以入池';
            type = 'call';
            desc = '中等起手牌，位置好可以玩';
        } else {
            title = '建议弃牌';
            type = 'fold';
            desc = '起手牌较弱，等待更好的机会';
        }
    }

    return { title, desc, type };
}
