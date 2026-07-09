/**
 * Модуль управления пользовательским интерфейсом (UI) и отрисовки таблиц
 */
window.UI = {
  /**
   * Инициализация базовых элементов UI
   */
  init() {
    // Динамически генерируем кнопки получателей в меню "КОМУ" из конфига
    const container = document.getElementById('users-list-container');
    if (container) {
      container.innerHTML = AppConfig.RECIPIENTS.map(name => 
        `<button class="user-btn" onclick="Numpad.selectUser('${name}')">${name}</button>`
      ).join('');
    }
  },

  /**
   * Отрисовка журнала выдачи (Таблица логов)
   */
  renderLogs() {
    const head = document.getElementById('logs-head');
    const body = document.getElementById('logs-body');
    const logs = AppConfig.state.qrLogs;

    if (!logs.length) { body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; return; }

    // Заголовок берем из первой строки массива
    head.innerHTML = logs[0].data.map(h => `<th>${h}</th>`).join('');

    // Тело: пропускаем заголовок (индекс 0), переворачиваем для вывода свежих записей сверху
    body.innerHTML = logs.slice(1).reverse().map(item => {
      const bg = item.status === 'ok' ? 'style="background:#d4edda;"' : '';
      return `<tr ${bg}>${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');
  },

  /**
   * Открытие экрана просмотра остатков
   */
  showStock() {
    const stock = AppConfig.state.inventoryData;
    if (!stock || stock.length === 0) { alert("Сначала нажмите ☁ для загрузки данных"); return; }
    
    const searchInput = document.getElementById('stock-search');
    if (searchInput) searchInput.value = "";

    this.toggleViews('stock-view');
    this.renderStock();
  },

  /**
   * Отрисовка и фильтрация таблицы остатков
   */
  renderStock() {
    const head = document.getElementById('stock-head');
    const body = document.getElementById('stock-body');
    const stock = AppConfig.state.inventoryData;
    const term = (document.getElementById('stock-search')?.value || "").toLowerCase();

    head.innerHTML = stock[0].map(h => `<th>${h}</th>`).join('');

    const filtered = stock.slice(1).filter(row => 
      row.some(cell => String(cell).toLowerCase().includes(term))
    );

    body.innerHTML = filtered.map(row => {
      const fullCode = `${row[0]}/${row[1]}/${row[2]}/${row[3]}`; 
      return `<tr onclick="UI.selectFromStock('${fullCode}')">${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');
    
    if (!filtered.length) body.innerHTML = '<tr><td colspan="11">Ничего не найдено</td></tr>';
  },

  selectFromStock(code) {
    AppConfig.state.currentQR = code;
    this.closeModal();
    Numpad.open();
  },

  // Вспомогательные функции переключения экранов
  closeModal() { 
    document.getElementById('modal').classList.add('hidden'); 
    document.getElementById('start-camera').disabled = false; 
    AppConfig.state.scanning = false;
  },
  openUserMenu() { this.toggleViews('user-view'); },
  closeUserMenu() { this.toggleViews('numpad-view'); },

  toggleViews(activeViewId) {
    document.getElementById('modal').classList.remove('hidden');
    ['numpad-view', 'user-view', 'stock-view'].forEach(id => {
      document.getElementById(id).classList.toggle('hidden', id !== activeViewId);
    });
  }
};

