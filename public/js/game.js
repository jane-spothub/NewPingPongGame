import {drawPaddle, drawTable, updateBall, drawBall,worldToScreen} from "/js/drawings.js";
import {
    ball,
    botScore, botSpeed,
    incrementBotScore,
    incrementPlayerScore,
    playerScore,
    playerXP,
    setBallHeld,
    xpNeeded, bot, loadPaddleImages, player, scoreEl, addXP, ballHeld
} from "./globals.js";


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let last = performance.now();
let running = true;
let pointerActive = false;
const keys = {};
let server = "bot";   // who serves first (can toggle between "bot" and "player")
let serveDelay = 1000; // 1s delay before bot serves


// HUD elements & popups
const xpDisplay = document.getElementById('xp-display');
const serveBtn = document.getElementById('serve-btn');
const pauseBtn = document.getElementById('pause-btn');
const popupLevel = document.getElementById('popup-level');
const popupReward = document.getElementById('popup-reward');
const rewardText = document.getElementById('reward-text');


serveBtn.addEventListener('click', () => {
    setBallHeld(false);
});
pauseBtn.addEventListener('click', () => {
    running = !running;
    pauseBtn.textContent = running ? 'Pause' : 'Resume';
    last = performance.now();
    initGame();
});


// Level start button
document.getElementById('level-start').addEventListener('click', () => {
    popupLevel.classList.add('hidden');
    setBallHeld(false);
});


// Claim reward
document.getElementById('claim-reward').addEventListener('click', () => {
    popupReward.classList.add('hidden');
});

async function initGame() {
    await loadPaddleImages(); // make sure paddles are ready
    loop();          // your render/update loop
}

// Simple AI to follow ball
function updateAI(dt) {
    const dir = ball.u - bot.u;
    bot.u += Math.sign(dir) * Math.min(Math.abs(dir), botSpeed * dt * 0.5);
}


function checkScore() {
// out-of-bounds scoring simple
    if (ball.v > 1.1) {
        incrementBotScore(true);
        resetRound(false);
    }
    if (ball.v < -1.1) {
        incrementPlayerScore(true);
        resetRound(true);
    }
}



function resetRound(playerWon) {
    if (playerWon) {
        addXP(25 + Math.floor(Math.random() * 25));
        showReward('You scored! XP awarded');
    }

    ball.u = 0.5;
    ball.v = 0;
    ball.z = 0.1;
    ball.vu = 0;
    ball.vv = 0;
    setBallHeld(true);

    // Alternate server
    server = (server === "player") ? "bot" : "player";
}


function showReward(text) {
    rewardText.textContent = text;
    popupReward.classList.remove('hidden');
    updateXPUI();
}


function updateXPUI() {
    xpDisplay.textContent = `XP: ${playerXP} / ${xpNeeded[Math.min(xpNeeded.length - 1, Math.floor(playerXP / 100) + 1)]}`;
}

function pointerToU(x) {
    const left = worldToScreen(0, player.v);
    const right = worldToScreen(1, player.v);
    return Math.max(0, Math.min(1, (x - left.x) / (right.x - left.x)));
}

canvas.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    player.u = pointerToU(e.clientX);
    player.v = pointerToV(e.clientY);
});
canvas.addEventListener("pointerup", () => { pointerActive = false; });
canvas.addEventListener("pointercancel", () => { pointerActive = false; });

canvas.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    e.preventDefault();

    player.u = pointerToU(e.clientX);
    player.v = pointerToV(e.clientY);
});


window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

function updatePlayerFromKeyboard(dt) {
    const moveSpeedU = 0.0015 * dt; // left/right
    const moveSpeedV = 0.001 * dt;  // up/down (slower for realism)

    if (keys["ArrowLeft"])  player.u = Math.max(0, player.u - moveSpeedU);
    if (keys["ArrowRight"]) player.u = Math.min(1, player.u + moveSpeedU);
    if (keys["ArrowUp"])    player.v = Math.max(0.6, player.v - moveSpeedV);
    if (keys["ArrowDown"])  player.v = Math.min(0.95, player.v + moveSpeedV);
}

function pointerToV(y) {
    const top = worldToScreen(0.5, 0.6).y;   // upper bound
    const bottom = worldToScreen(0.5, 0.95).y; // lower bound
    return Math.max(0.6, Math.min(0.95, (y - top) / (bottom - top)));
}


function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = now - last;
    last = now;
// physics
    updatePlayerFromKeyboard(dt);
    // Serve handling
    if (ballHeld) {
        if (server === "player") {
            // Keep ball on player's paddle until they move/serve
            ball.u = player.u;
            ball.v = player.v - 0.03;
        } else if (server === "bot") {
            // Keep ball on bot's paddle until serve delay ends
            ball.u = bot.u;
            ball.v = bot.v + 0.03;

            serveDelay -= dt;
            if (serveDelay <= 0) {
                // Bot serves: launch the ball
                setBallHeld(false);
                ball.vv = 0.0012;   // downward toward player
                ball.vu = (Math.random() - 0.5) * 0.002; // slight angle
                serveDelay = 1000;  // reset delay
            }
        }
    }

    updateBall(dt);
    updateAI(dt);
    checkScore();

// clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTable();
    drawPaddle(bot, true);
    drawBall();
    drawPaddle(player, false);

// draw paddles simple
//     const p = worldToScreen(player.u, player.v);
//     const b = worldToScreen(bot.u, bot.v);
    // D.drawPaddle(ctx, p.x, p.y, Math.min(canvas.width, canvas.height)*0.03, '#ffcc00', false);
    // D.drawPaddle(ctx, b.x, b.y, Math.min(canvas.width, canvas.height)*0.03, '#00ccff', true);


// HUD updates
    scoreEl.textContent = `Player ${playerScore} : Bot ${botScore}`;
    updateXPUI();


    requestAnimationFrame(loop);
}


// start showing level popup initially
popupLevel.classList.remove('hidden');
initGame();
