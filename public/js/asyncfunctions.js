// frontend/progress.js
import {
    playerScore,
    botScore,
    ball,
    player,
    bot,
    botSpeed,
    categoryNames,
    serveTurn,
    setBallHeld,
    setBotSpeed,
    currentCategory,
    currentLevel,
    scoreEl,
    xpNeeded,
    incrementMatches,
    incrementMatchesWon,
    totalPPlayTime
} from "./globals.js";
let playerXP = 0, playerLevel = 1, playerCoins = 0; // === Player Progression ===

//
// ─── BOT AI ──────────────────────────────────────────────────────────────
//
export function updateBotMovement(dt) {
    const horizontalSpeed = botSpeed * dt;
    const verticalSpeed = botSpeed * dt;
    const predictU = ball.u + (ball.vu * 12);

    // Horizontal movement
    const horizontalError = predictU - bot.u;
    if (Math.abs(horizontalError) > 0.025) {
        bot.u += Math.sign(horizontalError) * horizontalSpeed;
    }

    // Vertical movement
    if (ball.vv < 0) {
        if (ball.v < bot.v + 0.18) {
            if (bot.v > -0.5) bot.v -= verticalSpeed * 0.6;
        } else {
            if (bot.v < -0.3) bot.v += verticalSpeed * 0.4;
        }
    } else {
        if (bot.v < -0.3) bot.v += verticalSpeed * 0.3;
    }

    // Human-like imperfections
    if (Math.random() < 0.04) {
        bot.u += (Math.random() - 0.5) * 0.008;
        bot.v += (Math.random() - 0.5) * 0.004;
    }

    // Bounds
    bot.u = Math.max(0.1, Math.min(0.9, bot.u));
    bot.v = Math.max(-0.6, Math.min(-0.1, bot.v));
}

//
// ─── UI ─────────────────────────────────────────────────────────────────
//
export function updateProgressUI() {
    scoreEl.textContent = `Player: ${playerScore} | Bot: ${botScore}`;
    const stageEl = document.getElementById("levelReached");
    if (stageEl) {
        const categoryName = categoryNames[currentCategory - 1] || `Category ${currentCategory}`;
        stageEl.textContent = `${categoryName} - Level ${currentLevel}`;
    }
}

//
// ─── MATCHES & CHALLENGES ───────────────────────────────────────────────
//
export async function recordMatchCompletion(win) {
    incrementMatches();
    incrementMatchesWon(win)
    totalPPlayTime();

}
const rewardRules = {
    1: {winXP: 100, loseXP: 50, winCoins: 50, loseCoins: 25},
    2: {winXP: 120, loseXP: 60, winCoins: 60, loseCoins: 30},
};

export function grantRewards(win) {
    const rules = rewardRules[currentCategory] || rewardRules[1];
    const earnedXP = win ? rules.winXP : rules.loseXP;
    const earnedCoins = win ? rules.winCoins : rules.loseCoins;
    addXP(earnedXP, win);
    addCoins(earnedCoins);
    // saveProgress();
    return {earnedXP, earnedCoins};
}

function addXP(amount, allowLevelUp = true) {
    playerXP += amount;
    if (allowLevelUp &&
        playerLevel < xpNeeded.length - 1 &&
        playerXP >= xpNeeded[playerLevel]) {
        playerLevel = Math.max(1, playerLevel + 1);
    }
    updateProgressUI();
    // saveProgress();
}

function addCoins(amount) {
    playerCoins += amount;
    updateProgressUI();
}

//
// ─── BALL / SERVE ───────────────────────────────────────────────────────
//

export function resetBall() {
    let baseSpeed = 0.00020;
    let speedFactor = 0.7;

    // difficulty scaling
    if (currentCategory >= 2) baseSpeed += 0.00005 * (currentCategory - 1);
    if (currentLevel >= 10) baseSpeed += 0.00002 * (currentLevel / 10);
    setBotSpeed(baseSpeed);

    if (currentCategory >= 4 || currentLevel >= 5) {
        speedFactor = 1.4; setBotSpeed(0.00035);
    }
    if (currentCategory >= 7 || currentLevel >= 10) {
        speedFactor = 2.0; setBotSpeed(0.00055);
    }

    player.u = 0.5; player.v = 0.72;
    bot.u = 0.5; bot.v = -0.40;

    if (serveTurn === "player") {
        // Ball in player’s hand until serve
        setBallHeld(true);
        ball.u = player.u;
        ball.v = player.v - 0.06;
        ball.vu = 0; ball.vv = 0;
    } else {
        // Bot serve immediately
        setBallHeld(false);
        ball.u = bot.u;
        ball.v = bot.v + 0.06;
        ball.vu = (Math.random() - 0.5) * 0.0012 * speedFactor;
        ball.vv = 0.0011 * speedFactor;
    }

    ball.z = 0.2;
    ball.vz = 0;
}
