export class ProjectScanner {
    constructor() {
        // Определяем, какие файлы/папки игнорировать
        this.ignorePatterns = [
            'node_modules',
            '.git',
            '.vscode',
            '.idea',
            'dist',
            'build',
            '*.min.js',
            '*.map',
            '*.log',
            '.DS_Store',
            'Thumbs.db'
        ];
    }

    async scanProjectStructure() {
        try {
            // Получаем список всех файлов в проекте
            const files = await this.getAllFiles();
            
            // Строим дерево
            const tree = this.buildTree(files);
            
            return tree;
        } catch (error) {
            console.error('Error scanning project:', error);
            return this.getDefaultStructure();
        }
    }

    async getAllFiles() {
        // В браузере мы не можем просто так просканировать файловую систему
        // Поэтому используем подход с fetch для проверки существования файлов
        
        // Список всех возможных файлов в нашем проекте
        const possibleFiles = [
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

        const existingFiles = [];

        for (const filePath of possibleFiles) {
            try {
                // Пытаемся загрузить файл
                const response = await fetch(filePath, { method: 'HEAD' });
                if (response.ok) {
                    existingFiles.push(filePath);
                }
            } catch (e) {
                // Файл не существует, пропускаем
            }
        }

        return existingFiles;
    }

    buildTree(files) {
        const tree = {};
        
        files.forEach(file => {
            const parts = file.split('/');
            let current = tree;
            
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // Это файл
                    if (!current._files) current._files = [];
                    current._files.push(part);
                } else {
                    // Это папка
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });

        return tree;
    }

    formatTree(tree, prefix = '') {
        let result = '';
        const items = Object.keys(tree);
        const files = tree._files || [];
        const folders = items.filter(item => item !== '_files');
        
        // Сначала выводим папки
        folders.forEach((folder, index) => {
            const isLast = index === folders.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            result += `${prefix}${connector}${folder}/\n`;
            result += this.formatTree(tree[folder], prefix + (isLast ? '    ' : '│   '));
        });

        // Затем файлы
        files.forEach((file, index) => {
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            result += `${prefix}${connector}${file}\n`;
        });

        return result;
    }

    getDefaultStructure() {
        // Возвращаем структуру по умолчанию, если сканирование не удалось
        return `last-spell-clone/
├── index.html
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── menu-background.png
│   │   │   ├── logo.png
│   │   │   └── ...
│   │   ├── sounds/
│   │   │   ├── menu-music.mp3
│   │   │   └── ...
│   │   └── fonts/
│   ├── styles/
│   │   ├── main.css
│   │   ├── menu.css
│   │   └── components/
│   │       ├── buttons.css
│   │       └── ...
│   ├── scripts/
│   │   ├── main.js
│   │   ├── core/
│   │   │   ├── Engine.js
│   │   │   ├── Game.js
│   │   │   └── StateManager.js
│   │   ├── ui/
│   │   │   ├── MenuManager.js
│   │   │   ├── UIManager.js
│   │   │   └── components/
│   │   │       ├── Button.js
│   │   │       └── ...
│   │   ├── graphics/
│   │   │   ├── Renderer.js
│   │   │   ├── ParticleSystem.js
│   │   │   └── AnimationManager.js
│   │   ├── audio/
│   │   │   ├── AudioManager.js
│   │   │   └── SoundController.js
│   │   └── utils/
│   │       ├── helpers.js
│   │       └── constants.js
│   └── config/
│       ├── gameConfig.js
│       └── menuConfig.js
├── README.md
└── .gitignore`;
    }

    // Метод для получения структуры в виде строки с отметками о существующих файлах
    async getProjectStructure() {
        const existingFiles = await this.getAllFiles();
        const tree = this.buildTree(existingFiles);
        
        // Создаем строку с отметками
        let result = 'last-spell-clone/\n';
        result += this.formatTreeWithStatus(tree, existingFiles);
        
        return result;
    }

    formatTreeWithStatus(tree, existingFiles, prefix = '') {
        let result = '';
        const items = Object.keys(tree);
        const files = tree._files || [];
        const folders = items.filter(item => item !== '_files');
        
        folders.forEach((folder, index) => {
            const isLast = index === folders.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            const exists = this.folderHasFiles(tree[folder]);
            const status = exists ? ' ✅' : ' ❌';
            result += `${prefix}${connector}${folder}/${status}\n`;
            result += this.formatTreeWithStatus(tree[folder], existingFiles, prefix + (isLast ? '    ' : '│   '));
        });

        files.forEach((file, index) => {
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const fullPath = this.findFilePath(tree, file);
            const exists = existingFiles.includes(fullPath);
            const status = exists ? ' ✅' : ' ❌';
            result += `${prefix}${connector}${file}${status}\n`;
        });

        return result;
    }

    findFilePath(tree, targetFile, currentPath = '') {
        // Рекурсивно ищем полный путь к файлу
        const items = Object.keys(tree);
        const files = tree._files || [];
        
        if (files.includes(targetFile)) {
            return currentPath ? `${currentPath}/${targetFile}` : targetFile;
        }
        
        const folders = items.filter(item => item !== '_files');
        for (const folder of folders) {
            const newPath = currentPath ? `${currentPath}/${folder}` : folder;
            const result = this.findFilePath(tree[folder], targetFile, newPath);
            if (result) return result;
        }
        
        return null;
    }

    folderHasFiles(folder) {
        // Проверяет, есть ли в папке файлы
        const files = folder._files || [];
        const folders = Object.keys(folder).filter(item => item !== '_files');
        
        if (files.length > 0) return true;
        for (const subFolder of folders) {
            if (this.folderHasFiles(folder[subFolder])) return true;
        }
        return false;
    }

    // Генерирует компактное представление для копирования
    async generateStructureForAI() {
        const existingFiles = await this.getAllFiles();
        
        // Строим дерево с полными путями
        let structure = 'last-spell-clone/\n';
        const tree = this.buildTree(existingFiles);
        structure += this.formatTreeWithPaths(tree, '');
        
        return structure;
    }

    formatTreeWithPaths(tree, prefix = '') {
        let result = '';
        const items = Object.keys(tree);
        const files = tree._files || [];
        const folders = items.filter(item => item !== '_files');
        
        folders.forEach((folder, index) => {
            const isLast = index === folders.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            const path = prefix ? `${prefix}/${folder}` : folder;
            result += `${prefix}${connector}${folder}/\n`;
            result += this.formatTreeWithPaths(tree[folder], path);
        });

        files.forEach((file, index) => {
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const path = prefix ? `${prefix}/${file}` : file;
            result += `${prefix}${connector}${file}\n`;
        });

        return result;
    }
}
