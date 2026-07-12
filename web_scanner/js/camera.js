let stream = null;

/**
 * Включение/выключение камеры через кнопку в хедере
 */
function toggleCamera() {
  const video = document.getElementById("video");
  const btn = document.getElementById("start-camera");
  if (!video) return;

  if (stream) {
    stopCamera();
    if (btn) btn.innerText = "Найти QR";
  } else {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        stream = s;
        video.srcObject = stream;
        if (btn) btn.innerText = "Стоп Камера";
        requestAnimationFrame(tick);
      })
      .catch(err => {
        alert("Не удалось включить камеру: " + err);
      });
  }
}

/**
 * Остановка видеопотока
 */
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  const video = document.getElementById("video");
  if (video) video.srcObject = null;
}

/**
 * Постоянный анализ кадров с камеры с помощью jsQR
 */
function tick() {
  const video = document.getElementById("video");
  if (!stream || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
    if (stream) requestAnimationFrame(tick);
    return;
  }

  // Создаем виртуальный холст для считывания картинки
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });

  if (code && code.data) {
    // QR-код успешно считан, останавливаем камеру и отправляем данные на обработку
    stopCamera();
    const btn = document.getElementById("start-camera");
    if (btn) btn.innerText = "Найти QR";
    
    handleQRCode(code.data);
  } else {
    requestAnimationFrame(tick);
  }
}

/**
 * ФУНКЦИОНАЛ СКАНЕРА С РАЗДЕЛИТЕЛЕМ "!"
 * Принимает сырую строку из QR-кода, делит её и запускает нумпад
 */
function handleQRCode(rawData) {
  if (!rawData) return;

  // Разделяем строку из QR-кода по знаку "!"
  const parts = rawData.split("!");
  const scannedArt = parts[0] ? parts[0].trim() : "";
  const scannedParam = parts[1] ? parts[1].trim() : "";

  if (!scannedArt) {
    alert("Ошибка: В QR-коде не найден артикул.");
    return;
  }

  // Записываем распознанные данные в глобальные переменные для save.js
  window.currentScannedArt = scannedArt;
  window.currentScannedParam = scannedParam;

  // Обновляем текстовую плашку в нумпаде, чтобы пользователь видел, какой товар выбран
  const displayBadge = document.getElementById("qr-data-display");
  if (displayBadge) {
    displayBadge.innerText = `Арт: ${scannedArt} | Парам: ${scannedParam || "нет"}`;
  }

  // Открываем подэкран нумпада (Экран 2) внутри вашего единого модального окна
  const modal = document.getElementById("modal");
  const numpadView = document.getElementById("numpad-view");
  const stockView = document.getElementById("stock-view");
  const userView = document.getElementById("user-view");
  const numDisplay = document.getElementById("numDisplay");

  if (modal) modal.classList.remove("hidden");
  if (numpadView) numpadView.classList.remove("hidden");
  if (stockView) stockView.classList.add("hidden");
  if (userView) userView.classList.add("hidden");
  
  // Сбрасываем дисплей ввода количества на ноль
  if (numDisplay) numDisplay.innerText = "0";
}
