/**
 * Глобальная конфигурация и реактивное состояние приложения
 */
window.AppConfig = {
  // Автоматически подтягиваем секретную ссылку из внешнего файла env.js
  SCRIPT_URL: (window.AppEnv && window.AppEnv.SCRIPT_URL) || 'https://google.com',
  
  // База данных персонала и доступов (ПИН-коды) с исправленным синтаксисом (запятые на месте)
  STAFF: { 
    "Неугодникова": "1234", 
    "Окороков": "5555",
    "Глушков": "5555",
    "Гуляев": "5555"
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
    currentQR: "",           // Текст из QR-кода (используется только при сканировании)
    currentQty: "0",         // Текстовое значение набранного количества
    currentUser: "Не указан",// Выбранный получатель груза
    foundRowRef: null,       // Ссылка на чистый массив ячеек товара из базы остатков [Артикул, Параметр, Название, Размер, Остаток]
    
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
 
