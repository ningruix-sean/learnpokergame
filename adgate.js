// adgate.js - 广告时间门控系统
// 用户观看广告后获得2小时使用时间

const AD_GATE_KEY = 'poker_ad_gate';
const AD_GRANT_HOURS = 2;
const AD_COUNTDOWN_SECONDS = 15; // 广告倒计时秒数
const FIRST_FREE_HOURS = 2;      // 首次免费时长

let adCountdownInterval = null;

// ========== 时间管理 ==========

function getAdGateData() {
    try {
        const saved = localStorage.getItem(AD_GATE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return null;
}

function saveAdGateData(data) {
    try {
        localStorage.setItem(AD_GATE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
}

function initAdGate() {
    const data = getAdGateData();
    if (!data) {
        // 首次访问，赠送免费时间
        grantFreeTime(FIRST_FREE_HOURS);
        return;
    }
    checkTimeRemaining();
}

function grantFreeTime(hours) {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    saveAdGateData({ expiry: expiry, totalGranted: hours });
    hideAdWall();
}

function checkTimeRemaining() {
    const data = getAdGateData();
    if (!data || !data.expiry) {
        showAdWall();
        return;
    }

    const remaining = data.expiry - Date.now();
    if (remaining <= 0) {
        showAdWall();
    } else {
        hideAdWall();
        // 设置到期后自动弹出
        setTimeout(() => {
            checkTimeRemaining();
        }, Math.min(remaining, 60000)); // 每分钟检查一次
    }
}

function getRemainingTimeStr() {
    const data = getAdGateData();
    if (!data || !data.expiry) return '已过期';
    const remaining = data.expiry - Date.now();
    if (remaining <= 0) return '已过期';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
}

// ========== 广告墙 UI ==========

function showAdWall() {
    const overlay = document.getElementById('adWallOverlay');
    overlay.classList.add('active');
    document.getElementById('adWallWatchBtn').style.display = 'block';
    document.getElementById('adWallCloseBtn').style.display = 'none';
    document.getElementById('adContainer').style.display = 'none';
    document.getElementById('adWallTimer').textContent = '';
    document.getElementById('adWallRemaining').textContent = '';
}

function hideAdWall() {
    const overlay = document.getElementById('adWallOverlay');
    overlay.classList.remove('active');
    if (adCountdownInterval) {
        clearInterval(adCountdownInterval);
        adCountdownInterval = null;
    }
    updateTimeDisplay();
}

function updateTimeDisplay() {
    // 在主页显示剩余时间
    const el = document.getElementById('adWallRemaining');
    if (el) {
        el.textContent = '剩余时间：' + getRemainingTimeStr();
    }
    // 也更新主页底部的时间提示
    const homeTimer = document.getElementById('homeTimeRemaining');
    if (homeTimer) {
        homeTimer.textContent = '剩余使用时间：' + getRemainingTimeStr();
    }
}

function showAdAndGrantTime() {
    // 隐藏按钮，显示广告区域
    document.getElementById('adWallWatchBtn').style.display = 'none';
    document.getElementById('adContainer').style.display = 'block';

    // 尝试加载 AdSense 广告
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
        // AdSense 未加载（开发环境或广告被拦截）
    }

    // 开始倒计时
    let countdown = AD_COUNTDOWN_SECONDS;
    const timerEl = document.getElementById('adWallTimer');
    timerEl.textContent = `请等待 ${countdown} 秒...`;

    adCountdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerEl.textContent = `请等待 ${countdown} 秒...`;
        } else {
            clearInterval(adCountdownInterval);
            adCountdownInterval = null;
            timerEl.textContent = '广告观看完成！';

            // 授予时间
            const data = getAdGateData() || {};
            const expiry = Date.now() + AD_GRANT_HOURS * 60 * 60 * 1000;
            data.expiry = expiry;
            data.totalGranted = (data.totalGranted || 0) + AD_GRANT_HOURS;
            data.lastWatch = Date.now();
            saveAdGateData(data);

            // 显示关闭按钮
            document.getElementById('adWallCloseBtn').style.display = 'block';
        }
    }, 1000);
}

function closeAdWall() {
    hideAdWall();
}

// 页面加载时检查 — 在 app.js 的 DOMContentLoaded 之前注入
document.addEventListener('DOMContentLoaded', () => {
    initAdGate();
    // 定时更新剩余时间
    setInterval(updateTimeDisplay, 60000);
});
