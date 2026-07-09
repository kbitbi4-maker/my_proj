/**
 * Модуль управления стримом камеры и интеграции с jsQR (На базе рабочего оригинала)
 */
window.Camera = {
  stream: null,
  canvas: null,
  context: null,

  /**
   * Точка входа для кнопки "Найти QR" из интерфейса
   */
  toggle() {
    if (AppConfig.state.scanning) { 
      this.stop(); 
    } else { 
      this.start(); 
    }
  },

  /**
   * Запуск видеопотока и инициализация сканера
   */
  async start() {
    if (AppConfig.state.scanning) return;
    const video = document.getElementById('video');
    const sBtn = document.getElementById('start-camera');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (video) video.srcObject = this.stream;
      
      AppConfig.state.scanning = true;
      if (sBtn) {
        sBtn.innerText = "ВЫКЛ КАМЕРУ";
        sBtn.disabled = false;
      }
      
      requestAnimationFrame(() => this.tick());
    } catch (e) { 
      alert("Ошибка камеры"); 
    }
  },

  /**
   * Остановка камеры и освобождение ресурсов устройства
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
   * Покадровый анализ изображения с видеопотока
   */
  tick() {
    const video = document.getElementById('video');
    
    // Проверяем состояние scanning из общего конфига приложения
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && AppConfig.state.scanning) {
      if (!this.canvas) { 
        this.canvas = document.createElement('canvas'); 
        this.context = this.canvas.getContext('2d'); 
      }
      
      this.canvas.width = video.videoWidth; 
      this.canvas.height = video.videoHeight;
      this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      
      const code = jsQR(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data, this.canvas.width, this.canvas.height);
      
      // Если код успешно распознан библиотекой jsQR
      if (code) { 
        AppConfig.state.currentQR = code.data; // Записываем расшифрованный текст в состояние
        this.stop();                          // Гасим камеру через наш метод
        Numpad.open(false);                    // Открываем нумпад (флаг false означает, что данные пришли с камеры)
        return; 
      }
    }
    
    // Если QR еще не найден, продолжаем цикл
    if (AppConfig.state.scanning) {
      requestAnimationFrame(() => this.tick());
    }
  }
};
