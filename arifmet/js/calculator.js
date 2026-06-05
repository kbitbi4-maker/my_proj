// version: v2.2
export function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    if (cleaned.includes('*')) {
        let p = cleaned.split('*');
        return p.length === 2 ? parseInt(p[0], 10) * parseInt(p[1], 10) : null;
    }
    if (cleaned.includes('+')) return cleaned.split('+').reduce((sum, p) => sum + (parseInt(p, 10) || 0), 0);
    if (cleaned.includes('-')) {
        let p = cleaned.split('-');
        return p.length === 2 ? parseInt(p[0], 10) - parseInt(p[1], 10) : null;
    }
    return parseInt(cleaned, 10) || null;
}

export function parseAdditionData(exampleText) {
    const nums = exampleText.split('+'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10) % 10, ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10) % 10, ones2 = num2 % 10;
    
    // Вычисляем заимствование в обе стороны (зеркально)
    let leftBorrow = (ones1 > 0 && ones1 + ones2 >= 10) ? 10 - ones1 : 0;
    let rightBorrow = (ones2 > 0 && ones1 + ones2 >= 10) ? 10 - ones2 : 0;
    
    return {
        num1, num2, tens1, ones1, tens2, ones2,
        leftBorrowCount: leftBorrow,
        rightBorrowCount: rightBorrow,
        leftLabel: String(num1), rightLabel: String(num2)
    };
}

export function parseSubtractionData(exampleText, report) {
    const nums = exampleText.split('-'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10) % 10, ones1 = num1 % 10;
    let currentSubtrahend = num2, addedAmount = 0, subtractedAmount = 0;
    
    if (report && report.simText && report.simText.includes('-')) {
        let p = report.simText.split('-');
        let userSub = parseInt(p[1], 10);
        if (!isNaN(userSub)) {
            currentSubtrahend = userSub;
            if (currentSubtrahend > num2) addedAmount = currentSubtrahend - num2;
            else if (currentSubtrahend < num2) subtractedAmount = num2 - currentSubtrahend;
        }
    }
    let finalAdded = (report && report.simText && report.simText.includes('-')) ? parseInt(report.simText.split('-')[1], 10) - num2 : 0;
    return { 
        num1, num2, tens1, ones1, currentSubtrahend, addedAmount, subtractedAmount, 
        finalAddedAmount: finalAdded < 0 ? 0 : finalAdded, leftLabel: "Л", rightLabel: "П"
    };
}

export function parseMultiplicationData(exampleText) {
    const parts = exampleText.split('×');
    return { items: parseInt(parts[0], 10), monsters: parseInt(parts[1], 10) };
}
