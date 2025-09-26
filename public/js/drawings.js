import {
    ball, ballHeld, width,
    height,PlayerImg, BotImg,
} from "./globals.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const trail = [], maxTrail = 10; // how many ghost balls to keep

const gravity = -0.00005;
const bounceFactor = 0.7;     // Physics constants

// === Enhanced Drawing Functions ===
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

    // Table top
    ctx.beginPath();
    ctx.moveTo(topLeftX, topY);
    ctx.lineTo(topRightX, topY);
    ctx.lineTo(bottomRightX, bottomY);
    ctx.lineTo(bottomLeftX, bottomY);
    ctx.closePath();
    ctx.fill();

    // Left border with highlight + shadow
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.moveTo(topLeftX, topY);
    ctx.lineTo(bottomLeftX, bottomY);
    ctx.lineTo(bottomLeftX - 12, bottomY + 12);
    ctx.lineTo(topLeftX - 12, topY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = -4;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    // Right border with highlight + shadow
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.moveTo(topRightX, topY);
    ctx.lineTo(bottomRightX, bottomY);
    ctx.lineTo(bottomRightX + 12, bottomY + 12);
    ctx.lineTo(topRightX + 12, topY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // White lines
    // ctx.strokeStyle = "#fff";
    // ctx.lineWidth = 4;
    // ctx.stroke();

    // Center line
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, bottomY);
    ctx.stroke();

    // === Net ===
    const netY = (topY + bottomY) / 2-10;
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

    // Net shadow (drop to table for 3D)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.rect(netLeftX, netY + netHeight / 2, netRightX - netLeftX, 10);
    ctx.filter = "blur(6px)";
    ctx.fill();
    ctx.restore();
}


export function updateBall(dt) {
    if (ballHeld) return; // 🚀 don't move ball if player hasn't served yet

    // Apply gravity
    ball.vz += gravity * dt;
    ball.z += ball.vz * dt;
    // Bounce off table with more realistic physics
    if (ball.z <= 0.1) {
        ball.z = 0.1;
        ball.vz *= -bounceFactor;
        // Add some horizontal friction on bounce
        ball.vu *= 0.95;
        // soundHandler.play("hitTable");
    }
    // Move in table plane
    ball.u += ball.vu * dt;
    ball.v += ball.vv * dt;
    // Bounce off side walls with energy loss
    if (ball.u < 0 || ball.u > 1) {
        ball.vu *= -0.9;
        ball.vu *= 0.95; // Energy loss
        // soundHandler.play("hitTable");
    }
}

export function drawBall() {
    const p = worldToScreen(ball.u, ball.v);
    const r = ball.radius * Math.min(width, height) * p.scale;
    const ballX = p.x;
    const ballY = p.y - (ball.z - 0.1) * 300;

    // Save trail
    trail.push({x: ballX, y: ballY});
    if (trail.length > maxTrail) trail.shift();

    // Trail (glowing fade)
    trail.forEach((pos, i) => {
        const alpha = i / trail.length;
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * (0.4 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
    });

    // Shadow
    ctx.beginPath();
    ctx.ellipse(
        p.x, p.y + r + 5,
        r * 1.3, r * 0.5, 0, 0, Math.PI * 2
    );
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.filter = "blur(6px)";
    ctx.fill();
    ctx.filter = "none";

    // Ball with shiny gradient
    const grad = ctx.createRadialGradient(
        ballX - r / 2, ballY - r / 2, r * 0.2,
        ballX, ballY, r
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.6, "#f0f0f0");
    grad.addColorStop(1, "#c0c0c0");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ballX, ballY, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.stroke();
}



export function drawPaddle(ctx, x, y, radius, color, isBot = false, useRound = true) {
    const paddleSize = radius * 3.4;
    const img = isBot ? BotImg : PlayerImg;

    // --- Shadow ---
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
        x + radius * 0.8,
        y + radius * 0.3,
        radius * 1.1,
        radius * 0.3,
        0,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.filter = "blur(5px)";
    ctx.fill();
    ctx.restore();

    // --- Draw paddle image with rotation ---
    ctx.save();
    ctx.translate(x, y);

    if (isBot) {
        // Flip 180° for bot (handle up)
        ctx.rotate(0);
    } else {
        // Upright (handle down)
        ctx.rotate(Math.PI*2);
    }

    if (img && img.complete) {
        ctx.drawImage(img, -paddleSize / 2, -paddleSize / 2, paddleSize, paddleSize);
    } else {
        // fallback
        ctx.fillStyle = color;
        if (useRound) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        }
    }

    ctx.restore();
}

export function worldToScreen(u, v) {
    const scale = 0.6 + v * 0.5;  // reduce scaling so top is smaller
    const x = width * (0.5 + (u - 0.5) * scale);
    const y = height * (0.5 + (v - 0.5) * scale * 0.8); // 0.8 flattens perspective
    return {x, y, scale};
}



export function hitPaddle(paddle, radius=0.1) {  // was 0.07
    const du = ball.u - paddle.u;
    const dv = ball.v - paddle.v;
    const dist = Math.sqrt(du*du + dv*dv);
    return dist < radius && Math.abs(ball.z - paddle.z) < 0.06;
}
