// js/calculator.js
// УНИВЕРСАЛЬНЫЙ БЕЗОПАСНЫЙ КАЛЬКУЛЯТОР
function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    // 1. Обработка умножения
    if (cleaned.includes('*')) {
        let partsArr = cleaned.split('*');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 * n2;
        }
        return null;
    }
    // 2. Обработка сложения (цепочки любой длины)
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
    // 3. Обработка вычитания
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            
            if (isNaN(n1) || isNaN(n2)) return null;

            // ДЕТЕКЦИЯ УПРОЩЕНИЯ ДЛЯ РОБОТОВ
            // Проверяем, запущена ли сцена вычитания прямо сейчас
            if (typeof SubtractionVisual !== 'undefined' && SubtractionVisual.state && SubtractionVisual.state.minuend > 0) {
                let origX = SubtractionVisual.state.minuend;   // Исходный груз (например, 44)
                let origY = SubtractionVisual.state.subtrahend; // Исходные кубики (например, 18)

                // Если пользователь ввёл новые числа, но разность осталась верной
                if (n1 !== origX && n2 !== origY && (n1 - n2 === origX - origY)) {
                    
                    // ВАРИАНТ 1: Округление вверх (Прибавление кубиков)
                    if (n2 > origY && SubtractionVisual.state.addedAmount === 0) {
                        let diff = n2 - origY;
                        SubtractionVisual.simplifyByAdding(diff);
                    } 
                    // ВАРИАНТ 2: Округление вниз (Убавление кубиков)
                    else if (n2 < origY && SubtractionVisual.state.subtractedAmount === 0) {
                        let diff = origY - n2;
                        SubtractionVisual.simplifyBySubtracting(diff);
                    }
                }
            }

            return n1 - n2;
        }
        return null;
    }
    
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}
