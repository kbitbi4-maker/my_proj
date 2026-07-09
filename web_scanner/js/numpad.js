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

    // Если данные пришли с камеры, парсим строку по разделителю '!'
    if (!isPreFound) {
      const qrParts = state.currentQR.split('!');
      const qrArt = (qrParts[0] || "").trim(); 
      const qrParam = (qrParts[1] || "").trim(); 

      // Ищем строку в базе по совпадению первых двух параметров
      state.foundRowRef = state.inventoryData.find(r => 
        String(r[0]).trim() === qrArt && String(r[1]).trim() === qrParam
      );
    }

    // Получаем текущий остаток из 5-й ячейки найденного массива (индекс 4)
    const stockText = state.foundRowRef ? ` (Ост: ${state.foundRowRef[4] || '0'})` : " (Ост: ?)";

    // Сброс вводимых значений
    state.currentQty = "0"; 
    state.currentUser = "Не указан";

    // Формируем красивое отображение названия на экране нумпада
    let displayTitle = "";
    if (isPreFound && state.foundRowRef) {
      displayTitle = `${state.foundRowRef[0]} | ${state.foundRowRef[2]}`;
    } else {
      displayTitle = state.foundRowRef ? `${state.foundRowRef[0]} | ${state.foundRowRef[2]}` : state.currentQR;
    }

    document.getElementById('qr-data-display').innerText = "ТОВАР: " + displayTitle + stockText;
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
