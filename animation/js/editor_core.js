import { AnimationPlayer } from './animation_player.js';

export const EditorCore = {
    GRID_W: 40,
    GRID_H: 40,
    BASE_PIXEL_SIZE: 8, // Базовый размер одного пикселя сетки
    currentZoom: 100,
    canvas: null,
    ctx: null,
    colorPicker: null,

    init() {
        this.canvas = document.getElementById('paintCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.colorPicker = document.getElementById('colorPicker');
        this.resizeCanvasSize();
        this.setupListeners();
        this.draw();
    },

    // Динамически меняем реальное разрешение холста под пропорции сетки
    resizeCanvasSize() {
        const pSize = this.BASE_PIXEL_SIZE;
        this.canvas.width = this.GRID_W * pSize;
        this.canvas.height = this.GRID_H * pSize;
        this.setZoom(this.currentZoom);
    },

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handlePaint(e));
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 || e.buttons === 2) this.handlePaint(e);
        });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    handlePaint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor(((e.clientX - rect.left) / rect.width) * this.GRID_W);
        const r = Math.floor(((e.clientY - rect.top) / rect.height) * this.GRID_H);

        if (c >= 0 && c < this.GRID_W && r >= 0 && r < this.GRID_H) {
            const currentGrid = AnimationPlayer.getCurrentGrid();
            if (!currentGrid) return;
            currentGrid[r][c] = (e.buttons === 2) ? null : this.colorPicker.value;
            this.draw();
            AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        }
    },

    // Изменение масштаба через CSS с сохранением прямоугольных пропорций
    setZoom(zoomLevel) {
        this.currentZoom = zoomLevel;
        const scale = zoomLevel / 100;
        const visualW = this.GRID_W * this.BASE_PIXEL_SIZE * scale;
        const visualH = this.GRID_H * this.BASE_PIXEL_SIZE * scale;
        
        this.canvas.style.width = visualW + 'px';
        this.canvas.style.height = visualH + 'px';
        this.updateGridCSS();
    },

    updateGridCSS() {
        if (this.GRID_W > 75 || this.GRID_H > 75) {
            this.canvas.style.backgroundImage = 'none';
            return;
        }
        const stepX = (100 / this.GRID_W) + '%';
        const stepY = (100 / this.GRID_H) + '%';
        this.canvas.style.backgroundImage = `
            linear-gradient(to right, #2d2d38 1px, transparent 1px),
            linear-gradient(to bottom, #2d2d38 1px, transparent 1px)
        `;
        this.canvas.style.backgroundSize = `${stepX} ${stepY}`;
    },

    changeGridSize(newW, newH) {
        this.GRID_W = newW;
        this.GRID_H = newH;
        this.resizeCanvasSize();
        AnimationPlayer.handleGridResize(newW, newH);
        this.draw();
    },

    clearCurrentGrid() {
        const emptyGrid = Array(this.GRID_H).fill(null).map(() => Array(this.GRID_W).fill(null));
        AnimationPlayer.setCurrentGrid(emptyGrid);
        this.draw();
        AnimationPlayer.drawPreview(this.currentIndex);
    },

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const grid = AnimationPlayer.getCurrentGrid();
        if (!grid) return;

        const pSize = this.BASE_PIXEL_SIZE;
        // Отрисовка строго квадратных пикселей стык-в-стык без искажения пропорций экрана!
        for (let r = 0; r < this.GRID_H; r++) {
            for (let c = 0; c < this.GRID_W; c++) {
                if (grid[r][c]) {
                    this.ctx.fillStyle = grid[r][c];
                    this.ctx.fillRect(c * pSize, r * pSize, pSize, pSize);
                }
            }
        }
    }
};
