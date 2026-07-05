// version: v1.0 (Визуализация режима деления)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

export function renderDivisionVisual() {
    const activeItem = state.examplesHistory[state.activeIndex];
    if (!activeItem) return GameCanvas.clearZone();

    // Парсим текст примера (например, "36÷6")
    const parts = activeItem.exampleText.split('÷');
    const totalPizzas = parseInt(parts[0], 10); // Сколько всего пицц на тарелке (делимое)
    const monstersCount = parseInt(parts[1], 10); // Сколько монстров пришли делить (делитель)

    const report = state.validateCurrentInput();
    const status = report.isFullySolved ? 'win' : (report.isWrongAnswer ? 'sad' : 'play');
    const cacheKey = `${activeItem.exampleText}_div_${status}`;

    // Динамический размер пицц в зависимости от их общего количества на одной тарелке
    const pizzaSize = totalPizzas > 24 ? '15px' : (totalPizzas > 12 ? '18px' : '22px');
    const monsterSize = monstersCount > 4 ? '38px' : '46px';

    // 1. Формируем огромную общую тарелку с пиццами
    let plateContent = '';
    if (status === 'win') {
        plateContent = '<span style="font-size:14px;color:#22c55e;font-weight:bold;animation:fadeIn 0.3s;">Всё честно разделили! 🍕✨</span>';
    } else if (status === 'sad') {
        plateContent = `<span class="tears-animation" style="font-size:${pizzaSize};">💦💦💦</span>`;
    } else {
        // Наполняем тарелку общим количеством пицц
        plateContent = `<span style="font-size:${pizzaSize}; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1)); letter-spacing: 2px;">${'🍕'.repeat(totalPizzas)}</span>`;
    }

    const plateHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff7ed; border:2px dashed #fed7aa; padding:10px 15px; border-radius:50%; min-width:160px; min-height:80px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); animation:fadeIn 0.3s;">
            <b style="font-size:11px; color:#c2410c; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Общая тарелка</b>
            <div style="display:flex; justify-content:center; flex-wrap:wrap; max-width:240px; align-items:center; gap:2px;">${plateContent}</div>
        </div>
    `;

    // 2. Формируем группу голодных инопланетян
    let monstersHTML = '';
    const mClass = status === 'win' ? 'monster-happy' : (status === 'sad' ? 'monster-sad' : '');
    
    for (let i = 0; i < monstersCount; i++) {
        let subtitleHTML = '';
        if (status === 'win') {
            subtitleHTML = `<div style="font-size:11px; color:#22c55e; font-weight:bold; margin-top:2px;">Ням! ${activeItem.correctValue}</div>`;
        }
        monstersHTML += `<div style="font-size:${monsterSize}; display:inline-block; margin:0 4px;">` + GameCanvas.createActorHTML({ emoji: '👾', animationClass: mClass, subtitle: subtitleHTML }) + `</div>`;
    }

    const monstersGroupHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <b style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Ждут свою долю (${monstersCount} инопланетян)</b>
            <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:8px;">${monstersHTML}</div>
        </div>
    `;

    // Объединяем общую тарелку и группу монстров в единую композицию
    const finalSceneHTML = `
        <div style="display:flex; justify-content:space-around; align-items:center; width:100%; gap:20px; padding:0 10px; box-sizing:border-box;">
            ${plateHTML}
            <div style="font-size:32px; font-weight:bold; color:#cbd5e1;">➔</div>
            ${monstersGroupHTML}
        </div>
    `;

    GameCanvas.renderZoneScene(finalSceneHTML, cacheKey);
}

