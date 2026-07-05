import { EditorCore } from './editor_core.js';

export const AnimationPlayer = {
    frames: [],
    currentIndex: 0,
    isPlaying: false,
    intervalId: null,
    pCanvas: null,
    pCtx: null,

    init() {
        this.pCanvas = document.getElementById('previewCanvas');
        if (!this.pCanvas) return;
        this.pCtx = this.pCanvas.getContext('2d');
        this.frames.push(Array(40).fill(null).map(() => Array(40).fill(null)));
        this.updateUI();
        this.drawPreview(0);
    },

    getCurrentGrid() { return this.frames[this.currentIndex]; },
    setCurrentGrid(newGrid) { this.frames[this.currentIndex] = newGrid; this.updateConsoleCode(); },

    handleGridResize(newW, newH) {
        this.frames = this.frames.map(() => Array(newH).fill(null).map(() => Array(newW).fill(null)));
        this.currentIndex = 0;
        this.updateUI();
        this.drawPreview(0);
    },

    addFrame() {
        const copy = this.frames[this.currentIndex].map(row => [...row]);
        this.frames.push(copy); this.currentIndex = this.frames.length - 1;
        this.updateUI(); EditorCore.draw(); this.drawPreview(this.currentIndex);
    },

    deleteFrame(idx, e) {
        e.stopPropagation(); if (this.frames.length <= 1) return;
        this.frames.splice(idx, 1);
        if (this.currentIndex >= this.frames.length) this.currentIndex = this.frames.length - 1;
        this.updateUI(); EditorCore.draw(); this.drawPreview(this.currentIndex);
    },

    updateConsoleCode() {
        const grid = this.frames[this.currentIndex];
        let compressedLines = [];
        for (let r = 0; r < EditorCore.GRID_H; r++) {
            let rowPackets = []; let c = 0;
            while (c < EditorCore.GRID_W) {
                if (grid[r][c] !== null) {
                    let startC = c; let color = grid[r][c]; let count = 0;
                    while (c < EditorCore.GRID_W && grid[r][c] === color) { count++; c++; }
                    rowPackets.push(`${startC},${count},${color}`);
                } else c++;
            }
            if (rowPackets.length > 0) compressedLines.push(`${r}:${rowPackets.join('|')}`);
        }
        document.getElementById('frameConsole').value = compressedLines.join('\n');
    },

    loadFrameFromCode() {
        const text = document.getElementById('frameConsole').value.trim();
        const newGrid = Array(EditorCore.GRID_H).fill(null).map(() => Array(EditorCore.GRID_W).fill(null));
        if (text) {
            text.split('\n').forEach(line => {
                const parts = line.split(':'); if (parts.length !== 2) return;
                const r = parseInt(parts[0], 10); if (r < 0 || r >= EditorCore.GRID_H) return;
                parts[1].split('|').forEach(packet => {
                    const data = packet.split(',');
                    if (data.length === 3) {
                        const startC = parseInt(data[0], 10); const count = parseInt(data[1], 10); const color = data[2].trim();
                        for (let i = 0; i < count; i++) {
                            let currentC = startC + i;
                            if (currentC >= 0 && currentC < EditorCore.GRID_W) newGrid[r][currentC] = color;
                        }
                    }
                });
            });
        }
        this.frames[this.currentIndex] = newGrid; EditorCore.draw(); this.drawPreview(this.currentIndex);
    },

    drawPreview(idx) {
        if (!this.pCtx) return; this.pCtx.clearRect(0, 0, this.pCanvas.width, this.pCanvas.height);
        const grid = this.frames[idx];
        const pSizeX = this.pCanvas.width / EditorCore.GRID_W;
        const pSizeY = this.pCanvas.height / EditorCore.GRID_H;
        for (let r = 0; r < EditorCore.GRID_H; r++) {
            for (let c = 0; c < EditorCore.GRID_W; c++) {
                if (grid[r][c]) { this.pCtx.fillStyle = grid[r][c]; this.pCtx.fillRect(c * pSizeX, r * pSizeY, pSizeX, pSizeY); }
            }
        }
    },

    updateUI() {
        const list = document.getElementById('framesList'); if (!list) return; list.innerHTML = '';
        this.frames.forEach((_, idx) => {
            const item = document.createElement('div'); item.className = `frame-item ${idx === this.currentIndex ? 'active' : ''}`;
            item.innerHTML = `<span>Кадр ${idx + 1}</span>`;
            if (this.frames.length > 1) {
                const delBtn = document.createElement('button'); delBtn.className = 'btn btn-danger'; delBtn.style = 'padding:2px 6px; font-size:0.7rem;'; delBtn.innerText = 'X';
                delBtn.onclick = (e) => this.deleteFrame(idx, e); item.appendChild(delBtn);
            }
            item.onclick = () => { if (this.isPlaying) this.togglePlay(); this.currentIndex = idx; this.updateUI(); EditorCore.draw(); this.drawPreview(idx); };
            list.appendChild(item);
        });
        this.updateConsoleCode();
    },

    togglePlay() {
        const btn = document.getElementById('playBtn'); if (!btn) return;
        if (this.isPlaying) {
            this.isPlaying = false; clearInterval(this.intervalId); btn.innerText = 'Запустить ▷'; btn.className = 'btn btn-success'; this.drawPreview(this.currentIndex);
        } else {
            this.isPlaying = true; btn.innerText = 'Стоп ▢'; btn.className = 'btn btn-danger';
            let animIdx = 0; const fps = parseInt(document.getElementById('fpsSlider').value);
            this.intervalId = setInterval(() => { this.drawPreview(animIdx); animIdx = (animIdx + 1) % this.frames.length; }, 1000 / fps);
        }
    },

    updateSpeed() { if (this.isPlaying) { this.togglePlay(); this.togglePlay(); } }
};
