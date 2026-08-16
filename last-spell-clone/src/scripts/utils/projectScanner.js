export class ProjectScanner{
    constructor(){
        // Базовые папки для сканирования
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
        
        // Кэш результатов
        this.cache = {};
        this.lastScanTime = null;
        
        // ДИНАМИЧЕСКИЙ СПИСОК - будем генерировать на лету
        this.commonFileNames = [
            // JS файлы
            'main.js', 'app.js', 'index.js', 'bootstrap.js',
            'Engine.js', 'Game.js', 'StateManager.js', 'SceneManager.js', 'GameLoop.js',
            'MenuManager.js', 'UIManager.js', 'UIRenderer.js',
            'Button.js', 'Panel.js', 'Modal.js', 'Tooltip.js', 'Slider.js',
            'helpers.js', 'constants.js', 'projectScanner.js', 'math.js', 'random.js',
            'AudioManager.js', 'SoundController.js', 'Sound.js', 'MusicPlayer.js',
            'Renderer.js', 'ParticleSystem.js', 'AnimationManager.js', 'Shader.js', 'Sprite.js',
            'gameConfig.js', 'menuConfig.js', 'config.js',
            // Новый файл!
            'new.js', 'test.js', 'debug.js', 'utils.js',
            // CSS файлы
            'main.css', 'menu.css', 'buttons.css', 'style.css', 'ui.css',
            // Медиа файлы
            'logo.png', 'menu-background.png', 'background.png', 'wall.png',
            'menu-music.mp3', 'sound.mp3', 'music.mp3', 'theme.mp3',
            'font.ttf', 'font.woff', 'font.woff2', 'regular.ttf', 'bold.ttf'
        ];
    }
    
    // ГЛАВНЫЙ МЕТОД - полное автоматическое сканирование
    async scanProject(){
        console.log('🔍 Полное автоматическое сканирование проекта...');
        const startTime = Date.now();
        
        try {
            const allFiles = {};
            
            // 1. Сканируем корневые файлы
            const rootFiles = ['index.html', 'README.md', '.gitignore', 'package.json'];
            for (const file of rootFiles) {
                const exists = await this.checkFileExists(file);
                if (exists) {
                    allFiles[file] = true;
                    console.log(`  ✅ Найден: ${file}`);
                }
            }
            
            // 2. Сканируем ВСЕ папки со ВСЕМИ возможными файлами
            for (const folder of this.baseFolders) {
                const folderFiles = await this.scanFolderDynamic(folder);
                Object.assign(allFiles, folderFiles);
            }
            
            // 3. Сортируем
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
    
    // ДИНАМИЧЕСКОЕ сканирование папки - проверяет ВСЕ возможные файлы
    async scanFolderDynamic(folderPath){
        const results = {};
        
        // Проверяем все возможные имена файлов в этой папке
        for (const fileName of this.commonFileNames) {
            const fullPath = folderPath + fileName;
            const exists = await this.checkFileExists(fullPath);
            if (exists) {
                results[fullPath] = true;
                console.log(`  ✅ Найден: ${fullPath}`);
            }
        }
        
        // Дополнительно: проверяем файлы с числовыми суффиксами (file1.js, file2.js и т.д.)
        for (let i = 1; i <= 10; i++) {
            for (const ext of ['.js', '.css', '.json']) {
                const fileName = `file${i}${ext}`;
                const fullPath = folderPath + fileName;
                const exists = await this.checkFileExists(fullPath);
                if (exists) {
                    results[fullPath] = true;
                    console.log(`  ✅ Найден: ${fullPath}`);
                }
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
        const files = await this.scanProject();
        const tree = this.buildTreeFromResults(files);
        
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
    
    getFallbackStructure(){
        return `last-spell-clone/\n├── index.html\n├── src/\n│   ├── scripts/\n│   │   ├── main.js\n│   │   ├── core/\n│   │   │   └── Engine.js\n│   │   ├── ui/\n│   │   │   └── MenuManager.js\n│   │   ├── audio/\n│   │   │   └── AudioManager.js\n│   │   └── utils/\n│   │       └── projectScanner.js\n│   └── styles/\n│       ├── main.css\n│       └── menu.css\n└── .gitignore`;
    }
}
