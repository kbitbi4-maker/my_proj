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
// js/excel_grid.js — Универсальный движок Excel-таблиц (20 столбцов х 800 строк) — ЧАСТЬ 2

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

      const valueStr = String(cells[j] || "").trim();
      window.excelMatrix[targetRow][targetCol] = valueStr;
      
      const key = `${targetRow},${targetCol}`;
      window.excelChangedCells[key] = valueStr;
      
      changed = true;
    }
  }

  if (changed) {
    renderExcelGrid();
  }
});

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
  window.excelChangedCells = {}; 
  window.ctrlSelectedCells = []; 
  renderExcelGrid();
}

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

  if (typeof handleExcelCellSelectWithCtrl === 'function') {
    handleExcelCellSelectWithCtrl(e, r, c);
  } else {
    focusExcelCell(r, c);
  }
  
  const cellEl = document.getElementById(`ex-cell-${r}-${c}`);
  if (cellEl) cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
