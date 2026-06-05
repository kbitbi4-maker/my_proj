// version: v1.6
export function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    if (cleaned.includes('*')) {
        let partsArr = cleaned.split('*');
        return partsArr.length === 2 ? parseInt(partsArr[0], 10) * parseInt(partsArr[1], 10) : null;
    }
    if (cleaned.includes('+')) {
        return cleaned.split('+').reduce((sum, p) => sum + (parseInt(p, 10) || 0), 0);
    }
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        return partsArr.length === 2 ? parseInt(partsArr[0], 10) - parseInt(partsArr[1], 10) : null;
    }
    return parseInt(cleaned, 10) || null;
}

export function parseAdditionData(exampleText) {
    const nums = exampleText.split('+'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10) % 10, ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10) % 10, ones2 = num2 % 10;
    
    let totalOnes = ones1 + ones2; 
    let hasTensTransition = totalOnes >= 10;
    if (hasTensTransition) totalOnes -= 10;

    return {
        num1, num2, tens1, ones1, tens2, ones2, totalOnes,
        leftBorrowCount: hasTensTransition ? 10 - ones1 : 0,
        rightBorrowCount: hasTensTransition ? 10 - ones2 : 0,
        // Отрезаем хвосты для удобного расчета промежуточных этапов
        roundedLeft: Math.ceil(num1 / 10) * 10,
        roundedRight: num2 - (10 - ones1)
    };
}

export function parseSubtractionData(exampleText) {
    const nums = exampleText.split('-'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    return { 
        num1, num2, 
        tens1: Math.floor(num1 / 10) % 10, 
        ones1: num1 % 10,
        tens2: Math.floor(num2 / 10) % 10,
        ones2: num2 % 10
    };
}

export function parseMultiplicationData(exampleText) {
    const parts = exampleText.split('×');
    return { items: parseInt(parts[0], 10), monsters: parseInt(parts[1], 10) };
}
