/**
 * Модуль управления пользовательским интерфейсом (UI) и отрисовки таблиц
 */
window.UI = {
  /**
   * Инициализация базовых элементов UI
   */
  init() {
    const container = document.getElementById('users-list-container');
    if (container) {
      container.innerHTML = AppConfig.RECIPIENTS.map(name => 
        `<button class="user-btn" onclick="Numpad.selectUser('${name}')">${name}</button>`
      ).join('');
    }
  },

  /**
   * Отрисовка журнала выдачи (Таблица логов) на главном экране
   */
  renderLogs() {
    const head = document.getElementById('logs-head');
    const body = document.getElementById('logs-body');
    const logs = AppConfig.state.qrLogs;

    if (!logs || !logs.length) { 
      body.innerHTML = '<tr><td colspan="12">Журнал выдачи пуст</td></tr>'; 
      return; 
    }

    head.innerHTML = logs.map(h => `<th>${h}</th>`).join('');

    body.innerHTML = logs.slice(1).reverse().map(item => {
      const bg = item.status === 'ok' ? 'style="background:#d4edda;"' : '';
      return `<tr ${bg}>${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');
  },

  /**
   * Открытие экрана просмотра остатков («планшетик»)
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

    if (!stock || !stock.length) return;
    head.innerHTML = stock.map(h => `<th>${h}</th>`).join('');

    const filtered = stock.slice(1).map((row, idx) => ({ row, originalIndex: idx + 1 })).filter(item => 
      item.row.some(cell => String(cell).toLowerCase().includes(term))
    );

    body.innerHTML = filtered.map(item => 
      `<tr onclick="UI.selectFromStockIndex(${item.originalIndex})">${item.row.map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('');
    
    if (!filtered.length) body.innerHTML = '<tr><td colspan="5">Ничего не найдено</td></tr>';
  },

  /**
   * Прямой выбор товара из таблицы без использования текстовых разделителей
   */
  selectFromStockIndex(index) {
    const state = AppConfig.state;
    state.foundRowRef = state.inventoryData[index];
    window.currentQR = ""; 
    this.closeModal();
    Numpad.open(true); 
  },

  // Вспомогательные функции переключения экранов
  closeModal() { 
    document.getElementById('modal').classList.add('hidden'); 
    document.getElementById('start-camera').disabled = false; 
    // Гасим оригинальную камеру, если она была запущена
    if (typeof stopCamera === 'function') {
      stopCamera();
    }
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
