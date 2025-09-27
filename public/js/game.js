// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menuOverlay');
const levelSelectOverlay = document.getElementById('levelSelectOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const playBtn = document.getElementById('playBtn');
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const playerScoreElem = document.getElementById('playerScore');
const botScoreElem = document.getElementById('botScore');
const winnerText = document.getElementById('winnerText');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const levelInfo = document.getElementById('levelInfo');

// Difficulty levels
const DIFFICULTY = {
    EASY: { speedMultiplier: 0.3, description: "Easy: Slow bot speed, great for beginners" },
    MEDIUM: { speedMultiplier: 0.55, description: "Medium: Balanced challenge for experienced players" },
    HARD: { speedMultiplier: 0.9, description: "Hard: Fast bot speed, for expert players" }
};

let currentDifficulty = DIFFICULTY.MEDIUM; // Default difficulty

// Responsive canvas setup
function setupCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Adjust game elements based on new canvas size
    if (playerPaddle) {
        playerPaddle.width = Math.max(80, canvas.width * 0.15);
        playerPaddle.height = Math.max(10, canvas.height * 0.03);
        playerPaddle.x = canvas.width / 2 - playerPaddle.width / 2;
        playerPaddle.y = canvas.height - 30 - playerPaddle.height;
    }

    if (botPaddle) {
        botPaddle.width = Math.max(80, canvas.width * 0.15);
        botPaddle.height = Math.max(10, canvas.height * 0.03);
        botPaddle.x = canvas.width / 2 - botPaddle.width / 2;
        botPaddle.y = 30;
    }

    if (ball) {
        ball.radius = Math.max(8, canvas.width * 0.015);
        ball.speed = Math.max(5, canvas.width * 0.008);
    }
}

let gameActive = false;
let playerScore = 0;
let botScore = 0;
let ballTrails = [];
const maxTrailLength = 10;

// Paddle properties (now horizontal)
let paddleWidth, paddleHeight, paddleSpeed;

// Player paddle at the bottom
let playerPaddle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: '#ff5252',
    speed: 0
};

// Bot paddle at the top
let botPaddle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: '#4fc3f7',
    speed: 0
};

// Ball properties
let ball = {
    x: 0,
    y: 0,
    radius: 0,
    speed: 0,
    velocityX: 0,
    velocityY: 0,
    color: '#fdbb2d'
};

// Initialize the game with selected difficulty
function initGame() {
    // Set up game parameters based on canvas size
    paddleWidth = Math.max(80, canvas.width * 0.15);
    paddleHeight = Math.max(10, canvas.height * 0.03);
    paddleSpeed = Math.max(6, canvas.width * 0.01);

    // Initialize player paddle
    playerPaddle = {
        x: canvas.width / 2 - paddleWidth / 2,
        y: canvas.height - 30 - paddleHeight,
        width: paddleWidth,
        height: paddleHeight,
        color: '#ff5252',
        speed: paddleSpeed
    };

    // Initialize bot paddle with difficulty-based speed
    botPaddle = {
        x: canvas.width / 2 - paddleWidth / 2,
        y: 30,
        width: paddleWidth,
        height: paddleHeight,
        color: '#4fc3f7',
        speed: paddleSpeed * currentDifficulty.speedMultiplier
    };

    // Initialize ball
    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: Math.max(8, canvas.width * 0.015),
        speed: Math.max(5, canvas.width * 0.008),
        velocityX: 0,
        velocityY: 0,
        color: '#fdbb2d'
    };

    playerScore = 0;
    botScore = 0;
    updateScore();
    resetBall();
    gameActive = true;
    levelSelectOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    gameLoop();
}

// Reset ball to center with random direction (always initiated by bot)
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    // Ball always starts moving toward the player (bot initiates)
    ball.velocityY = ball.speed; // Moving downward toward player
    ball.velocityX = (Math.random() * 2 - 1) * ball.speed;

    // Clear trails
    ballTrails = [];
}

// Update score display
function updateScore() {
    playerScoreElem.textContent = `Player: ${playerScore}`;
    botScoreElem.textContent = `Bot: ${botScore}`;
}

// Draw a 3D-looking ball with gradient and highlight
function drawBall(x, y, radius) {
    // Create gradient for 3D effect
    const gradient = ctx.createRadialGradient(
        x - radius/3, y - radius/3, 1,
        x, y, radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, ball.color);
    gradient.addColorStop(1, '#b26a00');

    // Draw ball
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add highlight for 3D effect
    ctx.beginPath();
    ctx.arc(x - radius/3, y - radius/3, radius/3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

// Draw ball trails
function drawTrails() {
    for (let i = 0; i < ballTrails.length; i++) {
        const trail = ballTrails[i];
        const alpha = i / ballTrails.length * 0.5;

        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 187, 45, ${alpha})`;
        ctx.fill();
    }
}

// Draw paddles with 3D effect (now horizontal)
function drawPaddle(x, y, width, height, color) {
    // Main paddle
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    // 3D effect - top and left edges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, width, 5);
    ctx.fillRect(x, y, 5, height);

    // 3D effect - bottom and right edges
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y + height - 5, width, 5);
    ctx.fillRect(x + width - 5, y, 5, height);
}

// Draw the net (now horizontal)
function drawNet() {
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
}

// Move player paddle (now horizontal movement)
function movePlayerPaddle() {
    if ((keys.ArrowLeft || touchControls.left) && playerPaddle.x > 0) {
        playerPaddle.x -= playerPaddle.speed;
    }
    if ((keys.ArrowRight || touchControls.right) && playerPaddle.x + playerPaddle.width < canvas.width) {
        playerPaddle.x += playerPaddle.speed;
    }
}

// Move bot paddle with simple AI (now horizontal movement)
function moveBotPaddle() {
    // Center the paddle on the ball's x position with some delay for fairness
    const botPaddleCenter = botPaddle.x + botPaddle.width / 2;
    const ballCenter = ball.x;

    if (ballCenter > botPaddleCenter + 10) {
        botPaddle.x += botPaddle.speed;
    } else if (ballCenter < botPaddleCenter - 10) {
        botPaddle.x -= botPaddle.speed;
    }

    // Keep paddle within canvas
    if (botPaddle.x < 0) botPaddle.x = 0;
    if (botPaddle.x + botPaddle.width > canvas.width) {
        botPaddle.x = canvas.width - botPaddle.width;
    }
}

// Ball movement and collision detection (now vertical)
function moveBall() {
    // Add current position to trails
    ballTrails.push({
        x: ball.x,
        y: ball.y,
        radius: ball.radius
    });

    // Limit trail length
    if (ballTrails.length > maxTrailLength) {
        ballTrails.shift();
    }

    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Left and right wall collision
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.velocityX = -ball.velocityX;
    }

    // Paddle collision
    // Player paddle (at bottom)
    if (
        ball.y + ball.radius > playerPaddle.y &&
        ball.x > playerPaddle.x &&
        ball.x < playerPaddle.x + playerPaddle.width &&
        ball.velocityY > 0
    ) {
        // Calculate hit position (from -1 to 1)
        let hitPos = (ball.x - (playerPaddle.x + playerPaddle.width / 2)) / (playerPaddle.width / 2);
        ball.velocityY = -ball.velocityY * 1.05; // Increase speed slightly
        ball.velocityX = hitPos * ball.speed;
    }

    // Bot paddle (at top)
    if (
        ball.y - ball.radius < botPaddle.y + botPaddle.height &&
        ball.x > botPaddle.x &&
        ball.x < botPaddle.x + botPaddle.width &&
        ball.velocityY < 0
    ) {
        // Calculate hit position (from -1 to 1)
        let hitPos = (ball.x - (botPaddle.x + botPaddle.width / 2)) / (botPaddle.width / 2);
        ball.velocityY = -ball.velocityY * 1.05; // Increase speed slightly
        ball.velocityX = hitPos * ball.speed;
    }

    // Score points
    if (ball.y + ball.radius < 0) {
        // Player scores (ball went past top)
        playerScore++;
        updateScore();
        resetBall();
        checkGameOver();
    } else if (ball.y - ball.radius > canvas.height) {
        // Bot scores (ball went past bottom)
        botScore++;
        updateScore();
        resetBall();
        checkGameOver();
    }
}

// Check if game is over
function checkGameOver() {
    if (playerScore >= 7 || botScore >= 7) {
        gameActive = false;
        winnerText.textContent = playerScore >= 5 ? "YOU WIN!" : "BOT WINS!";

        // Show game over overlay
        setTimeout(() => {
            gameOverOverlay.classList.remove('hidden');
        }, 500);
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#0c0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw net
    drawNet();

    // Draw trails
    drawTrails();

    // Draw ball
    drawBall(ball.x, ball.y, ball.radius);

    // Draw paddles
    drawPaddle(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, playerPaddle.color);
    drawPaddle(botPaddle.x, botPaddle.y, botPaddle.width, botPaddle.height, botPaddle.color);
}

// Game loop
function gameLoop() {
    if (!gameActive) return;

    movePlayerPaddle();
    moveBotPaddle();
    moveBall();
    draw();

    requestAnimationFrame(gameLoop);
}

// Keyboard input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
const touchControls = {
    left: false,
    right: false
};

// Touch event handlers for mobile controls
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.left = true;
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.left = false;
});

leftBtn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    touchControls.left = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.right = true;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.right = false;
});

rightBtn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    touchControls.right = false;
});

// Mouse event handlers for desktop testing of touch controls
leftBtn.addEventListener('mousedown', () => {
    touchControls.left = true;
});

leftBtn.addEventListener('mouseup', () => {
    touchControls.left = false;
});

leftBtn.addEventListener('mouseleave', () => {
    touchControls.left = false;
});

rightBtn.addEventListener('mousedown', () => {
    touchControls.right = true;
});

rightBtn.addEventListener('mouseup', () => {
    touchControls.right = false;
});

rightBtn.addEventListener('mouseleave', () => {
    touchControls.right = false;
});

// Button event listeners
playBtn.addEventListener('click', () => {
    menuOverlay.classList.add('hidden');
    levelSelectOverlay.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    levelSelectOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
});

easyBtn.addEventListener('click', () => {
    currentDifficulty = DIFFICULTY.EASY;
    levelInfo.textContent = DIFFICULTY.EASY.description;
    initGame();
});

mediumBtn.addEventListener('click', () => {
    currentDifficulty = DIFFICULTY.MEDIUM;
    levelInfo.textContent = DIFFICULTY.MEDIUM.description;
    initGame();
});

hardBtn.addEventListener('click', () => {
    currentDifficulty = DIFFICULTY.HARD;
    levelInfo.textContent = DIFFICULTY.HARD.description;
    initGame();
});

restartBtn.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    setTimeout(() => {
        initGame();
    }, 300);
});

menuBtn.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    setTimeout(() => {
        menuOverlay.classList.remove('hidden');
    }, 300);
});

// Handle window resize
window.addEventListener('resize', () => {
    setupCanvas();
    if (gameActive) {
        // Adjust game elements when resizing during gameplay
        playerPaddle.width = Math.max(80, canvas.width * 0.15);
        playerPaddle.height = Math.max(10, canvas.height * 0.03);
        playerPaddle.x = Math.min(playerPaddle.x, canvas.width - playerPaddle.width);
        playerPaddle.y = canvas.height - 30 - playerPaddle.height;

        botPaddle.width = Math.max(80, canvas.width * 0.15);
        botPaddle.height = Math.max(10, canvas.height * 0.03);
        botPaddle.x = Math.min(botPaddle.x, canvas.width - botPaddle.width);

        ball.radius = Math.max(8, canvas.width * 0.015);
        ball.speed = Math.max(5, canvas.width * 0.008);
    }
});

// Set initial level info
levelInfo.textContent = DIFFICULTY.EASY.description;

// Initial setup
setupCanvas();
draw();