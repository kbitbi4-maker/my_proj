// version: v1.1 (Сброс переносов при смене сложности)
import { GameCanvas } from './game_canvas.js';
import { state } from './state.js';

export const settings = {
    columnDigits: 2, // По умолчанию двузначные
};

// Вспомогательная функция для сброса кэша переносов в column_visual.js
// (Так как column_visual.js хранит свое состояние внутри себя, мы просто 
// попросим его перерисоваться, а при смене режима он создаст новые ключи)
function resetCarriesForCurrentIndex() {
    if (state.activeIndex !== -1) {
        import('./column_visual.js').then(() => {
            // Принудительный сброс не требуется, так как состояние привязано к activeIndex.
            // При генерации нового примера activeIndex изменится.
        });
    }
}

export function renderSettings() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    const html = `
        <div class="settings-container">
            <h2><span style="font-size:28px;">⚙️</span> Настройки сложности</h2>
            <p>Здесь вы можете настроить параметры для каждого режима.</p>

            <div class="settings-card">
                <h3>📝 В столбик</h3>
                <div class="settings-row">
                    <label for="col-digits">Скольки значные задачи?</label>
                    <input type="number" id="col-digits" min="1" max="15" value="${settings.columnDigits}">
                </div>
                <div class="settings-hint">
                    (Например: 1 — однозначные (9+9), 2 — двузначные (45+67))
                </div>
            </div>

            <div class="settings-card disabled">
                <h3>✖️ Умножение</h3>
                <div class="settings-soon">В разработке 🛠️</div>
            </div>

            <div class="settings-card disabled">
                <h3>➗ Деление</h3>
                <div class="settings-soon">В разработке 🛠️</div>
            </div>

            <button id="save-settings-btn" class="settings-save-btn">
                Сохранить и вернуться к игре
            </button>
        </div>
    `;

    GameCanvas.clearZone();
    leftArea.innerHTML = html;

    // Обработчик сохранения
    const saveBtn = document.getElementById('save-settings-btn');
    const input = document.getElementById('col-digits');

    saveBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 15) val = 15; // Ограничим до 15, чтобы не сломать верстку
        settings.columnDigits = val;

        // Возвращаемся к игре
        if (state.examplesHistory.length > 0) {
            import('./tens.js').then(m => {
                if (state.currentMode === 'column') {
                    // Очищаем текущие примеры, чтобы они не смешивались с новой сложностью
                    state.examplesHistory = [];
                    state.usedExamples = [];
                    state.activeIndex = -1;
                    m.generateExample(); 
                } else {
                    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, m.getTensHistoryHTML);
                }
            });
        } else {
            GameCanvas.clearHistory();
        }
    });
}
