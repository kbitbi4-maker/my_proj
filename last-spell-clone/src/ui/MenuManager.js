// Импорт сканера проекта
import { ProjectScanner } from '../utils/projectScanner.js';

// Класс управления меню
export class MenuManager{
    // Конструктор
    constructor(){
        this.buttons={};
        this.isVisible=true;
        this.projectScanner=new ProjectScanner()
    }
    
    // Инициализация меню
    init(){
        const btnIds=['btn1','btn2','btn3','btn4'];
        btnIds.forEach(id=>{
            const btn=document.getElementById(id);
            if(btn){
                this.buttons[id]=btn;
                this.setupButtonEvent(btn,id)
            }
        });
        document.querySelectorAll('.menu-btn').forEach(btn=>{
            btn.addEventListener('mouseenter',()=>{
                console.log('Button hover:',btn.id)
            })
        })
    }
    
    // Назначение обработчика события для кнопки
    setupButtonEvent(button,id){
        button.addEventListener('click',()=>{
            console.log(`Button ${id} clicked`);
            this.handleButtonClick(id)
        })
    }
    
    // Обработчик нажатия на кнопки
    async handleButtonClick(buttonId){
        switch(buttonId){
            case'btn1':
                console.log('Continue game');
                this.showNotification('Продолжение игры будет доступно позже');
                break;
            case'btn2':
                console.log('Open settings');
                this.showNotification('Настройки будут доступны позже');
                break;
            case'btn3':
                console.log('Show credits - copying project structure');
                this.copyProjectStructure();
                break;
            case'btn4':
                console.log('Exit game');
                this.showNotification('Выход из игры');
                break
        }
    }
    
    // Копирование структуры проекта (синхронная версия)
    copyProjectStructure(){
        try{
            this.showNotification('Генерация структуры проекта...','info');
            
            // Получаем структуру синхронно
            const fullMessage = this.projectScanner.getStructureForClipboard();
            
            // Копируем в буфер обмена
            navigator.clipboard.writeText(fullMessage).then(() => {
                this.showNotification('✅ Структура проекта скопирована в буфер обмена!','success');
                console.log('Project structure copied to clipboard:');
                console.log(fullMessage);
            }).catch((err) => {
                console.error('Clipboard error:', err);
                // Если не удалось скопировать, используем fallback
                this.fallbackCopy(fullMessage);
            });
            
        }catch(error){
            console.error('Error copying project structure:', error);
            this.showNotification('❌ Ошибка при копировании структуры','error');
            this.showStructureInPopup()
        }
    }
    
    // Fallback метод копирования (если clipboard не работает)
    fallbackCopy(text){
        // Создаем временный textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            document.execCommand('copy');
            this.showNotification('✅ Структура скопирована (методом fallback)!','success');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showNotification('❌ Не удалось скопировать. Открываю окно...','error');
            this.showStructureInPopup();
        }
        
        document.body.removeChild(textarea);
    }
    
    // Получение версии игры
    getVersion(){
        try{
            const versionElement=document.querySelector('.version');
            if(versionElement){
                return versionElement.textContent.trim()
            }
        }catch(e){}
        return'v1.0.0'
    }
    
    // Показ уведомления
    showNotification(message,type='info'){
        const notification=document.createElement('div');
        notification.className=`notification notification-${type}`;
        notification.textContent=message;
        Object.assign(notification.style,{
            position:'fixed',
            bottom:'20px',
            left:'50%',
            transform:'translateX(-50%)',
            padding:'12px 24px',
            borderRadius:'8px',
            fontFamily:"'Press Start 2P', monospace",
            fontSize:'12px',
            zIndex:'1000',
            animation:'slideUp 0.3s ease',
            maxWidth:'90%',
            textAlign:'center',
            color:'#e0d5c0',
            border:'2px solid #4a2a1a'
        });
        switch(type){
            case'success':
                notification.style.background='rgba(30, 80, 30, 0.9)';
                notification.style.borderColor='#4a8a3a';
                break;
            case'error':
                notification.style.background='rgba(80, 30, 30, 0.9)';
                notification.style.borderColor='#8a3a3a';
                break;
            default:
                notification.style.background='rgba(30, 30, 50, 0.9)';
                notification.style.borderColor='#4a4a6a'
        }
        document.body.appendChild(notification);
        setTimeout(()=>{
            notification.style.opacity='0';
            notification.style.transition='opacity 0.3s ease';
            setTimeout(()=>notification.remove(),300)
        },3000)
    }
    
    // Показ структуры в новом окне
    showStructureInPopup(){
        const structure = this.projectScanner.generateStructureForAI();
        const popup=window.open('','_blank','width=600,height=400');
        if(popup){
            popup.document.write(`<!DOCTYPE html>
            <html>
            <head>
                <title>Структура проекта</title>
                <style>
                    body{background:#0a0505;color:#e0d5c0;font-family:'Courier New',monospace;padding:20px;margin:0;white-space:pre-wrap}
                    pre{color:#d4a040;font-size:14px;line-height:1.6}
                    .header{color:#8a6a4a;border-bottom:2px solid #4a2a1a;padding-bottom:10px;margin-bottom:20px}
                    .footer{color:#4a3a2a;margin-top:20px;font-size:12px;border-top:1px solid #2a1a1a;padding-top:10px}
                    .copy-btn{background:#2a1a0a;border:2px solid #4a2a1a;color:#d4a040;padding:10px 20px;font-family:'Courier New',monospace;cursor:pointer;margin-top:10px}
                    .copy-btn:hover{background:#3a2a1a}
                </style>
            </head>
            <body>
                <div class="header">=== СТРУКТУРА ПРОЕКТА ===</div>
                <pre>${structure}</pre>
                <div class="footer">
                    Нажмите Ctrl+A затем Ctrl+C для копирования
                    <br>
                    <button class="copy-btn" onclick="copyStructure()">📋 Копировать</button>
                </div>
                <script>
                    function copyStructure(){
                        const text = document.querySelector('pre').textContent;
                        navigator.clipboard.writeText(text).then(() => {
                            alert('Структура скопирована в буфер обмена!');
                        }).catch(() => {
                            // Fallback
                            const textarea = document.createElement('textarea');
                            textarea.value = text;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            alert('Структура скопирована!');
                        });
                    }
                <\/script>
            </body>
            </html>`);
            popup.document.close()
        }
    }
    
    // Показать меню
    show(){
        const menu=document.getElementById('main-menu');
        if(menu)menu.style.display='flex';
        this.isVisible=true
    }
    
    // Скрыть меню
    hide(){
        const menu=document.getElementById('main-menu');
        if(menu)menu.style.display='none';
        this.isVisible=false
    }
}
