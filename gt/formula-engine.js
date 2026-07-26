// ============================================================
// formula-engine.js - ДВИЖОК ВЫЧИСЛЕНИЙ
// Вычисляет AST, подставляя значения из данных
// ============================================================

class FormulaEngine {
    constructor(data) {
        // data: { sheet1: { rows: [...] }, sheet2: { rows: [...] }, ... }
        this.data = data;
        this.parser = new FormulaParser();
        this.cache = {};
        this.dependencies = {};
    }

    // ============================================================
    // ВЫЧИСЛИТЬ ФОРМУЛУ
    // ============================================================
    evaluate(formula, sheetName = 'sheet1') {
        // Если это не формула — возвращаем как есть
        if (!this.parser.isFormula(formula)) {
            return formula;
        }

        // Парсим формулу в AST
        const ast = this.parser.parse(formula);
        if (ast.type === 'error') {
            return '#ERROR: ' + ast.message;
        }

        // Вычисляем AST
        return this.evaluateAST(ast, sheetName);
    }

    // ============================================================
    // ВЫЧИСЛИТЬ AST
    // ============================================================
    evaluateAST(ast, sheetName) {
        switch (ast.type) {
            case 'literal':
                return ast.value;

            case 'number':
                return ast.value;

            case 'string':
                return ast.value;

            case 'cellRef':
                return this.getCellValue(sheetName, ast.col, ast.row);

            case 'sheetRef':
                return this.getCellValue(ast.sheet, this.parser.parseCellRef(ast.cell).col, this.parser.parseCellRef(ast.cell).row);

            case 'range':
                return this.getRangeValues(sheetName, ast.from, ast.to);

            case 'sheetRange':
                return this.getRangeValues(ast.sheet, ast.from, ast.to);

            case 'binary':
                return this.evaluateBinary(ast, sheetName);

            case 'function':
                return this.evaluateFunction(ast, sheetName);

            default:
                return '#ERROR: Неизвестный тип AST';
        }
    }

    // ============================================================
    // ПОЛУЧИТЬ ЗНАЧЕНИЕ ЯЧЕЙКИ
    // ============================================================
    getCellValue(sheetName, colLetter, row) {
        const sheetData = this.data[sheetName];
        if (!sheetData) return '#REF!';

        const rows = sheetData.rows || [];
        const rowIndex = row - 1;
        if (rowIndex < 0 || rowIndex >= rows.length) return '#REF!';

        const colIndex = this.parser.colLetterToIndex(colLetter);
        if (colIndex < 0 || colIndex >= rows[rowIndex].length) return '#REF!';

        const value = rows[rowIndex][colIndex];
        
        // Если значение — формула, вычисляем её рекурсивно
        if (this.parser.isFormula(value)) {
            return this.evaluate(value, sheetName);
        }

        return value !== undefined && value !== null ? value : '';
    }

    // ============================================================
    // ПОЛУЧИТЬ ЗНАЧЕНИЯ ДИАПАЗОНА
    // ============================================================
    getRangeValues(sheetName, from, to) {
        const fromRef = this.parser.parseCellRef(from);
        const toRef = this.parser.parseCellRef(to);
        if (!fromRef || !toRef) return '#REF!';

        const sheetData = this.data[sheetName];
        if (!sheetData) return '#REF!';

        const rows = sheetData.rows || [];
        const minRow = Math.min(fromRef.row, toRef.row);
        const maxRow = Math.max(fromRef.row, toRef.row);
        const minCol = Math.min(this.parser.colLetterToIndex(fromRef.col), this.parser.colLetterToIndex(toRef.col));
        const maxCol = Math.max(this.parser.colLetterToIndex(fromRef.col), this.parser.colLetterToIndex(toRef.col));

        const values = [];
        for (let r = minRow - 1; r < maxRow; r++) {
            const rowValues = [];
            for (let c = minCol; c <= maxCol; c++) {
                if (r < rows.length && c < rows[r].length) {
                    const value = rows[r][c];
                    // Если значение — формула, вычисляем её рекурсивно
                    if (this.parser.isFormula(value)) {
                        rowValues.push(this.evaluate(value, sheetName));
                    } else {
                        rowValues.push(value !== undefined && value !== null ? value : '');
                    }
                } else {
                    rowValues.push('');
                }
            }
            values.push(rowValues);
        }

        return values;
    }

    // ============================================================
    // ВЫЧИСЛИТЬ БИНАРНУЮ ОПЕРАЦИЮ
    // ============================================================
    evaluateBinary(ast, sheetName) {
        const left = this.evaluateAST(ast.left, sheetName);
        const right = this.evaluateAST(ast.right, sheetName);

        // Если один из аргументов — массив, обрабатываем по-особому
        if (Array.isArray(left) || Array.isArray(right)) {
            return this.evaluateBinaryArray(left, right, ast.operator);
        }

        switch (ast.operator) {
            case '+': return this.safeAdd(left, right);
            case '-': return this.safeSubtract(left, right);
            case '*': return this.safeMultiply(left, right);
            case '/': return this.safeDivide(left, right);
            case '^': return Math.pow(left, right);
            default: return '#ERROR: Неизвестный оператор';
        }
    }

    evaluateBinaryArray(left, right, operator) {
        // Если оба — массивы, поэлементно
        if (Array.isArray(left) && Array.isArray(right)) {
            const result = [];
            const rows = Math.min(left.length, right.length);
            for (let r = 0; r < rows; r++) {
                const rowResult = [];
                const cols = Math.min(left[r].length, right[r].length);
                for (let c = 0; c < cols; c++) {
                    const l = left[r][c] !== undefined ? left[r][c] : 0;
                    const rv = right[r][c] !== undefined ? right[r][c] : 0;
                    switch (operator) {
                        case '+': rowResult.push(l + rv); break;
                        case '-': rowResult.push(l - rv); break;
                        case '*': rowResult.push(l * rv); break;
                        case '/': rowResult.push(rv !== 0 ? l / rv : '#DIV/0!'); break;
                    }
                }
                result.push(rowResult);
            }
            return result;
        }

        // Если один — массив, применяем операцию ко всем элементам
        const array = Array.isArray(left) ? left : right;
        const scalar = Array.isArray(left) ? right : left;
        const isLeft = Array.isArray(left);

        return array.map(row => {
            if (Array.isArray(row)) {
                return row.map(val => {
                    const l = isLeft ? val : scalar;
                    const rv = isLeft ? scalar : val;
                    switch (operator) {
                        case '+': return l + rv;
                        case '-': return isLeft ? l - rv : rv - l;
                        case '*': return l * rv;
                        case '/': return rv !== 0 ? (isLeft ? l / rv : rv / l) : '#DIV/0!';
                    }
                });
            }
            return row;
        });
    }

    // ============================================================
    // БЕЗОПАСНЫЕ АРИФМЕТИЧЕСКИЕ ОПЕРАЦИИ
    // ============================================================
    safeAdd(a, b) {
        if (typeof a === 'string' || typeof b === 'string') {
            return String(a) + String(b);
        }
        return (parseFloat(a) || 0) + (parseFloat(b) || 0);
    }

    safeSubtract(a, b) {
        return (parseFloat(a) || 0) - (parseFloat(b) || 0);
    }

    safeMultiply(a, b) {
        return (parseFloat(a) || 0) * (parseFloat(b) || 0);
    }

    safeDivide(a, b) {
        const bNum = parseFloat(b) || 0;
        if (bNum === 0) return '#DIV/0!';
        return (parseFloat(a) || 0) / bNum;
    }

    // ============================================================
    // ВЫЧИСЛИТЬ ФУНКЦИЮ
    // ============================================================
    evaluateFunction(ast, sheetName) {
        const args = ast.args.map(arg => this.evaluateAST(arg, sheetName));
        const funcName = ast.name;

        // Упрощаем: если аргумент — массив, разворачиваем
        const flatArgs = this.flattenArgs(args);

        switch (funcName) {
            case 'SUM':
                return flatArgs.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

            case 'AVERAGE':
                const numbers = flatArgs.filter(v => !isNaN(parseFloat(v)));
                return numbers.length > 0 ? numbers.reduce((sum, v) => sum + v, 0) / numbers.length : 0;

            case 'COUNT':
                return flatArgs.filter(v => v !== '' && v !== null && v !== undefined).length;

            case 'MAX':
                const maxNumbers = flatArgs.filter(v => !isNaN(parseFloat(v)));
                return maxNumbers.length > 0 ? Math.max(...maxNumbers) : 0;

            case 'MIN':
                const minNumbers = flatArgs.filter(v => !isNaN(parseFloat(v)));
                return minNumbers.length > 0 ? Math.min(...minNumbers) : 0;

            case 'IF':
                const condition = args[0];
                const trueVal = args[1];
                const falseVal = args[2];
                // Упрощённо: если условие > 0 или true
                const condResult = (typeof condition === 'boolean') ? condition : (parseFloat(condition) > 0);
                return condResult ? trueVal : falseVal;

            case 'CONCATENATE':
                return flatArgs.join('');

            case 'ROUND':
                const num = parseFloat(args[0]) || 0;
                const digits = parseInt(args[1]) || 0;
                const factor = Math.pow(10, digits);
                return Math.round(num * factor) / factor;

            case 'ABS':
                return Math.abs(parseFloat(args[0]) || 0);

            case 'POWER':
                return Math.pow(parseFloat(args[0]) || 0, parseFloat(args[1]) || 0);

            case 'SQRT':
                const sqrtVal = parseFloat(args[0]) || 0;
                return sqrtVal >= 0 ? Math.sqrt(sqrtVal) : '#ERROR: Отрицательное число';

            default:
                return '#ERROR: Неизвестная функция ' + funcName;
        }
    }

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================
    flattenArgs(args) {
        const result = [];
        for (const arg of args) {
            if (Array.isArray(arg)) {
                // Если это массив, разворачиваем его
                for (const item of arg) {
                    if (Array.isArray(item)) {
                        result.push(...item);
                    } else {
                        result.push(item);
                    }
                }
            } else {
                result.push(arg);
            }
        }
        return result;
    }

    // ============================================================
    // УСТАНОВИТЬ ДАННЫЕ ДЛЯ ВЫЧИСЛЕНИЙ
    // ============================================================
    setData(data) {
        this.data = data;
        this.cache = {};
        this.dependencies = {};
    }

    // ============================================================
    // ОБНОВИТЬ ЯЧЕЙКУ И ПЕРЕСЧИТАТЬ ЗАВИСИМОСТИ
    // ============================================================
    updateCell(sheetName, row, col, value) {
        // Обновляем данные
        if (!this.data[sheetName]) {
            this.data[sheetName] = { rows: [] };
        }
        const rows = this.data[sheetName].rows;
        const rowIndex = row - 1;
        const colIndex = this.parser.colLetterToIndex(col);

        if (rowIndex >= rows.length) {
            // Добавляем пустые строки
            for (let i = rows.length; i <= rowIndex; i++) {
                rows.push([]);
            }
        }
        if (colIndex >= rows[rowIndex].length) {
            // Добавляем пустые колонки
            for (let i = rows[rowIndex].length; i <= colIndex; i++) {
                rows[rowIndex].push('');
            }
        }

        rows[rowIndex][colIndex] = value;
        this.cache = {};
    }

    // ============================================================
    // ПОЛУЧИТЬ ВСЕ ФОРМУЛЫ ИЗ ДАННЫХ
    // ============================================================
    getAllFormulas() {
        const formulas = {};
        for (const sheetName in this.data) {
            formulas[sheetName] = [];
            const rows = this.data[sheetName].rows || [];
            for (let r = 0; r < rows.length; r++) {
                formulas[sheetName][r] = [];
                for (let c = 0; c < rows[r].length; c++) {
                    const value = rows[r][c];
                    if (this.parser.isFormula(value)) {
                        formulas[sheetName][r][c] = value;
                    } else {
                        formulas[sheetName][r][c] = '';
                    }
                }
            }
        }
        return formulas;
    }
}
