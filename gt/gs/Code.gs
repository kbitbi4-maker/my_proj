// Code.gs - размещается в Google Таблице
const SHEET_NAME = "Лист1"; // Название вашего листа

// GET: Получить все данные из таблицы
function getSheetData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return JSON.stringify({ error: "Лист не найден" });
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return JSON.stringify({
      success: true,
      headers: headers,
      rows: rows,
      totalRows: rows.length,
      totalCols: headers.length
    });
  } catch (error) {
    return JSON.stringify({ error: error.toString() });
  }
}

// POST: Обновить ячейку
function updateCell(row, col, value) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.getRange(row, col).setValue(value);
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ error: error.toString() });
  }
}

// POST: Добавить новую строку
function addRow(rowData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const parsedData = JSON.parse(rowData);
    sheet.appendRow(parsedData);
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ error: error.toString() });
  }
}

// POST: Удалить строку
function deleteRow(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.deleteRow(rowIndex);
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ error: error.toString() });
  }
}

// GET: Получить структуру (для отладки)
function getStructure() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return JSON.stringify({
      success: true,
      headers: headers,
      columnsCount: headers.length
    });
  } catch (error) {
    return JSON.stringify({ error: error.toString() });
  }
}

// Для развертывания: Опубликовать как веб-приложение
// → Развернуть → Новое развертывание → Веб-приложение
// → Кто имеет доступ: Все, у кого есть ссылка (для тестирования)
