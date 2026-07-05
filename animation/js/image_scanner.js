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
        // Берем текущий установленный размер сетки в редакторе (например, 40 или 50)
        const size = EditorCore.GRID_SIZE;
        
        // Создаем скрытый в памяти canvas для попиксельного анализа данных
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = size;
        hiddenCanvas.height = size;
        const ctx = hiddenCanvas.getContext('2d');
        if (!ctx) return;

        // Отключаем сглаживание, чтобы сохранить четкие ретро-контуры пиксель-арта
        ctx.imageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        // Рисуем картинку, сжимая её ровно в размер нашей сетки
        ctx.drawImage(img, 0, 0, size, size);

        // Получаем массив RGBA-данных каждого пикселя
        const imgData = ctx.getImageData(0, 0, size, size).data;
        const newGrid = Array(size).fill(null).map(() => Array(size).fill(null));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const idx = (r * size + c) * 4;
                const rColor = imgData[idx];
                const gColor = imgData[idx + 1];
                const bColor = imgData[idx + 2];
                const alpha = imgData[idx + 3];

                // Если пиксель полностью прозрачный, игнорируем его
                if (alpha < 50) {
                    newGrid[r][c] = null;
                } else {
                    // Переводим RGB в понятный редактору HEX-формат (#ffffff)
                    newGrid[r][c] = this.rgbToHex(rColor, gColor, bColor);
                }
            }
        }

        // Записываем полученную матрицу в текущий кадр и обновляем холст
        AnimationPlayer.frames[AnimationPlayer.currentIndex] = newGrid;
        EditorCore.draw();
        AnimationPlayer.drawPreview(AnimationPlayer.currentIndex);
        AnimationPlayer.updateConsoleCode();
        
        // Сбрасываем значение инпута, чтобы можно было загружать ту же картинку повторно
        document.getElementById('imageImporter').value = '';
    },

    // Конвертер цвета
    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }
};

