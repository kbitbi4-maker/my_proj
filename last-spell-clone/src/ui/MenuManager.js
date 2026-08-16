import { ProjectScanner } from '../utils/projectScanner.js';

export class MenuManager{
    constructor(){
        this.buttons={};
        this.projectScanner=new ProjectScanner();
    }
    
    init(){
        const btnIds=['btn1','btn2','btn3','btn4'];
        btnIds.forEach(id=>{
            const btn=document.getElementById(id);
            if(btn){
                this.buttons[id]=btn;
                this.setupButtonEvent(btn,id);
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
    
    handleButtonClick(buttonId){
        if(buttonId === 'btn3'){
            console.log('Copying structure...');
            this.copyStructure();
        } else {
            alert('Кнопка ' + buttonId + ' пока не работает');
        }
    }
    
    copyStructure(){
        try {
            // Получаем структуру
            const text = this.projectScanner.getStructureForClipboard();
            console.log('Structure generated:', text);
            
            // Пытаемся скопировать
            if(navigator.clipboard && navigator.clipboard.writeText){
                navigator.clipboard.writeText(text).then(() => {
                    alert('✅ Структура проекта скопирована в буфер обмена!');
                }).catch(err => {
                    console.error('Clipboard error:', err);
                    this.fallbackCopy(text);
                });
            } else {
                this.fallbackCopy(text);
            }
        } catch(error) {
            console.error('Error:', error);
            alert('Ошибка: ' + error.message);
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
            alert('✅ Структура скопирована!');
        } catch(err) {
            console.error('Fallback error:', err);
            // Открываем в новом окне
            const win = window.open('', '_blank', 'width=600,height=400');
            if(win){
                win.document.write('<pre style="background:#0a0505;color:#d4a040;padding:20px;font-family:monospace;">' + text + '</pre>');
                win.document.close();
            }
        }
        
        document.body.removeChild(textarea);
    }
}
