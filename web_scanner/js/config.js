/**
 * Глобальная конфигурация и реактивное состояние приложения
 */
window.AppConfig = {
  // Настройки сетевого шлюза Google Apps Script
  SCRIPT_URL: 'https://google.com',
  
  // База данных персонала и доступов (ПИН-коды)
  STAFF: { 
    "Неугодников": "1234", 
    "Петров": "5555" 
  },

  // Список сотрудников для меню выдачи "КОМУ"
  RECIPIENTS: [
    "Головин", "Иванов", "Мытин", "Погорелов", 
    "Гуляев", "Бывальцев", "Божков"
  ],

  // Динамическое состояние (State) приложения
  state: {
    scanning: false,         // Активен ли стрим камеры
    isSaving: false,         // Флаг блокировки повторных сохранений
    currentQR: "",           // Данные текущего отсканированного QR
    currentQty: "0",         // Текстовое значение набранного количества
    currentUser: "Не указан",// Выбранный получатель груза
    
    // Реактивные кэши данных в оперативной памяти
    qrLogs: JSON.parse(localStorage.getItem('qr_db_v9')) || [],
    inventoryData: JSON.parse(localStorage.getItem('qr_inventory_v2')) || []
  },

  /**
   * Синхронизирует локальное состояние массивов с хранилищем LocalStorage
   * @param {string} key - Ключ хранилища ('logs' или 'inventory')
   */
  saveToStorage(key) {
    if (key === 'logs') {
      localStorage.setItem('qr_db_v9', JSON.stringify(this.state.qrLogs));
    }
    if (key === 'inventory') {
      localStorage.setItem('qr_inventory_v2', JSON.stringify(this.state.inventoryData));
    }
  }
};

