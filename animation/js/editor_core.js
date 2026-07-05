import { AnimationPlayer } from './animation_player.js';

export const EditorCore = {
    GRID_SIZE: 16,
    CANVAS_SIZE: 400,
    pixelSize: 0,
    canvas: null,
    ctx: null,
    colorPicker: null,
    currentZoom: 100,

    init() {
        this.canvas = document.getElementById('paintCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.colorPicker = document.getElementById('colorPicker');
        this.pixelSize = this.CANVAS_SIZE / this.GRID_SIZE;

        this.setupListeners();
        this.draw();
    },

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handlePaint(e));
        this.canvas.addEventListener('mousemove', (e) => { if (e.buttons === 1 || e.buttons === 2) this.handlePaint(e); });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Поддержка сенсорных экранов (смартфоны)
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    },

    handlePaint(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Рассчитываем координаты с учетом текущего физического размера холста из-за зума
        const c = Math.floor(((e.clientX - rect.left) / rect.width) * this.GRID_SIZE);
        const r = Math.floor(((e.clientY - rect.top) / rect.height) * this.GRID_SIZE);

        if (c >= 0 && c < this.GRID_SIZE && r >= 0 && r < this.GRID_SIZE) {
            const currentGrid = AnimationPlayer.getCurrentGrid();
            if (!currentGrid) return;
            // Правая кнопка мыши (buttons === 2) — стирает
            currentGrid[r][c] = (e.buttons === 2) ? null : this.colorPicker.value;
            this.draw();
            AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        }
    },

    handleTouch(e) {
        if (e.touches.length === 0) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const c = Math.floor(((touch.clientX - rect.left) / rect.width) * this.GRID_SIZE);
        const r = Math.floor(((touch.clientY - rect.top) / rect.height) * this.GRID_SIZE);

        if (c >= 0 && c < this.GRID_SIZE && r >= 0 && r < this.GRID_SIZE) {
            const currentGrid = AnimationPlayer.getCurrentGrid();
            if (!currentGrid) return;
            // Если на экране 2 пальца или больше — работает как ластик (стирает пиксель)
            currentGrid[r][c] = (e.touches.length >= 2) ? null : this.colorPicker.value;
            this.draw();
            AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        }
    },

    setZoom(zoomLevel) {
        this.currentZoom = zoomLevel;
        const size = (this.CANVAS_SIZE * zoomLevel) / 100;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
    },

    changeGridSize(newSize) {
        this.GRID_SIZE = newSize;
        this.pixelSize = this.CANVAS_SIZE / this.GRID_SIZE;
        AnimationPlayer.handleGridResize(newSize);
        this.draw();
    },

    clearCurrentGrid() {
        const size = this.GRID_SIZE;
        const emptyGrid = Array(size).fill(null).map(() => Array(size).fill(null));
        AnimationPlayer.setCurrentGrid(emptyGrid);
        this.draw();
        AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
    },

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
        const grid = AnimationPlayer.getCurrentGrid();
        if (!grid) return;

        for (let r = 0; r < this.GRID_SIZE; r++) {
            for (let c = 0; c < this.GRID_SIZE; c++) {
                if (grid[r][c]) {
                    this.ctx.fillStyle = grid[r][c];
                    this.ctx.fillRect(c * this.pixelSize, r * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }
        this.ctx.strokeStyle = '#2d2d38'; this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.pixelSize, 0); this.ctx.lineTo(i * this.pixelSize, this.CANVAS_SIZE);
            this.ctx.moveTo(0, i * this.pixelSize); this.ctx.lineTo(this.CANVAS_SIZE, i * this.pixelSize);
            this.ctx.stroke();
        }
    }
};
