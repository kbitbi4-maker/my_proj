export class AudioManager {
    constructor() {
        this.menuMusic = null;
        this.isMusicPlaying = false;
        this.volume = 0.5;
    }

    async init() {
        try {
            // In a real implementation, we would load audio files here
            // For now, we'll use Web Audio API for a simple synth melody
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
            return false;
        }
    }

    playMenuMusic() {
        if (this.isMusicPlaying) return;
        
        // Simple chiptune-like melody using Web Audio API
        this.playChiptuneMelody();
        this.isMusicPlaying = true;
    }

    playChiptuneMelody() {
        const ctx = this.audioContext;
        if (!ctx) return;

        // Simple melody notes (C4, E4, G4, A4, etc.)
        const notes = [262, 330, 392, 440, 392, 330, 262, 330];
        let noteIndex = 0;
        
        const playNote = () => {
            if (noteIndex >= notes.length) {
                noteIndex = 0;
            }
            
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.value = notes[noteIndex];
            
            gainNode.gain.value = 0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
            
            noteIndex++;
        };

        // Play melody in loop
        this.musicInterval = setInterval(playNote, 400);
        setTimeout(() => playNote(), 100); // Start first note quickly
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.isMusicPlaying = false;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}
