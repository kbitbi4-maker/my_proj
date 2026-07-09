/**
 * Модуль управления стримом камеры и интеграции с jsQR (Полное восстановление оригинального алгоритма)
 */
window.Camera = {
  stream: null,
  canvas: null,
  context: null,

  /**
   * Точка входа для кнопки "Найти QR"
   */
  toggle() {
    if (AppConfig.state.scanning) { 
      this.stop(); 
    } else { 
      this.start(); 
    }
  },

  /**
   * Запуск видеопотока
   */
  async start() {
    if (AppConfig.state.scanning) return;
    
    // Явно находим элемент видео в DOM-дереве
    const videoElement = document.getElementById('video');
    const sBtn = document.getElementById('start-camera');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoElement) {
        videoElement.srcObject = this.stream;
      }
      
      AppConfig.state.scanning = true;
      if (sBtn) {
        sBtn.innerText = "ВЫКЛ КАМЕРУ";
        sBtn.disabled = false;
      }
      
      // Запускаем оригинальный покадровый цикл
      requestAnimationFrame(() => this.tick());
    } catch (e) { 
      alert("Ошибка камеры"); 
    }
  },

  /**
   * Остановка камеры
   */
  stop() {
    AppConfig.state.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    const videoElement = document.getElementById('video');
    const sBtn = document.getElementById('start-camera');
    
    if (videoElement) videoElement.srcObject = null;
    if (sBtn) {
      sBtn.innerText = "Найти QR";
      sBtn.disabled = false;
    }
  },

  /**
   * Оригинальный покадровый анализ кадра
   */
  tick() {
    // Находим видео заново внутри кадра анимации для гарантированного доступа
    const videoElement = document.getElementById('video');
    
    if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && AppConfig.state.scanning) {
      if (!this.canvas) { 
        this.canvas = document.createElement('canvas'); 
        this.context = this.canvas.getContext('2d'); 
      }
      
      this.canvas.width = videoElement.videoWidth; 
      this.canvas.height = videoElement.videoHeight;
      this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      
      // Вызываем подключенную библиотеку jsQR через переданный массив пикселей холста
      const code = jsQR(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data, this.canvas.width, this.canvas.height);
      
      if (code) { 
        // Привязываем результат к нашему общему глобальному состоянию
        AppConfig.state.currentQR = code.data; 
        this.stop(); 
        
        // Передаем управление модулю нумпада (флаг false - данные пришли с камеры)
        Numpad.open(false); 
        return; 
      }
    }
    
    // Если сканирование продолжается и код не найден - запрашиваем следующий кадр
    if (AppConfig.state.scanning) {
      requestAnimationFrame(() => this.tick());
    }
  }
};
