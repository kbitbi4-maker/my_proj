/**
 * Модуль сетевого взаимодействия с Google Apps Script и контроля онлайн-статуса
 */
window.Network = {
  /**
   * Инициализация слушателей сети
   */
  init() {
    window.addEventListener('online', () => this.handleNetworkChange());
    window.addEventListener('offline', () => this.handleNetworkChange());
    this.updateIndicator();
  },

  /**
   * Пошаговая отправка накопленных офлайн-записей со статусом 'wait'
   */
  async sendUnsynced() {
    if (!navigator.onLine) return;
    const state = AppConfig.state;

    for (let i = 0; i < state.qrLogs.length; i++) {
      if (state.qrLogs[i].status === 'wait') {
        state.qrLogs[i].status = 'syncing'; 
        try {
          await fetch(AppConfig.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ row: state.qrLogs[i].data })
          });
          state.qrLogs[i].status = 'ok';
          AppConfig.saveToStorage('logs');
          UI.renderLogs();
        } catch (e) {
          state.qrLogs[i].status = 'wait'; 
          AppConfig.saveToStorage('logs');
          break; // Прерываем цикл при сетевой ошибке
        }
      }
    }
  },

  /**
   * Полная двусторонняя синхронизация остатков и логов из облака
   */
  async syncFromGoogle() {
    if (!navigator.onLine) { alert("Нет подключения к интернету"); return; }
    try {
      const res = await fetch(AppConfig.SCRIPT_URL);
      const data = await res.json();
      const state = AppConfig.state;
      
      if (data.logs) {
        state.qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
        AppConfig.saveToStorage('logs');
      }
      if (data.stock) {
        state.inventoryData = data.stock;
        AppConfig.saveToStorage('inventory');
      }
      UI.renderLogs();
      alert("Данные успешно синхронизированы!");
    } catch (e) { 
      alert("Ошибка синхронизации данных"); 
    }
  },

  /**
   * Обновление визуального индикатора сети в шапке приложения
   */
  updateIndicator() {
    const indicator = document.getElementById('indicator');
    if (indicator) {
      indicator.classList.toggle('net-online', navigator.onLine);
    }
  },

  /**
   * Обработчик восстановления сети: обновляет иконку и запускает выгрузку
   */
  handleNetworkChange() {
    this.updateIndicator();
    if (navigator.onLine) {
      this.sendUnsynced();
    }
  }
};

