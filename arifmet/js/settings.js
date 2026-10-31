// version: v1.2 (Добавлены вкладки: Примеры и Шрифты. Исправлен баг с сохранением)
import { GameCanvas } from './game_canvas.js';
import { state } from './state.js';

export const settings = {
    columnDigits: 2, // Настройка значности
    // Здесь позже будут настройки шрифтов
};

let activeSettingsTab = 'examples'; // 'examples' | 'fonts' | 'soon'

export function renderSettings() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    // Верхняя навигация по вкладкам (имитация высоты шапки)
    let navHTML = `
        <div style="display:flex; width:100%; height: 8.64vh; min-height: 45px; border-bottom: 2px solid #cbd5e1; margin-bottom: 20px;">
            <button class="settings-tab-btn ${activeSettingsTab === 'examples' ? 'active' : ''}" data-tab="examples">Примеры</button>
            <button class="settings-tab-btn ${activeSettingsTab === 'fonts' ? 'active' : ''}" data-tab="fonts">Шрифты</button>
            <button class="settings-tab-btn disabled" data-tab="soon">В разработке</button>
        </div>
    `;

    let contentHTML = '';

    if (activeSettingsTab === 'examples') {
        contentHTML = `
            <div class="settings-container" style="padding-top:0;">
                <h2><span style="font-size:24px;">⚙️</span> Настройки примеров</h2>
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
                <button id="save-settings-btn" class="settings-save-btn">Сохранить и вернуться к игре</button>
            </div>
        `;
    } else if (activeSettingsTab === 'fonts') {
        contentHTML = `
            <div class="settings-container" style="padding-top:0;">
                <h2><span style="font-size:24px;">🔤</span> Настройки шрифтов</h2>
                <p>Настройте размеры текста для элементов интерфейса.</p>
                
                <div class="settings-card">
                    <h3>Кнопка выбора режима (в шапке)</h3>
                    <div class="settings-row">
                        <label>Размер шрифта:</label>
                        <button class="font-adj-btn" data-target="header-menu-btn" data-dir="-1">-</button>
                        <span id="val-header-menu-btn" style="font-weight:bold; width:60px; text-align:center;">2.0 vh</span>
                        <button class="font-adj-btn" data-target="header-menu-btn" data-dir="1">+</button>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>Цифры в примерах (Столбик)</h3>
                    <div class="settings-row">
                        <label>Размер шрифта:</label>
                        <button class="font-adj-btn" data-target="col-cell" data-dir="-1">-</button>
                        <span id="val-col-cell" style="font-weight:bold; width:60px; text-align:center;">2.8 vmin</span>
                        <button class="font-adj-btn" data-target="col-cell" data-dir="1">+</button>
                    </div>
                </div>
                
                <p style="color:#94a3b8; font-size:12px; margin-top:20px;">* Изменения применяются мгновенно.</p>
            </div>
        `;
    } else {
        contentHTML = `
            <div class="settings-container" style="padding-top:0;">
                <h2><span style="font-size:24px;">🛠️</span> В разработке</h2>
                <p>Этот раздел находится в разработке.</p>
            </div>
        `;
    }

    GameCanvas.clearZone();
    leftArea.innerHTML = navHTML + contentHTML;

    // Обработчики кнопок навигации
    leftArea.querySelectorAll('.settings-tab-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeSettingsTab = e.currentTarget.dataset.tab;
            renderSettings(); // Перерисовываем
        });
    });

    // Обработчик сохранения (только для вкладки Примеры)
    if (activeSettingsTab === 'examples') {
        const saveBtn = document.getElementById('save-settings-btn');
        const input = document.getElementById('col-digits');

        if (saveBtn && input) {
            saveBtn.addEventListener('click', () => {
                let val = parseInt(input.value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 15) val = 15;
                settings.columnDigits = val;

                // ВАЖНО: Очищаем экран настроек и возвращаем игру!
                activeSettingsTab = 'examples'; // Сбрасываем на вкладку по умолчанию
                document.getElementById('examples-list').innerHTML = '<div id="history-placeholder" style="color: #999; text-align: center; margin-top: 20px;">Выберите режим в меню для начала игры</div>';
                
                if (state.examplesHistory.length > 0) {
                    import('./tens.js').then(m => {
                        if (state.currentMode === 'column') {
                            state.examplesHistory = [];
                            state.usedExamples = [];
                            state.activeIndex = -1;
                            m.generateExample(); 
                        } else {
                            GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, m.getTensHistoryHTML);
                        }
                    });
                }
            });
        }
    }

    // Обработчики кнопок изменения шрифта (заглушка для будущего функционала)
    if (activeSettingsTab === 'fonts') {
        leftArea.querySelectorAll('.font-adj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Управление шрифтами будет добавлено в следующем шаге.');
            });
        });
    }
}
