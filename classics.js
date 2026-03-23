// classics.js - 经典牌局案例

const CLASSIC_HANDS = [
    // ===== WSOP 主赛事 =====
    {
        id: 1,
        tournament: '2023 WSOP 主赛事决赛桌',
        description: 'Daniel Weinman vs 对手，Weinman最终夺冠的关键一手。翻牌后Weinman中了两对，但对手拿着顺子听牌。',
        heroPos: 'BTN',
        heroCards: ['Ad', 'Ts'],
        villains: [{ position: 'BB', cards: ['9h', '8h'] }],
        community: ['Ah', 'Td', '7c'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 2,
        tournament: '2022 WSOP 主赛事决赛',
        description: 'Espen Jorstad夺冠之手。Jorstad拿着口袋Q，对手Adrian Attenborough拿着口袋8。',
        heroPos: 'SB',
        heroCards: ['Qh', 'Qd'],
        villains: [{ position: 'BB', cards: ['8s', '8c'] }],
        community: ['Qs', '8h', '3d', '5c'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 3,
        tournament: '2019 WSOP 主赛事决赛',
        description: 'Hossein Ensan vs Dario Sammartino最终单挑。Ensan拿着KJ对上Sammartino的9-4同花。',
        heroPos: 'BTN',
        heroCards: ['Kd', 'Jh'],
        villains: [{ position: 'BB', cards: ['9s', '4s'] }],
        community: ['Ks', 'Jc', '2s'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 4,
        tournament: '2018 WSOP 主赛事决赛',
        description: 'John Cynn夺冠之手。经过漫长单挑，Cynn的KJ撞上了Tony Miles的Q底对。',
        heroPos: 'SB',
        heroCards: ['Kc', 'Jc'],
        villains: [{ position: 'BB', cards: ['Qh', '8d'] }],
        community: ['Jd', 'Qs', '8c', '2s', '5h'],
        stage: 'river',
        numPlayers: 2
    },
    {
        id: 5,
        tournament: '2017 WSOP 主赛事决赛桌',
        description: 'Scott Blumstein最终夺冠。Blumstein用A2同花推all-in，对手Dan Ott用A8跟注。',
        heroPos: 'BTN',
        heroCards: ['2h', 'Ah'],
        villains: [{ position: 'BB', cards: ['As', '8s'] }],
        community: ['9h', 'Th', '3c'],
        stage: 'flop',
        numPlayers: 2
    },
    // ===== 经典历史手牌 =====
    {
        id: 6,
        tournament: '2006 WSOP 主赛事决赛',
        description: 'Jamie Gold vs Paul Wasicka。Gold利用激进打法拿下冠军，这手牌Gold用Q9击败了Wasicka的AT。',
        heroPos: 'BTN',
        heroCards: ['Qc', '9d'],
        villains: [{ position: 'BB', cards: ['Ah', 'Td'] }],
        community: ['Qd', '8s', '5h', '9s'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 7,
        tournament: '2003 WSOP 主赛事决赛',
        description: 'Chris Moneymaker创造扑克奇迹！业余玩家通过线上卫星赛晋级，最终击败Sam Farha夺冠。这手关键牌Moneymaker用54同花诈唬成功。',
        heroPos: 'SB',
        heroCards: ['5s', '4s'],
        villains: [{ position: 'BB', cards: ['Ah', '9d'] }],
        community: ['Js', 'Ts', '2d', '6h', '8c'],
        stage: 'river',
        numPlayers: 2
    },
    {
        id: 8,
        tournament: '2012 WSOP 主赛事决赛',
        description: 'Greg Merson vs Jesse Sylvia单挑。Merson拿着QJ同花，击败了Sylvia的KJ。',
        heroPos: 'BTN',
        heroCards: ['Qs', 'Js'],
        villains: [{ position: 'BB', cards: ['Kh', 'Jd'] }],
        community: ['Qd', 'Tc', '4c', '3h'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 9,
        tournament: '2015 WSOP 主赛事决赛',
        description: 'Joe McKeehen统治性夺冠。McKeehen在决赛桌以压倒性筹码领先，这手关键牌用AT击败对手K9。',
        heroPos: 'BTN',
        heroCards: ['Ac', 'Td'],
        villains: [{ position: 'BB', cards: ['Ks', '9h'] }],
        community: ['As', '7d', '3c', '9c'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 10,
        tournament: '2004 WSOP 主赛事 经典之手',
        description: 'Greg Raymer击败David Williams夺冠。Raymer用88对上Williams的A4，这是决定冠军归属的关键牌。',
        heroPos: 'SB',
        heroCards: ['8s', '8c'],
        villains: [{ position: 'BB', cards: ['Ad', '4h'] }],
        community: ['Ac', '5d', '6s'],
        stage: 'flop',
        numPlayers: 2
    },
    // ===== WPT 经典 =====
    {
        id: 11,
        tournament: '2022 WPT 世界锦标赛',
        description: 'Eliot Hudon击败多位高手夺冠。这手关键牌Hudon用口袋A在翻牌前击中暗三。',
        heroPos: 'CO',
        heroCards: ['As', 'Ah'],
        villains: [{ position: 'BTN', cards: ['Kh', 'Qh'] }],
        community: ['Ad', '7c', '2s'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 12,
        tournament: '2021 WPT 五钻经典赛',
        description: '多人底池中AK同花对上口袋JJ。翻牌未中但转牌来了A，局势逆转。',
        heroPos: 'UTG',
        heroCards: ['Ac', 'Kc'],
        villains: [{ position: 'CO', cards: ['Jd', 'Jh'] }],
        community: ['9h', '5d', '3c', 'As'],
        stage: 'turn',
        numPlayers: 2
    },
    // ===== EPT 经典 =====
    {
        id: 13,
        tournament: '2019 EPT 巴塞罗那主赛事',
        description: 'Simon Brandstrom夺冠的关键一手。翻牌全是小牌，Brandstrom的中对对上对手的高牌。',
        heroPos: 'BTN',
        heroCards: ['7d', '7s'],
        villains: [{ position: 'BB', cards: ['Ah', 'Kd'] }],
        community: ['9c', '4d', '2h'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 14,
        tournament: '2023 EPT 巴黎站',
        description: '经典的set over set（暗三对暗三）。一位玩家用55中了暗三，但对手用88也中了暗三。',
        heroPos: 'MP',
        heroCards: ['5h', '5c'],
        villains: [{ position: 'CO', cards: ['8d', '8s'] }],
        community: ['8h', '5d', 'Jc', '2s'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 15,
        tournament: '2018 EPT 蒙特卡洛主赛事',
        description: '经典的翻牌前全下对决。口袋K对上口袋A，这是扑克中最经典的cooler之一。',
        heroPos: 'CO',
        heroCards: ['Kh', 'Ks'],
        villains: [{ position: 'BTN', cards: ['Ac', 'Ad'] }],
        community: [],
        stage: 'preflop',
        numPlayers: 2
    },
    // ===== 多人经典局面 =====
    {
        id: 16,
        tournament: '2016 WSOP 主赛事半决赛',
        description: '三人底池的激烈对决。你拿着AQ中了顶对，但两个对手分别有暗三和顺子听牌。',
        heroPos: 'UTG',
        heroCards: ['Ah', 'Qd'],
        villains: [
            { position: 'MP', cards: ['7c', '7d'] },
            { position: 'BTN', cards: ['Jh', 'Th'] }
        ],
        community: ['Qs', '7h', '9h'],
        stage: 'flop',
        numPlayers: 3
    },
    {
        id: 17,
        tournament: '2020 WSOP Online 主赛事',
        description: 'Stoyan Obreshkov线上主赛事夺冠。经典的同花vs两对对决。',
        heroPos: 'BTN',
        heroCards: ['Kh', 'Th'],
        villains: [{ position: 'BB', cards: ['Qs', 'Jd'] }],
        community: ['Qh', '7h', '3d', 'Jc', '2h'],
        stage: 'river',
        numPlayers: 2
    },
    {
        id: 18,
        tournament: '2014 WSOP 主赛事 第8名淘汰',
        description: 'Mark Newhouse连续两年在WSOP主赛事决赛桌第9名出局。这手牌他的A9撞上了对手的口袋T。',
        heroPos: 'CO',
        heroCards: ['Ac', '9c'],
        villains: [{ position: 'BTN', cards: ['Th', 'Td'] }],
        community: ['Kd', '5s', '2h', '9d'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 19,
        tournament: '2021 WSOP 主赛事决赛桌',
        description: 'Koray Aldemir夺冠之手。德国玩家Aldemir用K7同花在翻牌后中了两对。',
        heroPos: 'BTN',
        heroCards: ['Kh', '7h'],
        villains: [{ position: 'BB', cards: ['Td', '5s'] }],
        community: ['Kd', '7c', '6d', '2s', '3c'],
        stage: 'river',
        numPlayers: 2
    },
    {
        id: 20,
        tournament: '2024 WSOP 主赛事决赛',
        description: 'Jonathan Tamayo夺冠。Tamayo是从卫星赛晋级的业余玩家，重现了Moneymaker的奇迹。这手关键牌他用A5中了两对。',
        heroPos: 'SB',
        heroCards: ['As', '5d'],
        villains: [{ position: 'BB', cards: ['Kh', 'Qc'] }],
        community: ['5c', 'Ad', '8s', 'Kd'],
        stage: 'turn',
        numPlayers: 2
    },
    // ===== 更多经典场景 =====
    {
        id: 21,
        tournament: '2010 WSOP 主赛事决赛',
        description: 'Jonathan Duhamel夺冠之战。加拿大玩家Duhamel用口袋A击败了John Racener的87同花。',
        heroPos: 'SB',
        heroCards: ['As', 'Ac'],
        villains: [{ position: 'BB', cards: ['8h', '7h'] }],
        community: ['4d', 'Tc', '9c', '2h'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 22,
        tournament: '2011 WSOP 主赛事决赛',
        description: 'Pius Heinz成为德国首位WSOP冠军。这手牌Heinz的AT同花对上Martin Staszko的KT。',
        heroPos: 'BTN',
        heroCards: ['Ac', 'Tc'],
        villains: [{ position: 'BB', cards: ['Kh', 'Th'] }],
        community: ['Jc', '9c', '3d'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 23,
        tournament: '2009 WSOP 主赛事 经典手牌',
        description: 'Joe Cada在21岁成为最年轻的WSOP冠军。这手关键牌Cada的99对上Darvin Moon的AQ。',
        heroPos: 'SB',
        heroCards: ['9d', '9c'],
        villains: [{ position: 'BB', cards: ['As', 'Qd'] }],
        community: ['Kd', '8s', '3h'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 24,
        tournament: '2005 WSOP 主赛事决赛',
        description: 'Steve Dannenmann vs Joseph Hachem。澳大利亚人Hachem最终夺冠，这手牌他的77中了暗三。',
        heroPos: 'BTN',
        heroCards: ['7s', '7h'],
        villains: [{ position: 'BB', cards: ['Ad', '3c'] }],
        community: ['7d', 'Qs', '4h', '2d'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 25,
        tournament: '2008 WSOP 主赛事 bubble hand',
        description: '经典的泡沫圈（bubble）对决。钱圈边缘，一位短码玩家用AJ全下，被大码的口袋K跟注。',
        heroPos: 'UTG',
        heroCards: ['Ac', 'Jh'],
        villains: [{ position: 'BB', cards: ['Ks', 'Kd'] }],
        community: ['Jd', 'Ts', '4c'],
        stage: 'flop',
        numPlayers: 2
    },
    {
        id: 26,
        tournament: '2023 WPT 世界锦标赛决赛',
        description: '经典的AK vs QQ翻牌前对决。AK被称为"大滑头"，对上口袋Q几乎是抛硬币。',
        heroPos: 'CO',
        heroCards: ['Ah', 'Kd'],
        villains: [{ position: 'BTN', cards: ['Qc', 'Qs'] }],
        community: [],
        stage: 'preflop',
        numPlayers: 2
    },
    {
        id: 27,
        tournament: '2022 EPT 布拉格站决赛桌',
        description: '翻牌圈三人底池。你中了顶对顶踢脚，但桌上同花面很危险。',
        heroPos: 'BTN',
        heroCards: ['As', 'Kd'],
        villains: [
            { position: 'SB', cards: ['Jh', 'Th'] },
            { position: 'BB', cards: ['9h', '8h'] }
        ],
        community: ['Ah', '6h', '2d'],
        stage: 'flop',
        numPlayers: 3
    },
    {
        id: 28,
        tournament: '2020 EPT 索契站',
        description: '经典的顺子vs同花对决。河牌出了第三张红心，同花完成。',
        heroPos: 'CO',
        heroCards: ['Jc', 'Td'],
        villains: [{ position: 'BTN', cards: ['Ah', '3h'] }],
        community: ['Qh', '9s', '8d', '2c', '5h'],
        stage: 'river',
        numPlayers: 2
    },
    {
        id: 29,
        tournament: '2013 WSOP 主赛事决赛',
        description: 'Ryan Riess击败Jay Farber夺冠。关键一手Riess的A-pair顶住了Farber的激进打法。',
        heroPos: 'SB',
        heroCards: ['Ah', '9s'],
        villains: [{ position: 'BB', cards: ['Jd', 'Tc'] }],
        community: ['Ac', '5d', '3h', '8c'],
        stage: 'turn',
        numPlayers: 2
    },
    {
        id: 30,
        tournament: '2007 WSOP 主赛事决赛',
        description: 'Jerry Yang夺冠之手。Yang用88对上了Tuan Lam的AQ，翻牌后中了暗三。',
        heroPos: 'BTN',
        heroCards: ['8h', '8d'],
        villains: [{ position: 'BB', cards: ['Ah', 'Qc'] }],
        community: ['8c', '4s', '2d'],
        stage: 'flop',
        numPlayers: 2
    }
];
