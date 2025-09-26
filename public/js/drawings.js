import { ball, ballHeld, width, height, PlayerImg, BotImg } from "/js/globals.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const trail = [], maxTrail = 12;

const gravity = -0.00005;
const bounceFactor = 0.7;

// === Table Drawing ===
export function drawTable() {
    const cx = width / 2;
    const cy = height / 2;
    const tableDepth = Math.min(width, height) * 0.35;
    const topWidth = width * 0.25;
    const bottomWidth = width * 0.45;
    const topY = cy - height * 0.25;
    const bottomY = cy + tableDepth;
    const topLeftX = cx - topWidth;
    const topRightX = cx + topWidth;
    const bottomLeftX = cx - bottomWidth;
    const bottomRightX = cx + bottomWidth;

    // Table gradient
    const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
    grad.addColorStop(0, "#1a6e3d");
    grad.addColorStop(0.5, "#006b2d");
    grad.addColorStop(1, "#65ff00");
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(topLeftX, topY);
    ctx.lineTo(topRightX, topY);
    ctx.lineTo(bottomRightX, bottomY);
    ctx.lineTo(bottomLeftX, bottomY);
    ctx.closePath();
    ctx.fill();

    // White center line
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, bottomY);
    ctx.stroke();

    // === Net ===
    const netY = (topY + bottomY) / 2 - 10;
    const netLeftX = (topLeftX + bottomLeftX) / 2;
    const netRightX = (topRightX + bottomRightX) / 2;
    const netHeight = tableDepth * 0.15;

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= netRightX - netLeftX; i += 12) {
        ctx.beginPath();
        ctx.moveTo(netLeftX + i, netY - netHeight / 2);
        ctx.lineTo(netLeftX + i, netY + netHeight / 2);
        ctx.stroke();
    }

    // Net bars
    ctx.fillStyle = "#fff";
    ctx.fillRect(netLeftX, netY - netHeight / 2 - 3, netRightX - netLeftX, 6);
    ctx.fillRect(netLeftX, netY + netHeight / 2 - 3, netRightX - netLeftX, 6);

    // Drop shadow for net
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.rect(netLeftX, netY + netHeight / 2, netRightX - netLeftX, 10);
    ctx.filter = "blur(6px)";
    ctx.fill();
    ctx.restore();
}

// === Ball Physics ===
export function updateBall(dt) {
    if (ballHeld) return;
    ball.vz += gravity * dt;
    ball.z += ball.vz * dt;

    if (ball.z <= 0.1) {
        ball.z = 0.1;
        ball.vz *= -bounceFactor;
        ball.vu *= 0.95;
    }

    ball.u += ball.vu * dt;
    ball.v += ball.vv * dt;

    if (ball.u < 0 || ball.u > 1) {
        ball.vu *= -0.9;
        ball.vu *= 0.95;
    }
}

// === Ball Drawing ===
export function drawBall() {
    if (!ball) return;
    const p = worldToScreen(ball.u, ball.v);
    const base = Math.min(width, height);
    const r = Math.max(2, ball.radius * base * p.scale);
    const zOffsetScale = base * 0.6;
    const ballX = p.x;
    const ballY = p.y - (ball.z - 0.1) * zOffsetScale;

    // Trail
    trail.push({ x: ballX, y: ballY, r });
    if (trail.length > maxTrail) trail.shift();
    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const alpha = (i + 1) / trail.length * 0.6;
        ctx.beginPath();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.18})`;
        ctx.arc(t.x, t.y, t.r * (0.6 + 0.4 * (i / trail.length)), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
    }

    // Shadow
    const zClamp = Math.max(0.1, Math.min(ball.z, 1.0));
    const shadowAlpha = Math.max(0.05, 0.45 * (1 - (zClamp - 0.1) / 0.9));
    const shadowRx = r * (1.2 + (1 - (zClamp - 0.1) / 0.9) * 0.4);
    const shadowRy = r * 0.5 * (1 + (1 - (zClamp - 0.1) / 0.9) * 0.6);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ballX, p.y + r + 6, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.filter = "blur(6px)";
    ctx.fill();
    ctx.filter = "none";
    ctx.restore();

    // Ball gradient
    const grad = ctx.createRadialGradient(
        ballX - r * 0.35, ballY - r * 0.35, r * 0.12,
        ballX, ballY, r
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, "#f6f6f6");
    grad.addColorStop(0.8, "#e0e0e0");
    grad.addColorStop(1, "#bfbfbf");

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(ballX, ballY, r, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.strokeStyle = "rgba(120,120,120,0.7)";
    ctx.stroke();

    // Seam
    ctx.beginPath();
    const seamStart = Math.PI * 0.3;
    const seamEnd = Math.PI * 0.9;
    ctx.lineWidth = Math.max(0.6, r * 0.06);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.arc(ballX, ballY, r * 0.78, seamStart, seamEnd);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = Math.max(0.4, r * 0.03);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.arc(ballX, ballY, r * 0.82, seamStart + 0.02, seamEnd + 0.02);
    ctx.stroke();
}
// === Paddle Drawing ===
export function drawPaddle(paddle, isBot = false) {
    if (!paddle) return;
    const p = worldToScreen(paddle.u, paddle.v);
    const base = Math.min(width, height);
    const paddleSize = paddle.radius * base * p.scale * 3.2; // scale paddle
    const img = isBot ? BotImg : PlayerImg;

    ctx.save();
    ctx.translate(p.x, p.y - (paddle.z - 0.1) * base * 0.6);

    if (img && img.complete) {
        ctx.drawImage(img, -paddleSize / 2, -paddleSize / 2, paddleSize, paddleSize);
    } else {
        ctx.fillStyle = isBot ? "#e74c3c" : "#3498db";
        ctx.beginPath();
        ctx.arc(0, 0, paddle.radius * base * p.scale, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// === Helper: World -> Screen ===
export function worldToScreen(u, v) {
    const scale = 0.6 + v * 0.5;
    const x = width * (0.5 + (u - 0.5) * scale);
    const y = height * (0.5 + (v - 0.5) * scale * 0.8);
    return { x, y, scale };
}
