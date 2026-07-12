/**
 * Функция отрисовки таблицы остатков на складе (Лист 1) с живым поиском
 */
function renderStock() {
  const tbody = document.getElementById("stock-body");
  const thead = document.getElementById("stock-head");
  const searchInput = document.getElementById("stock-search");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  // Получаем кэшированные при синхронизации данные остатков склада
  const stock = window.cachedStockData || [];
  if (!Array.isArray(stock) || stock.length === 0) {
    tbody.innerHTML = "<tr><td colspan='100%'>Данные склада отсутствуют или не синхронизированы</td></tr>";
    return;
  }

  // Рендерим заголовки колонок из первой строки массива (если они еще не отрисованы)
  if (thead && thead.children.length === 0 && stock[0]) {
    thead.innerHTML = stock[0].map(h => `<th>${h}</th>`).join("");
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // Перебираем строки склада, начиная со второй (индекс 1), пропуская шапку
  for (let i = 1; i < stock.length; i++) {
    const row = stock[i];
    if (!Array.isArray(row)) continue;
    
    // Фильтрация по поисковому запросу
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
 * Переключение модального интерфейса на экран просмотра остатков склада
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
 * Безопасно обрабатывает пустые данные и подсвечивает возвраты светло-красным
 * @param {Array} logs - Массив строк (Лист 2), полученный через doGet
 */
function renderLogs(logs) {
  const tbody = document.getElementById("logs-body");
  const thead = document.getElementById("logs-head");
  if (!tbody) return;

  tbody.innerHTML = "";
  
  // Кэшируем массив логов в глобальной области видимости
  window.cachedLogsData = logs;

  // Безопасная проверка: если данных нет или пришел не массив, пишем заглушку и не крашим скрипт
  if (!logs || !Array.isArray(logs) || logs.length <= 1) {
    tbody.innerHTML = "<tr><td colspan='100%' style='text-align:center; padding:15px;'>Журнал выдачи пуст. Синхронизируйте данные.</td></tr>";
    return;
  }

  // Генерируем шапку таблицы (Заголовки из первой строки logs[0])
  if (thead && logs[0]) {
    thead.innerHTML = logs[0].map(h => `<th>${h}</th>`).join("");
  }

  // Отрисовываем лог в обратном порядке (свежие записи сверху), исключая индекс 0 (шапку)
  for (let i = logs.length - 1; i >= 1; i--) {
    const row = logs[i];
    if (!Array.isArray(row)) continue;

    const tr = document.createElement("tr");

    // Извлекаем значение количества из 6-й колонки (индекс 5)
    const qty = parseInt(row[5], 10) || 0;

    // ПРОВЕРКА НА ВОЗВРАТ: Если число отрицательное, перекрашиваем строку веб-интерфейса
    if (qty < 0) {
      tr.style.backgroundColor = "#FCE4D6"; // Светло-красный пастельный цвет
      tr.classList.add("return-row");       
    } else {
      tr.style.backgroundColor = "#FFFFFF"; 
    }

    // Безопасно наполняем ячейки текстом
    tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join("");
    tbody.appendChild(tr);
  }
}
