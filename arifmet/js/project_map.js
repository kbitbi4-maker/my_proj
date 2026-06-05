// version: v2.0
import { generateDynamicMap } from './map_scanner.js';

export async function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    modal.style.display = 'flex';
    area.value = '⏳ Запуск живого сканирования репозитория... Пожалуйста, подождите.';
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
    alert('Карта проекта скопирована в буфер обмена! 📋');
}
