// auth.js
(function() {
    const STAFF = { "Неугодников": "1234", "Петров": "5555" };
    
    // Глобальная переменная для доступа из других файлов (window.authUser)
    window.authUser = JSON.parse(localStorage.getItem('qr_auth_user')) || null;

    // Функция инициализации логики
    function initAuth() {
        const overlay = document.getElementById('auth-overlay');
        const btn = document.getElementById('auth-submit-btn');
        const nameSelect = document.getElementById('auth-user-select');
        const pinInput = document.getElementById('auth-pin-input');

        if (!btn) return; // Если элементов еще нет, выходим

        function runLogin() {
            const name = nameSelect.value;
            const pin = pinInput.value.trim();

            if (STAFF[name] === pin) {
                window.authUser = name;
                localStorage.setItem('qr_auth_user', JSON.stringify(name));
                overlay.style.display = 'none';
                alert("Привет, " + name);
            } else {
                alert("Неверный ПИН");
                pinInput.value = "";
            }
        }

        // Привязываем события
        btn.addEventListener('click', runLogin);
        
        // Для мгновенной реакции на смартфонах
        btn.addEventListener('touchend', function(e) {
            if (pinInput.value.length >= 4) {
                e.preventDefault();
                runLogin();
            }
        });

        // Проверка текущего статуса
        if (window.authUser && STAFF[window.authUser]) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
        }
    }

    // Запускаем, когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();
