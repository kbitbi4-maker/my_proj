export function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    if (cleaned.includes('*')) {
        let partsArr = cleaned.split('*');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10), n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 * n2;
        }
        return null;
    }
    if (cleaned.includes('+')) {
        let partsArr = cleaned.split('+');
        let sum = 0;
        for (let i = 0; i < partsArr.length; i++) {
            let num = parseInt(partsArr[i], 10);
            if (isNaN(num)) return null; 
            sum += num;
        }
        return sum;
    }
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10), n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 - n2;
        }
        return null;
    }
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

export function parseAdditionData(exampleText, report) {
    const nums = exampleText.split('+'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10, tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;
    let leftTens = 0, leftOnes = 0, rightTens = 0, rightOnes = 0, leftLabel = '0', rightLabel = '0';
    if (report.simText.includes('+')) {
        const userParts = report.simText.split('+'), leftNum = parseInt(userParts[0], 10), rightNum = parseInt(userParts[1], 10);
        if (!isNaN(leftNum)) { leftTens = Math.floor(leftNum / 10); leftOnes = leftNum % 10; leftLabel = String(leftNum); }
        if (!isNaN(rightNum)) { rightTens = Math.floor(rightNum / 10); rightOnes = rightNum % 10; rightLabel = String(rightNum); }
    } else if (report.simText.length > 0) {
        let singleNum = parseInt(report.simText, 10);
        if (!isNaN(singleNum)) { leftTens = Math.floor(singleNum / 10); leftOnes = singleNum % 10; leftLabel = String(singleNum); }
    }
    let totalOnes = ones1 + ones2; if (totalOnes >= 10) totalOnes -= 10;
    return {
        num1, num2, tens1, ones1, tens2, ones2, leftTens, leftOnes, rightTens, rightOnes, leftLabel, rightLabel, totalOnes,
        leftBorrowCount: (leftTens > tens1 && leftOnes === 0 && ones1 > 0) ? 10 - ones1 : 0,
        rightBorrowCount: (rightTens > tens2 && rightOnes === 0 && ones2 > 0) ? 10 - ones2 : 0
    };
}

export function parseSubtractionData(exampleText, report) {
    const nums = exampleText.split('-'), num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    let currentSubtrahend = num2, addedAmount = 0, subtractedAmount = 0;
    if (report.simText.includes('-')) {
        let userSub = parseInt(report.simText.split('-').at(1), 10);
        if (!isNaN(userSub)) {
            currentSubtrahend = userSub;
            if (currentSubtrahend > num2) addedAmount = currentSubtrahend - num2;
            else if (currentSubtrahend < num2) subtractedAmount = num2 - currentSubtrahend;
        }
    }
    let finalAddedAmount = report.simText.includes('-') ? parseInt(report.simText.split('-').at(1), 10) - num2 : 0;
    return { num1, num2, tens1, ones1, currentSubtrahend, addedAmount, subtractedAmount, finalAddedAmount: isNaN(finalAddedAmount) || finalAddedAmount < 0 ? 0 : finalAddedAmount };
}

/**
 * Рассчитывает математику для УМНОЖЕНИЯ
 */
export function parseMultiplicationData(exampleText) {
    const parts = exampleText.split('×');
    return { items: parseInt(parts[0], 10), monsters: parseInt(parts[1], 10) };
}
