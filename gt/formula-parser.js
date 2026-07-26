// ============================================================
// formula-parser.js - ПАРСЕР ФОРМУЛ В AST
// Превращает строку "=SUM(A1:A10)" в структурированное дерево
// ============================================================

class FormulaParser {
    constructor() {
        // Поддерживаемые функции
        this.functions = {
            SUM: { minArgs: 1, maxArgs: Infinity },
            AVERAGE: { minArgs: 1, maxArgs: Infinity },
            COUNT: { minArgs: 1, maxArgs: Infinity },
            MAX: { minArgs: 1, maxArgs: Infinity },
            MIN: { minArgs: 1, maxArgs: Infinity },
            IF: { minArgs: 3, maxArgs: 3 },
            CONCATENATE: { minArgs: 1, maxArgs: Infinity },
            ROUND: { minArgs: 1, maxArgs: 2 },
            ABS: { minArgs: 1, maxArgs: 1 },
            POWER: { minArgs: 2, maxArgs: 2 },
            SQRT: { minArgs: 1, maxArgs: 1 },
        };
    }

    // ============================================================
    // ОСНОВНОЙ МЕТОД: ПАРСИНГ ФОРМУЛЫ
    // ============================================================
    parse(formula) {
        if (!formula || typeof formula !== 'string') {
            return { type: 'error', message: 'Пустая формула' };
        }

        // Убираем пробелы в начале и конце
        formula = formula.trim();

        // Если не начинается с "=" — это не формула
        if (!formula.startsWith('=')) {
            return { type: 'literal', value: formula };
        }

        // Убираем "="
        const expr = formula.substring(1).trim();

        // Если пусто после "="
        if (!expr) {
            return { type: 'error', message: 'Пустая формула' };
        }

        return this.parseExpression(expr);
    }

    // ============================================================
    // ПАРСИНГ ВЫРАЖЕНИЯ
    // ============================================================
    parseExpression(expr) {
        // Проверяем, является ли выражение функцией
        const funcMatch = expr.match(/^([A-Z_]+)\((.+)\)$/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const argsStr = funcMatch[2];
            
            if (!this.functions[funcName]) {
                return { type: 'error', message: `Неизвестная функция: ${funcName}` };
            }

            const args = this.parseArguments(argsStr);
            if (args === null) {
                return { type: 'error', message: `Ошибка парсинга аргументов функции ${funcName}` };
            }

            return {
                type: 'function',
                name: funcName,
                args: args
            };
        }

        // Проверяем, является ли выражением ссылкой на другой лист
        const sheetRefMatch = expr.match(/^([A-Za-z0-9_]+)!([A-Z]+[0-9]+)$/);
        if (sheetRefMatch) {
            return {
                type: 'sheetRef',
                sheet: sheetRefMatch[1],
                cell: sheetRefMatch[2]
            };
        }

        // Проверяем, является ли выражением ссылкой на ячейку (A1)
        const cellRefMatch = expr.match(/^([A-Z]+)([0-9]+)$/);
        if (cellRefMatch) {
            return {
                type: 'cellRef',
                col: cellRefMatch[1],
                row: parseInt(cellRefMatch[2])
            };
        }

        // Проверяем, является ли выражением диапазон (A1:A10)
        const rangeMatch = expr.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);
        if (rangeMatch) {
            return {
                type: 'range',
                from: rangeMatch[1],
                to: rangeMatch[2]
            };
        }

        // Проверяем, является ли выражением межлистовой диапазон (Sheet2!A1:A10)
        const sheetRangeMatch = expr.match(/^([A-Za-z0-9_]+)!([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);
        if (sheetRangeMatch) {
            return {
                type: 'sheetRange',
                sheet: sheetRangeMatch[1],
                from: sheetRangeMatch[2],
                to: sheetRangeMatch[3]
            };
        }

        // Проверяем бинарные операции (A1+B2, A1*B2 и т.д.)
        const binaryMatch = expr.match(/^(.+)\s*([+\-*/^])\s*(.+)$/);
        if (binaryMatch) {
            return {
                type: 'binary',
                operator: binaryMatch[2],
                left: this.parseExpression(binaryMatch[1].trim()),
                right: this.parseExpression(binaryMatch[3].trim())
            };
        }

        // Проверяем, является ли выражением число
        if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
            return { type: 'number', value: parseFloat(expr) };
        }

        // Проверяем, является ли выражением строка в кавычках
        const stringMatch = expr.match(/^"(.+)"$/);
        if (stringMatch) {
            return { type: 'string', value: stringMatch[1] };
        }

        // Если ничего не подошло — это ошибка
        return { type: 'error', message: `Неизвестное выражение: ${expr}` };
    }

    // ============================================================
    // ПАРСИНГ АРГУМЕНТОВ ФУНКЦИИ
    // ============================================================
    parseArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;
        let inString = false;
        let inQuote = false;

        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];

            if (char === '"' && argsStr[i - 1] !== '\\') {
                inString = !inString;
                current += char;
                continue;
            }

            if (inString) {
                current += char;
                continue;
            }

            if (char === '(') {
                depth++;
                current += char;
                continue;
            }

            if (char === ')') {
                depth--;
                current += char;
                continue;
            }

            if (char === ',' && depth === 0) {
                if (current.trim()) {
                    args.push(current.trim());
                }
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim()) {
            args.push(current.trim());
        }

        return args.map(arg => this.parseExpression(arg));
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================

    // Проверить, является ли значение формулой
    isFormula(value) {
        return typeof value === 'string' && value.startsWith('=');
    }

    // Получить имя листа из ссылки
    getSheetName(ref) {
        const match = ref.match(/^([A-Za-z0-9_]+)!/);
        return match ? match[1] : null;
    }

    // Получить ячейку из ссылки
    getCellRef(ref) {
        const match = ref.match(/!([A-Z]+[0-9]+)$/);
        return match ? match[1] : null;
    }

    // Проверить, является ли выражение ссылкой на другой лист
    isSheetRef(expr) {
        return expr.includes('!');
    }

    // Разобрать ссылку на ячейку (A1 → { col: "A", row: 1 })
    parseCellRef(cell) {
        const match = cell.match(/^([A-Z]+)([0-9]+)$/);
        if (!match) return null;
        return {
            col: match[1],
            row: parseInt(match[2])
        };
    }

    // Преобразовать букву колонки в индекс (A → 0, B → 1, ... AA → 26)
    colLetterToIndex(letter) {
        let index = 0;
        for (let i = 0; i < letter.length; i++) {
            index = index * 26 + (letter.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    // Преобразовать индекс в букву колонки (0 → A, 1 → B, ... 26 → AA)
    indexToColLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }
}
