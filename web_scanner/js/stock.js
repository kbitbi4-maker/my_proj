/**
 * Функция отрисовки таблицы остатков на складе (Лист 1)
 */
function renderStock() {
  const tbody = document.getElementById("stock-body");
  const thead = document.getElementById("stock-head");
  const searchInput = document.getElementById("stock-search");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  // Поддерживаем все варианты названий глобального кэша для стабильности
  const stock = window.cachedStockData || window.stockData || [];
  if (!Array.isArray(stock) || stock.length === 0) {
    tbody.innerHTML = "<tr><td colspan='100%'>Синхронизируйте данные остатков...</td></tr>";
    return;
  }

  if (thead && thead.children.length === 0 && stock) {
    thead.innerHTML = stock.map(h => `<th>${h}</th>`).join("");
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  for (let i = 1; i < stock.length; i++) {
    const row = stock[i];
    if (!Array.isArray(row)) continue;
    
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
 * Открытие экрана остатков в модальном окне
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
 * Функция отрисовки Журнала выдачи на главном экране (Лист 2)
 */
function renderLogs(logs) {
  const tbody = document.getElementById("logs-body");
  const thead = document.getElementById("logs-head");
  if (!tbody) return;

  tbody.innerHTML = "";
  
  // Записываем данные в глобальный кэш вашего приложения PRO_26
  window.cachedLogsData = logs;
  window.logsData = logs;

  if (!logs || !Array.isArray(logs) || logs.length <= 1) {
    tbody.innerHTML = "<tr><td colspan='100%'>Журнал выдачи пуст</td></tr>";
    return;
  }

  // Отрисовка заголовков таблицы
  if (thead && logs) {
    thead.innerHTML = logs.map(h => `<th>${h}</th>`).join("");
  }

  // Рендеринг строк журнала снизу вверх (новые сверху)
  for (let i = logs.length - 1; i >= 1; i--) {
    const row = logs[i];
    if (!Array.isArray(row)) continue;

    const tr = document.createElement("tr");

    // Индекс 5 — это количество товара
    const qty = parseInt(row[5], 10) || 0;

    // Безопасное окрашивание: если количество меньше нуля, строка красится в светло-красный
    if (qty < 0) {
      tr.style.backgroundColor = "#FCE4D6"; 
      tr.classList.add("return-row");       
    } else {
      tr.style.backgroundColor = "#FFFFFF"; 
    }

    tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join("");
    tbody.appendChild(tr);
  }
}
