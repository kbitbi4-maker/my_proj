function evaluateExpr(str) {
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
