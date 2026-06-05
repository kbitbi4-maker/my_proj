// version: v1.2
let currentWinPlayer = null;
let currentAlienPlayer = null;
let currentFailPlayer = null;
let alienRepeatCount = 0;

export const soundFlags = {
    simFailSoundPlayed: false,
    finFailSoundPlayed: false,
    simWinSoundPlayed: false,
    finWinSoundPlayed: false
};

export function resetAllFeedbacks() {
    if (currentWinPlayer) { currentWinPlayer.pause(); currentWinPlayer = null; }
    if (currentAlienPlayer) { currentAlienPlayer.onended = null; currentAlienPlayer.pause(); currentAlienPlayer = null; }
    if (currentFailPlayer) { currentFailPlayer.pause(); currentFailPlayer = null; }
    alienRepeatCount = 0;
    soundFlags.simFailSoundPlayed = false;
    soundFlags.finFailSoundPlayed = false;
    soundFlags.simWinSoundPlayed = false;
    soundFlags.finWinSoundPlayed = false;
}

export function triggerTensWinSound() {
    if (currentWinPlayer) return; 
    try {
        currentWinPlayer = new Audio('audio/win.mp3'); currentWinPlayer.volume = 0.25;
        currentWinPlayer.onended = () => { currentWinPlayer = null; }; currentWinPlayer.play();
    } catch (e) { console.warn("Audio blocked:", e); }
}

export function triggerWinFeedback() {
    if (currentAlienPlayer) return; 
    try {
        currentAlienPlayer = new Audio('audio/alien_win.mp3'); currentAlienPlayer.volume = 0.25; alienRepeatCount = 1;
        currentAlienPlayer.onended = () => { if (alienRepeatCount < 3) { alienRepeatCount++; currentAlienPlayer?.play(); } else if (currentAlienPlayer) { currentAlienPlayer.onended = null; currentAlienPlayer = null; } };
        currentAlienPlayer.play();
    } catch (e) { console.warn("Audio blocked:", e); }
}

export function triggerFailFeedback() {
    try {
        if (currentFailPlayer) { currentFailPlayer.currentTime = 0; currentFailPlayer.play(); } 
        else { currentFailPlayer = new Audio('audio/fail.mp3'); currentFailPlayer.volume = 0.25; currentFailPlayer.play(); }
    } catch (e) { console.warn("Audio blocked:", e); }
}

/**
 * Единый диспетчер проигрывания звуков для VisualEngine
 */
export function handleVisualSound(soundType, phase, hasEquals) {
    if (soundType === "alien_win" && !soundFlags.finWinSoundPlayed) {
        triggerWinFeedback(); soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
    } else if (soundType === "win" && !soundFlags.simWinSoundPlayed && phase === 2) {
        triggerTensWinSound(); soundFlags.simWinSoundPlayed = true;
    } else if (soundType === "win" && !soundFlags.finWinSoundPlayed && phase === 3) {
        triggerTensWinSound(); soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
    } else if (soundType === "fail") {
        if (hasEquals && !soundFlags.finFailSoundPlayed) { triggerFailFeedback(); soundFlags.finFailSoundPlayed = true; }
        else if (!hasEquals && !soundFlags.simFailSoundPlayed) { triggerFailFeedback(); soundFlags.simFailSoundPlayed = true; }
    }
}
