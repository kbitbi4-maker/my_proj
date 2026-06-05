// version: v1.0
import { VISUAL_RULES } from './visual_rules.js';
import { GameCanvas } from './game_canvas.js';

export const VisualEngine = {
    render(ctx) {
        if (!ctx) return GameCanvas.clearZone();

        // 1. Ищем подходящее правило в базе сложения
        let rule = null;
        if (ctx.operation === '+') {
            rule = VISUAL_RULES.addition.find(r => r.match(ctx));
        }

        if (!rule) return; // Если правило не найдено, ничего не делаем

        // 2. Получаем готовый конфиг из правила
        const cfg = rule.config(ctx);
        const cacheKey = `${ctx.exampleText}_rules_id_${rule.id}_solved_${ctx.isFullySolved}_input_${ctx.currentInput}`;
        let html = '';

        // 3. Строим HTML на основе типа лэйаута (layout)
        if (cfg.layout === "split-trucks") {
            const truck1 = this.buildTruckHTML(cfg.leftTruck);
            const truck2 = this.buildTruckHTML(cfg.rightTruck);
            html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;${cfg.style || ''}">${truck1}${cfg.operatorHTML}${truck2}</div>`;
        } 
        
        else if (cfg.layout === "merged-deck") {
            let hCrystals = '';
            if (cfg.hundredsConfig) {
                hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
                for (let i = 0; i < cfg.hundredsConfig.purple; i++) hCrystals += '<div class="hundred-crystal"></div>';
                for (let i = 0; i < cfg.hundredsConfig.crimson; i++) hCrystals += '<div class="hundred-crystal crimson"></div>';
                for (let i = 0; i < cfg.hundredsConfig.mixed; i++) hCrystals += '<div class="hundred-crystal mixed"></div>';
                hCrystals += '</div>';
            }

            const lAnim = cfg.isFullySolved ? 'add-robot-left-drive' : '';
            const rAnim = cfg.isFullySolved ? 'add-robot-right-drive' : '';
            const jumpL = cfg.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate;' : '';
            const jumpR = cfg.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate-reverse;' : '';

            html = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;">
                    <div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;">
                        <div class="${lAnim}"><div style="${jumpL}"><span style="font-size:36px;line-height:1;">🤖</span></div></div>
                        <div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;min-width:140px;align-items:flex-start;padding:8px;">
                            ${hCrystals}
                            <div style="display:flex;gap:4px;align-items:flex-end;">${cfg.deckHTML}</div>
                        </div>
                        <div class="${rAnim}"><div style="${jumpR}"><span style="font-size:36px;line-height:1;">🤖</span></div></div>
                    </div>
                    <b style="color:#22c55e;font-size:14px;margin-top:8px;">${cfg.bottomText}</b>
                </div>`;
        }

        GameCanvas.renderZoneScene(html, cacheKey);
    },

    buildTruckHTML(t) {
        let hCrystals = '';
        if (t.hundreds > 0 || t.mixedHundreds > 0) {
            hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
            for (let i = 0; i < t.hundreds; i++) hCrystals += `<div class="hundred-crystal ${t.isOrange ? 'crimson' : ''}"></div>`;
            for (let i = 0; i < t.mixedHundreds; i++) hCrystals += '<div class="hundred-crystal mixed"></div>';
            hCrystals += '</div>';
        }

        // Рендерим внутренности кузова грузовика
        let deckContent = '';
        for (let i = 0; i < t.tens; i++) {
            deckContent += `<div class="crystal-column">`;
            let isLast = (i === t.tens - 1) && (t.borrow > 0);
            for (let j = 1; j <= 10; j++) {
                deckContent += `<div class="crystal-item ${(isLast && j > (10 - t.borrow)) ? (t.isOrange ? 'borrow-blue' : 'borrow-orange') : (t.isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`;
            }
            deckContent += `</div>`;
        }
        if (t.ones > 0) {
            deckContent += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
            for (let j = 1; j <= 10; j++) {
                deckContent += (j <= t.ones) ? `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            }
            deckContent += `</div>`;
        }

        const robot = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:1px;">${t.label}</b></div>`;
        const deck = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckContent}</div></div>`;
        
        return `<div class="crystal-truck">${t.isOrange ? deck + robot : robot + deck}</div>`;
    }
};

