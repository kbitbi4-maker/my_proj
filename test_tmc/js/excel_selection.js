// ================================================================
// excel_selection.js — Модуль выделения ячеек в Excel-гриде
// Версия 1.1 — удалён дубликат buildRectangularPayload()
// ================================================================

/**
 * Обработчик выделения ячеек с поддержкой Ctrl+клик для множественного выбора
 * @param {MouseEvent} event - Событие клика
 * @param {number} row - Индекс строки
 * @param {number} col - Индекс столбца
 */
function handleExcelCellSelectWithCtrl(event, row, col) {
  if (!window.ctrlSelectedCells) window.ctrlSelectedCells = [];
  const isCtrl = event.ctrlKey || event.metaKey;
  
  // Если Ctrl не зажат — сбрасываем все выделения
  if (!isCtrl) {
    window.ctrlSelectedCells.forEach(function(cell) {
      const cellEl = document.getElementById('ex-cell-'+cell.r+'-'+cell.c);
      if (cellEl) cellEl.classList.remove('excel-cell-selected');
    });
    window.ctrlSelectedCells = [];
  }

  // Проверяем, не выделена ли уже эта ячейка
  const existsIdx = window.ctrlSelectedCells.findIndex(function(cell) {
    return cell.r === row && cell.c === col;
  });
  
  // Если ячейка уже выделена и зажат Ctrl — снимаем выделение
  if (existsIdx !== -1 && isCtrl) {
    window.ctrlSelectedCells.splice(existsIdx, 1);
    const cellEl = document.getElementById('ex-cell-'+row+'-'+col);
    if (cellEl) cellEl.classList.remove('excel-cell-selected');
  } else {
    // Добавляем ячейку в выделение
    window.ctrlSelectedCells.push({ r: row, c: col });
    
    // Если Ctrl не зажат — делаем ячейку активной (фокус)
    if (typeof focusExcelCell === 'function' && !isCtrl) {
      focusExcelCell(row, col);
    } else {
      // Иначе просто подсвечиваем
      const cellEl = document.getElementById('ex-cell-'+row+'-'+col);
      if (cellEl) cellEl.classList.add('excel-cell-selected');
    }
  }
}

/**
 * Функция buildRectangularPayload() удалена из этого файла,
 * так как она уже определена в excel_grid.js.
 * Используйте window.buildRectangularPayload() для доступа к ней.
 * 
 * Функция превращает выделенные ячейки в прямоугольную матрицу:
 * @param {Array} cellsArray - Массив выделенных ячеек [{r, c}, ...]
 * @param {Array} dataSourceMatrix - Исходная матрица данных
 * @returns {Object|null} - { startRow, startCol, numRows, numCols, values2D }
 */
// buildRectangularPayload() теперь доступна через window.buildRectangularPayload()

console.log('✅ excel_selection.js — загружен (версия 1.1)');
