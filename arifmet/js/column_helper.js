// version: v1.2 - Fixed Table Grid Alignment Without History Duplicates
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
 const n1 = nums[0].trim(), n2 = nums[1].trim();
 const maxDigits = Math.max(n1.length, n2.length, String(item.correctValue).length);
 const totalCols = maxDigits + 1;

 if (!item.userCarries) item.userCarries = Array(totalCols).fill(0);

 const padNum1 = n1.padStart(totalCols, ' ').split('');
 const padNum2 = n2.padStart(totalCols, ' ').split('');
 
 let ansCells = Array(totalCols).fill(' ');
 const inputDigits = finText.split('');
 for (let i = 0; i < inputDigits.length; i++) {
  const cellIdx = totalCols - 1 - i;
  if (cellIdx >= 0) ansCells[cellIdx] = inputDigits[i];
 }

 let html = `<div style="display: inline-flex; align-items: center; gap: 20px; font-family: monospace; font-size: 3vh;">`;
 html += `<div>${item.exampleText} =</div>`;
 html += `<table style="border-collapse: collapse; text-align: center; user-select: none; line-height: 1;">`;
 
 html += `<tr style="height: 4.5vh;">`;
 for (let i = 0; i < totalCols; i++) {
  const val = item.userCarries[i] || 0;
  if (i === totalCols - 1) {
   html += `<td style="width: 4vh;">&nbsp;</td>`;
  } else {
   html += `
    <td style="width: 4vh; font-size: 1.4vh; color: #a855f7; font-weight: bold; padding: 2px 0;">
     <div style="cursor: pointer; color: #3b82f6;" onclick="window.changeCarry(${index}, ${i}, 1)">▲</div>
     <div style="min-height: 2vh; font-size: 2vh;">${val === 0 ? '&nbsp;' : val}</div>
     <div style="cursor: pointer; color: #ef4444;" onclick="window.changeCarry(${index}, ${i}, -1)">▼</div>
    </td>`;
  }
 }
 html += `</tr>`;

 html += `<tr style="height: 4vh;"><td style="width: 4vh;"></td>`;
 for (let i = 1; i < totalCols; i++) html += `<td style="width: 4vh;">${padNum1[i] === ' ' ? '&nbsp;' : padNum1[i]}</td>`;
 html += `</tr>`;

 html += `<tr style="height: 4vh; border-bottom: 3px solid #333;"><td style="width: 4vh; font-weight: bold; color: #475569; text-align: center;">${op}</td>`;
 for (let i = 1; i < totalCols; i++) html += `<td style="width: 4vh;">${padNum2[i] === ' ' ? '&nbsp;' : padNum2[i]}</td>`;
 html += `</tr>`;

 html += `<tr style="height: 5vh; font-weight: bold;"><td style="width: 4vh;"></td>`;
 for (let i = 1; i < totalCols; i++) {
  const c = ansCells[i];
  const isBlur = c === ' ';
  html += `<td class="${isBlur ? '' : ansClass}" style="width: 4vh; color: ${isBlur ? '#ccc' : 'inherit'}">${isBlur ? '_' : c}</td>`;
 }
 html += `</tr></table></div>`;
 return html;
}
