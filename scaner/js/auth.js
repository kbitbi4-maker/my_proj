// auth.js
const STAFF_AUTH = {
    "Неугодников": "03ac674216f3e15c611c391ad522185821c5b05612491ad081846c9411690111", 
    "Петров": "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f"
};

let authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

async function getHash(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
    const name = document.getElementById('auth-user-select').value;
    const pin = document.getElementById('auth-pin-input').value;
    if (!name || !pin) return alert("Заполните все поля");

    const hashed = await getHash(pin);
    if (STAFF_AUTH[name] === hashed) {
        authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(authUser));
        document.getElementById('auth-overlay').style.display = 'none';
    } else {
        alert("Неверный PIN");
        document.getElementById('auth-pin-input').value = "";
    }
}

// Эта функция должна запускаться строго после загрузки HTML
function checkAuthOnLoad() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return; // Если HTML еще не готов, выходим

    if (!authUser) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// Запуск проверки
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthOnLoad);
} else {
    checkAuthOnLoad();
}
