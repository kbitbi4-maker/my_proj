import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';

export const ImageScanner = {
    scan(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => this.processImage(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    processImage(img) {
        const w = EditorCore.GRID_W;
        const h = EditorCore.GRID_H;
        
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = w;
        hiddenCanvas.height = h;
        const ctx = hiddenCanvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        // Отрисовка под прямоугольные параметры ширины и высоты
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h).data;
        const newGrid = Array(h).fill(null).map(() => Array(w).fill(null));

        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const idx = (r * w + c) * 4;
                const rColor = imgData[idx];
                const gColor = imgData[idx + 1];
                const bColor = imgData[idx + 2];
                const alpha = imgData[idx + 3];

                if (alpha < 50) {
                    newGrid[r][c] = null;
                } else {
                    newGrid[r][c] = this.rgbToHex(rColor, gColor, bColor);
                }
            }
        }

        AnimationPlayer.frames[AnimationPlayer.currentIndex] = newGrid;
        EditorCore.draw();
        AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        AnimationPlayer.updateConsoleCode();
        
        document.getElementById('imageImporter').value = '';
    },

    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }
};
