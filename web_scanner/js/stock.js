// js/stock.js — Модуль журнала остатков целиком

function showStock() {
  const currentData = window.inventoryData;

  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock(); 
}

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  // Правильно: берем именно первую строку (массив заголовков) из inventoryData
  head.innerHTML = currentData[0].map(h => `<th>${h}</th>`).join('');
  
  // Отрисовка строк таблицы по оригинальному индексу
  body.innerHTML = currentData.map((row, index) => {
    if (index === 0) return ''; // Пропускаем заголовок таблицы
    
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") return '';

    return `<tr onclick="selectFromStockDirect(${index})">${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');
  
  if (body.innerHTML.trim() === "") {
    body.innerHTML = '<tr><td colspan="11">Ничего не найдено</td></tr>';
  }
}

function selectFromStockDirect(index) {
  const currentData = window.inventoryData;
  if (!currentData) return;

  // Копируем чистый массив ячеек выбранной строки остатков без использования разделителей
  window.currentSelectedRowData = [...currentData[index]]; 
  
  // Переключаем экраны: скрываем остатки и вызываем форму нумпада
  document.getElementById('stock-view').classList.add('hidden');
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    console.error("Функция openNumpadView не найдена. Убедитесь, что файл js/numpad.js подключен.");
  }
}
