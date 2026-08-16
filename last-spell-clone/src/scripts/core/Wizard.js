export class Wizard{
    constructor(ctx, width, height){
        this.ctx=ctx;
        this.width=width;
        this.height=height;
        this.scale=Math.min(width, height)/400;
        this.x=width/2;
        this.y=height/2+20*this.scale;
        
        // Анимация 1: посох качается
        this.staffAngle=0;
        this.staffDirection=1;
        this.staffSpeed=0.02;
        this.staffAmplitude=0.3;
        
        // Анимация 2: дыхание
        this.breathPhase=0;
        this.breathSpeed=0.03;
        this.glowPhase=0;
        
        // Текущий вариант анимации (1 или 2)
        this.animationVariant=1;
    }
    
    setAnimationVariant(variant){
        this.animationVariant=variant;
        console.log('Animation variant changed to:', variant);
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
        
        // Обновляем анимации
        this.updateAnimations();
        
        // Рисуем в зависимости от варианта
        if(this.animationVariant===1){
            this.drawVariant1(ctx, s, x, y);
        } else {
            this.drawVariant2(ctx, s, x, y);
        }
    }
    
    updateAnimations(){
        // Анимация 1: посох
        this.staffAngle+=this.staffSpeed*this.staffDirection;
        if(this.staffAngle>this.staffAmplitude || this.staffAngle<-this.staffAmplitude){
            this.staffDirection*=-1;
        }
        
        // Анимация 2: дыхание и свечение
        this.breathPhase+=this.breathSpeed;
        this.glowPhase+=0.02;
    }
    
    // === ВАРИАНТ 1: Посох качается ===
    drawVariant1(ctx, s, x, y){
        const staffOffset=this.staffAngle*20*s;
        
        // Шляпа
        ctx.fillStyle='#6a6a7a';
        ctx.fillRect(x-25*s, y-85*s, 50*s, 8*s);
        ctx.fillRect(x-20*s, y-95*s, 40*s, 12*s);
        ctx.fillRect(x-15*s, y-105*s, 30*s, 12*s);
        ctx.fillRect(x-10*s, y-115*s, 20*s, 12*s);
        ctx.fillRect(x-5*s, y-120*s, 10*s, 10*s);
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-30*s, y-83*s, 60*s, 4*s);
        
        // Лицо
        ctx.fillStyle='#d4b896';
        ctx.fillRect(x-10*s, y-80*s, 20*s, 20*s);
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(x-6*s, y-75*s, 3*s, 3*s);
        ctx.fillRect(x+3*s, y-75*s, 3*s, 3*s);
        ctx.fillStyle='#8a8a9a';
        ctx.fillRect(x-8*s, y-78*s, 6*s, 2*s);
        ctx.fillRect(x+2*s, y-78*s, 6*s, 2*s);
        ctx.fillStyle='#c4a886';
        ctx.fillRect(x-2*s, y-70*s, 4*s, 6*s);
        
        // Борода
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(x-12*s, y-60*s, 24*s, 8*s);
        ctx.fillRect(x-14*s, y-52*s, 28*s, 8*s);
        ctx.fillRect(x-16*s, y-44*s, 32*s, 8*s);
        ctx.fillRect(x-14*s, y-36*s, 28*s, 8*s);
        ctx.fillRect(x-12*s, y-28*s, 24*s, 8*s);
        
        // Тело (мантия)
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-20*s, y-60*s, 40*s, 25*s);
        ctx.fillRect(x-22*s, y-35*s, 44*s, 25*s);
        ctx.fillRect(x-24*s, y-10*s, 48*s, 15*s);
        ctx.fillRect(x-22*s, y+5*s, 44*s, 15*s);
        
        // Складки
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(x-18*s, y-45*s, 3*s, 20*s);
        ctx.fillRect(x+15*s, y-45*s, 3*s, 20*s);
        ctx.fillRect(x-20*s, y-20*s, 3*s, 15*s);
        ctx.fillRect(x+17*s, y-20*s, 3*s, 15*s);
        
        // Посох (с анимацией)
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(x+25*s+staffOffset, y-70*s, 4*s, 90*s);
        ctx.fillStyle='#4a7aaa';
        ctx.fillRect(x+22*s+staffOffset, y-75*s, 10*s, 10*s);
        ctx.fillRect(x+20*s+staffOffset, y-72*s, 14*s, 6*s);
        ctx.fillStyle='rgba(74, 122, 170, 0.2)';
        ctx.fillRect(x+18*s+staffOffset, y-80*s, 18*s, 18*s);
        
        // Руки
        ctx.fillStyle='#d4b896';
        ctx.fillRect(x+20*s+staffOffset, y-50*s, 8*s, 15*s);
        ctx.fillRect(x-22*s, y-45*s, 8*s, 15*s);
        
        // Пояс
        ctx.fillStyle='#4a3a2a';
        ctx.fillRect(x-22*s, y-15*s, 44*s, 4*s);
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(x-4*s, y-16*s, 8*s, 6*s);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(x-2*s, y-14*s, 4*s, 2*s);
    }
    
    // === ВАРИАНТ 2: Дыхание + свечение посоха ===
    drawVariant2(ctx, s, x, y){
        // Эффект дыхания (масштабирование)
        const breath = Math.sin(this.breathPhase) * 0.02 + 1;
        const breathX = x;
        const breathY = y * (1 + (breath - 1) * 0.5);
        const breathS = s * breath;
        
        // Свечение посоха (пульсирует)
        const glowIntensity = Math.sin(this.glowPhase) * 0.3 + 0.5;
        
        // Шляпа
        ctx.fillStyle='#6a6a7a';
        ctx.fillRect(breathX-25*breathS, breathY-85*breathS, 50*breathS, 8*breathS);
        ctx.fillRect(breathX-20*breathS, breathY-95*breathS, 40*breathS, 12*breathS);
        ctx.fillRect(breathX-15*breathS, breathY-105*breathS, 30*breathS, 12*breathS);
        ctx.fillRect(breathX-10*breathS, breathY-115*breathS, 20*breathS, 12*breathS);
        ctx.fillRect(breathX-5*breathS, breathY-120*breathS, 10*breathS, 10*breathS);
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(breathX-30*breathS, breathY-83*breathS, 60*breathS, 4*breathS);
        
        // Лицо
        ctx.fillStyle='#d4b896';
        ctx.fillRect(breathX-10*breathS, breathY-80*breathS, 20*breathS, 20*breathS);
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(breathX-6*breathS, breathY-75*breathS, 3*breathS, 3*breathS);
        ctx.fillRect(breathX+3*breathS, breathY-75*breathS, 3*breathS, 3*breathS);
        ctx.fillStyle='#8a8a9a';
        ctx.fillRect(breathX-8*breathS, breathY-78*breathS, 6*breathS, 2*breathS);
        ctx.fillRect(breathX+2*breathS, breathY-78*breathS, 6*breathS, 2*breathS);
        ctx.fillStyle='#c4a886';
        ctx.fillRect(breathX-2*breathS, breathY-70*breathS, 4*breathS, 6*breathS);
        
        // Борода (слегка колышется)
        const beardWave = Math.sin(this.breathPhase * 0.5) * 2 * breathS;
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(breathX-12*breathS+beardWave*0.2, breathY-60*breathS, 24*breathS, 8*breathS);
        ctx.fillRect(breathX-14*breathS+beardWave*0.3, breathY-52*breathS, 28*breathS, 8*breathS);
        ctx.fillRect(breathX-16*breathS+beardWave*0.4, breathY-44*breathS, 32*breathS, 8*breathS);
        ctx.fillRect(breathX-14*breathS+beardWave*0.3, breathY-36*breathS, 28*breathS, 8*breathS);
        ctx.fillRect(breathX-12*breathS+beardWave*0.2, breathY-28*breathS, 24*breathS, 8*breathS);
        
        // Тело (мантия) - тоже "дышит"
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(breathX-20*breathS, breathY-60*breathS, 40*breathS, 25*breathS);
        ctx.fillRect(breathX-22*breathS, breathY-35*breathS, 44*breathS, 25*breathS);
        ctx.fillRect(breathX-24*breathS, breathY-10*breathS, 48*breathS, 15*breathS);
        ctx.fillRect(breathX-22*breathS, breathY+5*breathS, 44*breathS, 15*breathS);
        
        // Складки
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(breathX-18*breathS, breathY-45*breathS, 3*breathS, 20*breathS);
        ctx.fillRect(breathX+15*breathS, breathY-45*breathS, 3*breathS, 20*breathS);
        ctx.fillRect(breathX-20*breathS, breathY-20*breathS, 3*breathS, 15*breathS);
        ctx.fillRect(breathX+17*breathS, breathY-20*breathS, 3*breathS, 15*breathS);
        
        // Посох (свечение)
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(breathX+25*breathS, breathY-70*breathS, 4*breathS, 90*breathS);
        
        // Свечение кристалла (пульсирует)
        ctx.fillStyle=`rgba(100, 200, 255, ${glowIntensity * 0.3})`;
        ctx.fillRect(breathX+15*breathS, breathY-85*breathS, 24*breathS, 24*breathS);
        ctx.fillRect(breathX+10*breathS, breathY-80*breathS, 34*breathS, 14*breathS);
        
        // Кристалл (яркий)
        ctx.fillStyle=`rgba(80, 180, 255, ${glowIntensity * 0.7 + 0.3})`;
        ctx.fillRect(breathX+22*breathS, breathY-75*breathS, 10*breathS, 10*breathS);
        ctx.fillRect(breathX+20*breathS, breathY-72*breathS, 14*breathS, 6*breathS);
        
        // Вспышки от кристалла
        if(glowIntensity > 0.7){
            ctx.fillStyle=`rgba(255, 255, 255, ${(glowIntensity - 0.7) * 2})`;
            ctx.fillRect(breathX+23*breathS, breathY-78*breathS, 8*breathS, 4*breathS);
            ctx.fillRect(breathX+27*breathS, breathY-74*breathS, 4*breathS, 8*breathS);
        }
        
        // Руки
        ctx.fillStyle='#d4b896';
        ctx.fillRect(breathX+20*breathS, breathY-50*breathS, 8*breathS, 15*breathS);
        ctx.fillRect(breathX-22*breathS, breathY-45*breathS, 8*breathS, 15*breathS);
        
        // Пояс
        ctx.fillStyle='#4a3a2a';
        ctx.fillRect(breathX-22*breathS, breathY-15*breathS, 44*breathS, 4*breathS);
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(breathX-4*breathS, breathY-16*breathS, 8*breathS, 6*breathS);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(breathX-2*breathS, breathY-14*breathS, 4*breathS, 2*breathS);
    }
}
