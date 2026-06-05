// version: v5.4
import { GameCanvas } from './game_canvas.js';
import { ADDITION_RULES } from './rules/rules_addition.js';
import { SUBTRACTION_RULES } from './rules/rules_subtraction.js';
import { MULTIPLICATION_RULES } from './rules/rules_multiplication.js';
import { genHundreds } from './rules/rules_utils.js';
import { handleVisualSound } from './feedback.js';

export const VisualEngine = {
    render(ctx) {
        if (!ctx) return GameCanvas.clearZone();
        let rule = null;
        if (ctx.operation === '+') rule = ADDITION_RULES.find(r => r.match(ctx));
        else if (ctx.operation === '-') rule = SUBTRACTION_RULES.find(r => r.match(ctx));
        else if (ctx.operation === '×') rule = MULTIPLICATION_RULES.find(r => r.match(ctx));
        if (!rule) return;

        const cfg = rule.config(ctx);
        const cacheKey = ctx.operation === '×' ? `${ctx.exampleText}_status_${cfg.status}` : `${ctx.exampleText}_r_${rule.id}_s_${ctx.isFullySolved}_i_${ctx.currentInput}`;
        
        handleVisualSound(cfg.sound, ctx.phase, ctx.currentInput.includes('='));

        let html = '';
        if (cfg.layout === "custom") {
            // Берем чистый оригинальный HTML из правил сложения без изменений
            html = ctx.phase === 3 ? cfg.html : `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 5%;box-sizing:border-box;height:100%;${cfg.style || ''}">${cfg.html}</div>`;
        }
        else if (cfg.layout === "sub-scene") {
            const rL = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">${cfg.leftLabel}</b></div>`;
            const rR = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">${cfg.rightLabel}</b></div>`;
            const d1 = `<div class="crystal-deck" style="${cfg.deckStyle}">${genHundreds(cfg.leftH, cfg.leftCrimsonH, 0, cfg.leftEmptyH)}${cfg.leftDeckHTML}</div>`;
            if (cfg.phase === 3) {
                html = `<div class="sub-scene-container" style="animation:fadeIn 0.4s;overflow:hidden;position:relative;">${rL}${d1}<div class="${cfg.isFullySolved ? 'sub-drive-away' : ''}" style="display:flex;align-items:center;gap:20px;">${rR}<div class="crystal-deck" style="${cfg.rightDeckStyle}">${genHundreds(cfg.rightH, cfg.rightCrimsonH, 0, cfg.rightEmptyH)}${cfg.rightDeckHTML}</div></div><b class="sub-win-text" style="position:absolute;bottom:2px;">${cfg.text}</b></div>`;
            } else {
                const d2 = `<div class="crystal-deck" style="${cfg.rightDeckStyle}">${genHundreds(cfg.rightH, cfg.rightCrimsonH, 0, cfg.rightEmptyH)}${cfg.rightDeckHTML}</div>`;
                html = `<div class="sub-scene-container">${rL}${d1}<div style="font-size:24px;font-weight:bold;color:#22c55e;margin:0 10px;">-</div>${d2}${rR}</div>`;
            }
        }
        else if (cfg.layout === "monster-scene") {
            let actors = '';
            for (let i = 0; i < cfg.monsters; i++) {
                let sub = cfg.subtitleHTML || `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:#fff7ed;padding:4px 6px;border-radius:6px;border:1px dashed #fed7aa;min-height:32px;align-items:center;">${'🍕'.repeat(cfg.items)}</div>`;
                actors += GameCanvas.createActorHTML({ emoji: '👾', animationClass: cfg.mClass, subtitle: sub });
            }
            html = actors;
        }
        GameCanvas.renderZoneScene(html, cacheKey);
    }
};
