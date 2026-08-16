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
        this.breathSpeed=1.2;
        this.breathPhase=0;
        
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
        
        this.updateAnimations(frame);
        
        if(this.animationVariant===1){
            this.drawVariant1(ctx, s, x, y);
        } else {
            this.drawVariant2(ctx, s, x, y, frame);
        }
    }
    
    updateAnimations(frame){
        this.staffAngle+=this.staffSpeed*this.staffDirection;
        if(this.staffAngle>this.staffAmplitude || this.staffAngle<-this.staffAmplitude){
            this.staffDirection*=-1;
        }
        
        this.breathTimer++;
        if(this.breathTimer % Math.floor(60/this.breathSpeed) === 0){
            this.breathPhase++;
            const maxFrame=3;
            if(this.breathPhase>maxFrame){
                this.breathPhase=0;
            }
            if(this.breathPhase===3){
                this.breathPhase=1;
            }
        }
        this.breathFrame=this.breathPhase;
    }
    
    drawVariant1(ctx, s, x, y){
        const staffOffset=this.staffAngle*20*s;
        this.drawWizardBase(ctx, s, x, y, 0, 0, 0, staffOffset);
    }
    
    drawVariant2(ctx, s, x, y, frame){
        let breathOffset=0;
        let chestWidth=0;
        let shoulderRaise=0;
        let handRaise=0;
        
        switch(this.breathFrame){
            case 0:
                breathOffset=0;
                chestWidth=0;
                shoulderRaise=0;
                handRaise=0;
                break;
            case 1:
                breathOffset=2*s;
                chestWidth=4*s;
                shoulderRaise=3*s;
                handRaise=4*s;
                break;
            case 2:
                breathOffset=3*s;
                chestWidth=6*s;
                shoulderRaise=5*s;
                handRaise=7*s;
                break;
            case 3:
                breathOffset=1*s;
                chestWidth=2*s;
                shoulderRaise=2*s;
                handRaise=3*s;
                break;
        }
        
        this.drawWizardBase(ctx, s, x, y, chestWidth, shoulderRaise, handRaise, 0);
    }
    
    drawWizardBase(ctx, s, x, y, chestWidth, shoulderRaise, handRaise, staffOffset){
        const sw = s * 3; // Масштаб детализации (увеличен в 3 раза)
        const cx = x;
        const cy = y;
        
        // ========== ШЛЯПА (детализированная) ==========
        // Основание шляпы
        ctx.fillStyle='#5a4a5a';
        ctx.fillRect(cx-30*sw, cy-85*sw, 60*sw, 6*sw);
        ctx.fillRect(cx-26*sw, cy-91*sw, 52*sw, 8*sw);
        ctx.fillRect(cx-22*sw, cy-97*sw, 44*sw, 8*sw);
        ctx.fillRect(cx-18*sw, cy-103*sw, 36*sw, 8*sw);
        ctx.fillRect(cx-14*sw, cy-109*sw, 28*sw, 8*sw);
        ctx.fillRect(cx-10*sw, cy-115*sw, 20*sw, 8*sw);
        ctx.fillRect(cx-6*sw, cy-121*sw, 12*sw, 8*sw);
        ctx.fillRect(cx-4*sw, cy-127*sw, 8*sw, 8*sw);
        ctx.fillRect(cx-2*sw, cy-133*sw, 4*sw, 8*sw);
        
        // Поля шляпы (широкие)
        ctx.fillStyle='#4a3a4a';
        ctx.fillRect(cx-36*sw, cy-83*sw, 72*sw, 4*sw);
        ctx.fillRect(cx-38*sw, cy-79*sw, 76*sw, 2*sw);
        ctx.fillRect(cx-36*sw, cy-77*sw, 72*sw, 2*sw);
        
        // Узор на шляпе (золотая полоса)
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(cx-22*sw, cy-95*sw, 44*sw, 2*sw);
        ctx.fillRect(cx-18*sw, cy-101*sw, 36*sw, 2*sw);
        
        // ========== ЛИЦО (детализированное) ==========
        // Основа лица
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-12*sw, cy-76*sw, 24*sw, 22*sw);
        ctx.fillRect(cx-10*sw, cy-54*sw, 20*sw, 4*sw);
        
        // Скулы (лёгкая тень)
        ctx.fillStyle='#c4a886';
        ctx.fillRect(cx-12*sw, cy-70*sw, 3*sw, 8*sw);
        ctx.fillRect(cx+9*sw, cy-70*sw, 3*sw, 8*sw);
        
        // ========== ГЛАЗА (полузакрытые, мудрые) ==========
        // Левое веко (полузакрытое)
        ctx.fillStyle='#8a7a6a';
        ctx.fillRect(cx-9*sw, cy-72*sw, 6*sw, 2*sw);
        ctx.fillRect(cx-8*sw, cy-70*sw, 4*sw, 3*sw);
        // Правый глаз (полузакрытое)
        ctx.fillRect(cx+3*sw, cy-72*sw, 6*sw, 2*sw);
        ctx.fillRect(cx+4*sw, cy-70*sw, 4*sw, 3*sw);
        
        // Зрачки (смотрят вдаль)
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(cx-6*sw, cy-71*sw, 2*sw, 2*sw);
        ctx.fillRect(cx+4*sw, cy-71*sw, 2*sw, 2*sw);
        
        // Блики в глазах
        ctx.fillStyle='#d4d4e0';
        ctx.fillRect(cx-5*sw, cy-72*sw, 1*sw, 1*sw);
        ctx.fillRect(cx+5*sw, cy-72*sw, 1*sw, 1*sw);
        
        // Мудрые морщины вокруг глаз
        ctx.fillStyle='#a89070';
        ctx.fillRect(cx-10*sw, cy-74*sw, 2*sw, 1*sw);
        ctx.fillRect(cx+8*sw, cy-74*sw, 2*sw, 1*sw);
        ctx.fillRect(cx-11*sw, cy-69*sw, 2*sw, 1*sw);
        ctx.fillRect(cx+9*sw, cy-69*sw, 2*sw, 1*sw);
        
        // ========== БРОВИ (кустистые, седые) ==========
        ctx.fillStyle='#b8b8c0';
        ctx.fillRect(cx-10*sw, cy-76*sw, 8*sw, 2*sw);
        ctx.fillRect(cx+2*sw, cy-76*sw, 8*sw, 2*sw);
        ctx.fillRect(cx-9*sw, cy-78*sw, 6*sw, 2*sw);
        ctx.fillRect(cx+3*sw, cy-78*sw, 6*sw, 2*sw);
        
        // ========== НОС (выразительный) ==========
        ctx.fillStyle='#c4a886';
        ctx.fillRect(cx-3*sw, cy-68*sw, 6*sw, 4*sw);
        ctx.fillRect(cx-4*sw, cy-64*sw, 8*sw, 3*sw);
        ctx.fillRect(cx-5*sw, cy-61*sw, 10*sw, 2*sw);
        // Ноздри
        ctx.fillStyle='#a08070';
        ctx.fillRect(cx-3*sw, cy-60*sw, 2*sw, 1*sw);
        ctx.fillRect(cx+1*sw, cy-60*sw, 2*sw, 1*sw);
        
        // ========== БОРОДА (длинная, седая, детализированная) ==========
        ctx.fillStyle='#c8c8d0';
        // Верхняя часть бороды
        ctx.fillRect(cx-14*sw, cy-56*sw, 28*sw, 4*sw);
        ctx.fillRect(cx-16*sw, cy-52*sw, 32*sw, 4*sw);
        ctx.fillRect(cx-18*sw, cy-48*sw, 36*sw, 4*sw);
        // Средняя часть
        ctx.fillRect(cx-20*sw, cy-44*sw, 40*sw, 4*sw);
        ctx.fillRect(cx-22*sw, cy-40*sw, 44*sw, 4*sw);
        ctx.fillRect(cx-24*sw, cy-36*sw, 48*sw, 4*sw);
        // Нижняя часть
        ctx.fillRect(cx-26*sw, cy-32*sw, 52*sw, 4*sw);
        ctx.fillRect(cx-28*sw, cy-28*sw, 56*sw, 4*sw);
        ctx.fillRect(cx-30*sw, cy-24*sw, 60*sw, 4*sw);
        ctx.fillRect(cx-32*sw, cy-20*sw, 64*sw, 4*sw);
        // Кончик бороды
        ctx.fillRect(cx-34*sw, cy-16*sw, 68*sw, 4*sw);
        ctx.fillRect(cx-32*sw, cy-12*sw, 64*sw, 4*sw);
        ctx.fillRect(cx-28*sw, cy-8*sw, 56*sw, 4*sw);
        ctx.fillRect(cx-22*sw, cy-4*sw, 44*sw, 4*sw);
        
        // Пряди бороды (текстура)
        ctx.fillStyle='#b8b8c0';
        ctx.fillRect(cx-20*sw, cy-48*sw, 2*sw, 20*sw);
        ctx.fillRect(cx-12*sw, cy-44*sw, 2*sw, 24*sw);
        ctx.fillRect(cx-4*sw, cy-40*sw, 2*sw, 28*sw);
        ctx.fillRect(cx+4*sw, cy-40*sw, 2*sw, 28*sw);
        ctx.fillRect(cx+12*sw, cy-44*sw, 2*sw, 24*sw);
        ctx.fillRect(cx+20*sw, cy-48*sw, 2*sw, 20*sw);
        
        // ========== ПЛЕЧИ И МАНТИЯ (детализированные) ==========
        const chestExtra=chestWidth;
        const shoulderUp=shoulderRaise;
        
        // Воротник
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(cx-16*sw, cy-60*sw-shoulderUp, 32*sw, 6*sw);
        ctx.fillRect(cx-18*sw, cy-54*sw-shoulderUp, 36*sw, 4*sw);
        
        // Плечи (с наплечниками)
        ctx.fillStyle='#5a5a6a';
        // Левое плечо
        ctx.fillRect(cx-30*sw-chestExtra/2, cy-58*sw-shoulderUp, 12*sw, 8*sw);
        ctx.fillRect(cx-34*sw-chestExtra/2, cy-54*sw-shoulderUp, 16*sw, 6*sw);
        // Правое плечо
        ctx.fillRect(cx+18*sw+chestExtra/2, cy-58*sw-shoulderUp, 12*sw, 8*sw);
        ctx.fillRect(cx+18*sw+chestExtra/2, cy-54*sw-shoulderUp, 16*sw, 6*sw);
        
        // Основная мантия
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-24*sw-chestExtra/2, cy-52*sw-shoulderUp, 48*sw+chestExtra, 20*sw);
        ctx.fillRect(cx-26*sw-chestExtra/2, cy-32*sw-shoulderUp/2, 52*sw+chestExtra, 20*sw);
        ctx.fillRect(cx-28*sw-chestExtra/3, cy-12*sw, 56*sw+chestExtra*0.7, 16*sw);
        ctx.fillRect(cx-26*sw-chestExtra/4, cy+4*sw, 52*sw+chestExtra*0.5, 16*sw);
        ctx.fillRect(cx-22*sw-chestExtra/5, cy+20*sw, 44*sw+chestExtra*0.3, 12*sw);
        
        // Складки мантии (детализированные)
        ctx.fillStyle='#4a4a5a';
        // Вертикальные складки
        ctx.fillRect(cx-20*sw-chestExtra/3, cy-48*sw-shoulderUp/2, 2*sw, 24*sw);
        ctx.fillRect(cx-12*sw-chestExtra/4, cy-44*sw-shoulderUp/2, 2*sw, 28*sw);
        ctx.fillRect(cx-4*sw, cy-40*sw, 2*sw, 32*sw);
        ctx.fillRect(cx+4*sw, cy-40*sw, 2*sw, 32*sw);
        ctx.fillRect(cx+12*sw+chestExtra/4, cy-44*sw-shoulderUp/2, 2*sw, 28*sw);
        ctx.fillRect(cx+20*sw+chestExtra/3, cy-48*sw-shoulderUp/2, 2*sw, 24*sw);
        
        // Горизонтальные складки
        ctx.fillRect(cx-24*sw-chestExtra/3, cy-40*sw-shoulderUp/2, 48*sw+chestExtra*0.7, 1*sw);
        ctx.fillRect(cx-26*sw-chestExtra/3, cy-28*sw-shoulderUp/3, 52*sw+chestExtra*0.7, 1*sw);
        ctx.fillRect(cx-26*sw-chestExtra/4, cy-16*sw, 52*sw+chestExtra*0.5, 1*sw);
        
        // ========== РУКАВА (детализированные) ==========
        const handUp=handRaise;
        
        // Левый рукав (свисает)
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-28*sw, cy-44*sw, 10*sw, 16*sw);
        ctx.fillRect(cx-30*sw, cy-28*sw, 12*sw, 12*sw);
        ctx.fillRect(cx-28*sw, cy-16*sw, 10*sw, 8*sw);
        
        // Кисть левой руки
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-26*sw, cy-12*sw, 6*sw, 6*sw);
        ctx.fillRect(cx-28*sw, cy-10*sw, 8*sw, 2*sw);
        
        // Правый рукав (с посохом)
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx+18*sw+staffOffset, cy-48*sw-handUp, 10*sw, 18*sw+handUp);
        ctx.fillRect(cx+16*sw+staffOffset, cy-30*sw-handUp, 12*sw, 14*sw+handUp);
        ctx.fillRect(cx+18*sw+staffOffset, cy-16*sw-handUp, 10*sw, 10*sw+handUp);
        
        // Кисть правой руки (держит посох)
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx+20*sw+staffOffset, cy-12*sw-handUp, 6*sw, 6*sw+handUp);
        ctx.fillRect(cx+18*sw+staffOffset, cy-10*sw-handUp, 8*sw, 2*sw);
        
        // ========== ПОСОХ (детализированный) ==========
        // Древко
        ctx.fillStyle='#5a3a1a';
        ctx.fillRect(cx+24*sw+staffOffset, cy-68*sw-handUp, 4*sw, 80*sw+handUp);
        ctx.fillRect(cx+23*sw+staffOffset, cy-68*sw-handUp, 6*sw, 2*sw);
        ctx.fillRect(cx+23*sw+staffOffset, cy+10*sw-handUp, 6*sw, 2*sw);
        
        // Узоры на посохе
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(cx+25*sw+staffOffset, cy-60*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+25*sw+staffOffset, cy-50*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+25*sw+staffOffset, cy-40*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+25*sw+staffOffset, cy-30*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+25*sw+staffOffset, cy-20*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+25*sw+staffOffset, cy-10*sw-handUp, 2*sw, 4*sw);
        
        // Навершие посоха (основа)
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(cx+22*sw+staffOffset, cy-72*sw-handUp, 8*sw, 6*sw);
        ctx.fillRect(cx+20*sw+staffOffset, cy-76*sw-handUp, 12*sw, 6*sw);
        
        // Кристалл (большой, светящийся)
        const glowPulse = Math.sin(Date.now() / 1000) * 0.3 + 0.7;
        ctx.fillStyle=`rgba(80, 180, 255, ${glowPulse * 0.8})`;
        ctx.fillRect(cx+22*sw+staffOffset, cy-80*sw-handUp, 8*sw, 8*sw);
        ctx.fillRect(cx+20*sw+staffOffset, cy-76*sw-handUp, 12*sw, 4*sw);
        
        // Свечение кристалла
        ctx.fillStyle=`rgba(80, 180, 255, ${glowPulse * 0.2})`;
        ctx.fillRect(cx+16*sw+staffOffset, cy-86*sw-handUp, 20*sw, 20*sw);
        ctx.fillRect(cx+10*sw+staffOffset, cy-80*sw-handUp, 32*sw, 8*sw);
        ctx.fillRect(cx+18*sw+staffOffset, cy-88*sw-handUp, 16*sw, 16*sw);
        
        // Блики на кристалле
        ctx.fillStyle=`rgba(255, 255, 255, ${glowPulse * 0.3})`;
        ctx.fillRect(cx+24*sw+staffOffset, cy-78*sw-handUp, 2*sw, 2*sw);
        ctx.fillRect(cx+26*sw+staffOffset, cy-76*sw-handUp, 1*sw, 1*sw);
        
        // ========== ПОЯС (детализированный) ==========
        ctx.fillStyle='#3a2a1a';
        ctx.fillRect(cx-26*sw-chestExtra/4, cy-14*sw, 52*sw+chestExtra/2, 4*sw);
        ctx.fillRect(cx-28*sw-chestExtra/4, cy-12*sw, 56*sw+chestExtra/2, 2*sw);
        
        // Пряжка (золотая, детализированная)
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(cx-6*sw, cy-16*sw, 12*sw, 8*sw);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(cx-4*sw, cy-14*sw, 8*sw, 4*sw);
        ctx.fillStyle='#aa8a4a';
        ctx.fillRect(cx-5*sw, cy-15*sw, 10*sw, 1*sw);
        ctx.fillRect(cx-5*sw, cy-10*sw, 10*sw, 1*sw);
        
        // ========== МЕЛКИЕ ДЕТАЛИ ==========
        // Складки на рукавах
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(cx-28*sw, cy-38*sw, 2*sw, 4*sw);
        ctx.fillRect(cx-28*sw, cy-30*sw, 2*sw, 4*sw);
        ctx.fillRect(cx+20*sw+staffOffset, cy-36*sw-handUp, 2*sw, 4*sw);
        ctx.fillRect(cx+20*sw+staffOffset, cy-26*sw-handUp, 2*sw, 4*sw);
        
        // Тень под шляпой
        ctx.fillStyle='rgba(0,0,0,0.15)';
        ctx.fillRect(cx-14*sw, cy-76*sw, 28*sw, 2*sw);
        ctx.fillRect(cx-12*sw, cy-74*sw, 24*sw, 1*sw);
        
        // Лёгкая тень на лице (скулы)
        ctx.fillStyle='rgba(0,0,0,0.05)';
        ctx.fillRect(cx-10*sw, cy-68*sw, 4*sw, 4*sw);
        ctx.fillRect(cx+6*sw, cy-68*sw, 4*sw, 4*sw);
        
        // Борода - добавление седых прядей
        ctx.fillStyle='#d8d8e0';
        ctx.fillRect(cx-16*sw, cy-52*sw, 2*sw, 8*sw);
        ctx.fillRect(cx+14*sw, cy-52*sw, 2*sw, 8*sw);
        ctx.fillRect(cx-8*sw, cy-44*sw, 2*sw, 10*sw);
        ctx.fillRect(cx+6*sw, cy-44*sw, 2*sw, 10*sw);
        ctx.fillRect(cx-4*sw, cy-36*sw, 2*sw, 12*sw);
        ctx.fillRect(cx+2*sw, cy-36*sw, 2*sw, 12*sw);
        
        // ========== СВЕТОТЕНЬ (объём) ==========
        // Тень с левой стороны мантии
        ctx.fillStyle='rgba(0,0,0,0.08)';
        ctx.fillRect(cx-28*sw-chestExtra/2, cy-50*sw-shoulderUp, 4*sw, 40*sw);
        ctx.fillRect(cx-30*sw-chestExtra/3, cy-30*sw-shoulderUp/2, 4*sw, 30*sw);
        ctx.fillRect(cx-30*sw-chestExtra/4, cy-10*sw, 4*sw, 20*sw);
        
        // Свет с правой стороны (блик)
        ctx.fillStyle='rgba(255,255,255,0.04)';
        ctx.fillRect(cx+24*sw+chestExtra/2, cy-50*sw-shoulderUp, 4*sw, 40*sw);
        ctx.fillRect(cx+26*sw+chestExtra/3, cy-30*sw-shoulderUp/2, 4*sw, 30*sw);
        ctx.fillRect(cx+26*sw+chestExtra/4, cy-10*sw, 4*sw, 20*sw);
    }
}
