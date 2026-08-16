import { ProjectScanner } from '../utils/projectScanner.js';

export class MenuManager{
    constructor(){
        this.buttons={};
        this.projectScanner=new ProjectScanner();
        this.isScanning = false;
    }
    
    init(){
        const btnIds=['btn1','btn2','btn3','btn4'];
        btnIds.forEach(id=>{
            const btn=document.getElementById(id);
            if(btn){
                this.buttons[id]=btn;
                this.setupButtonEvent(btn,id);
                console.log('Button found:', id);
            } else {
                console.warn('Button not found:', id);
            }
        });
    }
    
    setupButtonEvent(button,id){
        button.addEventListener('click',()=>{
            console.log('Button clicked:', id);
            this.handleButtonClick(id);
        });
    }
    
    async handleButtonClick(buttonId){
        if(buttonId === 'btn3'){
            if(this.isScanning){
                this.showNotification('⏳ Сканирование уже выполняется...', 'info');
                return;
            }
            console.log('📋 Копирование структуры...');
            await this.copyStructure();
        } else {
            this.showNotification('Кнопка ' + buttonId + ' пока не работает', 'info');
        }
    }
    
    async copyStructure(){
        try {
            this.isScanning = true;
            this.showNotification('🔍 Сканирование файлов проекта...', 'info');
            
            // Получаем структуру
            const text = await this.projectScanner.getStructureForClipboard();
            console.log('✅ Структура сгенерирована');
            
            // Копируем в буфер
            if(navigator.clipboard && navigator.clipboard.writeText){
                await navigator.clipboard.writeText(text);
                this.showNotification('✅ Структура скопирована в буфер обмена!', 'success');
            } else {
                this.fallbackCopy(text);
            }
            
        } catch(error) {
            console.error('Error in copyStructure:', error);
            this.showNotification('❌ Ошибка: ' + error.message, 'error');
            this.fallbackCopy('Ошибка сканирования: ' + error.message);
        } finally {
            this.isScanning = false;
        }
    }
    
    fallbackCopy(text){
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0;left:-9999px;top:0;';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('✅ Структура скопирована!', 'success');
        } catch(err) {
            console.error('Fallback error:', err);
            this.showStructureInPopup(text);
        }
        
        document.body.removeChild(textarea);
    }
    
    showStructureInPopup(text){
        const win = window.open('', '_blank', 'width=600,height=400');
        if(win){
            win.document.write(`<html><head><title>Структура проекта</title><style>body{background:#0a0505;color:#d4a040;padding:20px;font-family:monospace;white-space:pre}</style></head><body><pre>${text}</pre></body></html>`);
            win.document.close();
            this.showNotification('📂 Открыто окно со структурой', 'info');
        } else {
            this.showNotification('❌ Не удалось открыть окно', 'error');
        }
    }
    
    showNotification(message, type = 'info'){
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Press Start 2P', monospace;
            font-size: 11px;
            z-index: 1000;
            max-width: 90%;
            text-align: center;
            color: #e0d5c0;
            border: 2px solid #4a2a1a;
            background: ${type === 'success' ? 'rgba(30, 80, 30, 0.9)' : 
                      type === 'error' ? 'rgba(80, 30, 30, 0.9)' : 
                      'rgba(30, 30, 50, 0.9)'};
            border-color: ${type === 'success' ? '#4a8a3a' : 
                          type === 'error' ? '#8a3a3a' : 
                          '#4a4a6a'};
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}
