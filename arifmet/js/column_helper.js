// version: v1.0 - Column Matrix and Interactive Carry Logic
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
 const maxDigits = Math.max(n1.length, n2.length, String(item.correctValue).length);

 if (!item.userCarries) item.userCarries = Array(maxDigits).fill(0);

 const padNum1 = n1.padStart(maxDigits, ' ').split('');
 const padNum2 = n2.padStart(maxDigits, ' ').split('');
 const padAns = finText.split('').reverse().join('').padStart(maxDigits, ' ').split('');

 let html = `<table style="font-family: monospace; font-size: 2.8vh; border-collapse: collapse; text-align: center; margin-left: 25px; display: inline-table; vertical-align: middle; user-select: none;">`;
 html += `tr><td></td>`;
 
 for (let i = 0; i < maxDigits; i++) {
  const val = item.userCarries[i] || 0;
  html += `
   <td style="width: 3.5vh; font-size: 1.5vh; line-height: 1.1; color: #a855f7; font-weight: bold; padding: 2px 0;">
    <div style="cursor: pointer; color: #3b82f6;" onclick="window.changeCarry(${index}, ${i}, 1)">▲</div>
    <div style="min-height: 1.8vh; font-size: 1.8vh;">${val === 0 ? '&nbsp;' : val}</div>
    <div style="cursor: pointer; color: #ef4444;" onclick="window.changeCarry(${index}, ${i}, -1)">▼</div>
   </td>`;
 }
 html += `</tr>`;

 html += `<tr style="height: 3.5vh;"><td></td>`;
 padNum1.forEach(c => html += `<td>${c}</td>`);
 html += `</tr>`;

 html += `<tr style="height: 3.5vh; border-bottom: 3px solid #333;"><td style="width: 2.5vh; text-align: left; font-weight: bold; color: #475569;">${op}</td>`;
 padNum2.forEach(c => html += `<td>${c}</td>`);
 html += `</tr>`;

 html += `<tr style="height: 4vh; font-weight: bold;"><td style="width: 2.5vh;"></td>`;
 padAns.forEach(c => {
  const isBlur = c === ' ';
  html += `<td class="${isBlur ? '' : ansClass}" style="color: ${isBlur ? '#ccc' : 'inherit'}">${isBlur ? '_' : c}</td>`;
 });
 html += `</tr></table>`;
 return html;
}

