/**
 * Модуль управления цифровой панелью (Нумпад) и вводом данных
 */
window.Numpad = {
  /**
   * Открытие нумпада для ввода количества под конкретный QR-код
   * @param {boolean} isPreFound - Был ли товар выбран из таблицы остатков вручную
   */
  open(isPreFound = false) {
    const state = AppConfig.state;

    // Если данные пришли с камеры, парсим глобальный window.currentQR по разделителю '!'
    if (!isPreFound) {
      const qrParts = window.currentQR.split('!');
      // Берем строго 1-й элемент (индекс 0) и 2-й элемент (индекс 1)
      const qrArt = qrParts && qrParts[0] ? qrParts[0].trim() : ""; 
      const qrParam = qrParts && qrParts[1] ? qrParts[1].trim() : ""; 

      // Находим строку в базе по совпадению первых двух колонок (индексы 0 i 1)
      state.foundRowRef = state.inventoryData.find(r => 
        r && String(r[0]).trim() === qrArt && String(r[1]).trim() === qrParam
      );
    }

    // Получаем текущий остаток из 5-го столбца найденного массива (индекс 4)
    const stockText = state.foundRowRef ? ` (Ост: ${state.foundRowRef[4] || '0'})` : " (Ост: ?)";

    // Сброс вводимых значений в состоянии перед вводом количества
    state.currentQty = "0"; 
    state.currentUser = "Не указан";

    // Формируем отображение названия товара на экране нумпада
    let displayTitle = "";
    if (isPreFound && state.foundRowRef) {
      displayTitle = `${state.foundRowRef[0]} | ${state.foundRowRef[2]}`;
    } else {
      displayTitle = state.foundRowRef ? `${state.foundRowRef[0]} | ${state.foundRowRef[2]}` : window.currentQR;
    }

    document.getElementById('qr-data-display').innerText = "ТОВАР: " + displayTitle + stockText;
    document.getElementById('numpad-display').innerText = "0";
    document.getElementById('who-label').innerText = "...";
    
    this.updateAddButton();
    UI.toggleViews('numpad-view');
  },

  /**
   * Обработка нажатий на кнопки цифр и сброса
   */
  press(n) {
    const state = AppConfig.state;
    if (n === 'C') {
      state.currentQty = "0";
    } else {
      state.currentQty = state.currentQty === "0" ? String(n) : state.currentQty + n;
    }
    document.getElementById('numpad-display').innerText = state.currentQty;
    this.updateAddButton();
  },

  /**
   * Выбор конечного получателя товара из меню сотрудников
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
