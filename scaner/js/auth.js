// auth.js - Логика авторизации МОЛ

// 1. Список сотрудников и их ПИН-коды (прямое сравнение для работы оффлайн и без HTTPS)
const STAFF_AUTH = {
    "Неугодников": "1234",
    "Петров": "5555"
};

// 2. Инициализация переменной сессии (глобальная для доступа из других JS)
window.authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

/**
 * Функция входа
 * Привязана к window, чтобы HTML-кнопка её гарантированно видела
 */
window.login = function() {
    const nameSelect = document.getElementById('auth-user-select');
    const pinInput = document.getElementById('auth-pin-input');
    const overlay = document.getElementById('auth-overlay');

    if (!nameSelect || !pinInput) {
        console.error("Элементы авторизации не найдены в HTML");
        return;
    }

    const name = nameSelect.value;
    const pin = pinInput.value.trim();

    if (!name) {
        alert("Выберите сотрудника!");
        return;
    }
    if (!pin) {
        alert("Введите PIN!");
        return;
    }

    // Простая проверка совпадения
    if (STAFF_AUTH[name] === pin) {
        window.authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(window.authUser));
        
        // Прямое скрытие окна
        overlay.style.display = 'none';
        pinInput.value = "";
        
        alert("Доступ разрешен: " + name);
    } else {
        alert("НЕВЕРНЫЙ ПИН-КОД");
        pinInput.value = "";
    }
};

/**
 * Функция выхода (для смены оператора)
 */
window.logout = function() {
    localStorage.removeItem('qr_auth_user');
    window.location.reload();
};

/**
 * Проверка авторизации при загрузке страницы
 */
function checkAuthStatus() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;

    if (window.authUser && STAFF_AUTH[window.authUser]) {
        // Если уже авторизован — скрываем экран
        overlay.style.display = 'none';
    } else {
        // Если нет — показываем экран и сбрасываем мусор в памяти
        overlay.style.display = 'flex';
        localStorage.removeItem('qr_auth_user');
    }
}

// Запуск проверки сразу после того, как DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthStatus);
} else {
    checkAuthStatus();
}
