/**
 * Модуль визуализации для режима ВЫЧИТАНИЯ (Десятки/Сотни)
 * Реализует метод постоянной разности: (А + Х) - (В + Х)
 */

/**
 * Главная функция рендеринга сцены вычитания
 * @param {Object} data - Данные из state.getVisualData()
 * @param {Object} report - Состояние проверки из state.checkStep(...)
 * @returns {string} HTML-разметка сцены
 */
export function renderSubtractionVisual(data, report) {
    let html = '';

    // ФАЗА 1: Исходное состояние примера (например, 52 - 24)
    if (data.stepPhase === 1) {
        html = `
        <div class="sub-scene-container">
            <div class="sub-workspace">
                <!-- Левый робот (Уменьшаемое) везет исходный груз -->
                <div class="sub-robot-platform left-platform">
                    <div class="sub-robot robot-left-idle">🤖 Уменьшаемое</div>
                    <div class="sub-cargo-area">
                        ${generateSubCargoHTML(data.tens1, data.ones1, 0, 0)}
                    </div>
                </div>

                <div class="sub-operator-sign">➖</div>

                <!-- Правый робот (Вычитаемое) хочет забрать часть груза -->
                <div class="sub-robot-platform right-platform">
                    <div class="sub-robot robot-right-idle">🤖 Вычитаемое</div>
                    <div class="sub-cargo-needed">
                        <div class="sub-need-bubble">Надо забрать: <b>${data.initialNum2}</b></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    } 
    // ФАЗА 2: Промежуточный этап - округление (добавление кристаллов к обоим роботам)
    else if (data.stepPhase === 2) {
        const added = data.finalAddedAmount; // Сколько добавили для округления (например, 6)
        html = `
        <div class="sub-scene-container">
            <div class="sub-info-banner">
                Применяем хитрость: округлим вычитаемое! Добавим к обоим числам по <b>${added}</b> 💎
            </div>
            <div class="sub-workspace">
                <!-- К левому роботу добавились синие кристаллы округления -->
                <div class="sub-robot-platform left-platform highlighted-platform">
                    <div class="sub-robot robot-left-work">🤖 Получил +${added}</div>
                    <div class="sub-cargo-area">
                        ${generateSubCargoHTML(data.tens1, data.ones1, added, 0)}
                    </div>
                </div>

                <div class="sub-operator-sign">➖</div>

                <!-- К правому роботу тоже добавились кристаллы, округлив его до десятков -->
                <div class="sub-robot-platform right-platform highlighted-platform">
                    <div class="sub-robot robot-right-work">🤖 Стал круглым!</div>
                    <div class="sub-cargo-needed">
                        <div class="sub-need-bubble">
                            Новая цель: ${data.initialNum2} + ${added} = <b>${data.currentSubtrahend}</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    } 
    // ФАЗА 3: Финальный расчет и уезд робота с остатком груза
    else {
        const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '';
        const labelText = report.isFullySolved ? 'Ура! Робот уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';
        
        html = `
        <div class="sub-scene-container ${driveAwayClass}">
            <div class="sub-info-banner resolution-banner">${labelText}</div>
            <div class="sub-workspace">
                <div class="sub-robot-platform left-platform final-platform">
                    <div class="sub-robot robot-left-drive">🚚 Остаток груза</div>
                    <div class="sub-cargo-area">
                        <!-- ИСПРАВЛЕНО: Передаем data.finalAddedAmount вместо 0, чтобы учесть синие кубики округления -->
                        ${generateSubCargoHTML(data.tens1, data.ones1, data.finalAddedAmount, data.currentSubtrahend)}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    return html;
}

/**
 * Генератор HTML-структуры кристаллов на платформе уменьшаемого
 * @param {number} tens - Исходное количество десятков (палочек)
 * @param {number} ones - Исходное количество единиц (кубиков)
 * @param {number} addedOnes - Количество добавленных единиц при округлении (синие кристаллы)
 * @param {number} subtractedTotal - Сколько всего единиц нужно вычесть/скрыть на финальном шаге
 * @returns {string} HTML-код контейнера с кристаллами
 */
function generateSubCargoHTML(tens, ones, addedOnes, subtractedTotal = 0) {
    let html = '<div class="sub-cargo-grid">';

    // 1. Собираем массив всех имеющихся кубиков (исходные единицы + добавленные для округления)
    let totalOnesArray = [];
    for (let i = 0; i < ones; i++) {
        totalOnesArray.push({ type: 'normal' });
    }
    for (let i = 0; i < addedOnes; i++) {
        totalOnesArray.push({ type: 'added' });
    }

    // Рассчитываем общую сумму единиц до вычитания круглого десятка
    let totalOnesCount = totalOnesArray.length; 
    let totalAvailable = (tens * 10) + totalOnesCount;
    
    // Вычисляем, сколько кубиков должно остаться видимыми после вычитания
    let visibleCount = totalAvailable - subtractedTotal;
    let currentGlobalIndex = 0;

    // 2. Отрисовка десятков (столбцов по 10 штук)
    for (let t = 0; t < tens; t++) {
        html += '<div class="sub-tens-column">';
        for (let u = 0; u < 10; u++) {
            currentGlobalIndex++;
            // Если индекс превышает visibleCount, скрываем кубик (он «вычтен»)
            const isHidden = currentGlobalIndex > visibleCount ? 'sub-cube-hidden' : '';
            html += `<div class="sub-crystal-cube cube-tens ${isHidden}">🔮</div>`;
        }
        html += '</div>';
    }

    // 3. Отрисовка разрозненных единиц (исходных и добавленных синих)
    if (totalOnesCount > 0) {
        html += '<div class="sub-ones-block">';
        for (let o = 0; o < totalOnesCount; o++) {
            currentGlobalIndex++;
            const cubeData = totalOnesArray[o];
            const isHidden = currentGlobalIndex > visibleCount ? 'sub-cube-hidden' : '';
            const cubeClass = cubeData.type === 'added' ? 'cube-ones-added' : 'cube-ones-normal';
            const cubeEmoji = cubeData.type === 'added' ? '🔷' : '💎';

            html += `<div class="sub-crystal-cube ${cubeClass} ${isHidden}">${cubeEmoji}</div>`;
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}
