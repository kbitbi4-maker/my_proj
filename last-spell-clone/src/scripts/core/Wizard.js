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
        
        // Анимация 2: дыхание (по кадрам)
        this.breathFrame=0;
        this.breathTimer=0;
        this.breathSpeed=3; // кадров в секунду
        this.breathPhase=0; // 0=вдох, 1=выдох
        
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
        this.updateAnimations(frame);
        
        // Рисуем в зависимости от варианта
        if(this.animationVariant===1){
            this.drawVariant1(ctx, s, x, y);
        } else {
            this.drawVariant2(ctx, s, x, y, frame);
        }
    }
    
    updateAnimations(frame){
        // Анимация 1: посох
        this.staffAngle+=this.staffSpeed*this.staffDirection;
        if(this.staffAngle>this.staffAmplitude || this.staffAngle<-this.staffAmplitude){
            this.staffDirection*=-1;
        }
        
        // Анимация 2: дыхание по кадрам
        this.breathTimer++;
        if(this.breathTimer % Math.floor(60/this.breathSpeed) === 0){
            this.breathPhase++;
            // Цикл: 0→1→2→3→2→1→0→...
            const maxFrame=3;
            if(this.breathPhase>maxFrame){
                this.breathPhase=0;
            }
            // Пропускаем фрейм 3 для плавного перехода
            if(this.breathPhase===3){
                this.breathPhase=1;
            }
        }
        this.breathFrame=this.breathPhase;
    }
    
    // === ВАРИАНТ 1: Посох качается ===
    drawVariant1(ctx, s, x, y){
        const staffOffset=this.staffAngle*20*s;
        this.drawWizardBase(ctx, s, x, y, 0, 0, 0, staffOffset);
    }
    
    // === ВАРИАНТ 2: Дыхание по кадрам ===
    drawVariant2(ctx, s, x, y, frame){
        // Определяем смещения для текущего кадра дыхания
        let breathOffset=0;
        let chestWidth=0;
        let shoulderRaise=0;
        let handRaise=0;
        
        switch(this.breathFrame){
            case 0: // Исходное положение
                breathOffset=0;
                chestWidth=0;
                shoulderRaise=0;
                handRaise=0;
                break;
            case 1: // Вдох (первая фаза)
                breathOffset=2*s;
                chestWidth=4*s;
                shoulderRaise=3*s;
                handRaise=4*s;
                break;
            case 2: // Вдох (вторая фаза - пик)
                breathOffset=3*s;
                chestWidth=6*s;
                shoulderRaise=5*s;
                handRaise=7*s;
                break;
            case 3: // Выдох (возврат)
                breathOffset=1*s;
                chestWidth=2*s;
                shoulderRaise=2*s;
                handRaise=3*s;
                break;
        }
        
        this.drawWizardBase(ctx, s, x, y, chestWidth, shoulderRaise, handRaise, 0);
    }
    
    // === БАЗОВАЯ ОТРИСОВКА ВОЛШЕБНИКА ===
    drawWizardBase(ctx, s, x, y, chestWidth, shoulderRaise, handRaise, staffOffset){
        // ---- ШЛЯПА ----
        ctx.fillStyle='#6a6a7a';
        ctx.fillRect(x-25*s, y-85*s, 50*s, 8*s);
        ctx.fillRect(x-20*s, y-95*s, 40*s, 12*s);
        ctx.fillRect(x-15*s, y-105*s, 30*s, 12*s);
        ctx.fillRect(x-10*s, y-115*s, 20*s, 12*s);
        ctx.fillRect(x-5*s, y-120*s, 10*s, 10*s);
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-30*s, y-83*s, 60*s, 4*s);
        
        // ---- ЛИЦО ----
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
        
        // ---- БОРОДА ----
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(x-12*s, y-60*s, 24*s, 8*s);
        ctx.fillRect(x-14*s, y-52*s, 28*s, 8*s);
        ctx.fillRect(x-16*s, y-44*s, 32*s, 8*s);
        ctx.fillRect(x-14*s, y-36*s, 28*s, 8*s);
        ctx.fillRect(x-12*s, y-28*s, 24*s, 8*s);
        
        // ---- ТЕЛО (МАНТИЯ) С ДЫХАНИЕМ ----
        const chestExtra=chestWidth;
        const shoulderUp=shoulderRaise;
        
        // Верх мантии (плечи)
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(x-20*s-chestExtra/2, y-60*s-shoulderUp, 40*s+chestExtra, 25*s);
        
        // Средняя часть (грудь)
        ctx.fillRect(x-22*s-chestExtra/2, y-35*s-shoulderUp/2, 44*s+chestExtra, 25*s);
        
        // Нижняя часть
        ctx.fillRect(x-24*s-chestExtra/3, y-10*s, 48*s+chestExtra*0.7, 15*s);
        ctx.fillRect(x-22*s-chestExtra/4, y+5*s, 44*s+chestExtra*0.5, 15*s);
        
        // ---- СКЛАДКИ ----
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(x-18*s-chestExtra/3, y-45*s-shoulderUp/2, 3*s, 20*s);
        ctx.fillRect(x+15*s+chestExtra/3, y-45*s-shoulderUp/2, 3*s, 20*s);
        ctx.fillRect(x-20*s-chestExtra/4, y-20*s, 3*s, 15*s);
        ctx.fillRect(x+17*s+chestExtra/4, y-20*s, 3*s, 15*s);
        
        // ---- ПОСОХ ----
        const handUp=handRaise;
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(x+25*s+staffOffset, y-70*s-handUp, 4*s, 90*s+handUp);
        
        // Кристалл
        ctx.fillStyle='#4a7aaa';
        ctx.fillRect(x+22*s+staffOffset, y-75*s-handUp, 10*s, 10*s);
        ctx.fillRect(x+20*s+staffOffset, y-72*s-handUp, 14*s, 6*s);
        
        // Свечение
        ctx.fillStyle='rgba(74, 122, 170, 0.2)';
        ctx.fillRect(x+18*s+staffOffset, y-80*s-handUp, 18*s, 18*s);
        
        // ---- РУКИ ----
        ctx.fillStyle='#d4b896';
        // Правая рука (держит посох, поднимается с дыханием)
        ctx.fillRect(x+20*s+staffOffset, y-50*s-handUp, 8*s, 15*s+handUp);
        // Левая рука (опущена)
        ctx.fillRect(x-22*s, y-45*s, 8*s, 15*s);
        
        // ---- ПОЯС ----
        ctx.fillStyle='#4a3a2a';
        ctx.fillRect(x-22*s-chestExtra/4, y-15*s, 44*s+chestExtra/2, 4*s);
        
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(x-4*s, y-16*s, 8*s, 6*s);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(x-2*s, y-14*s, 4*s, 2*s);
    }
}
