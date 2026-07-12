let stream = null;
let scanning = false;
let canvas = null;
let context = null;
let currentQR = "";

// Привязываем элементы только после полной загрузки страницы
let video = null;
let sBtn = null;

window.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    sBtn = document.getElementById('start-camera');
});

function toggleCamera() {
    if (scanning) { 
        stopCamera(); 
    } else { 
        startScanner(); 
    }
}

function stopCamera() {
    scanning = false;
    if (stream) { 
        stream.getTracks().forEach(track => track.stop()); 
        stream = null;
    }
    if (video) { video.srcObject = null; }
    if (sBtn) { sBtn.innerText = "Найти QR"; }
}

async function startScanner() {
    if (scanning) return;
    try {
        // Запрашиваем доступ к камере
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (video) { video.srcObject = stream; }
        scanning = true;
        if (sBtn) { sBtn.innerText = "ВЫКЛ КАМЕРУ"; }
        requestAnimationFrame(tick);
    } catch (e) { 
        alert("Ошибка камеры: " + e.message); 
    }
}

function tick() {
    if (!video || !scanning) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvas) { 
            canvas = document.createElement('canvas'); 
            context = canvas.getContext('2d'); 
        }
        
        // Подстраиваем размеры холста под реальное видео
        canvas.width = video.videoWidth; 
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Извлекаем массив пикселей кадра
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Вызываем библиотеку и передаем обязательные параметры: данные, ширину, высоту
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) { 
            currentQR = code.data; 
            stopCamera(); 
            
            // Запуск процесса автоматического поиска товара по QR-коду
            processScannedQR(currentQR);
            return; 
        }
    }
    if (scanning) {
        requestAnimationFrame(tick);
    }
}

// НОВАЯ ФУНКЦИЯ: Поиск товара по двум параметрам из QR и вызов нумпада
function processScannedQR(qrText) {
  // Проверяем, загружена ли база остатков
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) {
    alert("Ошибка: База остатков пуста. Сначала выполните синхронизацию ☁");
    return;
  }

  // Разбиваем текст QR-кода по разделителю "!"
  const parts = qrText.split('!');
  if (parts.length < 2) {
    alert("Ошибка чтения: QR-код должен содержать два параметра, разделенных знаком '!'");
    return;
  }

  // Приводим считанные ячейки к нижнему регистру и обрезаем пробелы для точного сравнения
  const param1 = parts[0].trim().toLowerCase();
  const param2 = parts[1].trim().toLowerCase();

  // Ищем строку в inventoryData (пропуская заголовок с индексом 0)
  let foundIndex = -1;
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    if (row && row.length >= 2) {
      const cell1 = String(row[0]).trim().toLowerCase();
      const cell2 = String(row[1]).trim().toLowerCase();

      // Сравнение по столбцам 1 и 2
      if (cell1 === param1 && cell2 === param2) {
        foundIndex = i;
        break;
      }
    }
  }

  // Если товар успешно найден
  if (foundIndex !== -1) {
    // Копируем чистый массив данных строки, как это делается при ручном выборе
    window.currentSelectedRowData = [...currentData[foundIndex]];

    // Сохраняем исходный артикул и параметр в глобальные переменные для корректной работы save.js
    window.currentScannedArt = currentData[foundIndex][0];
    window.currentScannedParam = currentData[foundIndex][1];

    // Обновляем текстовую плашку над нумпадом, чтобы было видно, какой товар найден
    const displayBadge = document.getElementById("qr-data-display");
    if (displayBadge) {
      displayBadge.innerText = `Арт: ${window.currentScannedArt} | Парам: ${window.currentScannedParam || "нет"}`;
    }

    // Открываем модальное окно и сразу переключаем на экран ввода количества (нумпад)
    if (typeof openNumpadView === 'function') {
      openNumpadView();
    } else {
      console.error("Функция openNumpadView не найдена. Проверьте js/numpad.js");
    }
  } else {
    // Если совпадений не найдено
    alert(`Товар не найден в остатках!\nПараметр 1: ${parts[0]}\nПараметр 2: ${parts[1]}`);
  }
}
