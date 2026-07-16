// js/excel_selection.js — Модуль выделения и формирования прямоугольных матриц

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
    if (typeof focusExcelCell === 'function' && !isCtrl) {
      focusExcelCell(row, col);
    } else {
      const cellEl = document.getElementById(`ex-cell-${row}-${col}`);
      if (cellEl) cellEl.classList.add('excel-cell-selected');
    }
  }
}

/**
 * ГАРАНТИЯ ПРЯМОУГОЛЬНОСТИ: Метод превращает любые разрозненные или полные ячейки 
 * в идеальную прямоугольную сетку (двумерный массив равной ширины) для setValues
 */
function buildRectangularPayload(cellsArray, dataSourceMatrix) {
  if (!cellsArray || cellsArray.length === 0) return null;

  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  cellsArray.forEach(cell => {
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
