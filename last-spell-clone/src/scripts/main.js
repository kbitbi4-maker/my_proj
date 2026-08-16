import { Engine } from './core/Engine.js';
import { MenuManager } from './ui/MenuManager.js';
import { AudioManager } from './audio/AudioManager.js';

class Game{
    constructor(){
        this.menuManager=new MenuManager();
        this.audioManager=new AudioManager();
    }
    
    init(){
        console.log('Game init start');
        this.menuManager.init();
        console.log('Game init done');
        this.drawBackground();
    }
    
    drawBackground(){
        const canvas=document.getElementById('menu-canvas');
        if(!canvas){
            console.warn('Canvas not found');
            return;
        }
        const ctx=canvas.getContext('2d');
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight;
        
        ctx.fillStyle='#0a0505';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        let y = 0;
        setInterval(() => {
            ctx.fillStyle='#0a0505';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='rgba(200, 100, 50, 0.5)';
            ctx.fillRect(100, y % canvas.height, 50, 50);
            y += 2;
        }, 50);
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    console.log('DOM loaded');
    const game=new Game();
    window.game=game;
    game.init();
});
