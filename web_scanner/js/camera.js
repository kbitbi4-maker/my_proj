/**
 * Модуль управления стримом камеры и интеграции с jsQR
 */
window.Camera = {
  stream: null,
  canvas: null,
  context: null,

  /**
   * Переключение состояния камеры (Вкл/Выкл)
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
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (video) video.srcObject = this.stream;
      
      AppConfig.state.scanning = true;
      if (sBtn) sBtn.innerText = "ВЫКЛ КАМЕРУ";
      
      requestAnimationFrame(() => this.tick());
    } catch (e) { 
      alert("Ошибка доступа к камере"); 
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
   * Циклический покадровый анализ изображения с видеопотока
   */
  tick() {
    const video = document.getElementById('video');
    if (!video || !AppConfig.state.scanning) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!this.canvas) { 
        this.canvas = document.createElement('canvas'); 
        this.context = this.canvas.getContext('2d'); 
      }
      
      this.canvas.width = video.videoWidth; 
      this.canvas.height = video.videoHeight;
      this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      
      const imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(imgData.data, this.canvas.width, this.canvas.height);
      
      if (code) { 
        AppConfig.state.currentQR = code.data; 
        this.stop(); 
        Numpad.open(); 
        return; 
      }
    }
    
    if (AppConfig.state.scanning) {
      requestAnimationFrame(() => this.tick());
    }
  }
};

