// version: v1.0
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

// Хранилище для интерактивных плашек переноса (памяти) текущего примера
// Ключ: "индекс_примера", значение: { thousands: X, hundreds: Y, tens: Z }
const carryState = {};

export function renderColumnVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return;

    const report = state.validateCurrentInput();
    const isAdd = item.exampleText.includes('+');
    const sign = isAdd ? '+' : '−';
    
    // Парсим числа из текста примера (работает как для десятков, так и для сотен)
    const nums = item.exampleText.split(/[+\-]/);
    const num1 = parseInt(nums[0], 10);
    const num2 = parseInt(nums[1], 10);

    // Инициализируем состояние кликалок памяти для текущего примера, если еще нет
    if (!carryState[state.activeIndex]) {
        carryState[state.activeIndex] = { thousands: '', hundreds: '', tens: '' };
    }
    const carries = carryState[state.activeIndex];

    // Разбираем числа по разрядам (до сотен) для посимвольного выравнивания
    const s1 = String(num1).padStart(3, ' ');
    const s2 = String(num2).padStart(3, ' ');

    // Получаем текущие введенные ребенком данные из отчета состояния
    // Фаза 1: Промежуточного ответа нет (ждем ввода упрощения/ответа)
    // Фаза 2 и 3: разбираем то, что вводится после знака "="
    const userAns = report.finText || report.simText || '';
    const displayAns = userAns.padStart(4, ' '); // Максимум 4 знака (для суммы сотен)

    // Генерируем уникальный ключ кэша для GameCanvas, учитывая состояние кликалок
    const cacheKey = `${item.exampleText}_col_p${report.phase}_input${userAns}_th${carries.thousands}_h${carries.hundreds}_t${carries.tens}`;

    // Собираем HTML-интерфейс школьной тетради в столбик
    let html = `
    <div class="column-math-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; font-size: 4.5vh; font-weight: bold; color: #334155; line-height: 1.2; user-select: none;">
        
        <!-- Линейка переноса (перенос над единицами отсутствует по условию) -->
        <div class="carry-row" style="display: flex; justify-content: flex-end; width: 140px; margin-bottom: 2px; height: 4vh;">
            <div class="carry-box" data-digit="thousands" style="width: 35px; text-align: center; color: #a855f7; font-size: 2.5vh; background: #f3e8ff; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.thousands}</div>
            <div class="carry-box" data-digit="hundreds" style="width: 35px; text-align: center; color: #3b82f6; font-size: 2.5vh; background: #dbeafe; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.hundreds}</div>
            <div class="carry-box" data-digit="tens" style="width: 35px; text-align: center; color: #10b981; font-size: 2.5vh; background: #d1fae5; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.tens}</div>
            <div style="width: 35px;"></div> <!-- Над единицами пусто -->
        </div>

        <!-- Основная сетка столбика -->
        <div style="position: relative; width: 140px; text-align: right; letter-spacing: 12px; padding-right: 4px;">
            <!-- Знак операции слева от чисел -->
            <div style="position: absolute; left: -25px; top: 1.2vh; color: #64748b; letter-spacing: normal;">${sign}</div>
            
            <!-- Первое число -->
            <div>${s1}</div>
            <!-- Второе число -->
            <div>${s2}</div>
            
            <!-- Черта под выражениями -->
            <div style="width: 165px; position: absolute; left: -25px; border-top: 4px solid #475569; margin-top: 2px; margin-bottom: 2px;"></div>
        </div>

        <!-- Область ответа под чертой -->
        <div class="answer-row ${report.isFullySolved ? 'block-correct' : (report.isWrongAnswer ? 'block-incorrect' : '')}" style="width: 140px; text-align: right; letter-spacing: 12px; margin-top: 12px; padding-right: 4px; color: ${report.isFullySolved ? '#155724' : (report.isWrongAnswer ? '#721c24' : '#1e293b')}; min-height: 5.5vh;">
            ${displayAns || '____'}
        </div>

        <!-- Текстовый статус для ребенка -->
        <div style="font-size: 1.8vh; margin-top: 15px; color: #64748b; letter-spacing: normal; font-family: sans-serif;">
            ${report.isFullySolved ? 'Великолепно! Правильно в столбик! 🎉' : 'Нажимай на цветные квадраты для памяток разрядов 📝'}
        </div>
    </div>
    `;

    // Выводим сцену в игровую зону
    GameCanvas.renderZoneScene(html, cacheKey);

    // Вешаем обработчики кликов на коробки переноса для инкремента цифр памяти
    const container = document.getElementById('game-zone');
    if (container) {
        container.querySelectorAll('.carry-box').forEach(box => {
            box.addEventListener('click', (e) => {
                const digitType = e.currentTarget.getAttribute('data-digit');
                let currentVal = carryState[state.activeIndex][digitType];
                
                // Циклический перебор: пусто -> 1 -> 2 -> пусто
                if (currentVal === '') currentVal = '1';
                else if (currentVal === '1') currentVal = '2';
                else currentVal = '';

                carryState[state.activeIndex][digitType] = currentVal;
                
                // Перерисовываем UI, чтобы отобразить изменения без смены фокуса примера
                renderColumnVisual();
            });
        });
    }
}

