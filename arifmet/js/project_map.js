// version: v3.0
import { generateDynamicMap } from './map_scanner.js';

export async function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    modal.style.display = 'flex';
    area.value = '⏳ Запуск сканирования репозитория... Пожалуйста, подождите.';

    // Запускаем динамический сбор данных с диска
    const liveMapText = await generateDynamicMap();
    area.value = liveMapText;
}

export function closeProjectMap() {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
    const area = document.getElementById('map-text-area');
    if (!area) return;
    area.select();
    navigator.clipboard.writeText(area.value);
    alert('Актуальная интерактивная карта проекта скопирована! 📋');
}
