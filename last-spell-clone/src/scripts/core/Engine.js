export class Engine{
    constructor(){
        this.isRunning=false;
        this.fps=60;
        this.lastTime=0;
        this.gameLoop=this.gameLoop.bind(this)
    }
    async init(){
        this.isRunning=true;
        this.gameLoop();
        return true
    }
    gameLoop(timestamp){
        if(!this.isRunning)return;
        const deltaTime=timestamp-this.lastTime;
        if(deltaTime>=1000/this.fps){
            this.update(deltaTime);
            this.lastTime=timestamp
        }
        requestAnimationFrame(this.gameLoop)
    }
    update(deltaTime){}
    stop(){
        this.isRunning=false
    }
}
