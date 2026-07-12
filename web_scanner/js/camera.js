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
    stopCamera();
    const btn = document.getElementById("start-camera");
    if (btn) btn.innerText = "Найти QR";
    
    handleQRCode(code.data);
  } else {
    requestAnimationFrame(tick);
  }
}

/**
 * ОПЕРАЦИЯ СКАНЕРА: Разделение по "!" и обязательная ПРОВЕРКА ПО БАЗЕ ДАННЫХ
 */
function handleQRCode(rawData) {
  if (!rawData) return;

  // Разделяем строку из QR-кода по знаку "!"
  const parts = rawData.split("!");
  const scannedArt = parts[0] ? parts[0].trim() : "";
  const scannedParam = parts[1] ? parts[1].trim() : "";

  if (!scannedArt) {
    alert("Ошибка: В QR-коде не распознан артикул.");
    return;
  }

  // Считываем текущую базу данных остатков из глобального кэша приложения
  const stock = window.cachedStockData || window.stockData || [];
  
  if (!stock || stock.length <= 1) {
    alert("Ошибка: База данных склада пуста. Пожалуйста, выполните синхронизацию (облако).");
    return;
  }

  // ИЩЕМ ТОВАР В БАЗЕ ДАННЫХ ОСТАТКОВ
  let isProductExists = false;
  let matchedRowData = null;

  // Бежим по складу (пропуская шапку под индексом 0)
  for (let i = 1; i < stock.length; i++) {
    const row = stock[i];
    if (!Array.isArray(row)) continue;

    // Предполагаем стандарт: артикул в 1-й колонке (индекс 0), параметр во 2-й (индекс 1)
    const currentArt = String(row[0]).trim();
    const currentParam = String(row[1]).trim();

    if (currentArt === scannedArt && currentParam === scannedParam) {
      isProductExists = true;
      matchedRowData = row; // Сохраняем ссылку на найденную строку склада
      break;
    }
  }

  // Если проверка по базе данных провалилась — блокируем запуск нумпада
  if (!isProductExists) {
    alert(`Товар не найден в базе остатков!\nАртикул: ${scannedArt}\nПараметр: ${scannedParam || "нет"}\nПроверьте справочник.`);
    return;
  }

  // Товар железно найден в базе, фиксируем параметры в глобальный контекст для save.js
  window.currentScannedArt = scannedArt;
  window.currentScannedParam = scannedParam;

  // Выводим информацию о найденном товаре на плашку нумпада
  const displayBadge = document.getElementById("qr-data-display");
  if (displayBadge) {
    displayBadge.innerText = `Арт: ${scannedArt} | Парам: ${scannedParam || "нет"}`;
  }

  // Переключаем экраны единого модального окна на Нумпад (Экран 2)
  const modal = document.getElementById("modal");
  const numpadView = document.getElementById("numpad-view");
  const stockView = document.getElementById("stock-view");
  const userView = document.getElementById("user-view");
  const numDisplay = document.getElementById("numDisplay");

  if (modal) modal.classList.remove("hidden");
  if (numpadView) numpadView.classList.remove("hidden");
  if (stockView) stockView.classList.add("hidden");
  if (userView) userView.classList.add("hidden");
  
  if (numDisplay) numDisplay.innerText = "0";
}
