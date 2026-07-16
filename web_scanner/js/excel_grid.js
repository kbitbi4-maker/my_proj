// js/excel_grid.js — Универсальный движок Excel-таблиц (20 столбцов х 800 строк) — ЧАСТЬ 1

window.excelMatrix = []; 
window.selectedCell = { row: null, col: null };
window.excelChangedCells = {}; 
window.ctrlSelectedCells = []; 

const EXCEL_COLS = 20;
const EXCEL_ROWS = 800;

function getExcelColumnName(colIndex) {
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (colIndex < 26) return alphabet[colIndex];
  return alphabet[Math.floor(colIndex / 26) - 1] + alphabet[colIndex % 26];
}

function initExcelMatrixData() {
  window.excelMatrix = [];
  window.excelChangedCells = {};
  window.ctrlSelectedCells = [];
  
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

function renderExcelGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  let headHtml = `<tr><th class="excel-corner-header"></th>`;
  for (let c = 0; c < EXCEL_COLS; c++) {
    headHtml += `<th>${getExcelColumnName(c)}</th>`;
  }
  headHtml += `</tr>`;
  head.innerHTML = headHtml;

  let bodyHtml = "";
  for (let r = 0; r < EXCEL_ROWS; r++) {
    bodyHtml += `<tr><th class="excel-row-header">${r + 1}</th>`;
    for (let c = 0; c < EXCEL_COLS; c++) {
      const cellValue = window.excelMatrix[r][c];
      
      let isSelected = false;
      if (window.ctrlSelectedCells && window.ctrlSelectedCells.length > 0) {
        isSelected = window.ctrlSelectedCells.some(cell => cell.r === r && cell.c === c);
      } else {
        isSelected = window.selectedCell.row === r && window.selectedCell.col === c;
      }
      
      const selectClass = isSelected ? 'class="excel-cell-selected"' : '';
      bodyHtml += `<td id="ex-cell-${r}-${c}" ${selectClass} onclick="handleExcelCellSelectWithCtrl(event, ${r}, ${c})">${cellValue}</td>`;
    }
    bodyHtml += `</tr>`;
  }
  body.innerHTML = bodyHtml;
}

function focusExcelCell(row, col) {
  if (window.selectedCell.row !== null && window.selectedCell.col !== null) {
    const oldCell = document.getElementById(`ex-cell-${window.selectedCell.row}-${window.selectedCell.col}`);
    if (oldCell) oldCell.classList.remove('excel-cell-selected');
  }

  window.selectedCell = { row, col };
  
  const newCell = document.getElementById(`ex-cell-${row}-${col}`);
  if (newCell) newCell.classList.add('excel-cell-selected');
}

/**
 * ИЗОЛИРОВАННОЕ ВЫДЕЛЕНИЕ ЯЧЕЕК (КЛИК / CTRL+КЛИК) ТЕПЕРЬ НАПРЯМУЮ ТУТ
 */
function handleExcelCellSelectWithCtrl(event, row, col) {
  if (!window.ctrlSelectedCells) window.ctrlSelectedCells = [];
  const isCtrl = event.ctrlKey || event.metaKey;
  
  if (!isCtrl) {
    window.ctrlSelectedCells.forEach(cell => {
      const cellEl = document.getElementById(`ex-cell-${cell.r}-${cell.c}`);
      if (cellEl) cellEl.classList.remove('excel-cell-selected');
    });
    window.ctrlSelectedCells = [];
  }

  const existsIdx = window.ctrlSelectedCells.findIndex(cell => cell.r === row && cell.c === col);
  
  if (existsIdx !== -1 && isCtrl) {
    window.ctrlSelectedCells.splice(existsIdx, 1);
    const cellEl = document.getElementById(`ex-cell-${row}-${col}`);
    if (cellEl) cellEl.classList.remove('excel-cell-selected');
  } else {
    window.ctrlSelectedCells.push({ r: row, c: col });
    if (!isCtrl) {
      focusExcelCell(row, col);
    } else {
      const cellEl = document.getElementById(`ex-cell-${row}-${col}`);
      if (cellEl) cellEl.classList.add('excel-cell-selected');
    }
  }
}
