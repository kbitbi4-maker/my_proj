// Основной движок игры
export class Engine{
    // Конструктор
    constructor(){
        this.isRunning=false;
        this.fps=60;
        this.lastTime=0;
        this.gameLoop=this.gameLoop.bind(this)
    }
    
    // Инициализация движка
    async init(){
        this.isRunning=true;
        this.gameLoop();
        return true
    }
    
    // Основной игровой цикл
    gameLoop(timestamp){
        if(!this.isRunning)return;
        const deltaTime=timestamp-this.lastTime;
        if(deltaTime>=1000/this.fps){
            this.update(deltaTime);
            this.lastTime=timestamp
        }
        requestAnimationFrame(this.gameLoop)
    }
    
    // Обновление игровой логики
    update(deltaTime){}
    
    // Остановка движка
    stop(){
        this.isRunning=false
    }
}
