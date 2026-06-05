// version: v2.0
import { GameCanvas } from './game_canvas.js';
import { ADDITION_RULES } from './rules/rules_addition.js';
import { SUBTRACTION_RULES } from './rules/rules_subtraction.js';
import { MULTIPLICATION_RULES } from './rules/rules_multiplication.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, soundFlags } from './feedback.js';

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
        
        if (cfg.sound === "alien_win" && !soundFlags.finWinSoundPlayed) {
            triggerWinFeedback(); soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
        } else if (cfg.sound === "win" && !soundFlags.simWinSoundPlayed && ctx.phase === 2) {
            triggerTensWinSound(); soundFlags.simWinSoundPlayed = true;
        } else if (cfg.sound === "win" && !soundFlags.finWinSoundPlayed && ctx.phase === 3) {
            triggerTensWinSound(); soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
        } else if (cfg.sound === "fail") {
            if (ctx.currentInput.includes('=') && !soundFlags.finFailSoundPlayed) { triggerFailFeedback(); soundFlags.finFailSoundPlayed = true; }
            else if (!ctx.currentInput.includes('=') && !soundFlags.simFailSoundPlayed) { triggerFailFeedback(); soundFlags.simFailSoundPlayed = true; }
        }

        let html = '';
        if (cfg.layout === "split-trucks") {
            html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 5%;box-sizing:border-box;height:100%;${cfg.style || ''}">${this.bTruck(cfg.leftTruck)}${cfg.operatorHTML}${this.bTruck(cfg.rightTruck)}</div>`;
        } 
        else if (cfg.layout === "merged-deck") {
            let hCryst = this.bH(cfg.hundredsConfig?.purple, cfg.hundredsConfig?.crimson, cfg.hundredsConfig?.mixed, false);
            html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${cfg.isFullySolved ? 'add-robot-left-drive' : ''}"><div style="${cfg.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate;' : ''}"><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;min-width:140px;align-items:flex-start;padding:8px;">${hCryst}<div style="display:flex;gap:4px;align-items:flex-end;">${cfg.deckHTML}</div></div><div class="${cfg.isFullySolved ? 'add-robot-right-drive' : ''}"><div style="${cfg.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate-reverse;' : ''}"><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${cfg.bottomText}</b></div>`;
        }
        else if (cfg.layout === "sub-scene") {
            const rL = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">${cfg.leftLabel}</b></div>`;
            const rR = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">${cfg.rightLabel}</b></div>`;
            const hL = this.bH(cfg.leftH, cfg.leftCrimsonH, 0, cfg.leftEmptyH);
            const d1 = `<div class="crystal-deck" style="${cfg.deckStyle}">${hL}${cfg.leftDeckHTML}</div>`;
            
            if (cfg.phase === 3) {
                const hR = this.bH(cfg.rightH, cfg.rightCrimsonH, 0, cfg.rightEmptyH);
                html = `<div class="sub-scene-container" style="animation:fadeIn 0.4s;overflow:hidden;position:relative;">${rL}${d1}<div class="${cfg.isFullySolved ? 'sub-drive-away' : ''}" style="display:flex;align-items:center;gap:20px;">${rR}<div class="crystal-deck" style="${cfg.rightDeckStyle}">${hR}${cfg.rightDeckHTML}</div></div><b class="sub-win-text" style="position:absolute;bottom:2px;">${cfg.text}</b></div>`;
            } else {
                const hR = this.bH(cfg.rightH, cfg.rightCrimsonH, 0, cfg.rightEmptyH);
                const d2 = `<div class="crystal-deck" style="${cfg.rightDeckStyle}">${hR}${cfg.rightDeckHTML}</div>`;
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
    },
    bH(p, c, m, e) {
        let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
        for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
        for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
        for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
        for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
        return h ? h + '</div>' : '';
    },
    bTruck(t) {
        let hC = this.bH(t.hundreds, t.mixedHundreds, 0, 0), dC = '';
        for (let i = 0; i < t.tens; i++) { dC += `<div class="crystal-column">`; let isL = (i === t.tens - 1) && (t.borrow > 0); for (let j = 1; j <= 10; j++) dC += `<div class="crystal-item ${(isL && j > (10 - t.borrow)) ? (t.isOrange ? 'borrow-blue' : 'borrow-orange') : (t.isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`; dC += `</div>`; }
        if (t.ones > 0) { dC += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) dC += (j <= t.ones) ? `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; dC += `</div>`; }
        const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
        const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
        return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
    }
};
