/**
 * Функция отрисовки таблицы остатков на складе (Лист 1) с возможностью живого фильтра
 */
function renderStock() {
  const tbody = document.getElementById("stock-body");
  const thead = document.getElementById("stock-head");
  const searchInput = document.getElementById("stock-search");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  // Проверяем наличие кэшированных данных склада (записываются при синхронизации)
  const stock = window.cachedStockData || [];
  if (stock.length === 0) {
    tbody.innerHTML = "<tr><td colspan='100%'>Данные склада пусты или не синхронизированы</td></tr>";
    return;
  }

  // Рендеринг заголовков таблицы из первой строки массива Google Таблицы
  const headers = stock[0];
  if (thead && thead.children.length === 0) {
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join("");
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // Перебираем строки данных, исключая строку заголовков (индекс 0)
  for (let i = 1; i < stock.length; i++) {
    const row = stock[i];
    
    // Если есть поисковый запрос, проверяем совпадение по артикулу или названию
    if (query) {
      const rowString = row.join(" ").toLowerCase();
      if (rowString.indexOf(query) === -1) continue;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join("");
    tbody.appendChild(tr);
  }
}

/**
 * Функция открытия экрана просмотра остатков склада в модальном окне
 */
function showStock() {
  const modal = document.getElementById("modal");
  const stockView = document.getElementById("stock-view");
  const numpadView = document.getElementById("numpad-view");
  const userView = document.getElementById("user-view");
  const searchInput = document.getElementById("stock-search");

  if (modal) modal.classList.remove("hidden");
  if (stockView) stockView.classList.remove("hidden");
  if (numpadView) numpadView.classList.add("hidden");
  if (userView) userView.classList.add("hidden");
  
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }

  renderStock();
}

/**
 * Функция отрисовки Журнала выдачи на главном экране веб-приложения
 * Проверяет знак количества и автоматически красит возвраты в светло-красный цвет
 * @param {Array} logs - Массив строк (Лист 2), полученный из doGet
 */
function renderLogs(logs) {
  const tbody = document.getElementById("logs-body");
  const thead = document.getElementById("logs-head");
  if (!tbody) return;

  tbody.innerHTML = "";
  
  // Сохраняем логи в кэш для доступа из других модулей, если необходимо
  window.cachedLogsData = logs;

  if (!logs || logs.length === 0) {
    tbody.innerHTML = "<tr><td colspan='100%'>Журнал выдачи пуст</td></tr>";
    return;
  }

  // Формируем шапку таблицы (Заголовки из первой строки Листа 2)
  const headers = logs[0];
  if (thead) {
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join("");
  }

  // Отрисовываем записи журнала в обратном порядке (новые записи сверху), пропуская шапку (индекс 0)
  for (let i = logs.length - 1; i >= 1; i--) {
    const row = logs[i];
    const tr = document.createElement("tr");

    // Количество товара лежит в 6-м столбце (индекс 5)
    const qty = parseInt(row[5], 10) || 0;

    // ПРОВЕРКА РЕЖИМА: Если количество отрицательное — это возврат.
    // Окрашиваем ВСЮ строку веб-интерфейса (все 12 ячеек) в светло-красный пастельный цвет
    if (qty < 0) {
      tr.style.backgroundColor = "#FCE4D6"; 
      tr.classList.add("return-row"); // CSS класс для кастомной стилизации border или шрифтов
    } else {
      tr.style.backgroundColor = "#FFFFFF"; 
    }

    // Заполняем ячейки текущей строки данными из массива
    tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join("");
    tbody.appendChild(tr);
  }
}
