// version: v4.0
import { generateDynamicMap, buildFullProjectBundleText } from './map_scanner.js';

export async function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    modal.style.display = 'flex';
    area.value = '⏳ Запуск сканирования репозитория... Пожалуйста, подождите.';
    area.value = await generateDynamicMap();
}

export function closeProjectMap() {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
    const area = document.getElementById('map-text-area');
    if (!area) return;
    area.select(); navigator.clipboard.writeText(area.value);
    alert('Карта проекта скопирована! 📋');
}

/**
 * Асинхронно собирает весь код и инициирует скачивание .txt бандла
 */
export async function downloadProjectBundle() {
    const fullText = await buildFullProjectBundleText();
    
    // Создаем виртуальный файл в оперативной памяти
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = 'arifmet_bundle.txt'; // Имя скачиваемого файла
    
    document.body.appendChild(link);
    link.click(); // Симулируем клик для запуска скачивания
    document.body.removeChild(link);
}
