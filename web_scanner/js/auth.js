/**
 * Модуль авторизации и контроля сессии пользователя
 */
window.Auth = {
  // Имя текущего авторизованного администратора склада
  user: JSON.parse(localStorage.getItem('qr_auth_user')) || null,

  /**
   * Инициализация модуля: отрисовка списка и проверка текущей сессии
   */
  init() {
    const overlay = document.getElementById('auth-overlay');
    const select = document.getElementById('auth-user-select');
    const btn = document.getElementById('auth-submit-btn');

    if (!overlay || !select || !btn) return;

    // Динамически заполняем выпадающий список администраторов из Config
    select.innerHTML = '<option value="">Кто вы?</option>' + 
      Object.keys(AppConfig.STAFF).map(name => `<option value="${name}">${name}</option>`).join('');

    // Привязка клика и тач-события для мобильных устройств
    btn.onclick = () => this.login();
    btn.ontouchend = (e) => {
      if (document.getElementById('auth-pin-input').value.length >= 4) {
        e.preventDefault();
        this.login();
      }
    };

    // Если пользователь уже авторизован — скрываем окно, иначе — блокируем экран
    if (this.user && AppConfig.STAFF[this.user]) {
      overlay.classList.add('hidden');
    } else {
      overlay.classList.remove('hidden');
    }
  },

  /**
   * Проверка введенных данных и выполнение входа
   */
  login() {
    const name = document.getElementById('auth-user-select').value;
    const pin = document.getElementById('auth-pin-input').value.trim();
    const overlay = document.getElementById('auth-overlay');

    if (AppConfig.STAFF[name] === pin) {
      this.user = name;
      localStorage.setItem('qr_auth_user', JSON.stringify(name));
      overlay.classList.add('hidden');
      alert("Привет, " + name);
    } else {
      alert("Неверный ПИН-код");
      document.getElementById('auth-pin-input').value = "";
    }
  }
};

