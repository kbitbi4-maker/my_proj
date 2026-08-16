// Класс управления аудио
export class AudioManager{
    // Конструктор
    constructor(){
        this.menuMusic=null;
        this.isMusicPlaying=false;
        this.volume=0.5
    }
    
    // Инициализация аудио
    async init(){
        try{
            this.audioContext=new(window.AudioContext||window.webkitAudioContext)();
            return true
        }catch(error){
            console.error('Audio initialization failed:',error);
            return false
        }
    }
    
    // Воспроизведение музыки меню
    playMenuMusic(){
        if(this.isMusicPlaying)return;
        this.playChiptuneMelody();
        this.isMusicPlaying=true
    }
    
    // Воспроизведение чиптюн мелодии
    playChiptuneMelody(){
        const ctx=this.audioContext;
        if(!ctx)return;
        const notes=[262,330,392,440,392,330,262,330];
        let noteIndex=0;
        const playNote=()=>{
            if(noteIndex>=notes.length){
                noteIndex=0
            }
            const oscillator=ctx.createOscillator();
            const gainNode=ctx.createGain();
            oscillator.type='square';
            oscillator.frequency.value=notes[noteIndex];
            gainNode.gain.value=0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime+0.2);
            noteIndex++
        };
        this.musicInterval=setInterval(playNote,400);
        setTimeout(()=>playNote(),100)
    }
    
    // Остановка музыки
    stopMusic(){
        if(this.musicInterval){
            clearInterval(this.musicInterval);
            this.musicInterval=null
        }
        this.isMusicPlaying=false
    }
    
    // Установка громкости
    setVolume(volume){
        this.volume=Math.max(0,Math.min(1,volume))
    }
}
