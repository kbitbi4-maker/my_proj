// Переменная для хранения элемента индикатора
let indicator = null;

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    indicator = document.getElementById('indicator');
    updateStatus(); // Проверяем статус сразу при старте
});

// Функция обновления визуального статуса сети
function updateStatus() {
    if (!indicator) return;
    
    if (navigator.onLine) {
        indicator.classList.add('net-online');
    } else {
        indicator.classList.remove('net-online');
    }
}

// Слушатели глобальных событий изменения состояния сети
window.addEventListener('online', () => {
    updateStatus();
    // Сюда в будущем добавим триггер автоматической выгрузки логов
});

window.addEventListener('offline', updateStatus);

