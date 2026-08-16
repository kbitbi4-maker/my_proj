export class Wizard{
    constructor(ctx, width, height){
        this.ctx=ctx;
        this.width=width;
        this.height=height;
        this.calculateScale(width, height);
        this.x=width/2;
        this.y=height/2+10*this.scale;
        
        // Анимация 1: посох качается
        this.staffAngle=0;
        this.staffDirection=1;
        this.staffSpeed=0.015;
        this.staffAmplitude=0.25;
        
        // Анимация 2: дыхание (6 фреймов)
        this.breathFrame=0;
        this.breathTimer=0;
        this.breathSpeed=0.6; // медленное дыхание
        this.breathPhase=0;
        this.breathFrames=6; // 6 фреймов для плавности
        this.breathCycle=0; // 0=вдох, 1=выдох
        
        this.animationVariant=1;
    }
    
    calculateScale(width, height){
        const baseWidth=120;
        const baseHeight=280;
        const padding=0.1;
        const availWidth=width*(1-padding*2);
        const availHeight=height*(1-padding*2);
        const scaleX=availWidth/baseWidth;
        const scaleY=availHeight/baseHeight;
        this.scale=Math.min(scaleX, scaleY, 3.5);
        this.scale=Math.max(this.scale, 0.3);
    }
    
    setAnimationVariant(variant){
        this.animationVariant=variant;
    }
    
    resize(width, height){
        this.width=width;
        this.height=height;
        this.calculateScale(width, height);
        this.x=width/2;
        this.y=height/2+10*this.scale;
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
            this.drawVariant2(ctx, s, x, y);
        }
    }
    
    updateAnimations(frame){
        this.staffAngle+=this.staffSpeed*this.staffDirection;
        if(this.staffAngle>this.staffAmplitude || this.staffAngle<-this.staffAmplitude){
            this.staffDirection*=-1;
        }
        
        this.breathTimer++;
        const frameDelay=Math.floor(60/this.breathSpeed);
        if(this.breathTimer%frameDelay===0){
            this.breathPhase++;
            if(this.breathPhase>=this.breathFrames){
                this.breathPhase=0;
            }
        }
        this.breathFrame=this.breathPhase;
    }
    
    drawVariant1(ctx, s, x, y){
        const staffOffset=this.staffAngle*20*s;
        const breathData=this.getBreathData(0);
        this.drawWizardBase(ctx, s, x, y, breathData, staffOffset);
    }
    
    drawVariant2(ctx, s, x, y){
        const breathData=this.getBreathData(this.breathFrame);
        this.drawWizardBase(ctx, s, x, y, breathData, 0);
    }
    
    getBreathData(frame){
        // 6 фреймов: 0-2 вдох, 3-5 выдох
        const maxChest=5*s;
        const maxShoulder=5*s;
        const maxHand=7*s;
        const maxBeard=3*s;
        
        let chestWidth, shoulderRaise, handRaise, beardRaise;
        
        switch(frame){
            case 0: chestWidth=0; shoulderRaise=0; handRaise=0; beardRaise=0; break;
            case 1: chestWidth=2*s; shoulderRaise=2*s; handRaise=3*s; beardRaise=1*s; break;
            case 2: chestWidth=4*s; shoulderRaise=4*s; handRaise=5*s; beardRaise=2*s; break;
            case 3: chestWidth=5*s; shoulderRaise=5*s; handRaise=7*s; beardRaise=3*s; break;
            case 4: chestWidth=3*s; shoulderRaise=3*s; handRaise=4*s; beardRaise=2*s; break;
            case 5: chestWidth=1*s; shoulderRaise=1*s; handRaise=2*s; beardRaise=1*s; break;
            default: chestWidth=0; shoulderRaise=0; handRaise=0; beardRaise=0;
        }
        
        return { chestWidth, shoulderRaise, handRaise, beardRaise };
    }
    
    drawWizardBase(ctx, s, x, y, breath, staffOffset){
        const cx=x;
        const cy=y;
        const { chestWidth, shoulderRaise, handRaise, beardRaise } = breath;
        const chestExtra=chestWidth;
        const shoulderUp=shoulderRaise;
        const handUp=handRaise;
        const beardUp=beardRaise;
        
        // ========== ШЛЯПА ==========
        ctx.fillStyle='#5a4a5a';
        ctx.fillRect(cx-30*s, cy-85*s, 60*s, 6*s);
        ctx.fillRect(cx-26*s, cy-91*s, 52*s, 8*s);
        ctx.fillRect(cx-22*s, cy-97*s, 44*s, 8*s);
        ctx.fillRect(cx-18*s, cy-103*s, 36*s, 8*s);
        ctx.fillRect(cx-14*s, cy-109*s, 28*s, 8*s);
        ctx.fillRect(cx-10*s, cy-115*s, 20*s, 8*s);
        ctx.fillRect(cx-6*s, cy-121*s, 12*s, 8*s);
        ctx.fillRect(cx-4*s, cy-127*s, 8*s, 8*s);
        ctx.fillRect(cx-2*s, cy-133*s, 4*s, 8*s);
        
        ctx.fillStyle='#4a3a4a';
        ctx.fillRect(cx-36*s, cy-83*s, 72*s, 4*s);
        ctx.fillRect(cx-38*s, cy-79*s, 76*s, 2*s);
        ctx.fillRect(cx-36*s, cy-77*s, 72*s, 2*s);
        
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(cx-22*s, cy-95*s, 44*s, 2*s);
        ctx.fillRect(cx-18*s, cy-101*s, 36*s, 2*s);
        
        // ========== ЛИЦО ==========
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-12*s, cy-76*s, 24*s, 22*s);
        ctx.fillRect(cx-10*s, cy-54*s, 20*s, 4*s);
        
        ctx.fillStyle='#c4a886';
        ctx.fillRect(cx-12*s, cy-70*s, 3*s, 8*s);
        ctx.fillRect(cx+9*s, cy-70*s, 3*s, 8*s);
        
        // ========== ГЛАЗА ==========
        ctx.fillStyle='#8a7a6a';
        ctx.fillRect(cx-9*s, cy-72*s, 6*s, 2*s);
        ctx.fillRect(cx-8*s, cy-70*s, 4*s, 3*s);
        ctx.fillRect(cx+3*s, cy-72*s, 6*s, 2*s);
        ctx.fillRect(cx+4*s, cy-70*s, 4*s, 3*s);
        
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(cx-6*s, cy-71*s, 2*s, 2*s);
        ctx.fillRect(cx+4*s, cy-71*s, 2*s, 2*s);
        
        ctx.fillStyle='#d4d4e0';
        ctx.fillRect(cx-5*s, cy-72*s, 1*s, 1*s);
        ctx.fillRect(cx+5*s, cy-72*s, 1*s, 1*s);
        
        ctx.fillStyle='#a89070';
        ctx.fillRect(cx-10*s, cy-74*s, 2*s, 1*s);
        ctx.fillRect(cx+8*s, cy-74*s, 2*s, 1*s);
        ctx.fillRect(cx-11*s, cy-69*s, 2*s, 1*s);
        ctx.fillRect(cx+9*s, cy-69*s, 2*s, 1*s);
        
        // ========== БРОВИ ==========
        ctx.fillStyle='#b8b8c0';
        ctx.fillRect(cx-10*s, cy-76*s, 8*s, 2*s);
        ctx.fillRect(cx+2*s, cy-76*s, 8*s, 2*s);
        ctx.fillRect(cx-9*s, cy-78*s, 6*s, 2*s);
        ctx.fillRect(cx+3*s, cy-78*s, 6*s, 2*s);
        
        // ========== НОС (меньше и чётче) ==========
        ctx.fillStyle='#c4a886';
        ctx.fillRect(cx-2*s, cy-68*s, 4*s, 3*s);
        ctx.fillRect(cx-3*s, cy-65*s, 6*s, 2*s);
        ctx.fillRect(cx-4*s, cy-63*s, 8*s, 1*s);
        ctx.fillStyle='#a08070';
        ctx.fillRect(cx-2*s, cy-62*s, 2*s, 1*s);
        ctx.fillRect(cx+1*s, cy-62*s, 1*s, 1*s);
        
        // ========== УСЫ (над бородой, разделяют рот) ==========
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(cx-14*s, cy-58*s, 6*s, 3*s);
        ctx.fillRect(cx+8*s, cy-58*s, 6*s, 3*s);
        ctx.fillRect(cx-12*s, cy-56*s, 4*s, 2*s);
        ctx.fillRect(cx+8*s, cy-56*s, 4*s, 2*s);
        
        // ========== РОТ (виден между усами и бородой) ==========
        ctx.fillStyle='#8a7060';
        ctx.fillRect(cx-4*s, cy-56*s, 8*s, 2*s);
        ctx.fillRect(cx-3*s, cy-54*s, 6*s, 1*s);
        ctx.fillStyle='#6a5a4a';
        ctx.fillRect(cx-2*s, cy-56*s, 4*s, 1*s);
        
        // ========== БОРОДА (теперь рисуется поверх мантии) ==========
        // Верхняя часть бороды (поднимается с дыханием)
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(cx-14*s, cy-52*s-beardUp, 28*s, 4*s);
        ctx.fillRect(cx-16*s, cy-48*s-beardUp, 32*s, 4*s);
        ctx.fillRect(cx-18*s, cy-44*s-beardUp, 36*s, 4*s);
        ctx.fillRect(cx-20*s, cy-40*s-beardUp, 40*s, 4*s);
        ctx.fillRect(cx-22*s, cy-36*s-beardUp, 44*s, 4*s);
        ctx.fillRect(cx-24*s, cy-32*s-beardUp, 48*s, 4*s);
        ctx.fillRect(cx-26*s, cy-28*s-beardUp, 52*s, 4*s);
        ctx.fillRect(cx-28*s, cy-24*s-beardUp, 56*s, 4*s);
        ctx.fillRect(cx-30*s, cy-20*s-beardUp, 60*s, 4*s);
        ctx.fillRect(cx-32*s, cy-16*s-beardUp, 64*s, 4*s);
        ctx.fillRect(cx-34*s, cy-12*s-beardUp, 68*s, 4*s);
        ctx.fillRect(cx-32*s, cy-8*s-beardUp, 64*s, 4*s);
        ctx.fillRect(cx-28*s, cy-4*s-beardUp, 56*s, 4*s);
        ctx.fillRect(cx-22*s, cy-0*s-beardUp, 44*s, 4*s);
        
        // Пряди бороды (текстура)
        ctx.fillStyle='#b8b8c0';
        ctx.fillRect(cx-20*s, cy-44*s-beardUp, 2*s, 20*s);
        ctx.fillRect(cx-12*s, cy-40*s-beardUp, 2*s, 24*s);
        ctx.fillRect(cx-4*s, cy-36*s-beardUp, 2*s, 28*s);
        ctx.fillRect(cx+4*s, cy-36*s-beardUp, 2*s, 28*s);
        ctx.fillRect(cx+12*s, cy-40*s-beardUp, 2*s, 24*s);
        ctx.fillRect(cx+20*s, cy-44*s-beardUp, 2*s, 20*s);
        
        // Седые пряди
        ctx.fillStyle='#d8d8e0';
        ctx.fillRect(cx-16*s, cy-48*s-beardUp, 2*s, 8*s);
        ctx.fillRect(cx+14*s, cy-48*s-beardUp, 2*s, 8*s);
        ctx.fillRect(cx-8*s, cy-40*s-beardUp, 2*s, 10*s);
        ctx.fillRect(cx+6*s, cy-40*s-beardUp, 2*s, 10*s);
        ctx.fillRect(cx-4*s, cy-32*s-beardUp, 2*s, 12*s);
        ctx.fillRect(cx+2*s, cy-32*s-beardUp, 2*s, 12*s);
        
        // ========== ПЛЕЧИ И МАНТИЯ ==========
        // Воротник
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(cx-16*s, cy-60*s-shoulderUp, 32*s, 6*s);
        ctx.fillRect(cx-18*s, cy-54*s-shoulderUp, 36*s, 4*s);
        
        // Плечи
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-30*s-chestExtra/2, cy-58*s-shoulderUp, 12*s, 8*s);
        ctx.fillRect(cx-34*s-chestExtra/2, cy-54*s-shoulderUp, 16*s, 6*s);
        ctx.fillRect(cx+18*s+chestExtra/2, cy-58*s-shoulderUp, 12*s, 8*s);
        ctx.fillRect(cx+18*s+chestExtra/2, cy-54*s-shoulderUp, 16*s, 6*s);
        
        // Мантия
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-24*s-chestExtra/2, cy-52*s-shoulderUp, 48*s+chestExtra, 20*s);
        ctx.fillRect(cx-26*s-chestExtra/2, cy-32*s-shoulderUp/2, 52*s+chestExtra, 20*s);
        ctx.fillRect(cx-28*s-chestExtra/3, cy-12*s, 56*s+chestExtra*0.7, 16*s);
        ctx.fillRect(cx-26*s-chestExtra/4, cy+4*s, 52*s+chestExtra*0.5, 16*s);
        ctx.fillRect(cx-22*s-chestExtra/5, cy+20*s, 44*s+chestExtra*0.3, 12*s);
        
        // Складки
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(cx-20*s-chestExtra/3, cy-48*s-shoulderUp/2, 2*s, 24*s);
        ctx.fillRect(cx-12*s-chestExtra/4, cy-44*s-shoulderUp/2, 2*s, 28*s);
        ctx.fillRect(cx-4*s, cy-40*s, 2*s, 32*s);
        ctx.fillRect(cx+4*s, cy-40*s, 2*s, 32*s);
        ctx.fillRect(cx+12*s+chestExtra/4, cy-44*s-shoulderUp/2, 2*s, 28*s);
        ctx.fillRect(cx+20*s+chestExtra/3, cy-48*s-shoulderUp/2, 2*s, 24*s);
        
        // ========== КОНЕЧНОСТИ И ПАЛЬЦЫ ==========
        // Левая рука
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-28*s, cy-44*s, 10*s, 16*s);
        ctx.fillRect(cx-30*s, cy-28*s, 12*s, 12*s);
        ctx.fillRect(cx-28*s, cy-16*s, 10*s, 8*s);
        
        // Кисть левой руки с пальцами
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-26*s, cy-12*s, 6*s, 6*s);
        ctx.fillRect(cx-28*s, cy-10*s, 8*s, 2*s);
        // Пальцы
        ctx.fillRect(cx-28*s, cy-8*s, 2*s, 4*s);
        ctx.fillRect(cx-24*s, cy-8*s, 2*s, 4*s);
        ctx.fillRect(cx-26*s, cy-6*s, 4*s, 3*s);
        
        // Правая рука (с посохом)
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx+18*s+staffOffset, cy-48*s-handUp, 10*s, 18*s+handUp);
        ctx.fillRect(cx+16*s+staffOffset, cy-30*s-handUp, 12*s, 14*s+handUp);
        ctx.fillRect(cx+18*s+staffOffset, cy-16*s-handUp, 10*s, 10*s+handUp);
        
        // Кисть правой руки с пальцами
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx+20*s+staffOffset, cy-12*s-handUp, 6*s, 6*s+handUp);
        ctx.fillRect(cx+18*s+staffOffset, cy-10*s-handUp, 8*s, 2*s);
        // Пальцы (держат посох)
        ctx.fillRect(cx+18*s+staffOffset, cy-8*s-handUp, 2*s, 4*s);
        ctx.fillRect(cx+22*s+staffOffset, cy-8*s-handUp, 2*s, 4*s);
        ctx.fillRect(cx+20*s+staffOffset, cy-6*s-handUp, 4*s, 3*s);
        
        // ========== ПОСОХ ==========
        ctx.fillStyle='#5a3a1a';
        ctx.fillRect(cx+24*s+staffOffset, cy-68*s-handUp, 4*s, 80*s+handUp);
        ctx.fillRect(cx+23*s+staffOffset, cy-68*s-handUp, 6*s, 2*s);
        ctx.fillRect(cx+23*s+staffOffset, cy+10*s-handUp, 6*s, 2*s);
        
        ctx.fillStyle='#6a4a2a';
        for(let i=0; i<6; i++){
            ctx.fillRect(cx+25*s+staffOffset, cy-(60-i*10)*s-handUp, 2*s, 4*s);
        }
        
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(cx+22*s+staffOffset, cy-72*s-handUp, 8*s, 6*s);
        ctx.fillRect(cx+20*s+staffOffset, cy-76*s-handUp, 12*s, 6*s);
        
        const glowPulse=Math.sin(Date.now()/1000)*0.3+0.7;
        ctx.fillStyle=`rgba(80, 180, 255, ${glowPulse*0.8})`;
        ctx.fillRect(cx+22*s+staffOffset, cy-80*s-handUp, 8*s, 8*s);
        ctx.fillRect(cx+20*s+staffOffset, cy-76*s-handUp, 12*s, 4*s);
        
        ctx.fillStyle=`rgba(80, 180, 255, ${glowPulse*0.2})`;
        ctx.fillRect(cx+16*s+staffOffset, cy-86*s-handUp, 20*s, 20*s);
        ctx.fillRect(cx+10*s+staffOffset, cy-80*s-handUp, 32*s, 8*s);
        ctx.fillRect(cx+18*s+staffOffset, cy-88*s-handUp, 16*s, 16*s);
        
        ctx.fillStyle=`rgba(255, 255, 255, ${glowPulse*0.3})`;
        ctx.fillRect(cx+24*s+staffOffset, cy-78*s-handUp, 2*s, 2*s);
        ctx.fillRect(cx+26*s+staffOffset, cy-76*s-handUp, 1*s, 1*s);
        
        // ========== ПОЯС ==========
        ctx.fillStyle='#3a2a1a';
        ctx.fillRect(cx-26*s-chestExtra/4, cy-14*s, 52*s+chestExtra/2, 4*s);
        ctx.fillRect(cx-28*s-chestExtra/4, cy-12*s, 56*s+chestExtra/2, 2*s);
        
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(cx-6*s, cy-16*s, 12*s, 8*s);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(cx-4*s, cy-14*s, 8*s, 4*s);
        ctx.fillStyle='#aa8a4a';
        ctx.fillRect(cx-5*s, cy-15*s, 10*s, 1*s);
        ctx.fillRect(cx-5*s, cy-10*s, 10*s, 1*s);
        
        // ========== СВЕТОТЕНЬ ==========
        ctx.fillStyle='rgba(0,0,0,0.08)';
        ctx.fillRect(cx-28*s-chestExtra/2, cy-50*s-shoulderUp, 4*s, 40*s);
        ctx.fillRect(cx-30*s-chestExtra/3, cy-30*s-shoulderUp/2, 4*s, 30*s);
        ctx.fillRect(cx-30*s-chestExtra/4, cy-10*s, 4*s, 20*s);
        
        ctx.fillStyle='rgba(255,255,255,0.04)';
        ctx.fillRect(cx+24*s+chestExtra/2, cy-50*s-shoulderUp, 4*s, 40*s);
        ctx.fillRect(cx+26*s+chestExtra/3, cy-30*s-shoulderUp/2, 4*s, 30*s);
        ctx.fillRect(cx+26*s+chestExtra/4, cy-10*s, 4*s, 20*s);
    }
}
