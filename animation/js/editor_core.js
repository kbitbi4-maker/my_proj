import { AnimationPlayer } from './animation_player.js';

export const EditorCore = {
    GRID_W: 40,
    GRID_H: 40,
    CANVAS_SIZE: 400,
    pixelSizeX: 0,
    pixelSizeY: 0,
    canvas: null,
    ctx: null,
    colorPicker: null,

    init() {
        this.canvas = document.getElementById('paintCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.colorPicker = document.getElementById('colorPicker');
        this.recalcPixelSizes();
        this.setupListeners();
        this.draw();
    },

    recalcPixelSizes() {
        this.pixelSizeX = this.CANVAS_SIZE / this.GRID_W;
        this.pixelSizeY = this.CANVAS_SIZE / this.GRID_H;
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

    setZoom(zoomLevel) {
        const size = (this.CANVAS_SIZE * zoomLevel) / 100;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
    },

    changeGridSize(newW, newH) {
        this.GRID_W = newW;
        this.GRID_H = newH;
        this.recalcPixelSizes();
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
        this.ctx.clearRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
        const grid = AnimationPlayer.getCurrentGrid();
        if (!grid) return;

        for (let r = 0; r < this.GRID_H; r++) {
            for (let c = 0; c < this.GRID_W; c++) {
                if (grid[r][c]) {
                    this.ctx.fillStyle = grid[r][c];
                    this.ctx.fillRect(c * this.pixelSizeX, r * this.pixelSizeY, this.pixelSizeX, this.pixelSizeY);
                }
            }
        }

        this.ctx.strokeStyle = '#2d2d38'; this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.GRID_W; i++) {
            this.ctx.beginPath(); this.ctx.moveTo(i * this.pixelSizeX, 0); this.ctx.lineTo(i * this.pixelSizeX, this.CANVAS_SIZE); this.ctx.stroke();
        }
        for (let j = 0; i <= this.GRID_H; j++) {
            this.ctx.beginPath(); this.ctx.moveTo(0, j * this.pixelSizeY); this.ctx.lineTo(this.CANVAS_SIZE, j * this.pixelSizeY); this.ctx.stroke();
        }
    }
};
