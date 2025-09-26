// globals.js — browser ES module
export const scoreEl = document.getElementById('score-display');
export let matchStartTime = 0;
export function setmatchStartTime(time){ matchStartTime = time; }

export let width = window.innerWidth;
export let height = window.innerHeight;
export let matchesPlayed = 0, matchesWon = 0, totalPlayTime = 0;
export function incrementMatches(){ matchesPlayed++; }
export const matchDuration = () => Math.floor((performance.now() - matchStartTime)/1000);
export function totalPPlayTime(){ totalPlayTime += matchDuration(); }
export function incrementMatchesWon(win){ if(win) matchesWon++; }

export const xpNeeded = [0,100,250,500,1000];
export let playerScore = 0, botScore = 0;
export const categoryNames = [
    "Rookie Rally","Spin Masters","Power Play","Precision Pros","Speed Demons",
    "Tactical Titans","Elite Champions","Ultimate Showdown","Legendary League","Hall of Fame"
];
// /public/js/globals.js
//
// export const width = window.innerWidth;
// export const height = window.innerHeight;

export const ball = {
    u: 0.5,
    v: 0.5,
    z: 0.2,
    vu: 0,
    vv: 0,
    vz: 0,
    radius: 0.02,
};

export let ballHeld = false;

export let PlayerImg = null;
export let BotImg = null;

// === Image Loader ===
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export async function loadPaddleImages() {
    try {
        const [player, bot] = await Promise.all([
            loadImage("/assets/img/ProplayerPaddle.png"), // update with your path
            loadImage("/assets/img/ProBotPaddle.png"),    // update with your path
        ]);

        PlayerImg = player;
        BotImg = bot;

        console.log("✅ Paddle images loaded");
    } catch (err) {
        console.error("❌ Failed to load paddle images:", err);
    }
}

// export const ball = { u:0.5, v:0.1, vu:0.004, vv:0.004, z:0.1, vz:0, radius:0.03 };
export const player = { u: 0.5, v: 0.82, z: 0.1, radius: 0.04 };
export const bot    = { u: 0.5, v: -0.40, z: 0.1, radius: 0.04 };

export let botSpeed = 0.001;
export let serveTurn = 'bot';
export function setServerTurn(actor){ serveTurn = actor; }
export function setBotSpeed(speed){ botSpeed = speed; }
export function setPlayerScore(score){ playerScore = score; }
export function setBotScore(score){ botScore = score; }
// export let ballHeld = true;
export function setBallHeld(state){ ballHeld = state; }
export function incrementPlayerScore(increment=true){ if(increment) playerScore++; }
export function incrementBotScore(increment=true){ if(increment) botScore++; }

// export const PlayerImg = new Image(); PlayerImg.src = '/assets/img/ProplayerPaddle.png';
// export const BotImg = new Image(); BotImg.src = '/assets/img/ProBotPaddle.png';

export const levelsPerCategory = 15;

// Injected from EJS safely:
export let currentCategory = parseInt(new URLSearchParams(window.location.search).get('category'))
    || window.INIT_CATEGORY || 1;
export let currentLevel = parseInt(new URLSearchParams(window.location.search).get('level'))
    || window.INIT_LEVEL || 1;

export function setCurrrentLevel(level){ currentLevel = level; }
export function incrementCurrentLevel(){ currentLevel++; }
export function incrementCurrentCategory(){ currentCategory++; }
export function setCurrentCategory(category){ currentCategory = category; }

// Simple player progression state
export let playerXP = 0;
export function addXP(amount){ playerXP += amount; }
export function xpForNext(){
    for (let i = 0; i < xpNeeded.length; i++) if (playerXP < xpNeeded[i]) return xpNeeded[i];
    return xpNeeded[xpNeeded.length-1];
}

// Resize helper
export function resizeToWindow(){
    // width = window.innerWidth;
    // height = window.innerHeight;
    const c=document.getElementById('gameCanvas');
    if (c){ c.width=width; c.height=height; }
}
window.addEventListener('resize', resizeToWindow);
resizeToWindow();
