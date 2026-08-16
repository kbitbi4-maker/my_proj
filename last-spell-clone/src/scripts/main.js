// Импорт движка
import { Engine } from './core/Engine.js';

// Импорт менеджера меню
import { MenuManager } from './ui/MenuManager.js';

// Импорт менеджера аудио
import { AudioManager } from './audio/AudioManager.js';

// Импорт сканера проекта
import { ProjectScanner } from './utils/projectScanner.js';

// Импорт конфигурации
import { GAME_CONFIG } from '../config/gameConfig.js';

// Основной класс игры
class Game{
    // Конструктор
    constructor(){
        this.engine=new Engine();
        this.menuManager=new MenuManager();
        this.audioManager=new AudioManager();
        this.isInitialized=false
    }
    
    // Инициализация игры
    async init(){
        try{
            await this.engine.init();
            await this.audioManager.init();
            this.menuManager.init();
            this.setupMenuBackground();
            this.audioManager.playMenuMusic();
            this.isInitialized=true;
            console.log('Game initialized successfully!')
        }catch(error){
            console.error('Failed to initialize game:',error)
        }
    }
    
    // Настройка фона меню
    setupMenuBackground(){
        const canvas=document.getElementById('menu-canvas');
        const ctx=canvas.getContext('2d');
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight;
        this.animateBackground(ctx,canvas)
    }
    
    // Анимация фона
    animateBackground(ctx,canvas){
        const particles=[];
        const numParticles=50;
        for(let i=0;i<numParticles;i++){
            particles.push({
                x:Math.random()*canvas.width,
                y:Math.random()*canvas.height,
                size:Math.random()*3+1,
                speedX:(Math.random()-0.5)*0.5,
                speedY:-(Math.random()*0.5+0.1),
                opacity:Math.random()*0.5+0.3
            })
        }
        const animate=()=>{
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#0a0505';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            this.drawPixelWall(ctx,canvas);
            particles.forEach(p=>{
                p.x+=p.speedX;
                p.y+=p.speedY;
                if(p.y<0){
                    p.y=canvas.height;
                    p.x=Math.random()*canvas.width
                }
                ctx.fillStyle=`rgba(200, 100, 50, ${p.opacity})`;
                ctx.fillRect(p.x,p.y,p.size,p.size)
            });
            requestAnimationFrame(animate)
        };
        animate()
    }
    
    // Рисование пиксельной стены
    drawPixelWall(ctx,canvas){
        const width=canvas.width;
        const height=canvas.height;
        const wallY=height*0.6;
        const wallHeight=height*0.3;
        ctx.fillStyle='#2a1a1a';
        ctx.fillRect(0,wallY,width,wallHeight);
        const brickWidth=40;
        const brickHeight=20;
        for(let row=0;row<wallHeight/brickHeight;row++){
            const offset=row%2===0?0:brickWidth/2;
            for(let col=-1;col<width/brickWidth+1;col++){
                const x=col*brickWidth+offset;
                const y=wallY+row*brickHeight;
                ctx.fillStyle=row%2===0?'#3a2a2a':'#4a3a3a';
                ctx.fillRect(x,y,brickWidth-1,brickHeight-1);
                if(Math.random()>0.95){
                    ctx.fillStyle='#1a0a0a';
                    ctx.fillRect(x+5,y+5,10,10)
                }
            }
        }
        this.drawPixelFire(ctx,width,height)
    }
    
    // Рисование пиксельного огня
    drawPixelFire(ctx,width,height){
        const fireX=width*0.4;
        const fireY=height*0.3;
        const fireWidth=width*0.2;
        const fireHeight=height*0.3;
        const colors=[
            'rgba(200, 50, 0, 0.5)',
            'rgba(255, 100, 0, 0.3)',
            'rgba(255, 200, 0, 0.2)'
        ];
        for(let i=0;i<20;i++){
            const x=fireX+Math.random()*fireWidth;
            const y=fireY+Math.random()*fireHeight;
            const size=Math.random()*8+2;
            const color=colors[Math.floor(Math.random()*colors.length)];
            ctx.fillStyle=color;
            ctx.fillRect(x,y,size,size)
        }
    }
}

// Запуск игры при загрузке DOM
document.addEventListener('DOMContentLoaded',()=>{
    const game=new Game();
    window.game=game;
    game.init()
});

// Обработка изменения размера окна
window.addEventListener('resize',()=>{
    const canvas=document.getElementById('menu-canvas');
    if(canvas){
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight
    }
});
