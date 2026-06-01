function renderAllLines() {
    if (!examplesList) return;
    const placeholder = examplesList.querySelector('div[style*="color: #999"]');
    if (placeholder) placeholder.remove();
    let currentRenderedCount = examplesList.children.length;
    if (currentRenderedCount < window.examplesHistory.length) {
        for (let index = currentRenderedCount; index < window.examplesHistory.length; index++) {
            const item = window.examplesHistory[index];
            const line = document.createElement('div');
            line.className = `example-line ${index === window.activeIndex ? 'active' : ''}`;
            line.setAttribute('data-index', index);
            line.onclick = () => selectExample(index);
            line.innerHTML = `<span class="example-text">${item.exampleText}</span><span class="sim-block-wrapper"></span><span class="fin-block-wrapper"></span>`;
            examplesList.appendChild(line);
        }
    } else if (currentRenderedCount > window.examplesHistory.length) { examplesList.innerHTML = ''; }
    window.examplesHistory.forEach((item, index) => {
        const line = examplesList.querySelector(`[data-index="${index}"]`);
        if (!line) return;
        if (index === window.activeIndex) { line.classList.add('active'); } else { line.classList.remove('active'); }
        const partsArr = item.currentInput.split('=');
        const simText = (partsArr.length > 0) ? partsArr.at(0) : '';
        const finText = (partsArr.length > 1) ? partsArr.at(1) : '';
        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');
        const targetLength = String(item.correctValue).length;
        let isMultiplicationLine = item.exampleText.includes('×');
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            if (isMultiplicationLine && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×').at(1), 10);
                if (checkParts.length !== monsterCountFromText) simCorrect = false;
            }
            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
            if (index === window.activeIndex && typeof triggerFailFeedback === 'function') {
                if (!simCorrect && !window.simFailSoundPlayed) { triggerFailFeedback(); window.simFailSoundPlayed = true; }
                if (simCorrect && !window.simWinSoundPlayed) { triggerTensWinSound(); window.simWinSoundPlayed = true; }
                if (simCorrect) window.simFailSoundPlayed = false;
                if (!simCorrect) window.simWinSoundPlayed = false;
            }
        } else { simWrapper.innerHTML = ' = <span class="block">' + (simText || '_') + '</span>'; }
        if (partsArr.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            let trimmedFinText = String(finText).trim();
            if (trimmedFinText.length >= targetLength) {
                finWrapper.innerHTML = ' = <span class="block ' + (finCorrect ? 'block-correct' : 'block-incorrect') + '">' + finText + '</span>';
                if (index === window.activeIndex && typeof triggerFailFeedback === 'function') {
                    if (!finCorrect && !window.finFailSoundPlayed) { triggerFailFeedback(); window.finFailSoundPlayed = true; }
                    if (finCorrect && !isMultiplicationLine && !window.finWinSoundPlayed) { triggerTensWinSound(); window.finWinSoundPlayed = true; }
                    if (finCorrect) window.finFailSoundPlayed = false;
                    if (!finCorrect) window.finWinSoundPlayed = false;
                }
            } else if (trimmedFinText.length > 0) {
                finWrapper.innerHTML = ' = <span class="block">' + finText + '</span>';
                if (index === window.activeIndex) { window.finFailSoundPlayed = false; window.finWinSoundPlayed = false; }
            } else {
                finWrapper.innerHTML = ' = <span class="block">_</span>';
                if (index === window.activeIndex) { window.finFailSoundPlayed = false; window.finWinSoundPlayed = false; }
            }
        } else { finWrapper.innerHTML = ''; }
    });
    let cur = window.examplesHistory[window.activeIndex];
    if (cur && cur.exampleText.includes('-') && typeof renderSubtractionVisual === 'function') {
        let nums = cur.exampleText.split('-');
        renderSubtractionVisual(parseInt(nums[0], 10), parseInt(nums[1], 10), cur.currentInput);
    }
    if (cur && window.currentMode === 'scales') {
        const gameZone = document.getElementById('game-zone');
        if (gameZone) gameZone.innerHTML = '<div style="color:#94a3b8; font-size:14px;">[Визуал весов: ' + cur.currentInput + ']</div>';
    }
    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

