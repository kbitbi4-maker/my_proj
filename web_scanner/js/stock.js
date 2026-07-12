// js/stock.js — Модуль журнала остатков (до 100 строк)

// Хранилище для чистой копии ячеек выбранного товара (без разделителей)
let currentSelectedRowData = [];

function showStock() {
  if (!inventoryData || inventoryData.length === 0) { 
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
  
  if (!inventoryData.length) return;
  
  // Всегда берем заголовок из первой строки массива
  head.innerHTML = inventoryData[0].map(h => `<th>${h}</th>`).join('');
  
  // Отрисовка строк с передачей оригинального индекса массива (избегаем слэшей)
  body.innerHTML = inventoryData.map((row, index) => {
    if (index === 0) return ''; // Пропускаем заголовок
    
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") return '';

    return `<tr onclick="selectFromStockDirect(${index})">${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');
  
  if (body.innerHTML.trim() === "") {
    body.innerHTML = '<tr><td colspan="11">Ничего не найдено</td></tr>';
  }
}

function selectFromStockDirect(index) {
  // Копируем чистый массив ячеек выбранной строки остатков
  currentSelectedRowData = [...inventoryData[index]]; 
  
  // Скрываем остатки и передаем управление модулю нумпада
  document.getElementById('stock-view').classList.add('hidden');
  openNumpadView();
}

