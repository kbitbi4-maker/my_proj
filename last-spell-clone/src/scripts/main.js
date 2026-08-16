import { Engine } from './core/Engine.js';
import { MenuManager } from './ui/MenuManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { Wizard } from './core/Wizard.js';

class Game{
    constructor(){
        this.menuManager=new MenuManager();
        this.audioManager=new AudioManager();
        this.wizard=null;
        this.animationId=null;
    }
    
    init(){
        console.log('Game init start');
        this.menuManager.init();
        this.initWizard();
        console.log('Game init done');
    }
    
    initWizard(){
        const canvas=document.getElementById('wizard-canvas');
        if(!canvas){
            console.warn('Wizard canvas not found');
            return;
        }
        
        const ctx=canvas.getContext('2d');
        canvas.width=canvas.parentElement.clientWidth;
        canvas.height=canvas.parentElement.clientHeight;
        
        // Создаём волшебника
        this.wizard=new Wizard(ctx, canvas.width, canvas.height);
        
        // Запускаем анимацию
        this.animateWizard(ctx, canvas);
    }
    
    animateWizard(ctx, canvas){
        let frame=0;
        
        const animate=()=>{
            // Очищаем canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Тёмный фон
            ctx.fillStyle='#0a0505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Рисуем простой фон (звёзды/угольки)
            this.drawBackground(ctx, canvas);
            
            // Рисуем волшебника
            if(this.wizard){
                this.wizard.draw(frame);
            }
            
            frame++;
            this.animationId=requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    drawBackground(ctx, canvas){
        // Несколько мерцающих точек (звёзды)
        const numStars=30;
        for(let i=0; i<numStars; i++){
            const x=(i*137+50)%canvas.width;
            const y=(i*251+30)%canvas.height;
            const size=1+Math.random();
            const opacity=0.1+Math.random()*0.3;
            ctx.fillStyle=`rgba(200, 180, 150, ${opacity})`;
            ctx.fillRect(x, y, size, size);
        }
        
        // Лёгкая дымка внизу
        const gradient=ctx.createLinearGradient(0, canvas.height*0.7, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(10, 5, 5, 0)');
        gradient.addColorStop(1, 'rgba(20, 10, 8, 0.3)');
        ctx.fillStyle=gradient;
        ctx.fillRect(0, canvas.height*0.7, canvas.width, canvas.height*0.3);
    }
    
    stopAnimation(){
        if(this.animationId){
            cancelAnimationFrame(this.animationId);
            this.animationId=null;
        }
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    console.log('DOM loaded');
    const game=new Game();
    window.game=game;
    game.init();
});

window.addEventListener('resize',()=>{
    const canvas=document.getElementById('wizard-canvas');
    if(canvas){
        canvas.width=canvas.parentElement.clientWidth;
        canvas.height=canvas.parentElement.clientHeight;
        if(window.game && window.game.wizard){
            window.game.wizard.resize(canvas.width, canvas.height);
        }
    }
});
