// ================================================================
// excel_grid.js — Универсальный движок Excel-таблиц (сальдо)
// Версия 2.1 — содержит buildRectangularPayload()
// ================================================================

window.excelMatrix = [];
window.selectedCell = { row: null, col: null };
window.excelChangedCells = {};
window.ctrlSelectedCells = [];
window.excelIsDragging = false;
window.excelDragStartRow = null;
window.excelDragStartCol = null;
window.excelSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };

const EXCEL_COLS = 20;
const EXCEL_ROWS = 800;

/**
 * Возвращает буквенное обозначение столбца (A, B, C, ... Z, AA, AB...)
 * @param {number} colIndex - Индекс столбца (0-based)
 * @returns {string} - Буквенное обозначение столбца
 */
function getExcelColumnName(colIndex) {
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (colIndex < 26) return alphabet[colIndex];
  return alphabet[Math.floor(colIndex / 26) - 1] + alphabet[colIndex % 26];
}

/**
 * Инициализирует матрицу данных для Excel-грида
 * Загружает данные из window.balanceData или создаёт пустую матрицу
 */
function initExcelMatrixData() {
  window.excelMatrix = [];
  window.excelChangedCells = {};
  window.ctrlSelectedCells = [];
  window.excelSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  
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
 * Рендерит Excel-грид в DOM
 */
function renderExcelGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  // Шапка: буквы столбцов
  let headHtml = '<tr>';
  headHtml += '<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;" onclick="excelSelectAllGrid()">⬚</th>';
  for (let c = 0; c < EXCEL_COLS; c++) {
    headHtml += '<th onclick="excelSelectWholeColumnGrid('+c+')" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;">'+getExcelColumnName(c)+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  // Тело таблицы
  let bodyHtml = "";
  for (let r = 0; r < EXCEL_ROWS; r++) {
    bodyHtml += '<tr>';
    bodyHtml += '<td class="row-header-num" onclick="excelSelectWholeRowGrid('+r+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;padding:4px 2px;">'+(r+1)+'</td>';
    
    for (let c = 0; c < EXCEL_COLS; c++) {
      const cellValue = window.excelMatrix[r][c];
      
      let isSelected = false;
      if (window.excelSelectedRange.startRow !== null) {
        isSelected = (r >= window.excelSelectedRange.startRow && r <= window.excelSelectedRange.endRow &&
                      c >= window.excelSelectedRange.startCol && c <= window.excelSelectedRange.endCol);
      }
      
      const selectClass = isSelected ? 'class="excel-cell-selected"' : '';
      bodyHtml += '<td id="ex-cell-'+r+'-'+c+'" '+selectClass+' onclick="excelHandleCellSelectGrid(event, '+r+', '+c+')" onmousedown="excelHandleMouseDownGrid(event, '+r+', '+c+')" onmouseover="excelHandleMouseOverGrid(event, '+r+', '+c+')" style="border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;background:#ffffff;color:#000;cursor:pointer;">'+cellValue+'</td>';
    }
    bodyHtml += '</tr>';
  }
  body.innerHTML = bodyHtml;

  // Добавляем обработчики drag
  attachExcelGridDragListeners();
}

// ================================================================
// DRAG SELECTION ДЛЯ EXCEL-ГРИДА
// ================================================================

function attachExcelGridDragListeners() {
  const table = document.querySelector('#balance-paste-container .excel-grid-table');
  if (!table) return;
  table.removeEventListener('mousedown', excelGridGlobalMouseDown);
  table.removeEventListener('mousemove', excelGridGlobalMouseMove);
  table.removeEventListener('mouseup', excelGridGlobalMouseUp);
  document.removeEventListener('mouseup', excelGridGlobalMouseUp);
  table.addEventListener('mousedown', excelGridGlobalMouseDown);
  table.addEventListener('mousemove', excelGridGlobalMouseMove);
  table.addEventListener('mouseup', excelGridGlobalMouseUp);
  document.addEventListener('mouseup', excelGridGlobalMouseUp);
}

function excelGridGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  window.excelIsDragging = true;
  window.excelDragStartRow = rIdx;
  window.excelDragStartCol = cIdx;
  window.excelSelectedRange.startRow = rIdx;
  window.excelSelectedRange.endRow = rIdx;
  window.excelSelectedRange.startCol = cIdx;
  window.excelSelectedRange.endCol = cIdx;
  renderExcelGrid();
}

function excelGridGlobalMouseMove(e) {
  if (!window.excelIsDragging) return;
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  window.excelSelectedRange.startRow = Math.min(window.excelDragStartRow, rIdx);
  window.excelSelectedRange.endRow = Math.max(window.excelDragStartRow, rIdx);
  window.excelSelectedRange.startCol = Math.min(window.excelDragStartCol, cIdx);
  window.excelSelectedRange.endCol = Math.max(window.excelDragStartCol, cIdx);
  renderExcelGrid();
}

function excelGridGlobalMouseUp(e) {
  if (window.excelIsDragging) {
    window.excelIsDragging = false;
    renderExcelGrid();
  }
}

// ================================================================
// ВЫДЕЛЕНИЕ ЯЧЕЕК В EXCEL-ГРИДЕ
// ================================================================

function excelHandleCellSelectGrid(event, row, col) {
  if (window.excelIsDragging) return;
  window.excelSelectedRange.startRow = row;
  window.excelSelectedRange.endRow = row;
  window.excelSelectedRange.startCol = col;
  window.excelSelectedRange.endCol = col;
  renderExcelGrid();
}

function excelSelectWholeRowGrid(row) {
  window.excelSelectedRange.startRow = row;
  window.excelSelectedRange.endRow = row;
  window.excelSelectedRange.startCol = 0;
  window.excelSelectedRange.endCol = EXCEL_COLS - 1;
  renderExcelGrid();
}

function excelSelectWholeColumnGrid(col) {
  window.excelSelectedRange.startRow = 0;
  window.excelSelectedRange.endRow = EXCEL_ROWS - 1;
  window.excelSelectedRange.startCol = col;
  window.excelSelectedRange.endCol = col;
  renderExcelGrid();
}

function excelSelectAllGrid() {
  window.excelSelectedRange.startRow = 0;
  window.excelSelectedRange.endRow = EXCEL_ROWS - 1;
  window.excelSelectedRange.startCol = 0;
  window.excelSelectedRange.endCol = EXCEL_COLS - 1;
  renderExcelGrid();
}

function excelHandleMouseDownGrid(event, rIdx, cIdx) {
  const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+cIdx);
  if (cellEl) cellEl.focus();
}

function excelHandleMouseOverGrid(event, rIdx, cIdx) {}

// ================================================================
// COPY/PASTE ДЛЯ EXCEL-ГРИДА
// ================================================================

document.addEventListener('copy', function(e) {
  if (window.excelSelectedRange.startRow === null) return;
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#balance-paste-container')) return;
  
  const { startRow, endRow, startCol, endCol } = window.excelSelectedRange;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < EXCEL_ROWS; r++) {
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < EXCEL_COLS; c++) {
      rowCopy.push(window.excelMatrix[r][c] || '');
    }
    copyData.push(rowCopy);
  }
  const tsvText = copyData.map(function(row) { return row.join('\t'); }).join('\n');
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();
});

document.addEventListener('paste', function(e) {
  if (window.excelSelectedRange.startRow === null) return;
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#balance-paste-container')) return;
  
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  
  const rows = pasteData.split('\n').filter(function(line) { return line.trim() !== ''; });
  const startR = window.excelSelectedRange.startRow;
  const startC = window.excelSelectedRange.startCol;
  
  rows.forEach(function(rowText, rIdx) {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= EXCEL_ROWS) return;
    cells.forEach(function(cellValue, cIdx) {
      const targetC = startC + cIdx;
      if (targetC >= EXCEL_COLS) return;
      const trimmedVal = cellValue.trim();
      window.excelMatrix[targetR][targetC] = trimmedVal;
      const key = targetR+','+targetC;
      window.excelChangedCells[key] = trimmedVal;
    });
  });
  renderExcelGrid();
});

// ================================================================
// ОЧИСТКА ТАБЛИЦЫ
// ================================================================

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
  window.excelSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.excelChangedCells = {};
  window.ctrlSelectedCells = [];
  renderExcelGrid();
}

// ================================================================
// НАВИГАЦИЯ КЛАВИШАМИ
// ================================================================

document.addEventListener('keydown', function(e) {
  if (window.excelSelectedRange.startRow === null) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

  let r = window.excelSelectedRange.startRow;
  let c = window.excelSelectedRange.startCol;

  if (e.key === 'ArrowUp') { r = Math.max(0, r - 1); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { r = Math.min(EXCEL_ROWS - 1, r + 1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { c = Math.max(0, c - 1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { c = Math.min(EXCEL_COLS - 1, c + 1); e.preventDefault(); }
  else return;

  window.excelSelectedRange.startRow = r;
  window.excelSelectedRange.endRow = r;
  window.excelSelectedRange.startCol = c;
  window.excelSelectedRange.endCol = c;
  renderExcelGrid();
  
  const cellEl = document.getElementById('ex-cell-'+r+'-'+c);
  if (cellEl) cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

// ================================================================
// ГАРАНТИЯ ПРЯМОУГОЛЬНОСТИ
// ================================================================

/**
 * Превращает любые разрозненные или полные ячейки 
 * в идеальную прямоугольную сетку (двумерный массив равной ширины) для setValues()
 * @param {Array} cellsArray - Массив выделенных ячеек [{r, c}, ...]
 * @param {Array} dataSourceMatrix - Исходная матрица данных
 * @returns {Object|null} - { startRow, startCol, numRows, numCols, values2D }
 */
function buildRectangularPayload(cellsArray, dataSourceMatrix) {
  if (!cellsArray || cellsArray.length === 0) return null;

  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  cellsArray.forEach(function(cell) {
    if (cell.r < minR) minR = cell.r;
    if (cell.r > maxR) maxR = cell.r;
    if (cell.c < minC) minC = cell.c;
    if (cell.c > maxC) maxC = cell.c;
  });

  let exportMatrix = [];
  for (let r = minR; r <= maxR; r++) {
    let rowData = [];
    for (let c = minC; c <= maxC; c++) {
      let currentVal = dataSourceMatrix[r] && dataSourceMatrix[r][c] !== undefined ? dataSourceMatrix[r][c] : "";
      rowData.push(String(currentVal));
    }
    exportMatrix.push(rowData);
  }

  return {
    startRow: minR + 1, 
    startCol: minC + 1,
    numRows: (maxR - minR) + 1,
    numCols: (maxC - minC) + 1,
    values2D: exportMatrix
  };
}

// Делаем функцию доступной глобально
window.buildRectangularPayload = buildRectangularPayload;

console.log('✅ excel_grid.js — загружен (версия 2.1)');
