/**
 * Модуль визуализации разницы и упрощения вычитания (Роботы и кубики)
 */

const SubtractionVisual = {
    // Хранилище текущего состояния сцены
    state: {
        minuend: 0,      // Текущее уменьшаемое (оранжевые кубики левого робота)
        subtrahend: 0,   // Текущее вычитаемое (пустые кубики правого робота)
        addedAmount: 0,  // Сколько кубиков добавили для округления до десятка
        subtractedAmount: 0 // Сколько кубиков убавили при упрощении
    },

    /**
     * Инициализация и первичная отрисовка сцены (Роботы стоят у общего груза слева)
     * @param {string} containerId - ID контейнера (game-zone)
     * @param {number} X - Уменьшаемое (например, 14)
     * @param {number} Y - Вычитаемое (например, 8)
     */
    init: function(containerId, X, Y) {
        const zone = document.getElementById(containerId);
        if (!zone) return;
        
        this.state = { minuend: X, subtrahend: Y, addedAmount: 0, subtractedAmount: 0 };
        zone.innerHTML = '';

        // Контейнер сцены
        const scene = document.createElement('div');
        scene.id = 'sub-visual-scene';
        scene.style.cssText = `
            display: flex;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: relative;
            box-sizing: border-box;
            gap: 10px;
            overflow: hidden;
        `;

        // 1. Зона левого робота и его груза
        const leftZone = document.createElement('div');
        leftZone.id = 'left-robot-zone';
        leftZone.style.cssText = 'display: flex; align-items: flex-end; gap: 8px; position: relative;';

        // Контейнер для кубиков левого робота
        const leftCargo = document.createElement('div');
        leftCargo.id = 'left-cargo';
        leftCargo.style.cssText = 'display: flex; flex-wrap: wrap-reverse; align-content: flex-start; gap: 4px; max-width: 140px;';
        
        // Заполняем оранжевыми кубиками исходное уменьшаемое
        for (let i = 0; i < X; i++) {
            leftCargo.appendChild(this.createCube('orange'));
        }

        const robotLeft = this.createRobot('🤖 Л', '#3b82f6');
        leftZone.appendChild(leftCargo);
        leftZone.appendChild(robotLeft);

        // 2. Зона правого робота и его кубиков за спиной
        const rightZone = document.createElement('div');
        rightZone.id = 'right-robot-zone';
        rightZone.style.cssText = 'display: flex; align-items: flex-end; gap: 8px; transition: transform 1s ease-in-out, opacity 1s;';

        const robotRight = this.createRobot('🤖 П', '#ef4444');
        
        // Контейнер для кубиков правого робота
        const rightCargo = document.createElement('div');
        rightCargo.id = 'right-cargo';
        rightCargo.style.cssText = 'display: flex; flex-wrap: wrap-reverse; align-content: flex-start; gap: 4px; max-width: 140px;';
        
        // Заполняем пустыми кубиками исходное вычитаемое
        for (let i = 0; i < Y; i++) {
            rightCargo.appendChild(this.createCube('empty'));
        }

        rightZone.appendChild(robotRight);
        rightZone.appendChild(rightCargo);

        // Собираем всё в общую сцену
        scene.appendChild(leftZone);
        scene.appendChild(rightZone);
        zone.appendChild(scene);
    },

    /**
     * Вариант Упрощения №1: Прибавляем число к обоим для округления вычитаемого до десятка
     * @param {number} amount - Сколько кубиков добавляем (например, если было 8, то добавляем 2)
     */
    simplifyByAdding: function(amount) {
        this.state.addedAmount = amount;
        
        const leftCargo = document.getElementById('left-cargo');
        const rightCargo = document.getElementById('right-cargo');
        if (!leftCargo || !rightCargo) return;

        // Добавляем оранжевые кубики левому роботу
        for (let i = 0; i < amount; i++) {
            const cube = this.createCube('orange');
            cube.style.transform = 'scale(0)';
            cube.style.borderColor = '#22c55e'; // Временная зеленая подсветка нового кубика
            leftCargo.appendChild(cube);
            setTimeout(() => cube.style.transform = 'scale(1)', i * 100);
        }

        // Добавляем точно такие же оранжевые кубики правому роботу для округления его неполного десятка!
        for (let i = 0; i < amount; i++) {
            const cube = this.createCube('orange');
            cube.style.transform = 'scale(0)';
            cube.style.borderColor = '#22c55e';
            rightCargo.appendChild(cube);
            setTimeout(() => cube.style.transform = 'scale(1)', i * 100);
        }
    },

    /**
     * Вариант Упрощения №2: Убавляем лишнее из вычитаемого
     * @param {number} amount - Сколько лишних кубиков забираем
     */
    simplifyBySubtracting: function(amount) {
        this.state.subtractedAmount = amount;
        
        const leftCargo = document.getElementById('left-cargo');
        const rightCargo = document.getElementById('right-cargo');
        if (!leftCargo || !rightCargo) return;

        // 1. У правого робота забираются лишние пустые кубики с конца списка
        const emptyCubes = rightCargo.querySelectorAll('.cube-empty');
        const cubesToRemove = Math.min(amount, emptyCubes.length);
        for (let i = 0; i < cubesToRemove; i++) {
            const targetCube = emptyCubes[emptyCubes.length - 1 - i];
            if (targetCube) {
                targetCube.style.transform = 'scale(0)';
                setTimeout(() => targetCube.remove(), 300);
            }
        }

        // 2. У левого робота то же число СИНИХ кубиков (или оранжевых, если синих еще нет)
        // теряют свой цвет и становятся ПУСТЫМИ. 
        // Примечание: так как изначально они оранжевые, превращаем оранжевые в пустые контуры
        const orangeCubes = leftCargo.querySelectorAll('.cube-orange, .cube-blue');
        const cubesToEmpty = Math.min(amount, orangeCubes.length);
        for (let i = 0; i < cubesToEmpty; i++) {
            const targetCube = orangeCubes[orangeCubes.length - 1 - i];
            if (targetCube) {
                targetCube.className = 'my-cube cube-empty';
                targetCube.style.backgroundColor = 'transparent';
                targetCube.style.border = '2px dashed #ef4444';
            }
        }
    },

    /**
     * Анимация триумфа при правильном ответе. Правый робот забирает свое число 
     * (синие кубики + округленный оранжевый хвост) и уезжает со сцены.
     */
    animateCorrectAnswer: function() {
        const rightCargo = document.getElementById('right-cargo');
        const rightZone = document.getElementById('right-robot-zone');
        if (!rightCargo || !rightZone) return;

        // Перекрашиваем изначальное количество вычитаемого (пустые кубики) в синий цвет
        const emptyCubes = rightCargo.querySelectorAll('.cube-empty');
        emptyCubes.forEach((cube, index) => {
            setTimeout(() => {
                cube.className = 'my-cube cube-blue';
                cube.style.backgroundColor = '#3b82f6';
                cube.style.border = '1px solid #1d4ed8';
            }, index * 50);
        });

        // Даем небольшую паузу на перекрашивание, после чего правый робот уезжает направо за экран
        setTimeout(() => {
            rightZone.style.transform = 'translateX(300px)';
            rightZone.style.opacity = '0';
        }, (emptyCubes.length * 50) + 400);
    },

    // Вспомогательный метод создания кубика нужного типа
    createCube: function(type) {
        const cube = document.createElement('div');
        cube.className = `my-cube cube-${type}`;
        
        let styles = `
            width: 16px;
            height: 16px;
            border-radius: 3px;
            box-sizing: border-box;
            transition: all 0.4s ease;
        `;

        if (type === 'orange') {
            styles += 'background-color: #f59e0b; border: 1px solid #d97706; box-shadow: 1px 1px 2px rgba(0,0,0,0.1);';
        } else if (type === 'blue') {
            styles += 'background-color: #3b82f6; border: 1px solid #1d4ed8;';
        } else if (type === 'empty') {
            styles += 'border: 2px dashed #ef4444; background-color: transparent;';
        }

        cube.style.cssText = styles;
        return cube;
    },

    // Вспомогательный метод создания робота
    createRobot: function(icon, color) {
        const r = document.createElement('div');
        r.style.cssText = 'display: flex; flex-direction: column; align-items: center; font-size: 26px;';
        
        const badge = document.createElement('span');
        badge.innerText = icon;
        badge.style.cssText = `
            font-size: 11px; font-weight: bold; color: white; background: ${color};
            padding: 1px 5px; border-radius: 4px; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        r.appendChild(badge);
        return r;
    }
};

