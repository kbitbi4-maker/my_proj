// js/excel_grid.js — Универсальный движок Excel-таблиц (20 столбцов х 800 строк) — ЧАСТЬ 1

window.excelMatrix = []; // Двумерный массив данных грида
window.selectedCell = { row: null, col: null };

const EXCEL_COLS = 20;
const EXCEL_ROWS = 800;

// Генерация буквенных имен колонок (A, B, C... T)
function getExcelColumnName(colIndex) {
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (colIndex < 26) return alphabet[colIndex];
  return alphabet[Math.floor(colIndex / 26) - 1] + alphabet[colIndex % 26];
}

/**
 * Инициализация матрицы данными из кэша Сальдо или создание пустой структуры
 */
function initExcelMatrixData() {
  window.excelMatrix = [];
  const savedBalance = window.balanceData || [];

  for (let r = 0; r < EXCEL_ROWS; r++) {
    let rowData = [];
    for (let c = 0; c < EXCEL_COLS; c++) {
      if (savedBalance[r] && savedBalance[r][c] !== undefined) {
        rowData.push(String(savedBalance[r][c]));
      } else {
        rowData.push("");
      }
    }
    window.excelMatrix.push(rowData);
  }
  window.selectedCell = { row: null, col: null };
}

/**
 * Отрисовка Excel сетки внутри HTML с поддержкой скроллинга и множественного выделения
 */
function renderExcelGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  // Формируем шапку (Угловатая ячейка + Буквы)
  let headHtml = `<tr><th class="excel-corner-header"></th>`;
  for (let c = 0; c < EXCEL_COLS; c++) {
    headHtml += `<th>${getExcelColumnName(c)}</th>`;
  }
  headHtml += `</tr>`;
  head.innerHTML = headHtml;

  // Формируем строки (Номер + Ячейки матрицы)
  let bodyHtml = "";
  for (let r = 0; r < EXCEL_ROWS; r++) {
    bodyHtml += `<tr><th class="excel-row-header">${r + 1}</th>`;
    for (let c = 0; c < EXCEL_COLS; c++) {
      const cellValue = window.excelMatrix[r][c];
      
      // Проверяем, находится ли ячейка в массиве множественного выделения ctrlSelectedCells
      let isSelected = false;
      if (window.ctrlSelectedCells && window.ctrlSelectedCells.length > 0) {
        isSelected = window.ctrlSelectedCells.some(cell => cell.r === r && cell.c === c);
      } else {
        isSelected = window.selectedCell.row === r && window.selectedCell.col === c;
      }
      
      const selectClass = isSelected ? 'class="excel-cell-selected"' : '';
      
      // Клик по ячейке теперь вызывает умный метод выделения с зажатым Ctrl из excel_selection.js
      bodyHtml += `<td id="ex-cell-${r}-${c}" ${selectClass} onclick="handleExcelCellSelectWithCtrl(event, ${r}, ${c})">${cellValue}</td>`;
    }
    bodyHtml += `</tr>`;
  }
  body.innerHTML = bodyHtml;
}

/**
 * Стандартный фокус на одиночную ячейку
 */
function focusExcelCell(row, col) {
  if (window.selectedCell.row !== null && window.selectedCell.col !== null) {
    const oldCell = document.getElementById(`ex-cell-${window.selectedCell.row}-${window.selectedCell.col}`);
    if (oldCell) oldCell.classList.remove('excel-cell-selected');
  }

  window.selectedCell = { row, col };
  
  const newCell = document.getElementById(`ex-cell-${row}-${col}`);
  if (newCell) newCell.classList.add('excel-cell-selected');
}
// js/excel_grid.js — Универсальный движок Excel-таблиц (20 столбцов х 800 строк) — ЧАСТЬ 2

/**
 * Глобальный перехватчик события вставки Ctrl+V для активной ячейки
 */
document.addEventListener('paste', function (e) {
  if (window.selectedCell.row === null || window.selectedCell.col === null) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

  e.preventDefault();
  
  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedText = clipboardData.getData('text');
  if (!pastedText) return;

  const lines = pastedText.split(/\r?\n/);
  const startRow = window.selectedCell.row;
  const startCol = window.selectedCell.col;

  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "" && i === lines.length - 1) continue; 
    
    const targetRow = startRow + i;
    if (targetRow >= EXCEL_ROWS) break;

    const cells = lines[i].split('\t');
    for (let j = 0; j < cells.length; j++) {
      const targetCol = startCol + j;
      if (targetCol >= EXCEL_COLS) break;

      window.excelMatrix[targetRow][targetCol] = cells[j];
      
      // ИНТЕГРАЦИЯ: Регистрируем изменение ячейки в пул точечной отправки данных
      if (typeof trackExcelCellChange === 'function') {
        trackExcelCellChange(targetRow, targetCol, cells[j]);
      }
      
      changed = true;
    }
  }

  if (changed) {
    renderExcelGrid();
  }
});

/**
 * Кнопка Очистить таблицу
 */
function clearExcelGridData() {
  if (!confirm("Вы уверены, что хотите полностью очистить текущую сетку Сальдо?")) return;
  
  window.excelMatrix = [];
  for (let r = 0; r < EXCEL_ROWS; r++) {
    let rowData = [];
    for (let c = 0; c < EXCEL_COLS; c++) {
      rowData.push("");
    }
    window.excelMatrix.push(rowData);
  }
  window.selectedCell = { row: null, col: null };
  window.excelChangedCells = {}; // Полностью очищаем пул изменений
  window.ctrlSelectedCells = []; // Очищаем множественный выбор
  renderExcelGrid();
}

// Глобальная поддержка перемещения по ячейкам кнопками стрелок клавиатуры
document.addEventListener('keydown', function(e) {
  if (window.selectedCell.row === null || window.selectedCell.col === null) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

  let r = window.selectedCell.row;
  let c = window.selectedCell.col;

  if (e.key === 'ArrowUp') { r = Math.max(0, r - 1); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { r = Math.min(EXCEL_ROWS - 1, r + 1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { c = Math.max(0, c - 1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { c = Math.min(EXCEL_COLS - 1, c + 1); e.preventDefault(); }
  else return;

  // Если подключен модуль множественного выделения, передаем событие клика туда
  if (typeof handleExcelCellSelectWithCtrl === 'function') {
    handleExcelCellSelectWithCtrl(e, r, c);
  } else {
    focusExcelCell(r, c);
  }
  
  const cellEl = document.getElementById(`ex-cell-${r}-${c}`);
  if (cellEl) cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
