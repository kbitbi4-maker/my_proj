export class Wizard{
    constructor(ctx, width, height){
        this.ctx=ctx;
        this.width=width;
        this.height=height;
        
        // Размер волшебника (относительно canvas)
        this.scale=Math.min(width, height)/400;
        this.x=width/2;
        this.y=height/2+20*this.scale;
        
        // Состояние анимации
        this.staffAngle=0;
        this.staffDirection=1;
        this.staffSpeed=0.02;
        this.staffAmplitude=0.3;
    }
    
    resize(width, height){
        this.width=width;
        this.height=height;
        this.scale=Math.min(width, height)/400;
        this.x=width/2;
        this.y=height/2+20*this.scale;
    }
    
    draw(frame){
        const ctx=this.ctx;
        const s=this.scale;
        const x=this.x;
        const y=this.y;
        
        // Обновляем анимацию посоха
        this.staffAngle+=this.staffSpeed*this.staffDirection;
        if(this.staffAngle>this.staffAmplitude || this.staffAngle<-this.staffAmplitude){
            this.staffDirection*=-1;
        }
        
        // === ШЛЯПА ===
        ctx.fillStyle='#6a6a7a';
        ctx.fillRect(x-25*s, y-85*s, 50*s, 8*s);
        ctx.fillRect(x-20*s, y-95*s, 40*s, 12*s);
        ctx.fillRect(x-15*s, y-105*s, 30*s, 12*s);
        ctx.fillRect(x-10*s, y-115*s, 20*s, 12*s);
        ctx.fillRect(x-5*s, y-120*s, 10*s, 10*s);
        
        // Поля шляпы
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-30*s, y-83*s, 60*s, 4*s);
        
        // === ЛИЦО ===
        ctx.fillStyle='#d4b896';
        ctx.fillRect(x-10*s, y-80*s, 20*s, 20*s);
        
        // Глаза
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(x-6*s, y-75*s, 3*s, 3*s);
        ctx.fillRect(x+3*s, y-75*s, 3*s, 3*s);
        
        // Брови
        ctx.fillStyle='#8a8a9a';
        ctx.fillRect(x-8*s, y-78*s, 6*s, 2*s);
        ctx.fillRect(x+2*s, y-78*s, 6*s, 2*s);
        
        // Нос
        ctx.fillStyle='#c4a886';
        ctx.fillRect(x-2*s, y-70*s, 4*s, 6*s);
        
        // === БОРОДА ===
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(x-12*s, y-60*s, 24*s, 8*s);
        ctx.fillRect(x-14*s, y-52*s, 28*s, 8*s);
        ctx.fillRect(x-16*s, y-44*s, 32*s, 8*s);
        ctx.fillRect(x-14*s, y-36*s, 28*s, 8*s);
        ctx.fillRect(x-12*s, y-28*s, 24*s, 8*s);
        
        // === ТЕЛО (МАНТИЯ) ===
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-20*s, y-60*s, 40*s, 25*s);
        ctx.fillRect(x-22*s, y-35*s, 44*s, 25*s);
        ctx.fillRect(x-24*s, y-10*s, 48*s, 15*s);
        ctx.fillRect(x-22*s, y+5*s, 44*s, 15*s);
        
        // Складки на мантии
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(x-18*s, y-45*s, 3*s, 20*s);
        ctx.fillRect(x+15*s, y-45*s, 3*s, 20*s);
        ctx.fillRect(x-20*s, y-20*s, 3*s, 15*s);
        ctx.fillRect(x+17*s, y-20*s, 3*s, 15*s);
        
        // === ПОСОХ ===
        const staffOffset=this.staffAngle*20*s;
        
        // Древко посоха
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(x+25*s+staffOffset, y-70*s, 4*s, 90*s);
        
        // Навершие посоха (кристалл)
        ctx.fillStyle='#4a7aaa';
        ctx.fillRect(x+22*s+staffOffset, y-75*s, 10*s, 10*s);
        ctx.fillRect(x+20*s+staffOffset, y-72*s, 14*s, 6*s);
        
        // Свечение кристалла
        ctx.fillStyle='rgba(74, 122, 170, 0.2)';
        ctx.fillRect(x+18*s+staffOffset, y-80*s, 18*s, 18*s);
        
        // === РУКИ ===
        ctx.fillStyle='#d4b896';
        // Правая рука (держит посох)
        ctx.fillRect(x+20*s+staffOffset, y-50*s, 8*s, 15*s);
        // Левая рука (опущена)
        ctx.fillRect(x-22*s, y-45*s, 8*s, 15*s);
        
        // === ДЕТАЛИ ОДЕЖДЫ ===
        // Пояс
        ctx.fillStyle='#4a3a2a';
        ctx.fillRect(x-22*s, y-15*s, 44*s, 4*s);
        
        // Пряжка
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(x-4*s, y-16*s, 8*s, 6*s);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(x-2*s, y-14*s, 4*s, 2*s);
    }
}
