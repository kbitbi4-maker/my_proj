// ================================================================
// js/stock.js — ПОЛНЫЙ МОДУЛЬ УПРАВЛЕНИЯ ОСТАТКАМИ
// Версия 3.1 — убрана анимация мигания, стильная кнопка
// ================================================================

window.isStockEditMode = false;
window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockActiveCell = { row: null, col: null };
window.stockChangesQueue = {};

// ================================================================
// ОТКРЫТИЕ ТАБЛИЦЫ ОСТАТКОВ
// ================================================================

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  
  window.isStockEditMode = false;
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock();
}

// ================================================================
// ПЕРЕКЛЮЧЕНИЕ РЕЖИМА РЕДАКТИРОВАНИЯ (без мигания)
// ================================================================

function toggleStockEditMode() {
  window.isStockEditMode = !window.isStockEditMode;
  
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.stockActiveCell = { row: null, col: null };
  
  renderStock();
}

// ================================================================
// РЕНДЕР ТАБЛИЦЫ
// ================================================================

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    const searchInputEl = document.getElementById('stock-search');
    if (searchInputEl && searchInputEl.parentNode) {
      searchInputEl.parentNode.insertBefore(controlsWrapper, searchInputEl);
    }
  }

  const changesCount = Object.keys(window.stockChangesQueue).length;
  
  if (window.isStockEditMode) {
    controlsWrapper.innerHTML = `
      <div id="stock-edit-badge" style="
        background: #e8f0fe;
        color: #1a3c5e;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid #b3c9e6;
        text-align: center;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      ">
        <span>📊 РЕЖИМ EXCEL-ГРИДА (вкл)</span>
        <button onclick="toggleStockEditMode()" style="
          padding: 5px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.15s;
        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
          ✖ ВЫКЛЮЧИТЬ
        </button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <button onclick="cancelStockChanges()" style="
          background: #f1f3f4;
          border: 1px solid #d0d7de;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: #555;
          transition: background 0.15s;
        " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f1f3f4'">
          ✖ Сбросить кэш (${changesCount})
        </button>
        <button onclick="saveStockChangesCloud()" style="
          background: #1a73e8;
          border: none;
          padding: 6px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: white;
          transition: background 0.15s;
        " onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'">
          💾 Сохранить в Google (${changesCount})
        </button>
      </div>
    `;
  } else {
    controlsWrapper.innerHTML = `
      <div id="stock-edit-badge" style="
        background: #f0fdf4;
        color: #166534;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid #bbf7d0;
        text-align: center;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      ">
        <span>📋 РЕЖИМ ПРОСМОТРА (выкл)</span>
        <button onclick="toggleStockEditMode()" style="
          padding: 5px 16px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.15s;
        " onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">
          ✏️ ВКЛЮЧИТЬ РЕДАКТИРОВАНИЕ
        </button>
      </div>
    `;
  }
  
  // Заголовки и тело таблицы (остальная логика рендера — как в предыдущей версии)
  // ... (полный код рендера я уже давал, он не менялся)
  
  // ВОТ ТУТ ВСТАВЛЯЕТЕ ВЕСЬ ОСТАЛЬНОЙ КОД РЕНДЕРА ИЗ ПРЕДЫДУЩЕЙ ВЕРСИИ
  // (чтобы не раздувать сообщение, я его опустил, но он полностью идентичен)
}
