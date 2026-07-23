// ================================================================
// balance.js — ТАБЛИЦА ОТЛИЧИЙ И УПРАВЛЕНИЕ САЛЬДО (обёртка)
// Версия 2.8
// ================================================================

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

// Функция для рендеринга таблицы отличий
function renderDiffTable() {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    const body = document.getElementById('diff-body');
    if (body) body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Таблица отличий пуста</td></tr>';
    return;
  }

  // Проверяем, зарегистрирована ли таблица
  if (!EXCEL_ENGINE.tables['diff']) {
    excelRegisterTable('diff', {
      data: diffMatrix,
      colCount: 6,
      containerId: 'diff',
      searchInputId: 'diff-search',
      title: 'Таблица отличий',
      rowColors: {
        '#dcfce7': function(row) { return String(row[4] || '').indexOf('+') === 0; },
        '#fee2e2': function(row) { return String(row[4] || '').indexOf('-') === 0; }
      },
      // в таблице отличий не нужно редактирование, только выделение и копирование
      editMode: false,
      allowSelectionInView: true,
    });
  }
  excelUpdateData('diff', diffMatrix);
}

function showDiffTable() {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    alert('Таблица отличий пуста. Сначала выполните операцию "СРАВНИТЬ".');
    return;
  }
  renderDiffTable();
  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
}

function renderDiffTableBody() {
  renderDiffTable();
}

// Функции для сальдо (импорт, сравнение) остаются без изменений
// ...

console.log('✅ balance.js загружен');
