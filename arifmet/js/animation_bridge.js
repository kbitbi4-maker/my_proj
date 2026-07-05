// animation/js/animation_bridge.js
import { GameSpriteData } from './game_sprite_data.js';

let bridgeCanvas = null;
let bridgeCtx = null;
let bridgeEffects = [];
let bridgeLoopActive = false;

function initBridgeCanvas() {
    if (bridgeCanvas) return;
    bridgeCanvas = document.createElement('canvas');
    bridgeCanvas.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9999;';
    bridgeCanvas.width = window.innerWidth;
    bridgeCanvas.height = window.innerHeight;
    document.body.appendChild(bridgeCanvas);
    bridgeCtx = bridgeCanvas.getContext('2d');
    window.addEventListener('resize', () => {
        if (!bridgeCanvas) return;
        bridgeCanvas.width = window.innerWidth; bridgeCanvas.height = window.innerHeight;
    });
}

function bridgeLoop() {
    if (bridgeEffects.length === 0) {
        bridgeLoopActive = false;
        if (bridgeCtx) bridgeCtx.clearRect(0, 0, bridgeCanvas.width, bridgeCanvas.height);
        return;
    }
    bridgeLoopActive = true;
    bridgeCtx.clearRect(0, 0, bridgeCanvas.width, bridgeCanvas.height);
    for (let i = bridgeEffects.length - 1; i >= 0; i--) {
        const effect = bridgeEffects[i];
        effect.update();
        effect.draw(bridgeCtx);
        if (effect.isFinished) bridgeEffects.splice(i, 1);
    }
    requestAnimationFrame(bridgeLoop);
}

// Слушаем команду победы от игры
window.addEventListener('game-success', async (e) => {
    initBridgeCanvas();
    const mode = e.detail?.mode;
    const isMulti = e.detail?.isMulti;
    const isColumn = e.detail?.isColumn;
    const sign = e.detail?.sign;

    const x = bridgeCanvas.width / 2;
    const y = bridgeCanvas.height * 0.72; // Центрируем ровно над нижней игровой зоной

    // ЕСЛИ ЭТО НАШ НОВЫЙ РЕЖИМ ЛУЧНИКА!
    if (mode === 'archer') {
        bridgeEffects.push({
            startTime: performance.now(),
            duration: 2000, // Эльф показывается на 2 секунды
            isFinished: false,
            update() {
                if (performance.now() - this.startTime > this.duration) this.isFinished = true;
            },
            draw(ctx) {
                // Отрисовка эльфа размером 120х120 пикселей по центру
                const size = 120;
                const targetX = x - size / 2;
                const targetY = y - size / 2;
                
                const code = GameSpriteData.frames[0];
                const pSizeX = size / GameSpriteData.width;
                const pSizeY = size / GameSpriteData.height;

                code.split('\n').forEach(line => {
                    const parts = line.split(':'); if (parts.length !== 2) return;
                    const r = parseInt(parts[0], 10);
                    parts[1].split('|').forEach(packet => {
                        const data = packet.split(',');
                        if (data.length === 3) {
                            ctx.fillStyle = data[2].trim();
                            ctx.fillRect(targetX + parseInt(data[0], 10) * pSizeX, targetY + r * pSizeY, parseInt(data[1], 10) * pSizeX, pSizeY);
                        }
                    });
                });
            }
        });
    } else {
        // Обычные эффекты для других режимов
        if (isMulti) {
            const { PizzaFountainEffect } = await import('./effects/pizza_fountain.js');
            bridgeEffects.push(new PizzaFountainEffect(x, y));
        } else if (isColumn) {
            const { CrystalBurstEffect } = await import('./effects/crystal_burst.js');
            bridgeEffects.push(new CrystalBurstEffect(x, y));
        } else {
            const { ConfettiEffect } = await import('./effects/confetti.js');
            bridgeEffects.push(new ConfettiEffect(x, y));
        }
    }
    if (!bridgeLoopActive) bridgeLoop();
});

window.addEventListener('game-fail', async () => {
    initBridgeCanvas();
    const { ScreenShakeEffect } = await import('./effects/shake.js');
    bridgeEffects.push(new ScreenShakeEffect());
    if (!bridgeLoopActive) bridgeLoop();
});

window.addEventListener('game-reset-all', () => {
    bridgeEffects = []; bridgeLoopActive = false;
    if (bridgeCtx) bridgeCtx.clearRect(0, 0, bridgeCanvas.width, bridgeCanvas.height);
});

