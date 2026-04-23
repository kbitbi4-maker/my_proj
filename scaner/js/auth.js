// auth.js
const STAFF_AUTH = {
    "Неугодников": "03ac674216f3e15c611c391ad522185821c5b05612491ad081846c9411690111", // 1234
    "Петров": "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f"      // 5555
};

let authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

async function getHash(str) {
    const msgBuffer = new TextEncoder().encode(String(str).trim()); // Убираем лишние пробелы
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').toLowerCase(); // Принудительно в нижний регистр
}

async function login() {
    const name = document.getElementById('auth-user-select').value;
    const pin = document.getElementById('auth-pin-input').value;
    
    if (!name || !pin) return;

    const hashed = await getHash(pin);
    const expected = STAFF_AUTH[name];

    // Это покажет нам реальную причину
    if (hashed !== expected) {
        console.log("Длина введённого:", hashed.length);
        console.log("Длина ожидаемого:", expected ? expected.length : "0");
        alert("ОШИБКА!\nТвой ПИН выдал: " + hashed.substring(0,10) + "...\nВ базе записано: " + (expected ? expected.substring(0,10) : "пусто") + "...");
    }

    if (hashed === expected) {
        authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(authUser));
        document.getElementById('auth-overlay').style.display = 'none';
    }
}


    const hashed = await getHash(pin);
    const expected = STAFF_AUTH[name] ? STAFF_AUTH[name].trim().toLowerCase() : "";

    console.log("Введено:", pin);
    console.log("Получен хеш:", hashed);
    console.log("Ожидался хеш:", expected);

    if (hashed === expected) {
        authUser = name;
        localStorage.setItem('qr_auth_user', JSON.stringify(authUser));
        document.getElementById('auth-overlay').style.display = 'none';
        pinInput.value = "";
    } else {
        alert("НЕВЕРНЫЙ PIN");
        pinInput.value = "";
    }
}

function checkAuthOnLoad() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.style.display = authUser ? 'none' : 'flex';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthOnLoad);
} else {
    checkAuthOnLoad();
}
