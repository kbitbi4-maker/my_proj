// ============================================================
// formula-parser.js - ПАРСЕР ФОРМУЛ В AST
// Превращает строку "=SUM(A1:A10)" в структурированное дерево
// ============================================================

class FormulaParser {
    constructor() {
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

    parse(formula) {
        if (!formula || typeof formula !== 'string') {
            return { type: 'error', message: 'Пустая формула' };
        }
        formula = formula.trim();
        if (!formula.startsWith('=')) {
            return { type: 'literal', value: formula };
        }
        const expr = formula.substring(1).trim();
        if (!expr) {
            return { type: 'error', message: 'Пустая формула' };
        }
        return this.parseExpression(expr);
    }

    parseExpression(expr) {
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
            return { type: 'function', name: funcName, args: args };
        }

        const sheetRefMatch = expr.match(/^([A-Za-z0-9_]+)!([A-Z]+[0-9]+)$/);
        if (sheetRefMatch) {
            return { type: 'sheetRef', sheet: sheetRefMatch[1], cell: sheetRefMatch[2] };
        }

        const cellRefMatch = expr.match(/^([A-Z]+)([0-9]+)$/);
        if (cellRefMatch) {
            return { type: 'cellRef', col: cellRefMatch[1], row: parseInt(cellRefMatch[2]) };
        }

        const rangeMatch = expr.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);
        if (rangeMatch) {
            return { type: 'range', from: rangeMatch[1], to: rangeMatch[2] };
        }

        const sheetRangeMatch = expr.match(/^([A-Za-z0-9_]+)!([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);
        if (sheetRangeMatch) {
            return { type: 'sheetRange', sheet: sheetRangeMatch[1], from: sheetRangeMatch[2], to: sheetRangeMatch[3] };
        }

        const binaryMatch = expr.match(/^(.+)\s*([+\-*/^])\s*(.+)$/);
        if (binaryMatch) {
            return {
                type: 'binary',
                operator: binaryMatch[2],
                left: this.parseExpression(binaryMatch[1].trim()),
                right: this.parseExpression(binaryMatch[3].trim())
            };
        }

        if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
            return { type: 'number', value: parseFloat(expr) };
        }

        const stringMatch = expr.match(/^"(.+)"$/);
        if (stringMatch) {
            return { type: 'string', value: stringMatch[1] };
        }

        return { type: 'error', message: `Неизвестное выражение: ${expr}` };
    }

    parseArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;
        let inString = false;
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
            if (char === '(') { depth++; current += char; continue; }
            if (char === ')') { depth--; current += char; continue; }
            if (char === ',' && depth === 0) {
                if (current.trim()) args.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        if (current.trim()) args.push(current.trim());
        return args.map(arg => this.parseExpression(arg));
    }

    isFormula(value) {
        return typeof value === 'string' && value.startsWith('=');
    }

    getSheetName(ref) {
        const match = ref.match(/^([A-Za-z0-9_]+)!/);
        return match ? match[1] : null;
    }

    getCellRef(ref) {
        const match = ref.match(/!([A-Z]+[0-9]+)$/);
        return match ? match[1] : null;
    }

    isSheetRef(expr) {
        return expr.includes('!');
    }

    parseCellRef(cell) {
        const match = cell.match(/^([A-Z]+)([0-9]+)$/);
        if (!match) return null;
        return { col: match[1], row: parseInt(match[2]) };
    }

    colLetterToIndex(letter) {
        let index = 0;
        for (let i = 0; i < letter.length; i++) {
            index = index * 26 + (letter.charCodeAt(i) - 64);
        }
        return index - 1;
    }

    indexToColLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }
}
