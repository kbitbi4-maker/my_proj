/**
 * Модуль локальной базы данных, калькуляции ID и списания остатков
 */
window.DB = {
  /**
   * Сохранение новой записи в локальный лог и пересчет остатков
   */
  async saveEntry() {
    const state = AppConfig.state;
    if (state.isSaving) return; 
    state.isSaving = true;

    try {
      const timestamp = this.generateDateTime();
      // Нарезаем QR-код по новому разделителю '!'
      const qrParts = state.currentQR.split('!');
      
      // Вычисление инкрементального ID для записи
      const nextId = state.qrLogs.length > 1 
        ? Math.max(...state.qrLogs.filter(r => r.status === 'ok' || !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      // Структура строки для лога: ID, части QR, Количество, Получатель, Администратор, Время, День, Месяц, Год
      const newRowData = [
        nextId, ...qrParts, state.currentQty, state.currentUser, 
        Auth.user || "Неугодников", timestamp.time, timestamp.day, timestamp.month, timestamp.year
      ];

      // БЕЗ ПОВТОРНОГО ПОИСКА: Списываем остаток напрямую по ссылке, если товар был найден
      if (state.foundRowRef) {
        const qty = parseInt(state.currentQty) || 0;
        state.foundRowRef[4] = (parseInt(state.foundRowRef[4]) || 0) - qty;
      }

      // Фиксация изменений в кэше и хранилище
      AppConfig.saveToStorage('inventory');
      state.qrLogs.push({ data: newRowData, status: 'wait' });
      AppConfig.saveToStorage('logs');   
      
      // Сброс окон и триггер отправки в облако
      UI.renderLogs(); 
      UI.closeModal();
      state.isSaving = false; 
      
      Network.sendUnsynced(); 
    } catch (e) { 
      console.error(e); 
      state.isSaving = false; 
    }
  },

  /**
   * Вспомогательный метод генерации форматированной даты и времени
   * @returns {Object} Объект с компонентами даты и времени
   */
  generateDateTime() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return {
      time: "'" + hh + ":" + mm,
      day: now.getDate().toString().padStart(2, '0'),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString().slice(-2)
    };
  }
};
