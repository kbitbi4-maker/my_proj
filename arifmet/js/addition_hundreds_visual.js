// version: v2.0 (Новый стабильный визуал сотен: тележки с кучами груза и динамическими цифрами)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseAdditionData } from './calculator.js';

export function renderAdditionHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return GameCanvas.clearZone();

    const report = state.validateCurrentInput();
    const data = parseAdditionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_add_h_v2_p${report.phase}_${report.isFullySolved}_input${report.simText}`;

    // Базовые исходные числа задачи
    const baseLeft = data.num1;
    const baseRight = data.num2;

    // Рассчитываем динамические числа для фазы упрощения
    let currentLeftLabel = baseLeft;
    let currentRightLabel = baseRight;

    if (report.phase === 2 && report.simText.includes('+')) {
        const parts = report.simText.split('+');
        const userLeft = parseInt(parts[0], 10);
        const userRight = parseInt(parts[1], 10);
        
        // Если ребенок ввел валидные числа, плавно меняем надписи на кучах
        if (!isNaN(userLeft)) currentLeftLabel = userLeft;
        if (!isNaN(userRight)) currentRightLabel = userRight;
    }

    let html = '';

    // ФАЗА 1 и ФАЗА 2: Отрисовка двух роботов с тележками груза
    if (report.phase === 1 || report.phase === 2) {
        const borderGlow = (report.phase === 2 && report.simCorrect) ? 'filter:drop-shadow(0 0 8px #4ade80); border-color:#22c55e;' : '';
        const signColor = (report.phase === 2 && report.simCorrect) ? '#22c55e' : '#94a3b8';

        // Левая синяя тележка-куча
        const leftCart = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                <div style="position:relative; width:110px; height:70px; background:linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border:2px solid #0284c7; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(2,132,199,0.15); ${borderGlow}">
                    <!-- Рисуем декоративную горку кубиков сверху тележки -->
                    <div style="position:absolute; top:-16px; left:15px; width:76px; height:20px; background:#0284c7; border-radius:40% 40% 0 0; opacity:0.8;"></div>
                    <b style="font-size:22px; color:white; font-family:monospace; text-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:2;">${currentLeftLabel}</b>
                </div>
                <b style="font-size:12px; color:#0284c7; letter-spacing:0.5px;">ГРУЗ ЛЕВОГО</b>
            </div>
        `;

        // Правая оранжевая тележка-куча
        const rightCart = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div><span style="font-size:36px; line-height:1;">🤖</span></div>
                <div style="position:relative; width:110px; height:70px; background:linear-gradient(135deg, #fb923c 0%, #ea580c 100%); border:2px solid #ea580c; border-radius:12px 12px 4px 4px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(234,88,12,0.15); ${report.phase === 2 && report.simCorrect ? 'filter:drop-shadow(0 0 8px #facc15);' : ''}">
                    <div style="position:absolute; top:-16px; left:15px; width:76px; height:20px; background:#ea580c; border-radius:40% 40% 0 0; opacity:0.8;"></div>
                    <b style="font-size:22px; color:white; font-family:monospace; text-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:2;">${currentRightLabel}</b>
                </div>
                <b style="font-size:12px; color:#ea580c; letter-spacing:0.5px;">ГРУЗ ПРАВОГО</b>
            </div>
        `;

        html = `
            <div style="display:flex; justify-content:space-around; width:100%; align-items:center; padding:0 20px; box-sizing:border-box; height:100%;">
                ${leftCart}
                <div style="font-size:36px; font-weight:bold; color:${signColor}; transition:color 0.2s;">+</div>
                ${rightCart}
            </div>
        `;
    } 
    // ФАЗА 3: Финал. Роботы съехались, получилась одна огромная куча с верным итоговым ответом
    else {
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '';
        const rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        const labelText = report.isFullySolved ? 'Ура! Сотни объединены в одну большую кучу! 🎉' : 'Проверяем ответ... 👀';

        // Одна огромная золотая куча общего груза
        const finalGoldenHeap = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; animation:fadeIn 0.4s;">
                <div style="position:relative; width:150px; height:90px; background:linear-gradient(135deg, #facc15 0%, #ca8a04 100%); border:3px solid #eab308; border-radius:20px 20px 6px 6px; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 20px rgba(202,138,4,0.3);">
                    <!-- Большая декоративная кубическая горка -->
                    <div style="position:absolute; top:-24px; left:20px; width:104px; height:30px; background:#ca8a04; border-radius:50% 50% 0 0; opacity:0.9;"></div>
                    <b style="font-size:32px; color:white; font-family:monospace; text-shadow:0 3px 6px rgba(0,0,0,0.25); z-index:2;">${item.correctValue}</b>
                </div>
                <b style="font-size:13px; color:#ca8a04; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;">Общая куча груза</b>
            </div>
        `;

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s; overflow:hidden;">
                <div style="display:flex; align-items:center; justify-content:center; gap:30px; width:100%;">
                    <div class="${lAnim}"><div><span style="font-size:36px; line-height:1;">🤖</span></div></div>
                    ${finalGoldenHeap}
                    <div class="${rAnim}"><div><span style="font-size:36px; line-height:1;">🤖</span></div></div>
                </div>
                <b style="color:#22c55e; font-size:14px; margin-top:12px; text-align:center;">${labelText}</b>
            </div>
        `;
    }

    GameCanvas.renderZoneScene(html, cacheKey);
}
