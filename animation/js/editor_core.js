import { AnimationPlayer } from './animation_player.js';

export const EditorCore = {
    GRID_SIZE: 16,
    CANVAS_SIZE: 400,
    pixelSize: 0,
    canvas: null,
    ctx: null,
    colorPicker: null,

    init() {
        this.canvas = document.getElementById('paintCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.colorPicker = document.getElementById('colorPicker');
        this.pixelSize = this.CANVAS_SIZE / this.GRID_SIZE;

        this.setupListeners();
        this.draw();
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
        const c = Math.floor((e.clientX - rect.left) / this.pixelSize);
        const r = Math.floor((e.clientY - rect.top) / this.pixelSize);

        if (c >= 0 && c < this.GRID_SIZE && r >= 0 && r < this.GRID_SIZE) {
            const currentGrid = AnimationPlayer.getCurrentGrid();
            currentGrid[r][c] = (e.buttons === 2) ? null : this.colorPicker.value;
            this.draw();
            AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        }
    },

    clearCurrentGrid() {
        const emptyGrid = Array(this.GRID_SIZE).fill(null).map(() => Array(this.GRID_SIZE).fill(null));
        AnimationPlayer.setCurrentGrid(emptyGrid);
        this.draw();
        AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
    },

    draw() {
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

        this.ctx.strokeStyle = '#2d2d38';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.pixelSize, 0);
            this.ctx.lineTo(i * this.pixelSize, this.CANVAS_SIZE);
            this.ctx.moveTo(0, i * this.pixelSize);
            this.ctx.lineTo(this.CANVAS_SIZE, i * this.pixelSize);
            this.ctx.stroke();
        }
    }
};

