// version: v1.0 (Модуль настроек сложности)
import { GameCanvas } from './game_canvas.js';
import { state } from './state.js';

export const settings = {
    columnDigits: 2, // По умолчанию двузначные
};

export function renderSettings() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    // Если открыта игра, ставим на паузу активный пример (сбрасываем индекс)
    // чтобы при возврате к игре сгенерировался новый или продолжился старый
    // (в данном случае просто визуально скрываем старые примеры)

    const html = `
        <div style="padding: 20px; font-family: sans-serif; max-width: 600px;">
            <h2 style="margin-top:0; color:#334155; display:flex; align-items:center; gap:10px;">
                <span style="font-size:28px;">⚙️</span> Настройки сложности
            </h2>
            <p style="color:#64748b; margin-bottom:20px;">Здесь вы можете настроить параметры для каждого режима.</p>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <h3 style="margin:0 0 10px 0; font-size:18px; color:#1e293b;">📝 В столбик</h3>
                <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
                    <label for="col-digits" style="font-weight:bold; color:#475569;">Скольки значные задачи?</label>
                    <input type="number" id="col-digits" min="1" max="15" value="${settings.columnDigits}" style="padding:8px 12px; border:2px solid #cbd5e1; border-radius:8px; font-size:16px; font-weight:bold; width:80px; outline:none; transition: border-color 0.2s;">
                </div>
                <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                    (Например: 1 — однозначные (9+9), 2 — двузначные (45+67))
                </div>
            </div>

            <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:12px; padding:15px; margin-bottom:15px; opacity:0.7;">
                <h3 style="margin:0 0 5px 0; font-size:18px; color:#64748b;">✖️ Умножение</h3>
                <div style="font-weight:bold; color:#94a3b8; font-size:14px;">В разработке 🛠️</div>
            </div>

            <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:12px; padding:15px; opacity:0.7;">
                <h3 style="margin:0 0 5px 0; font-size:18px; color:#64748b;">➗ Деление</h3>
                <div style="font-weight:bold; color:#94a3b8; font-size:14px;">В разработке 🛠️</div>
            </div>

            <button id="save-settings-btn" style="margin-top:20px; background:#3f51b5; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(63,81,181,0.2); transition: background 0.2s;">
                Сохранить и вернуться к игре
            </button>
        </div>
    `;

    GameCanvas.clearZone();
    leftArea.innerHTML = html;

    // Обработчик сохранения
    const saveBtn = document.getElementById('save-settings-btn');
    const input = document.getElementById('col-digits');

    // Визуальный эффект фокуса
    input.addEventListener('focus', () => input.style.borderColor = '#3f51b5');
    input.addEventListener('blur', () => input.style.borderColor = '#cbd5e1');

    saveBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 15) val = 15; // Ограничим до 15, чтобы не сломать верстку
        settings.columnDigits = val;

        // Возвращаемся к игре (перерисовываем историю и текущий пример)
        // Если примеров не было, просто показываем пустое состояние
        if (state.examplesHistory.length > 0) {
            // Заставляем историю обновиться
            import('./tens.js').then(m => {
                if (state.currentMode === 'column') m.generateExample(); 
                else GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, m.getTensHistoryHTML);
            });
        } else {
            GameCanvas.clearHistory();
        }
    });
}