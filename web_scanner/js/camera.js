/**
 * ТЕСТОВЫЙ МОДУЛЬ КАМЕРЫ (Проверка захвата и работы библиотеки jsQR)
 */
window.Camera = {
  stream: null,
  canvas: null,
  context: null,

  /**
   * Переключение состояния камеры по нажатию на кнопку
   */
  toggle() {
    if (AppConfig.state.scanning) { 
      this.stop(); 
    } else { 
      this.start(); 
    }
  },

  /**
   * Запуск видеопотока с задней камеры устройства
   */
  async start() {
    if (AppConfig.state.scanning) return;
    const video = document.getElementById('video');
    const sBtn = document.getElementById('start-camera');

    try {
      // Запрашиваем доступ к камере устройства
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (video) video.srcObject = this.stream;
      
      AppConfig.state.scanning = true;
      if (sBtn) {
        sBtn.innerText = "ВЫКЛ КАМЕРУ";
        sBtn.disabled = false;
      }
      
      // Запускаем непрерывный цикл сканирования кадров
      requestAnimationFrame(() => this.tick());
    } catch (e) { 
      alert("Тест провален: Ошибка доступа к камере устройств"); 
    }
  },

  /**
   * Отключение камеры и освобождение ресурсов
   */
  stop() {
    AppConfig.state.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    const video = document.getElementById('video');
    const sBtn = document.getElementById('start-camera');
    
    if (video) video.srcObject = null;
    if (sBtn) {
      sBtn.innerText = "Найти QR";
      sBtn.disabled = false;
    }
  },

  /**
   * Покадровый анализ изображения
   */
  tick() {
    const video = document.getElementById('video');
    
    // Проверяем, что видео готово и флаг сканирования активен
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && AppConfig.state.scanning) {
      if (!this.canvas) { 
        this.canvas = document.createElement('canvas'); 
        this.context = this.canvas.getContext('2d'); 
      }
      
      // Рисуем текущий кадр видео на скрытый холст
      this.canvas.width = video.videoWidth; 
      this.canvas.height = video.videoHeight;
      this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Считываем пиксели и передаем их в библиотеку jsQR
      const code = jsQR(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data, this.canvas.width, this.canvas.height);
      
      // ЕСЛИ КОД НАЙДЕН — ПОКАЗЫВАЕМ ДИАЛОГОВОЕ ОКНО И ОСТАНАВЛИВАЕМСЯ
      if (code) { 
        this.stop(); // Гасим камеру
        
        // ВЫВОДИМ РАСШИФРОВКУ НА ЭКРАН ДЛЯ ПРОВЕРКИ
        alert("УСПЕХ!\nРасшифрованный QR-код:\n" + code.data);
        
        return; 
      }
    }
    
    // Если код не найден, продолжаем сканировать следующий кадр
    if (AppConfig.state.scanning) {
      requestAnimationFrame(() => this.tick());
    }
  }
};
