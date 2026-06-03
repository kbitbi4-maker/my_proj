import { selectExample } from './view_dispatcher.js';

const gameZone = document.getElementById('game-zone');
const examplesList = document.getElementById('examples-list');

export const GameCanvas = {
    // === СЛОЙ 1: ЛЕВАЯ ПАНЕЛЬ (ИСТОРИЯ ПРИМЕРОВ) ===
    renderHistory(examplesHistory, activeIndex, currentMode, getBlocksHTML) {
        if (!examplesList) return;
        const placeholder = document.getElementById('history-placeholder');
        if (placeholder) placeholder.remove();

        // 1. Быстрая синхронизация количества строк в DOM и привязка чистых кликов
        if (examplesList.children.length < examplesHistory.length) {
            for (let i = examplesList.children.length; i < examplesHistory.length; i++) {
                const line = document.createElement('div');
                line.className = 'example-line';
                line.setAttribute('data-index', i);
                line.addEventListener('click', () => selectExample(i));
                line.innerHTML = `<span class="example-text">${examplesHistory[i].exampleText}</span><span class="sim-block-wrapper"></span><span class="fin-block-wrapper"></span>`;
                examplesList.appendChild(line);
            }
        } else if (examplesList.children.length > examplesHistory.length) examplesList.innerHTML = '';

        // 2. Обновление содержимого блоков ответов и классов активных строк
        examplesHistory.forEach((item, index) => {
            const line = examplesList.querySelector(`[data-index="${index}"]`);
            if (!line) return;
            line.classList.toggle('active', index === activeIndex);
            
            const { simHTML, finHTML } = getBlocksHTML(item, index, currentMode);
            line.querySelector('.sim-block-wrapper').innerHTML = simHTML;
            line.querySelector('.fin-block-wrapper').innerHTML = finHTML;
        });

        const activeElem = examplesList.querySelector('.active');
        if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    // Метод принудительной очистки левой панели при смене режимов игры
    clearHistory() {
        if (examplesList) {
            examplesList.innerHTML = '<div id="history-placeholder" style="color: #999; text-align: center; margin-top: 20px;">Выберите режим в меню для начала игры</div>';
        }
    },

    // === СЛОЙ 2: НИЖНЯЯ ПАНЕЛЬ (ИГРОВАЯ ЗОНА) ===
    clearZone() {
        if (gameZone) { gameZone.innerHTML = ''; gameZone.removeAttribute('data-current-example'); }
    },
    
    renderZoneScene(html, cacheKey) {
        if (!gameZone) return;
        if (cacheKey && gameZone.getAttribute('data-current-example') === cacheKey) return;
        if (cacheKey) gameZone.setAttribute('data-current-example', cacheKey);
        gameZone.innerHTML = html;
    },

    createActorHTML({ emoji, label, color, animationClass = '', subtitle = '' }) {
        const labelHTML = label ? `<b class="sub-robot-label" style="color:${color};">${label}</b>` : '';
        return `<div class="${animationClass}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:46px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.1));">${emoji}</span>${labelHTML}${subtitle ? `<div style="margin-top:4px;">${subtitle}</div>` : ''}</div>`;
    },

    createDeckHTML(columnsHTML, extraStyles = '') {
        return `<div class="crystal-deck" style="${extraStyles}">${columnsHTML}</div>`;
    },

    createColumnHTML({ totalCount, filledCount, blueCount, dashedBorder = false }) {
        let html = dashedBorder ? `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">` : `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) {
            if (j <= totalCount) {
                html += j <= filledCount ? `<div class="crystal-item ${j <= blueCount ? '' : 'borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`;
            } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        }
        return html + `</div>`;
    }
};
