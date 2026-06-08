// version: ORIGINAL - Restored From PDF Context
export const GameCanvas = {
 clearZone() {
  const container = document.getElementById('canvas-container');
  if (container) {
   container.innerHTML = '';
  }
 },

 renderZoneScene(htmlContent, cacheKey) {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  if (container.getAttribute('data-cache') === cacheKey) return;
  container.innerHTML = htmlContent;
  container.setAttribute('data-cache', cacheKey);
 },

 createActorHTML({ emoji, animationClass, subtitle }) {
  return `
   <div class="actor-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
    <div class="monster-emoji ${animationClass || ''}" style="font-size: 64px; user-select: none;">${emoji}</div>
    ${subtitle || ''}
   </div>`;
 },

 renderHistory(history, activeIndex, mode, getHistoryHTMLFunc) {
  const historyContainer = document.querySelector('.game-history');
  if (!historyContainer) return;
  historyContainer.innerHTML = '';

  history.forEach((item, index) => {
   const { simHTML, finHTML } = getHistoryHTMLFunc(item, index, mode);
   const row = document.createElement('div');
   row.className = `history-item ${index === activeIndex ? 'active' : ''}`;
   row.innerHTML = `<span class="example-text">${item.exampleText}</span>${simHTML}${finHTML}`;
   historyContainer.appendChild(row);

   if (index === activeIndex) {
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
   }
  });
 }
};
