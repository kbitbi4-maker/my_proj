// js/excel_selection.js — Модуль продвинутого выделения и табличной отправки данных

window.excelChangedCells = {}; // Хранилище измененных ячеек вида {"r,c": "значение"}
window.ctrlSelectedCells = []; // Список координат выделенных ячеек [{r, c}, ...]

/**
 * Фиксирует изменение значения в матрице и запоминает его для точечной или диапазонной отправки
 */
function trackExcelCellChange(row, col, value) {
  const key = `${row},${col}`;
  window.excelChangedCells[key] = String(value);
}

/**
 * Модернизированный метод выделения ячеек (поддерживает зажатый Ctrl / Cmd)
 */
function handleExcelCellSelectWithCtrl(event, row, col) {
  const isCtrl = event.ctrlKey || event.metaKey;
  
  if (!isCtrl) {
    // Если Ctrl не зажат, очищаем множественное выделение
    clearCtrlSelectionVisuals();
    window.ctrlSelectedCells = [];
  }

  // Проверяем, нет ли уже этой ячейки в выделении
  const existsIdx = window.ctrlSelectedCells.findIndex(cell => cell.r === row && cell.c === col);
  
  if (existsIdx !== -1 && isCtrl) {
    // Повторный клик с Ctrl снимает выделение с конкретной ячейки
    window.ctrlSelectedCells.splice(existsIdx, 1);
    const cellEl = document.getElementById(`ex-cell-${row}-${col}`);
    if (cellEl) cellEl.classList.remove('excel-cell-selected');
  } else {
    // Добавляем ячейку в пул выделения
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
 * Очистка визуальных эффектов множественного выделения
 */
function clearCtrlSelectionVisuals() {
  window.ctrlSelectedCells.forEach(cell => {
    const cellEl = document.getElementById(`ex-cell-${cell.r}-${cell.c}`);
    if (cellEl) cellEl.classList.remove('excel-cell-selected');
  });
}

/**
 * ПРЕОБРАЗОВАНИЕ ПУЛА ДАННЫХ В СТРОГИЙ ДВУМЕРНЫЙ ПРЯМОУГОЛЬНЫЙ ФОРМАТ (ПРАВИЛО setValues)
 * Берет любые измененные или выделенные ячейки и строит из них идеальную мини-таблицу
 */
function buildRectangularPayload(cellsArray, dataSourceMatrix) {
  if (!cellsArray || cellsArray.length === 0) return null;

  // 1. Находим границы диапазона (минимум и максимум по строкам и колонкам)
  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  cellsArray.forEach(cell => {
    if (cell.r < minR) minR = cell.r;
    if (cell.r > maxR) maxR = cell.r;
    if (cell.c < minC) minC = cell.c;
    if (cell.c > maxC) maxC = cell.c;
  });

  // 2. Создаем идеальную прямоугольную сетку под размеры диапазона
  let exportMatrix = [];
  for (let r = minR; r <= maxR; r++) {
    let rowData = [];
    for (let c = minC; c <= maxC; c++) {
      // Брем актуальное значение из рабочей матрицы Excel
      let currentVal = dataSourceMatrix[r][c] !== undefined ? dataSourceMatrix[r][c] : "";
      rowData.push(String(currentVal));
    }
    exportMatrix.push(rowData);
  }

  // Возвращаем объект с метаданными координат для Google скрипта, чтобы он знал, куда вставлять
  return {
    startRow: minR + 1, // Переводим в 1-индексацию Google Таблиц
    startCol: minC + 1,
    numRows: (maxR - minR) + 1,
    numCols: (maxC - minC) + 1,
    values2D: exportMatrix
  };
}

