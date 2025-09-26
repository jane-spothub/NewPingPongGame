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

// Mouse/touch
let targetU = player.u;
let targetV = player.v;
// === POPUPS ===
const pauseBtn = document.getElementById("pause-btn");
const popupLevel = document.getElementById("popup-level");
const popupReward = document.getElementById("popup-reward");
const rewardText = document.getElementById("reward-text");
let lastPointerX, lastPointerY = 0;

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

// Add this function for keyboard movement
function updatePlayerFromKeyboard(dt) {
    const moveSpeed = 0.04 * dt;
    // const verticalMoveSpeed = 0.02 * dt;

    if (keys["ArrowLeft"]) player.u = Math.max(0, player.u - moveSpeed);
    if (keys["ArrowRight"]) player.u = Math.min(1, player.u + moveSpeed);
    // if (keys["ArrowUp"]) player.v = Math.max(0.6, player.v - verticalMoveSpeed);
    // if (keys["ArrowDown"]) player.v = Math.min(0.95, player.v + verticalMoveSpeed);
}



// === Paddle Controls ===
function pointerToU(x) {
    const left = worldToScreen(0, player.v);
    const right = worldToScreen(1, player.v);
    return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
}
function pointerToV(y) {
    const top = worldToScreen(0.5, -0.5).y;    // Top of playable area
    const bottom = worldToScreen(0.5, 1.0).y;  // Bottom of playable area
    const normalizedY = (y - top) / (bottom - top);
    return Math.max(-0.5, Math.min(1.0, normalizedY * 1.5 - 0.5));
}

canvas.addEventListener("pointerdown", (e) => {
    if (e.clientY > window.innerHeight * 0.6) {
        pointerActive = true;
        player.u = pointerToU(e.clientX);
    }
});

// Enhanced pointer movement detection for 2D control
canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pointerActive = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    // Initial position setting
    const targetU = pointerToU(e.clientX);
    const targetV = pointerToV(e.clientY);
    player.u = targetU;
    player.v = targetV;
});

canvas.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    e.preventDefault();

    const deltaY = e.clientY - lastPointerY;
    // Update last position
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    const sensitivity = 0.002; // Calculate movement sensitivity
    const targetU = pointerToU(e.clientX);// Horizontal movement (left/right)

    player.u = lerp(player.u, targetU, 0.5);// Vertical movement (forward/backward) - only for player
    player.v += deltaY * sensitivity;// Constrain player vertical movement within bounds
    player.v = Math.max(0.6, Math.min(0.95, player.v));
});

canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    pointerActive = false;
});

canvas.addEventListener("pointercancel", (e) => {
    e.preventDefault();
    pointerActive = false;
});

// Enhanced keyboard controls for precise movement
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    // Prevent arrow keys from scrolling the page
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// pointers
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        pointerActive = true;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (!pointerActive || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - lastPointerY;
    lastPointerX = touch.clientX;
    lastPointerY = touch.clientY;
    const touchSensitivity = 0.003; // More sensitive touch controls
    const targetU = pointerToU(touch.clientX); // Horizontal movement
    player.u = lerp(player.u, targetU, 0.7);
    player.v += deltaY * touchSensitivity; // Vertical movement
    player.v = Math.max(0.6, Math.min(0.95, player.v));
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    pointerActive = false;
});

canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault(); // stop page scroll/zoom
    pointerActive = true;
    player.u = pointerToU(e.clientX);
});

canvas.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    e.preventDefault();
    const targetU = pointerToU(e.clientX);
    player.u = lerp(player.u, targetU, 0.9);// Smooth follow for touch/mouse
});

canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    pointerActive = false;
});

canvas.addEventListener("pointercancel", (e) => {
    e.preventDefault();
    pointerActive = false;
});

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

// === Helpers ===
function lerp(a, b, t) {
    return a + (b - a) * t;
}






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
    const smoothFactor = 0.2;

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
    setServerTurn("bot");
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
// const moveStep = 0.05; // how far paddle moves per press
//
// function movePlayer(dir) {
//     if (dir === "left") targetU = Math.max(0, targetU - moveStep);
//     if (dir === "right") targetU = Math.min(1, targetU + moveStep);
//     if (dir === "up") targetV = Math.max(0.5, targetV - moveStep);
//     if (dir === "down") targetV = Math.min(0.9, targetV + moveStep);
// }

// // Mobile button listeners
// document.getElementById("btn-left")?.addEventListener("touchstart", () => movePlayer("left"));
// document.getElementById("btn-right")?.addEventListener("touchstart", () => movePlayer("right"));
// document.getElementById("btn-up")?.addEventListener("touchstart", () => movePlayer("up"));
// document.getElementById("btn-down")?.addEventListener("touchstart", () => movePlayer("down"));
//
// // Optional: also allow click for testing on desktop
// ["left", "right", "up", "down"].forEach(dir => {
//     document.getElementById(`btn-${dir}`)?.addEventListener("click", () => movePlayer(dir));
// });


// === Startup ===
// initProgress();
popupLevel.classList.remove("hidden"); // show start popup first
updateXPUI();
