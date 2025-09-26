import {
    playerScore, botScore, ball, player, bot,
    setPlayerScore, setBotScore,
    incrementPlayerScore, incrementBotScore,
    setServerTurn, scoreEl,
    width, height, setmatchStartTime, ballHeld, setBallHeld, incrementCurrentLevel, currentLevel, loadPaddleImages
} from "./globals.js";

import {
    updateProgressUI, recordMatchCompletion, grantRewards,
    updateBotMovement, resetBall,
} from "./asyncfunctions.js";

import {
    drawTable, drawBall, updateBall,
    worldToScreen, hitPaddle, drawPaddle
} from "./drawings.js";

// import {SoundHandler} from "./soundHandler.js";
// if (!window.soundHandler) window.soundHandler = new SoundHandler();

// === Canvas setup ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let last = performance.now();
let running = true;
let pointerActive = false;
const keys = {};
let lastMatchResult = null; // track win/lose

// === POPUPS ===
const pauseBtn = document.getElementById("pause-btn");
const popupLevel = document.getElementById("popup-level");
const popupReward = document.getElementById("popup-reward");
const rewardText = document.getElementById("reward-text");

// Pause toggle
pauseBtn.addEventListener("click", () => {
    running = !running;
    pauseBtn.textContent = running ? "Pause" : "Resume";
    last = performance.now();
    if (running) loop(performance.now());
});

// Start level popup
document.getElementById("level-start").addEventListener("click", () => {
    popupLevel.classList.add("hidden");
    startLevel();
});
// Reward claim popup
document.getElementById("claim-reward").addEventListener("click", () => {
    popupReward.classList.add("hidden");
    if (lastMatchResult === "win") {
        incrementCurrentLevel();
        updateFooter();
        startLevel();
    } else if (lastMatchResult === "lose") {
        startLevel();
        updateFooter();
    }
});

// === Show XP reward popup ===
function showReward(text, earnedXP = 0) {
    rewardText.textContent = text;

    if (earnedXP > 0) {
        addXP(earnedXP);   // update global XP
    }

    popupReward.classList.remove("hidden");
}


// === Controls ===
function pointerToU(x) {
    const left = worldToScreen(0, player.v);
    const right = worldToScreen(1, player.v);
    return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
}

function pointerToV(y) {
    const top = worldToScreen(0.5, -0.5).y;
    const bottom = worldToScreen(0.5, 1.0).y;
    const normalizedY = (y - top) / (bottom - top);
    return Math.max(-0.5, Math.min(1.0, normalizedY * 1.5 - 0.5));
}

// Keyboard
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (["ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Mouse/touch
canvas.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    player.u = pointerToU(e.clientX);

});
canvas.addEventListener("pointerup", () => {
    pointerActive = false;
});
let targetU = player.u;
let targetV = player.v;

canvas.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    e.preventDefault();

    targetU = pointerToU(e.clientX);

    let v = pointerToV(e.clientY);
    // Clamp bottom half
    targetV = Math.max(0.5, Math.min(0.85, v));
});


// canvas.addEventListener("pointermove", (e) => {
//     if (!pointerActive) return;
//     e.preventDefault();
//     player.u = pointerToU(e.clientX);
//     // keep fixed y-position
//     player.v = 0.82;
// });



async function initGame() {
    await loadPaddleImages();   // ✅ wait for images
    loop();                     // ✅ start game only after images load
}

initGame();

// === Main Loop ===
function loop(now) {
    if (!running) return;
    const dt = Math.min(40, now - last);
    last = now;

    // Clear + draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // const bg = ctx.createLinearGradient(0, 0, 0, height);
    // bg.addColorStop(0, "#b28aff");
    // bg.addColorStop(1, "#120017");
    // ctx.fillStyle = bg;
    // ctx.fillRect(0, 0, width, height);

    // Update game
    updateBotMovement(dt);
    updateBall(dt);
    drawTable();
    const b = worldToScreen(bot.u, bot.v);
    drawPaddle(ctx, b.x, b.y, Math.min(width, height) * 0.04, "#3498db", true);
    drawBall();

    // Draw paddles

    const p = worldToScreen(player.u, player.v);
    drawPaddle(ctx, p.x, p.y, Math.min(width, height) * 0.04, "#e74c3c", false);
    const smoothFactor = 0.15;

    player.u += (targetU - player.u) * smoothFactor;
    player.v += (targetV - player.v) * smoothFactor;
    // Paddle hits
    if (hitPaddle(bot)) {
        ball.vv = Math.abs(ball.vv) + 0.00005;
        ball.vu += (ball.u - bot.u) * 0.015;
        ball.v = bot.v + 0.03;
    }
    if (hitPaddle(player)) {
        if (ballHeld) {
            setBallHeld(false); // serve
            ball.vv = -0.0012;
            ball.vu = (Math.random() - 0.5) * 0.001;
        } else {
            ball.vv = -Math.abs(ball.vv) - 0.00005;
            ball.vu += (ball.u - player.u) * 0.02;
            ball.v = player.v - 0.03;
        }
    }

    // Scoring
    if (ball.v < bot.v - 0.15) {
        incrementPlayerScore(true);
        resetBall();
        setServerTurn("bot");
        updateProgressUI();
    } else if (ball.v > player.v + 0.15) {
        incrementBotScore(true);
        resetBall();
        setServerTurn("bot");
        updateProgressUI();
    }

    // Win/Lose
    if (playerScore >= 7) {
        const {earnedXP, earnedCoins} = grantRewards(true);
        endLevel("win"); // pass outcome
        showReward(`XP: ${earnedXP} Coins:${earnedCoins}`);
        document.getElementById("claim-reward").innerText="Next Level"
        document.getElementById("reward-title").innerText="You Won!!"

        return;
    }
    if (botScore >= 7) {
        const {earnedXP, earnedCoins} = grantRewards(false);
        endLevel("lose"); // pass outcome
        showReward(`XP: ${earnedXP} Coins:${earnedCoins}`);
        document.getElementById("reward-title").innerText="You Lost!!"
        document.getElementById("claim-reward").innerText="play Again"

        return;
    }

    // HUD
    scoreEl.textContent = `Player ${playerScore} : Bot ${botScore}`;

    requestAnimationFrame(loop);
}
function updateFooter() {
    const footer = document.getElementById("footer-info");
    footer.textContent = `Category: ${window.INIT_CATEGORY} · Level: ${currentLevel}`;
}

// === Level Flow ===
function startLevel() {
    setPlayerScore(0);
    setBotScore(0);
    updateProgressUI();
    running = true;
    setServerTurn("player");
    setBallHeld(true);
    resetBall();
    last = performance.now();
    setmatchStartTime(performance.now());
    loop(performance.now());
}

function endLevel(result) {
    running = false;
    lastMatchResult = result;  // store "win" or "lose"
    const win = (result === "win");
    recordMatchCompletion(win);
}
export let playerXP = 0;
function updateXPUI() {
    const xpDisplay = document.getElementById("xp-display");
    xpDisplay.textContent = `XP: ${playerXP}`;
}

export function addXP(amount) {
    playerXP += amount;
    updateXPUI();
}


// === Startup ===
// initProgress();
popupLevel.classList.remove("hidden"); // show start popup first
updateXPUI();
