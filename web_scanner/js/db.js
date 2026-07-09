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
      
      if (!state.foundRowRef) {
        alert("Ошибка: Товар не сопоставлен с базой остатков. Списание невозможно.");
        state.isSaving = false;
        return;
      }

      // Нахождение инкрементального ID лога
      const nextId = state.qrLogs.length > 1 
        ? Math.max(...state.qrLogs.filter(r => r.status === 'ok' || !isNaN(r.data)).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      // КОПИРУЕМ ЧИСТЫЕ ЯЧЕЙКИ ИЗ БАЗЫ ОСТАТКОВ: Артикул (0), Параметр (1), Название (2), Размер (3)
      const qrArt = state.foundRowRef[0];
      const qrParam = state.foundRowRef[1];
      const qrName = state.foundRowRef[2];
      const qrSize = state.foundRowRef[3] || "";

      // Формируем финальный массив для архива (12 колонок Excel-вида)
      const newRowData = [
        nextId, qrArt, qrParam, qrName, qrSize, 
        state.currentQty, state.currentUser, Auth.user || "Неугодников", 
        timestamp.time, timestamp.day, timestamp.month, timestamp.year
      ];

      // Офлайн-вычитание количества прямо из ячейки остатка (индекс 4)
      const qty = parseInt(state.currentQty) || 0;
      state.foundRowRef[4] = (parseInt(state.foundRowRef[4]) || 0) - qty;

      // Фиксация изменений в кэше устройства
      AppConfig.saveToStorage('inventory');
      state.qrLogs.push({ data: newRowData, status: 'wait' });
      AppConfig.saveToStorage('logs');   
      
      // Сброс интерфейса и инициализация POST-отправки
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
