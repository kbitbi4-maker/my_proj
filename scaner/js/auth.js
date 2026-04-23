// auth.js

// 1. Твои данные (коды)
const STAFF_AUTH = {
    "Неугодников": "03ac674216f3e15c611c391ad522185821c5b05612491ad081846c9411690111", 
    "Петров": "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f"
};

// 2. Глобальная переменная
let authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

// 3. Хеширование
async function getHash(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Важно: каждый байт должен быть строго 2 символа (padStart)
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


// 4. Функция входа
async function login() {
    const name = document.getElementById('auth-user-select').value;
    const pin = document.getElementById('auth-pin-input').value;

    if (!name || !pin) return alert("Выберите имя и введите PIN");

    const hashed = await getHash(pin);
    if (STAFF_AUTH[name] === hashed) {
        authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(authUser));
        document.getElementById('auth-overlay').style.display = 'none';
    } else {
        alert("НЕВЕРНЫЙ PIN");
        document.getElementById('auth-pin-input').value = "";
    }
}

// 5. САМОЗАПУСК (Проверка при загрузке)
(function() {
    const overlay = document.getElementById('auth-overlay');
    if (authUser) {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'flex'; // Меняем none на flex
    }
})();
