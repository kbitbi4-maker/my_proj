// auth.js
const STAFF_AUTH = {
    "Неугодников": "1234", 
    "Петров": "5555"
};

let authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

function login() {
    const name = document.getElementById('auth-user-select').value;
    const pin = document.getElementById('auth-pin-input').value;

    if (STAFF_AUTH[name] === pin) {
        authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(authUser));
        document.getElementById('auth-overlay').style.display = 'none';
        alert("Вход выполнен: " + name);
    } else {
        alert("Неверный ПИН-код");
        document.getElementById('auth-pin-input').value = "";
    }
}

// Эта функция СРАЗУ проверяет авторизацию
(function() {
    const overlay = document.getElementById('auth-overlay');
    // Если в памяти уже есть имя, скрываем окно, иначе — показываем
    if (authUser && STAFF_AUTH[authUser]) {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'flex';
        localStorage.removeItem('qr_auth_user'); // Сброс, если данные устарели
    }
})();
