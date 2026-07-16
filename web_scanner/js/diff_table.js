// js/diff_table.js — Модуль управления интерактивной таблицей отличий Листа 4

window.diffFilterColor = "all"; 

function showDiffTable() {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ', чтобы рассчитать разницу остатков.");
    return;
  }
  
  const head = document.getElementById('diff-head');
  if (!head) return;
  if (document.getElementById('diff-search')) document.getElementById('diff-search').value = "";
  window.diffFilterColor = "all";

  head.innerHTML = diffMatrix[0].map((h, idx) => {
    return `<th onclick="openDiffFilterMenu(event, ${idx})" style="cursor: pointer; position: relative;">${h} ▾</th>`;
  }).join('');

  renderDiffTableBody();
  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
}

function renderDiffTableBody() {
  const body = document.getElementById('diff-body');
  if (!body) return;
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) return;

  const searchInput = document.getElementById('diff-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  let rowsData = diffMatrix.slice(1);

  if (term !== "") {
    rowsData = rowsData.filter(row => {
      return row.some(cell => String(cell).toLowerCase().includes(term));
    });
  }

  if (window.diffFilterColor !== "all") {
    rowsData = rowsData.filter(row => {
      const lastCell = String(row[row.length - 1] || '').trim();
      if (window.diffFilterColor === "green") return lastCell.indexOf('+') === 0;
      if (window.diffFilterColor === "red") return lastCell.indexOf('-') === 0;
      if (window.diffFilterColor === "none") return (lastCell.indexOf('+') !== 0 && lastCell.indexOf('-') !== 0);
      return true;
    });
  }

  if (rowsData.length === 0) {
    body.innerHTML = '<tr><td colspan="6">Совпадений или расхождений не найдено</td></tr>';
    return;
  }

  body.innerHTML = rowsData.map(row => {
    if (!row) return '';
    const lastCell = String(row[row.length - 1] || '').trim();
    let bgStyle = '';
    if (lastCell.indexOf('-') === 0) bgStyle = 'style="background: #fee2e2;"'; 
    else if (lastCell.indexOf('+') === 0) bgStyle = 'style="background: #dcfce7;"'; 

    return `<tr ${bgStyle}>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');
}

function openDiffFilterMenu(event, colIndex) {
  event.stopPropagation();
  const popover = document.getElementById('filter-popover-menu');
  if (!popover) return;
  popover.style.top = `${event.clientY + window.scrollY + 10}px`;
  popover.style.left = `${Math.min(event.clientX, window.innerWidth - 200)}px`;
  popover.innerHTML = `
    <button onclick="sortDiffByColumn(${colIndex}, 'asc')">🔤 Сортировка (А → Я)</button>
    <button onclick="sortDiffByColumn(${colIndex}, 'desc')">🔤 Сортировка (Я → А)</button>
    <div style="border-top: 1px solid #e2e8f0; margin: 4px 0;"></div>
    <button class="color-opt-green" onclick="filterDiffByColor('green')">🟢 Только Профицит (+)</button>
    <button class="color-opt-red" onclick="filterDiffByColor('red')">🔴 Только Дефицит (-)</button>
    <button class="color-opt-none" onclick="filterDiffByColor('all')">⚪ Сбросить все фильтры</button>
  `;
  popover.classList.remove('hidden');
  const closeMenuHandler = () => { popover.classList.add('hidden'); document.removeEventListener('click', closeMenuHandler); };
  setTimeout(() => document.addEventListener('click', closeMenuHandler), 50);
}

function sortDiffByColumn(colIndex, direction) {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) return;
  const header = diffMatrix[0];
  let dataRows = diffMatrix.slice(1);
  dataRows.sort((rowA, rowB) => {
    let valA = String(rowA[colIndex] || '').toLowerCase().trim();
    let valB = String(rowB[colIndex] || '').toLowerCase().trim();
    const numA = parseFloat(valA.replace(/[+]/g, ''));
    const numB = parseFloat(valB.replace(/[+]/g, ''));
    if (!isNaN(numA) && !isNaN(numB)) return direction === 'asc' ? numA - numB : numB - numA;
    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
  window.diffData = [header, ...dataRows];
  renderDiffTableBody();
}

function filterDiffByColor(colorType) { window.diffFilterColor = colorType; renderDiffTableBody(); }
