/**
 * Модуль управления цифровой панелью (Нумпад) и вводом данных
 */
window.Numpad = {
  /**
   * Открытие нумпада для ввода количества под конкретный QR-код
   */
  open() {
    const state = AppConfig.state;
    // Разделяем данные QR-кода по новому разделителю '!'
    const qrParts = state.currentQR.split('!');
    const qrArt = qrParts[0] || ""; 
    const qrParam = qrParts[1] || ""; 

    // Находим строку ОДИН раз и сохраняем ссылку в состояние
    state.foundRowRef = state.inventoryData.find(r => 
      String(r[0]) === String(qrArt) && String(r[1]) === String(qrParam)
    );

    // Берем остаток из сохраненной ссылки (5-я колонка, индекс 4)
    const stockText = state.foundRowRef ? ` (Ост: ${state.foundRowRef[4] || '0'})` : " (Ост: ?)";

    // Инициализация стартовых значений в состоянии
    state.currentQty = "0"; 
    state.currentUser = "Не указан";

    // Обновление интерфейса
    document.getElementById('qr-data-display').innerText = "ТОВАР: " + state.currentQR + stockText;
    document.getElementById('numpad-display').innerText = "0";
    document.getElementById('who-label').innerText = "...";
    
    this.updateAddButton();
    UI.toggleViews('numpad-view');
  },

  /**
   * Обработка нажатий на кнопки цифр и сброса
   * @param {number|string} n - Цифра от 0 до 9 или символ 'C'
   */
  press(n) {
    const state = AppConfig.state;
    if (n === 'C') {
      state.currentQty = "0";
    } else {
      // Защита от ведущих нулей (избегаем "012", превращая в "12")
      state.currentQty = state.currentQty === "0" ? String(n) : state.currentQty + n;
    }
    document.getElementById('numpad-display').innerText = state.currentQty;
    this.updateAddButton();
  },

  /**
   * Выбор конечного получателя товара из меню сотрудников
   * @param {string} name - Имя сотрудника
   */
  selectUser(name) {
    AppConfig.state.currentUser = name;
    document.getElementById('who-label').innerText = name;
    this.updateAddButton();
    UI.closeUserMenu();
  },

  /**
   * Синхронизация текста главной кнопки добавления с текущим состоянием
   */
  updateAddButton() {
    const state = AppConfig.state;
    const btn = document.getElementById('add-btn');
    if (btn) {
      btn.innerText = `ДОБАВИТЬ ${state.currentQty} (${state.currentUser})`;
    }
  }
};
