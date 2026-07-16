// js/excel_grid.js — Универсальный движок Excel-таблиц (20 столбцов х 800 строк)

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
 * Отрисовка Excel сетки внутри HTML
 */
function renderExcelGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  // Формируем шапку (Угловатая пустая ячейка + Буквы)
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
      const isSelected = window.selectedCell.row === r && window.selectedCell.col === c;
      const selectClass = isSelected ? 'class="excel-cell-selected"' : '';
      
      bodyHtml += `<td id="ex-cell-${r}-${c}" ${selectClass} onclick="focusExcelCell(${r}, ${c})">${cellValue}</td>`;
    }
    bodyHtml += `</tr>`;
  }
  body.innerHTML = bodyHtml;
}

function focusExcelCell(row, col) {
  // Убираем старое выделение визуально
  if (window.selectedCell.row !== null && window.selectedCell.col !== null) {
    const oldCell = document.getElementById(`ex-cell-${window.selectedCell.row}-${window.selectedCell.col}`);
    if (oldCell) oldCell.classList.remove('excel-cell-selected');
  }

  window.selectedCell = { row, col };
  
  const newCell = document.getElementById(`ex-cell-${row}-${col}`);
  if (newCell) newCell.classList.add('excel-cell-selected');
}

/**
 * Глобальный перехватчик события вставки Ctrl+V для активной ячейки
 */
document.addEventListener('paste', function (e) {
  if (window.selectedCell.row === null || window.selectedCell.col === null) return;
  
  // Проверяем, что фокус не находится в стандартных поисковых инпутах
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
    if (lines[i].trim() === "" && i === lines.length - 1) continue; // Игнорируем пустую строку в конце буфера
    
    const targetRow = startRow + i;
    if (targetRow >= EXCEL_ROWS) break;

    const cells = lines[i].split('\t');
    for (let j = 0; j < cells.length; j++) {
      const targetCol = startCol + j;
      if (targetCol >= EXCEL_COLS) break;

      window.excelMatrix[targetRow][targetCol] = cells[j];
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

  focusExcelCell(r, c);
  
  // Автоматический скролл к ячейке внутри контейнера для удобства
  const cellEl = document.getElementById(`ex-cell-${r}-${c}`);
  if (cellEl) cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

