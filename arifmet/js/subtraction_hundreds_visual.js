// version: v2.1 (Сцентрированный визуал вычитания сотен кучками)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseSubtractionData } from './calculator.js';

export function renderSubtractionHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return GameCanvas.clearZone();

    const report = state.validateCurrentInput();
    const data = parseSubtractionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_sub_h_v2_p${report.phase}_${report.isFullySolved}_input${report.simText}`;

    const baseLeft = data.num1;
    const baseRight = data.num2;

    let currentLeftLabel = baseLeft;
    let currentRightLabel = baseRight;

    if (report.phase === 2 && report.simText.includes('-')) {
        const parts = report.simText.split('-');
        const userLeft = parseInt(parts[0], 10);
        const userRight = parseInt(parts[1], 10);
        
        if (!isNaN(userLeft)) currentLeftLabel = userLeft;
        if (!isNaN(userRight)) currentRightLabel = userRight;
    }

    let html = '';

    if (report.phase === 1 || report.phase === 2) {
        const borderColor = report.simCorrect ? '#22c55e' : '#0284c7';
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 8px #4ade80); border-color:#22c55e;' : '';
        const signColor = report.simCorrect ? '#22c55e' : '#94a3b8';

        const leftCart = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                <div style="position:relative; width:110px; height:70px; background:linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border:2px solid ${borderColor}; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(2,132,199,0.15); ${borderGlow}">
                    <div style="position:absolute; top:-16px; left:15px; width:76px; height:20px; background:${borderColor}; border-radius:40% 40% 0 0; opacity:0.8; transition: background 0.2s;"></div>
                    <b style="font-size:22px; color:white; font-family:monospace; text-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:2;">${currentLeftLabel}</b>
                </div>
                <b style="font-size:12px; color:#0284c7; letter-spacing:0.5px;">У РОБОТА Л</b>
            </div>
        `;

        const rightCart = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                <div style="position:relative; width:110px; height:70px; background:#f1f5f9; border:2px dashed #cbd5e1; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 4px 6px rgba(0,0,0,0.02);">
                    <b style="font-size:22px; color:#64748b; font-family:monospace;">${currentRightLabel}</b>
                </div>
                <b style="font-size:12px; color:#ef4444; letter-spacing:0.5px;">ЗАПРОС РОБОТА П</b>
            </div>
        `;

        // Заменили justify-content: space-around на center и зафиксировали gap для компактного расположения
        html = `
            <div style="display:flex; justify-content:center; gap:40px; width:100%; align-items:center; padding:0 20px; box-sizing:border-box; height:100%;">
                ${leftCart}
                <div style="font-size:36px; font-weight:bold; color:${signColor}; transition:color 0.2s;">−</div>
                ${rightCart}
            </div>
        `;
    } 
    else {
        const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '';
        const labelText = report.isFullySolved ? 'Ура! Робот П увёз свою кучу кубиков! 🎉' : 'Проверяем ответ... 👀';

        const leftCartFinal = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                <div style="position:relative; width:110px; height:70px; background:linear-gradient(135deg, #22c55e 0%, #15803d 100%); border:2px solid #16a34a; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(22,163,74,0.2);">
                    <div style="position:absolute; top:-14px; left:20px; width:66px; height:16px; background:#16a34a; border-radius:40% 40% 0 0; opacity:0.8;"></div>
                    <b style="font-size:22px; color:white; font-family:monospace; text-shadow:0 2px 4px rgba(0,0,0,0.15); z-index:2;">${item.correctValue}</b>
                </div>
                <b style="font-size:12px; color:#16a34a; font-weight:bold; letter-spacing:0.5px;">ОСТАТОК У Л</b>
            </div>
        `;

        const rightCartFinal = `
            <div class="${driveAwayClass}" style="display:flex; align-items:center; gap:20px;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                    <div style="position:relative; width:110px; height:70px; background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border:2px solid #dc2626; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(220,38,38,0.15);">
                        <div style="position:absolute; top:-14px; left:20px; width:66px; height:16px; background:#dc2626; border-radius:40% 40% 0 0; opacity:0.8;"></div>
                        <b style="font-size:22px; color:white; font-family:monospace; text-shadow:0 2px 4px rgba(0,0,0,0.15); z-index:2;">${baseRight}</b>
                    </div>
                    <b style="font-size:12px; color:#dc2626; font-weight:bold; letter-spacing:0.5px;">УВЁЗ РОБОТ П</b>
                </div>
            </div>
        `;

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s; overflow:hidden;">
                <div style="display:flex; align-items:center; justify-content:center; gap:40px; width:100%;">
                    ${leftCartFinal}
                    <div style="font-size:32px; font-weight:bold; color:#cbd5e1;">➔</div>
                    ${rightCartFinal}
                </div>
                <b style="color:#0284c7; font-size:14px; margin-top:12px; text-align:center;">${labelText}</b>
            </div>
        `;
    }

    GameCanvas.renderZoneScene(html, cacheKey);
}
