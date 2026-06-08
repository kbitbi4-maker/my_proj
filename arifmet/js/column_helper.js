// version: v2.0 - Total Flexbox Grid Re-Architecture
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

 let html = `<div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 15px; font-family: monospace; font-size: 3.5vh; font-weight: bold; user-select: none; width: 100%;">`;
 html += `<div style="white-space: nowrap; flex-shrink: 0;">${item.exampleText} =</div>`;
 html += `<div style="display: flex; flex-direction: row;">`;

 for (let i = 0; i < totalCols; i++) {
  const val = item.userCarries[i] || 0;
  const c1 = padNum1[i] === ' ' ? '&nbsp;' : padNum1[i];
  const c2 = padNum2[i] === ' ' ? '&nbsp;' : padNum2[i];
  const ans = ansCells[i];
  const isBlur = ans === ' ';
  const isUnitsIdx = (i === totalCols - 1);

  html += `<div style="display: flex; flex-direction: column; align-items: center; width: 4.5vh; text-align: center; line-height: 1.1;">`;
  
  if (isUnitsIdx) {
   html += `<div style="height: 5.5vh;">&nbsp;</div>`;
  } else {
   html += `
    <div style="font-size: 1.5vh; color: #a855f7; display: flex; flex-direction: column; align-items: center; height: 5.5vh; justify-content: center;">
     <div style="cursor: pointer; color: #3b82f6;" onclick="window.changeCarry(${index}, ${i}, 1)">▲</div>
     <div style="font-size: 2vh; min-height: 2vh;">${val === 0 ? '&nbsp;' : val}</div>
     <div style="cursor: pointer; color: #ef4444;" onclick="window.changeCarry(${index}, ${i}, -1)">▼</div>
    </div>`;
  }

  html += `<div style="height: 4vh; display: flex; align-items: center; justify-content: center;">${c1}</div>`;
  
  const isFirstWithOp = (i === 0);
  const borderStyle = "border-bottom: 4px solid #333;";
  if (isFirstWithOp) {
   html += `<div style="height: 4vh; display: flex; align-items: center; justify-content: center; color: #475569; ${borderStyle}">${op}</div>`;
  } else {
   html += `<div style="height: 4vh; display: flex; align-items: center; justify-content: center; ${borderStyle}">${c2}</div>`;
  }

  html += `<div class="${isBlur ? '' : ansClass}" style="height: 5vh; display: flex; align-items: center; justify-content: center; color: ${isBlur ? '#ccc' : 'inherit'}; width: 100%;">${isBlur ? '_' : ans}</div>`;
  html += `</div>`;
 }

 html += `</div></div>`;
 return html;
}
