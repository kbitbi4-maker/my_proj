// Глобальное состояние приложения, доступное всем режимам игры
let currentMode = '';
let examplesHistory = [];
let activeIndex = -1;

const menu = document.getElementById('menu');

// Открытие и закрытие выпадающего меню
function toggleMenu() { 
    menu.classList.toggle('active'); 
}

// Главный диспетчер переключения режимов
function setMode(mode) {
    menu.classList.remove('active');
    
    // Заглушки для нереализованных режимов
    if (mode === 'hundreds' || mode === 'thousands') { 
        alert("Режим в разработке 🛠️"); 
        return; 
    }
    
    // Сброс глобального состояния под новый режим
    currentMode = mode;
    examplesHistory = [];
    activeIndex = -1;
    
    // Очищаем экран от старых примеров перед запуском нового режима
    const examplesList = document.getElementById('examples-list');
    if (examplesList) examplesList.innerHTML = '';
    
    // Удаляем игровую зону умножения, если она осталась от прошлого сеанса
    const oldZone = document.getElementById('game-zone');
    if (oldZone) oldZone.remove();

    // Передаем управление конкретному движку игры
    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    }
}

