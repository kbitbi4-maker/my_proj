// version: v1.2

export function renderSubtractionVisual(data, report) {
    let html = '';

    if (data.stepPhase === 1) {
        html = `
        <div class="sub-scene-container">
            <div class="sub-workspace">
                <div class="sub-robot-platform left-platform">
                    <div class="sub-robot robot-left-idle">🤖 Уменьшаемое</div>
                    <div class="sub-cargo-area">
                        ${generateSubCargoHTML(data.tens1, data.ones1, 0, 0)}
                    </div>
                </div>
                <div class="sub-operator-sign">➖</div>
                <div class="sub-robot-platform right-platform">
                    <div class="sub-robot robot-right-idle">🤖 Вычитаемое</div>
                    <div class="sub-cargo-needed">
                        <div class="sub-need-bubble">Надо забрать: <b>${data.initialNum2}</b></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    } 
    else if (data.stepPhase === 2) {
        const added = data.finalAddedAmount;
        html = `
        <div class="sub-scene-container">
            <div class="sub-info-banner">
                Применяем хитрость: округлим вычитаемое! Добавим к обоим числам по <b>${added}</b> 💎
            </div>
            <div class="sub-workspace">
                <div class="sub-robot-platform left-platform highlighted-platform">
                    <div class="sub-robot robot-left-work">🤖 Получил +${added}</div>
                    <div class="sub-cargo-area">
                        ${generateSubCargoHTML(data.tens1, data.ones1, added, 0)}
                    </div>
                </div>
                <div class="sub-operator-sign">➖</div>
                <div class="sub-robot-platform right-platform highlighted-platform">
                    <div class="sub-robot robot-right-work">🤖 Стал круглым!</div>
                    <div class="sub-cargo-needed">
                        <div class="sub-need-bubble">
                            Новая цель: ${data.initialNum2} + ${added} = <b>${data.currentSubtrahend}</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    } 
    else {
        const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '';
        const labelText = report.isFullySolved ? 'Ура! Робот уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';
        
        html = `
        <div class="sub-scene-container ${driveAwayClass}">
            <div class="sub-info-banner resolution-banner">${labelText}</div>
            <div class="sub-workspace">
                <div class="sub-robot-platform left-platform final-platform">
                    <div class="sub-robot robot-left-drive">🚚 Остаток груза</div>
                    <div class="sub-cargo-area">
                        ${generateSubCargoHTML(data.tens1, data.ones1, data.finalAddedAmount, data.currentSubtrahend)}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    return html;
}

function generateSubCargoHTML(tens, ones, addedOnes, subtractedTotal = 0) {
    let html = '<div class="sub-cargo-grid">';
    let totalOnesArray = [];

    for (let i = 0; i < ones; i++) {
        totalOnesArray.push({ type: 'normal' });
    }
    for (let i = 0; i < addedOnes; i++) {
        totalOnesArray.push({ type: 'added' });
    }

    let totalOnesCount = totalOnesArray.length; 
    let totalAvailable = (tens * 10) + totalOnesCount;
    let visibleCount = totalAvailable - subtractedTotal;
    let currentGlobalIndex = 0;

    for (let t = 0; t < tens; t++) {
        html += '<div class="sub-tens-column">';
        for (let u = 0; u < 10; u++) {
            currentGlobalIndex++;
            const isHidden = currentGlobalIndex > visibleCount ? 'sub-cube-hidden' : '';
            html += `<div class="sub-crystal-cube cube-tens ${isHidden}">🔮</div>`;
        }
        html += '</div>';
    }

    if (totalOnesCount > 0) {
        html += '<div class="sub-ones-block">';
        for (let o = 0; o < totalOnesCount; o++) {
            currentGlobalIndex++;
            const cubeData = totalOnesArray[o];
            const isHidden = currentGlobalIndex > visibleCount ? 'sub-cube-hidden' : '';
            const cubeClass = cubeData.type === 'added' ? 'cube-ones-added' : 'cube-ones-normal';
            const cubeEmoji = cubeData.type === 'added' ? '🔷' : '💎';

            html += `<div class="sub-crystal-cube ${cubeClass} ${isHidden}">${cubeEmoji}</div>`;
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}
