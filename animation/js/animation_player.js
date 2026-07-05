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
        this.frames.push(Array(16).fill(null).map(() => Array(16).fill(null)));
        this.updateUI();
        this.drawPreview(0);
    },

    getCurrentGrid() { return this.frames[this.currentIndex]; },
    setCurrentGrid(newGrid) { this.frames[this.currentIndex] = newGrid; this.updateConsoleCode(); },

    handleGridResize(newSize) {
        this.frames = this.frames.map(() => Array(newSize).fill(null).map(() => Array(newSize).fill(null)));
        this.currentIndex = 0;
        this.updateUI();
        this.drawPreview(0);
    },

    addFrame() {
        const copy = this.frames[this.currentIndex].map(row => [...row]);
        this.frames.push(copy);
        this.currentIndex = this.frames.length - 1;
        this.updateUI();
        EditorCore.draw();
        this.drawPreview(this.currentIndex);
    },

    deleteFrame(idx, e) {
        e.stopPropagation(); if (this.frames.length <= 1) return;
        this.frames.splice(idx, 1);
        if (this.currentIndex >= this.frames.length) this.currentIndex = this.frames.length - 1;
        this.updateUI(); EditorCore.draw(); this.drawPreview(this.currentIndex);
    },

    // Сжатая генерация кода: по 4 пикселя в одной строке через знак "|"
    updateConsoleCode() {
        const grid = this.frames[this.currentIndex];
        let buffer = [];
        let codeLines = [];
        
        for (let r = 0; r < EditorCore.GRID_SIZE; r++) {
            for (let c = 0; c < EditorCore.GRID_SIZE; c++) {
                if (grid[r][c]) {
                    buffer.push(`${r},${c},${grid[r][c]}`);
                    if (buffer.length === 4) {
                        codeLines.push(buffer.join('|'));
                        buffer = [];
                    }
                }
            }
        }
        if (buffer.length > 0) {
            codeLines.push(buffer.join('|'));
        }
        document.getElementById('frameConsole').value = codeLines.join('\n');
    },

    // Чтение сжатого кода (по 4 пикселя на строку) обратно на холст
    loadFrameFromCode() {
        const text = document.getElementById('frameConsole').value.trim();
        const size = EditorCore.GRID_SIZE;
        const newGrid = Array(size).fill(null).map(() => Array(size).fill(null));
        
        if (text) {
            const lines = text.split('\n');
            lines.forEach(line => {
                const pixels = line.split('|');
                pixels.forEach(pixel => {
                    const parts = pixel.split(',');
                    if (parts.length === 3) {
                        const r = parseInt(parts[0], 10);
                        const c = parseInt(parts[1], 10);
                        const color = parts[2].trim();
                        if (r >= 0 && r < size && c >= 0 && c < size) {
                            newGrid[r][c] = color;
                        }
                    }
                });
            });
        }
        this.frames[this.currentIndex] = newGrid;
        EditorCore.draw();
        this.drawPreview(this.currentIndex);
    },

    drawPreview(idx) {
        if (!this.pCtx) return;
        this.pCtx.clearRect(0, 0, this.pCanvas.width, this.pCanvas.height);
        const grid = this.frames[idx]; const pSize = this.pCanvas.width / EditorCore.GRID_SIZE;
        for (let r = 0; r < EditorCore.GRID_SIZE; r++) {
            for (let c = 0; c < EditorCore.GRID_SIZE; c++) {
                if (grid[r][c]) { this.pCtx.fillStyle = grid[r][c]; this.pCtx.fillRect(c * pSize, r * pSize, pSize, pSize); }
            }
        }
    },

    updateUI() {
        const list = document.getElementById('framesList'); if (!list) return;
        list.innerHTML = '';
        this.frames.forEach((_, idx) => {
            const item = document.createElement('div');
            item.className = `frame-item ${idx === this.currentIndex ? 'active' : ''}`;
            item.innerHTML = `<span>Кадр ${idx + 1}</span>`;
            if (this.frames.length > 1) {
                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-danger'; delBtn.style = 'padding:2px 6px; font-size:0.7rem;'; delBtn.innerText = 'X';
                delBtn.onclick = (e) => this.deleteFrame(idx, e); item.appendChild(delBtn);
            }
            item.onclick = () => {
                if (this.isPlaying) this.togglePlay();
                this.currentIndex = idx; this.updateUI(); EditorCore.draw(); this.drawPreview(idx);
            };
            list.appendChild(item);
        });
        this.updateConsoleCode();
    },

    togglePlay() {
        const btn = document.getElementById('playBtn'); if (!btn) return;
        if (this.isPlaying) {
            this.isPlaying = false; clearInterval(this.intervalId);
            btn.innerText = 'Запустить ▷'; btn.className = 'btn btn-success'; this.drawPreview(this.currentIndex);
        } else {
            this.isPlaying = true; btn.innerText = 'Стоп ▢'; btn.className = 'btn btn-danger';
            let animIdx = 0; const fps = parseInt(document.getElementById('fpsSlider').value);
            this.intervalId = setInterval(() => { this.drawPreview(animIdx); animIdx = (animIdx + 1) % this.frames.length; }, 1000 / fps);
        }
    },

    updateSpeed() { if (this.isPlaying) { this.togglePlay(); this.togglePlay(); } }
};
