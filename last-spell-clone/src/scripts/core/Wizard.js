export class Wizard{
    constructor(ctx, width, height){
        this.ctx=ctx;
        this.width=width;
        this.height=height;
        this.calculateScale(width, height);
        this.x=width/2;
        this.y=height/2+10*this.scale;
        
        this.staffAngle=0;
        this.staffDirection=1;
        this.staffSpeed=0.015;
        this.staffAmplitude=0.25;
        
        this.breathFrame=0;
        this.breathTimer=0;
        this.breathSpeed=0.6;
        this.breathPhase=0;
        this.breathFrames=4;
        
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
        
        // Отрисовка фона
        ctx.fillStyle='#0a0505';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Звёзды
        for(let i=0; i<30; i++){
            const sx=(i*137+50)%this.width;
            const sy=(i*251+30)%this.height;
            const size=1+Math.random();
            const opacity=0.1+Math.random()*0.3;
            ctx.fillStyle=`rgba(200, 180, 150, ${opacity})`;
            ctx.fillRect(sx, sy, size, size);
        }
        
        // Волшебник
        const staffOffset=this.staffAngle*20*s;
        if(this.animationVariant===1){
            this.drawWizardBase(ctx, s, x, y, this.getBreathData(0), staffOffset);
        } else {
            this.drawWizardBase(ctx, s, x, y, this.getBreathData(this.breathFrame), staffOffset);
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
    
    getBreathData(frame){
        // Используем сохранённый scale
        const s=this.scale;
        let chestWidth=0, shoulderRaise=0, handRaise=0;
        
        switch(frame){
            case 0: chestWidth=0; shoulderRaise=0; handRaise=0; break;
            case 1: chestWidth=2*s; shoulderRaise=2*s; handRaise=3*s; break;
            case 2: chestWidth=4*s; shoulderRaise=4*s; handRaise=6*s; break;
            case 3: chestWidth=1*s; shoulderRaise=1*s; handRaise=2*s; break;
        }
        
        return { chestWidth, shoulderRaise, handRaise };
    }
    
    drawWizardBase(ctx, s, x, y, breath, staffOffset){
        const cx=x;
        const cy=y;
        const chestExtra=breath.chestWidth || 0;
        const shoulderUp=breath.shoulderRaise || 0;
        const handUp=breath.handRaise || 0;
        
        // === ШЛЯПА ===
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
        
        // === ЛИЦО ===
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-12*s, cy-76*s, 24*s, 22*s);
        
        // Глаза (полузакрытые)
        ctx.fillStyle='#8a7a6a';
        ctx.fillRect(cx-9*s, cy-72*s, 6*s, 2*s);
        ctx.fillRect(cx+3*s, cy-72*s, 6*s, 2*s);
        ctx.fillRect(cx-8*s, cy-70*s, 4*s, 3*s);
        ctx.fillRect(cx+4*s, cy-70*s, 4*s, 3*s);
        
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(cx-6*s, cy-71*s, 2*s, 2*s);
        ctx.fillRect(cx+4*s, cy-71*s, 2*s, 2*s);
        
        // Брови
        ctx.fillStyle='#b8b8c0';
        ctx.fillRect(cx-10*s, cy-76*s, 8*s, 2*s);
        ctx.fillRect(cx+2*s, cy-76*s, 8*s, 2*s);
        
        // Нос (маленький и чёткий)
        ctx.fillStyle='#c4a886';
        ctx.fillRect(cx-2*s, cy-68*s, 4*s, 3*s);
        ctx.fillRect(cx-3*s, cy-65*s, 6*s, 2*s);
        ctx.fillRect(cx-4*s, cy-63*s, 8*s, 1*s);
        
        // Усы
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(cx-14*s, cy-58*s, 6*s, 3*s);
        ctx.fillRect(cx+8*s, cy-58*s, 6*s, 3*s);
        
        // Рот
        ctx.fillStyle='#8a7060';
        ctx.fillRect(cx-4*s, cy-56*s, 8*s, 2*s);
        ctx.fillRect(cx-3*s, cy-54*s, 6*s, 1*s);
        
        // === БОРОДА ===
        ctx.fillStyle='#c8c8d0';
        ctx.fillRect(cx-14*s, cy-52*s, 28*s, 4*s);
        ctx.fillRect(cx-16*s, cy-48*s, 32*s, 4*s);
        ctx.fillRect(cx-18*s, cy-44*s, 36*s, 4*s);
        ctx.fillRect(cx-20*s, cy-40*s, 40*s, 4*s);
        ctx.fillRect(cx-22*s, cy-36*s, 44*s, 4*s);
        ctx.fillRect(cx-24*s, cy-32*s, 48*s, 4*s);
        ctx.fillRect(cx-26*s, cy-28*s, 52*s, 4*s);
        ctx.fillRect(cx-28*s, cy-24*s, 56*s, 4*s);
        ctx.fillRect(cx-30*s, cy-20*s, 60*s, 4*s);
        ctx.fillRect(cx-32*s, cy-16*s, 64*s, 4*s);
        ctx.fillRect(cx-34*s, cy-12*s, 68*s, 4*s);
        ctx.fillRect(cx-32*s, cy-8*s, 64*s, 4*s);
        ctx.fillRect(cx-28*s, cy-4*s, 56*s, 4*s);
        ctx.fillRect(cx-22*s, cy-0*s, 44*s, 4*s);
        
        // === ПЛЕЧИ И МАНТИЯ ===
        ctx.fillStyle='#4a4a5a';
        ctx.fillRect(cx-16*s, cy-60*s-shoulderUp, 32*s, 6*s);
        ctx.fillRect(cx-18*s, cy-54*s-shoulderUp, 36*s, 4*s);
        
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-30*s-chestExtra/2, cy-58*s-shoulderUp, 12*s, 8*s);
        ctx.fillRect(cx-34*s-chestExtra/2, cy-54*s-shoulderUp, 16*s, 6*s);
        ctx.fillRect(cx+18*s+chestExtra/2, cy-58*s-shoulderUp, 12*s, 8*s);
        ctx.fillRect(cx+18*s+chestExtra/2, cy-54*s-shoulderUp, 16*s, 6*s);
        
        ctx.fillRect(cx-24*s-chestExtra/2, cy-52*s-shoulderUp, 48*s+chestExtra, 20*s);
        ctx.fillRect(cx-26*s-chestExtra/2, cy-32*s-shoulderUp/2, 52*s+chestExtra, 20*s);
        ctx.fillRect(cx-28*s-chestExtra/3, cy-12*s, 56*s+chestExtra*0.7, 16*s);
        ctx.fillRect(cx-26*s-chestExtra/4, cy+4*s, 52*s+chestExtra*0.5, 16*s);
        
        // === РУКИ ===
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx-28*s, cy-44*s, 10*s, 16*s);
        ctx.fillRect(cx-30*s, cy-28*s, 12*s, 12*s);
        
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx-26*s, cy-12*s, 6*s, 6*s);
        
        // Правая рука
        ctx.fillStyle='#5a5a6a';
        ctx.fillRect(cx+18*s+staffOffset, cy-48*s-handUp, 10*s, 18*s+handUp);
        ctx.fillRect(cx+16*s+staffOffset, cy-30*s-handUp, 12*s, 14*s+handUp);
        
        ctx.fillStyle='#d4b896';
        ctx.fillRect(cx+20*s+staffOffset, cy-12*s-handUp, 6*s, 6*s+handUp);
        
        // === ПОСОХ ===
        ctx.fillStyle='#5a3a1a';
        ctx.fillRect(cx+24*s+staffOffset, cy-68*s-handUp, 4*s, 80*s+handUp);
        
        ctx.fillStyle='#6a4a2a';
        ctx.fillRect(cx+22*s+staffOffset, cy-72*s-handUp, 8*s, 6*s);
        ctx.fillRect(cx+20*s+staffOffset, cy-76*s-handUp, 12*s, 6*s);
        
        // Кристалл
        ctx.fillStyle='rgba(80, 180, 255, 0.8)';
        ctx.fillRect(cx+22*s+staffOffset, cy-80*s-handUp, 8*s, 8*s);
        ctx.fillRect(cx+20*s+staffOffset, cy-76*s-handUp, 12*s, 4*s);
        
        // === ПОЯС ===
        ctx.fillStyle='#3a2a1a';
        ctx.fillRect(cx-26*s-chestExtra/4, cy-14*s, 52*s+chestExtra/2, 4*s);
        ctx.fillRect(cx-28*s-chestExtra/4, cy-12*s, 56*s+chestExtra/2, 2*s);
        
        ctx.fillStyle='#8a7a4a';
        ctx.fillRect(cx-6*s, cy-16*s, 12*s, 8*s);
        ctx.fillStyle='#6a5a3a';
        ctx.fillRect(cx-4*s, cy-14*s, 8*s, 4*s);
    }
}
