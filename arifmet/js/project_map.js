// version: v2.0 - Complete Self-Contained PDF Generation and Map Exporter
import { state } from './state.js';

export function openProjectMap() {
 const modal = document.getElementById('project-map-modal');
 const textarea = document.getElementById('project-map-textarea');
 if (!modal || !textarea) return;

 // Собираем текущий моментальный снимок истории и состояния для ИИ-контекста
 let mapText = `=== ARIFMET GAME SESSION SNAPSHOT ===\n`;
 mapText += `Current Mode: ${state.currentMode}\n`;
 mapText += `Active Index: ${state.activeIndex}\n\n`;
 mapText += `=== EXAMPLES HISTORY ===\n`;
 
 (state.examplesHistory || []).forEach((item, idx) => {
  mapText += `[${idx}] ${item.exampleText} | User Input: "${item.currentInput}" | Correct: ${item.correctValue}\n`;
 });

 textarea.value = mapText;
 modal.style.display = 'block';
}

export function closeProjectMap() {
 const modal = document.getElementById('project-map-modal');
 if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
 const textarea = document.getElementById('project-map-textarea');
 if (!textarea) return;
 textarea.select();
 navigator.clipboard.writeText(textarea.value);
 const copyBtn = document.getElementById('copy-map-btn');
 if (copyBtn) {
  const oldText = copyBtn.innerText;
  copyBtn.innerText = 'Скопировано! ✅';
  setTimeout(() => { copyBtn.innerText = oldText; }, 2000);
 }
}

export function downloadProjectMapPDF() {
 const textarea = document.getElementById('project-map-textarea');
 if (!textarea) return;

 const printWindow = window.open('', '_blank');
 if (!printWindow) {
  alert('Пожалуйста, разрешите всплывающие окна для скачивания PDF');
  return;
 }

 // Генерируем изолированный HTML-документ для отправки в системный PDF-принтер
 printWindow.document.write(`
  <html>
   <head>
    <title>arifmet_project_code_export</title>
    <style>
     body { font-family: monospace; padding: 20px; white-space: pre-wrap; font-size: 14px; line-height: 1.4; color: #1e293b; }
     @media print { body { padding: 0; margin: 0; } }
    </style>
   </head>
   <body>${textarea.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
  </html>
 `);
 printWindow.document.close();
 printWindow.focus();
 
 // Триггерим нативное сохранение в PDF средствами браузера
 setTimeout(() => {
  printWindow.print();
  printWindow.close();
 }, 250);
}
