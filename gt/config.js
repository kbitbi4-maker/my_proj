// config.js - Настройки приложения

const APP_CONFIG = {
    // Google Sheets API URL (заполняется пользователем)
    API_URL: localStorage.getItem('gt_api_url') || '',
    
    // Настройки таблицы
    SHEET_NAME: 'Лист1',
    
    // Режимы
    DISPLAY_MODE: localStorage.getItem('gt_display_mode') || 'table',
    
    // Цвета (можно менять)
    COLORS: {
        header: '#075e54',
        headerText: '#ffffff',
        rowHover: '#f5f7fa',
        border: '#e0e0e0'
    }
};

// Сохранять настройки в localStorage
function saveConfig(key, value) {
    localStorage.setItem(`gt_${key}`, value);
}

function getConfig(key) {
    return localStorage.getItem(`gt_${key}`);
}
