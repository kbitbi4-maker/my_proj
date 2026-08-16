export class ProjectScanner{
    constructor(){
        // Базовые папки для сканирования (только папки, не файлы!)
        this.baseFolders = [
            'src/',
            'src/assets/',
            'src/assets/images/',
            'src/assets/sounds/',
            'src/assets/fonts/',
            'src/config/',
            'src/scripts/',
            'src/scripts/core/',
            'src/scripts/ui/',
            'src/scripts/ui/components/',
            'src/scripts/graphics/',
            'src/scripts/audio/',
            'src/scripts/utils/',
            'src/styles/',
            'src/styles/components/'
        ];
        
        // Расширения файлов для поиска
        this.extensions = {
            scripts: ['.js', '.ts'],
            styles: ['.css', '.scss', '.less'],
            config: ['.json', '.js'],
            assets: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.wav', '.ttf', '.woff']
        };
        
        // Кэш результатов
        this.cache = {};
        this.lastScanTime = null;
    }
    
    // ГЛАВНЫЙ МЕТОД - автоматическое сканирование
    async scanProject(){
        console.log('🔍 Автоматическое сканирование проекта...');
        const startTime = Date.now();
        
        try {
            // 1. Сканируем корневые файлы
            const rootFiles = await this.scanRootFiles();
            
            // 2. Сканируем все папки рекурсивно
            const folderFiles = await this.scanAllFolders();
            
            // 3. Объединяем результаты
            const allFiles = { ...rootFiles, ...folderFiles };
            
            // 4. Сортируем
            const sortedFiles = this.sortFiles(allFiles);
            
            this.cache = sortedFiles;
            this.lastScanTime = new Date();
            
            console.log(`✅ Сканирование завершено за ${Date.now() - startTime}ms`);
            console.log(`📁 Найдено файлов: ${Object.keys(sortedFiles).length}`);
            
            return sortedFiles;
            
        } catch (error) {
            console.error('❌ Ошибка сканирования:', error);
            return this.getFallbackStructure();
        }
    }
    
    // Сканирование корневых файлов
    async scanRootFiles(){
        const rootFiles = [
            'index.html',
            'README.md',
            '.gitignore',
            'package.json',
            'package-lock.json'
        ];
        
        const results = {};
        
        for (const file of rootFiles) {
            const exists = await this.checkFileExists(file);
            if (exists) {
                results[file] = true;
                console.log(`  ✅ Найден: ${file}`);
            }
        }
        
        return results;
    }
    
    // Сканирование всех папок
    async scanAllFolders(){
        const results = {};
        
        for (const folder of this.baseFolders) {
            const files = await this.scanFolder(folder);
            Object.assign(results, files);
        }
        
        return results;
    }
    
    // Сканирование конкретной папки
    async scanFolder(folderPath){
        const results = {};
        
        // Пробуем найти index файлы
        const indexFiles = ['index.html', 'index.js', 'index.css'];
        for (const indexFile of indexFiles) {
            const fullPath = folderPath + indexFile;
            const exists = await this.checkFileExists(fullPath);
            if (exists) {
                results[fullPath] = true;
                console.log(`  ✅ Найден: ${fullPath}`);
            }
        }
        
        // Для папки scripts - ищем все .js файлы
        if (folderPath.includes('scripts/') || folderPath.includes('core/') || 
            folderPath.includes('ui/') || folderPath.includes('utils/') ||
            folderPath.includes('audio/') || folderPath.includes('graphics/')) {
            
            // Пробуем найти типичные файлы в этой папке
            const possibleFiles = this.getPossibleFilesForFolder(folderPath);
            for (const file of possibleFiles) {
                const exists = await this.checkFileExists(folderPath + file);
                if (exists) {
                    results[folderPath + file] = true;
                    console.log(`  ✅ Найден: ${folderPath + file}`);
                }
            }
        }
        
        // Для папки styles - ищем .css файлы
        if (folderPath.includes('styles/')) {
            const possibleStyles = ['main.css', 'menu.css', 'buttons.css', 'style.css'];
            for (const style of possibleStyles) {
                const fullPath = folderPath + style;
                const exists = await this.checkFileExists(fullPath);
                if (exists) {
                    results[fullPath] = true;
                    console.log(`  ✅ Найден: ${fullPath}`);
                }
            }
        }
        
        // Для папки config - ищем .js файлы
        if (folderPath.includes('config/')) {
            const possibleConfigs = ['gameConfig.js', 'menuConfig.js', 'config.js'];
            for (const config of possibleConfigs) {
                const fullPath = folderPath + config;
                const exists = await this.checkFileExists(fullPath);
                if (exists) {
                    results[fullPath] = true;
                    console.log(`  ✅ Найден: ${fullPath}`);
                }
            }
        }
        
        // Для папок assets - ищем медиафайлы
        if (folderPath.includes('assets/')) {
            const mediaFiles = await this.scanMediaFiles(folderPath);
            Object.assign(results, mediaFiles);
        }
        
        return results;
    }
    
    // Получение возможных файлов для папки
    getPossibleFilesForFolder(folderPath){
        const name = folderPath.split('/').filter(Boolean).pop();
        
        const commonFiles = {
            'core': ['Engine.js', 'Game.js', 'StateManager.js'],
            'ui': ['MenuManager.js', 'UIManager.js', 'components/'],
            'ui/components': ['Button.js', 'Panel.js', 'Modal.js'],
            'utils': ['helpers.js', 'constants.js', 'projectScanner.js'],
            'audio': ['AudioManager.js', 'SoundController.js'],
            'graphics': ['Renderer.js', 'ParticleSystem.js', 'AnimationManager.js'],
            'scripts': ['main.js', 'app.js', 'index.js']
        };
        
        // Ищем по имени папки
        for (const [key, files] of Object.entries(commonFiles)) {
            if (folderPath.includes(key)) {
                return files;
            }
        }
        
        return [];
    }
    
    // Сканирование медиафайлов
    async scanMediaFiles(folderPath){
        const results = {};
        
        // Список возможных медиафайлов
        const mediaFiles = [
            'logo.png', 'menu-background.png', 'background.png',
            'menu-music.mp3', 'sound.mp3', 'music.mp3',
            'font.ttf', 'font.woff', 'font.woff2'
        ];
        
        for (const file of mediaFiles) {
            const fullPath = folderPath + file;
            const exists = await this.checkFileExists(fullPath);
            if (exists) {
                results[fullPath] = true;
                console.log(`  ✅ Найден: ${fullPath}`);
            }
        }
        
        return results;
    }
    
    // Проверка существования файла через fetch
    async checkFileExists(filePath){
        try {
            const response = await fetch(filePath, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Сортировка файлов
    sortFiles(files){
        const sorted = {};
        const keys = Object.keys(files).sort();
        for (const key of keys) {
            sorted[key] = files[key];
        }
        return sorted;
    }
    
    // Построение дерева из результатов
    buildTreeFromResults(results){
        const tree = {};
        
        Object.keys(results).forEach(filePath => {
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
    formatTreeWithStatus(tree, prefix = ''){
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
    
    // ГЛАВНЫЙ МЕТОД для получения структуры
    async generateStructureForAI(){
        console.log('📂 Генерация структуры проекта...');
        
        // Сканируем проект
        const files = await this.scanProject();
        
        // Строим дерево
        const tree = this.buildTreeFromResults(files);
        
        // Форматируем
        let structure = 'last-spell-clone/\n';
        structure += this.formatTreeWithStatus(tree, '');
        
        return structure;
    }
    
    // Получение структуры для буфера обмена
    async getStructureForClipboard(){
        console.log('📋 Подготовка структуры для буфера обмена...');
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
    
    // Резервная структура (если сканирование не удалось)
    getFallbackStructure(){
        return `last-spell-clone/\n├── index.html\n├── src/\n│   ├── scripts/\n│   │   ├── main.js\n│   │   ├── core/\n│   │   │   └── Engine.js\n│   │   ├── ui/\n│   │   │   └── MenuManager.js\n│   │   ├── audio/\n│   │   │   └── AudioManager.js\n│   │   └── utils/\n│   │       └── projectScanner.js\n│   └── styles/\n│       ├── main.css\n│       └── menu.css\n└── .gitignore`;
    }
}
