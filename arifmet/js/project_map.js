// version: v2.5 - Fixed Modal Element ID Targets from Layout Context
import { state } from './state.js';

export function openProjectMap() {
 const modal = document.getElementById('map-modal');
 const textarea = document.getElementById('map-text-area');
 if (!modal || !textarea) return;

 let mapText = `=== ARIFMET GAME SESSION SNAPSHOT ===\n`;
 mapText += `Current Mode: ${state.currentMode}\n`;
 mapText += `Active Index: ${state.activeIndex}\n\n`;
 mapText += `=== EXAMPLES HISTORY ===\n`;
 
 (state.examplesHistory || []).forEach((item, idx) => {
  mapText += `[${idx}] ${item.exampleText} | User Input: "${item.currentInput}" | Correct: ${item.correctValue}\n`;
 });

 textarea.value = mapText;
 modal.style.display = 'flex'; // Используем flex для выравнивания по центру, как в ваших стилях
}

export function closeProjectMap() {
 const modal = document.getElementById('map-modal');
 if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
 const textarea = document.getElementById('map-text-area');
 if (!textarea) return;
 textarea.select();
 navigator.clipboard.writeText(textarea.value);
 const copyBtn = document.getElementById('copy-map-btn');
 if (copyBtn) {
  const oldText = copyBtn.innerText;
  copyBtn.innerText = 'Карта скопирована! ✅';
  setTimeout(() => { copyBtn.innerText = oldText; }, 2000);
 }
}
