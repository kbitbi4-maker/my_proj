export class ProjectScanner{
    constructor(){
        // Базовый список файлов для сканирования
        // Добавляйте сюда новые файлы, когда создаёте их
        this.baseFiles = [
            'index.html',
            'README.md',
            '.gitignore',
            'src/assets/images/menu-background.png',
            'src/assets/images/logo.png',
            'src/assets/sounds/menu-music.mp3',
            'src/assets/fonts/',
            'src/styles/main.css',
            'src/styles/menu.css',
            'src/styles/components/buttons.css',
            'src/scripts/main.js',
            'src/scripts/core/Engine.js',
            'src/scripts/core/Game.js',
            'src/scripts/core/StateManager.js',
            'src/scripts/ui/MenuManager.js',
            'src/scripts/ui/UIManager.js',
            'src/scripts/ui/components/Button.js',
            'src/scripts/graphics/Renderer.js',
            'src/scripts/graphics/ParticleSystem.js',
            'src/scripts/graphics/AnimationManager.js',
            'src/scripts/audio/AudioManager.js',
            'src/scripts/audio/SoundController.js',
            'src/scripts/utils/helpers.js',
            'src/scripts/utils/constants.js',
            'src/scripts/utils/projectScanner.js',
            'src/config/gameConfig.js',
            'src/config/menuConfig.js'
        ];
        
        // Кэш для хранения результатов сканирования
        this.fileCache = {};
    }
    
    // АВТОМАТИЧЕСКОЕ сканирование файлов
    async scanProjectStructure(){
        console.log('🔍 Сканирование структуры проекта...');
        const results = {};
        
        for (const filePath of this.baseFiles) {
            try {
                // Пытаемся загрузить файл
                const response = await fetch(filePath, { 
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    results[filePath] = true;
                    console.log(`✅ Найден: ${filePath}`);
                } else {
                    results[filePath] = false;
                    console.log(`❌ Не найден: ${filePath}`);
                }
            } catch (error) {
                results[filePath] = false;
                console.log(`❌ Ошибка при проверке: ${filePath}`);
            }
        }
        
        this.fileCache = results;
        console.log('✅ Сканирование завершено!');
        return results;
    }
    
    // Построение дерева из результатов сканирования
    buildTreeFromResults(results){
        const tree = {};
        const sortedFiles = Object.keys(results).sort();
        
        sortedFiles.forEach(filePath => {
            const parts = filePath.split('/');
            let current = tree;
            
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    if (!current._files) current._files = [];
                    current._files.push({
                        name: part,
                        exists: results[filePath],
                        path: filePath
                    });
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });
        
        return tree;
    }
    
    // Форматирование дерева в строку
    formatTreeWithStatus(tree, prefix){
        let result = '';
        const items = Object.keys(tree);
        const files = tree._files || [];
        const folders = items.filter(item => item !== '_files');
        
        // Папки
        folders.forEach((folder, index) => {
            const isLast = index === folders.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            const hasFiles = this.folderHasFiles(tree[folder]);
            const status = hasFiles ? ' ✅' : ' ❌';
            result += `${prefix}${connector}${folder}/${status}\n`;
            result += this.formatTreeWithStatus(tree[folder], prefix + (isLast ? '    ' : '│   '))
        });
        
        // Файлы
        files.forEach((file, index) => {
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const status = file.exists ? ' ✅' : ' ❌';
            result += `${prefix}${connector}${file.name}${status}\n`
        });
        
        return result
    }
    
    folderHasFiles(folder){
        const files = folder._files || [];
        const folders = Object.keys(folder).filter(item => item !== '_files');
        if (files.length > 0) return true;
        for (const subFolder of folders) {
            if (this.folderHasFiles(folder[subFolder])) return true
        }
        return false
    }
    
    // ГЛАВНЫЙ МЕТОД - вызывается при нажатии кнопки
    async generateStructureForAI(){
        try {
            // Сканируем файлы
            const results = await this.scanProjectStructure();
            
            // Строим дерево
            const tree = this.buildTreeFromResults(results);
            
            // Форматируем в строку
            let structure = 'last-spell-clone/\n';
            structure += this.formatTreeWithStatus(tree, '');
            
            return structure;
        } catch (error) {
            console.error('Error generating structure:', error);
            return this.getFallbackStructure();
        }
    }
    
    // Структура по умолчанию (если сканирование не удалось)
    getFallbackStructure(){
        return `last-spell-clone/\n├── index.html ✅\n├── README.md ✅\n├── .gitignore ✅\n├── src/\n│   ├── scripts/\n│   │   ├── main.js ✅\n│   │   └── ...\n│   └── styles/\n│       ├── main.css ✅\n│       └── menu.css ✅\n└── .gitignore ✅`;
    }
    
    // Получение структуры для буфера обмена
    async getStructureForClipboard(){
        console.log('📋 Генерация структуры для буфера обмена...');
        const structure = await this.generateStructureForAI();
        const timestamp = new Date().toLocaleString();
        const version = this.getVersion();
        
        return `=== СТРУКТУРА ПРОЕКТА ===\nВерсия: ${version}\nДата: ${timestamp}\n\n${structure}\n\n=== КОНЕЦ СТРУКТУРЫ ===`;
    }
    
    getVersion(){
        try{
            const versionElement = document.querySelector('.version');
            if(versionElement){
                return versionElement.textContent.trim()
            }
        } catch(e){}
        return 'v1.0.2.21'
    }
}
