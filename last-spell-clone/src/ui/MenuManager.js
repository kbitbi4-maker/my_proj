import { ProjectScanner } from '../utils/projectScanner.js';

export class MenuManager {
    constructor() {
        this.buttons = {};
        this.isVisible = true;
        this.projectScanner = new ProjectScanner();
    }

    init() {
        // Get all menu buttons
        const btnIds = ['btn1', 'btn2', 'btn3', 'btn4'];
        
        btnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                this.buttons[id] = btn;
                this.setupButtonEvent(btn, id);
            }
        });
        
        // Add hover sound effect
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                // Play hover sound (will be implemented later)
                console.log('Button hover:', btn.id);
            });
        });
    }

    setupButtonEvent(button, id) {
        button.addEventListener('click', () => {
            console.log(`Button ${id} clicked`);
            this.handleButtonClick(id);
        });
    }

    async handleButtonClick(buttonId) {
        switch(buttonId) {
            case 'btn1':
                console.log('Continue game');
                this.showNotification('Продолжение игры будет доступно позже');
                break;
            case 'btn2':
                console.log('Open settings');
                this.showNotification('Настройки будут доступны позже');
                break;
            case 'btn3':
                console.log('Show credits - copying project structure');
                await this.copyProjectStructure();
                break;
            case 'btn4':
                console.log('Exit game');
                this.showNotification('Выход из игры');
                break;
        }
    }

    async copyProjectStructure() {
        try {
            // Показываем уведомление о начале копирования
            this.showNotification('Сканирование структуры проекта...', 'info');
            
            // Получаем структуру проекта
            const structure = await this.projectScanner.generateStructureForAI();
            
            // Добавляем информацию о версии и времени
            const timestamp = new Date().toLocaleString();
            const fullMessage = `=== СТРУКТУРА ПРОЕКТА ===\nВерсия: ${this.getVersion()}\nДата: ${timestamp}\n\n${structure}\n\n=== КОНЕЦ СТРУКТУРЫ ===`;
            
            // Копируем в буфер обмена
            await navigator.clipboard.writeText(fullMessage);
            
            // Показываем уведомление об успехе
            this.showNotification('✅ Структура проекта скопирована в буфер обмена!', 'success');
            
            // Также выводим в консоль для отладки
            console.log('Project structure copied to clipboard:');
            console.log(fullMessage);
            
        } catch (error) {
            console.error('Error copying project structure:', error);
            this.showNotification('❌ Ошибка при копировании структуры', 'error');
            
            // Если не удалось скопировать, показываем структуру в новом окне
            this.showStructureInPopup();
        }
    }

    getVersion() {
        // Пытаемся получить версию из конфига
        try {
            const versionElement = document.querySelector('.version');
            if (versionElement) {
                return versionElement.textContent.trim();
            }
        } catch (e) {}
        
        return 'v1.0.0';
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Стили для уведомления
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            zIndex: '1000',
            animation: 'slideUp 0.3s ease',
            maxWidth: '90%',
            textAlign: 'center',
            color: '#e0d5c0',
            border: '2px solid #4a2a1a'
        });

        // Разные стили для разных типов
        switch(type) {
            case 'success':
                notification.style.background = 'rgba(30, 80, 30, 0.9)';
                notification.style.borderColor = '#4a8a3a';
                break;
            case 'error':
                notification.style.background = 'rgba(80, 30, 30, 0.9)';
                notification.style.borderColor = '#8a3a3a';
                break;
            default:
                notification.style.background = 'rgba(30, 30, 50, 0.9)';
                notification.style.borderColor = '#4a4a6a';
        }

        // Добавляем в DOM
        document.body.appendChild(notification);

        // Автоматически удаляем через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showStructureInPopup() {
        // Если не удалось скопировать, открываем новое окно со структурой
        const structure = this.projectScanner.getDefaultStructure();
        const popup = window.open('', '_blank', 'width=600,height=400');
        if (popup) {
            popup.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Структура проекта</title>
                    <style>
                        body {
                            background: #0a0505;
                            color: #e0d5c0;
                            font-family: 'Courier New', monospace;
                            padding: 20px;
                            margin: 0;
                            white-space: pre-wrap;
                        }
                        pre {
                            color: #d4a040;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        .header {
                            color: #8a6a4a;
                            border-bottom: 2px solid #4a2a1a;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                        }
                        .footer {
                            color: #4a3a2a;
                            margin-top: 20px;
                            font-size: 12px;
                            border-top: 1px solid #2a1a1a;
                            padding-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">=== СТРУКТУРА ПРОЕКТА ===</div>
                    <pre>${structure}</pre>
                    <div class="footer">Нажмите Ctrl+C для копирования</div>
                </body>
                </html>
            `);
            popup.document.close();
        }
    }

    show() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'flex';
        this.isVisible = true;
    }

    hide() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'none';
        this.isVisible = false;
    }
}
