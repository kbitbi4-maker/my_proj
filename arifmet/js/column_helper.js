// version: v1.1 - Fixed Cell Mapping, Carry Alignment and Fixed Tags
import { state } from './state.js';
import { refreshUI } from './numpad.js';

if (!window.changeCarry) {
 window.changeCarry = (exIdx, carryIdx, delta) => {
  const item = state.examplesHistory[exIdx];
  if (!item || !item.userCarries) return;
  let val = item.userCarries[carryIdx] + delta;
  item.userCarries[carryIdx] = val < 0 ? 9 : (val > 9 ? 0 : val);
  refreshUI();
 };
}

export function buildColumnTable(item, index, op, finText, ansClass) {
 const nums = item.exampleText.split(op);
 const n1 = nums[0], n2 = nums[1];
 // Добавляем +1 к разрядам для потенциального перехода в тысячи (например, 900+200)
 const maxDigits = Math.max(n1.length, n2.length, String(item.correctValue).length);
 const totalCols = maxDigits + 1;

 if (!item.userCarries) item.userCarries = Array(totalCols).fill(0);

 const padNum1 = n1.padStart(totalCols, ' ').split('');
 const padNum2 = n2.padStart(totalCols, ' ').split('');
 
 // Массив ячеек ответа: заполняем прочерками, затем наполняем введенными цифрами справа налево
 let ansCells = Array(totalCols).fill(' ');
 const inputDigits = finText.split(''); // Что нащелкал ребенок (например, ['4', '6', '5'])
 for (let i = 0; i < inputDigits.length; i++) {
  // Заполняем с конца (единицы, десятки, сотни...)
  const cellIdx = totalCols - 1 - i;
  if (cellIdx >= 0) ansCells[cellIdx] = inputDigits[i];
 }

 let html = `<table style="font-family: monospace; font-size: 2.8vh; border-collapse: collapse; text-align: center; margin-left: 25px; display: inline-table; vertical-align: middle; user-select: none;">`;
 
 // СТРОКА 1: Переносы разрядов
 html += `<tr style="height: 4.5vh;">`;
 for (let i = 0; i < totalCols; i++) {
  const val = item.userCarries[i] || 0;
  const isUnitsIdx = (i === totalCols - 1); // Над единицами стрелочки не нужны
  
  if (isUnitsIdx) {
   html += `<td style="width: 3.5vh;">&nbsp;</td>`;
  } else {
   html += `
    <td style="width: 3.5vh; font-size: 1.4vh; line-height: 1; color: #a855f7; font-weight: bold; padding: 2px 0;">
     <div style="cursor: pointer; color: #3b82f6; margin-bottom: 1px;" onclick="window.changeCarry(${index}, ${i}, 1)">▲</div>
     <div style="min-height: 1.8vh; font-size: 1.8vh;">${val === 0 ? '&nbsp;' : val}</div>
     <div style="cursor: pointer; color: #ef4444; margin-top: 1px;" onclick="window.changeCarry(${index}, ${i}, -1)">▼</div>
    </td>`;
  }
 }
 html += `</tr>`;

 // СТРОКА 2: Первое число
 html += `<tr style="height: 3.5vh;">`;
 padNum1.forEach(c => html += `<td style="width: 3.5vh;">${c === ' ' ? '&nbsp;' : c}</td>`);
 html += `</tr>`;

 // СТРОКА 3: Второе число и знак операции
 html += `<tr style="height: 3.5vh; border-bottom: 3px solid #333;">`;
 padNum2.forEach((c, i) => {
  const isFirstCell = (i === 0);
  const displayChar = isFirstCell ? op : (c === ' ' ? '&nbsp;' : c);
  html += `<td style="width: 3.5vh; font-weight: ${isFirstCell ? 'bold' : 'normal'}; color: ${isFirstCell ? '#475569' : 'inherit'};">${displayChar}</td>`;
 });
 html += `</tr>`;

 // СТРОКА 4: Ответ
 html += `<tr style="height: 4vh; font-weight: bold;">`;
 ansCells.forEach(c => {
  const isBlur = c === ' ';
  html += `<td class="${isBlur ? '' : ansClass}" style="width: 3.5vh; color: ${isBlur ? '#ccc' : 'inherit'}">${isBlur ? '_' : c}</td>`;
 });
 html += `</tr></table>`;
 return html;
}
