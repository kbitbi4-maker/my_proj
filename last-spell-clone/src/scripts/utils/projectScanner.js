// Класс для сканирования структуры проекта
export class ProjectScanner{
    // Конструктор с настройками игнорируемых файлов
    constructor(){
        this.ignorePatterns=['node_modules','.git','.vscode','.idea','dist','build','*.min.js','*.map','*.log','.DS_Store','Thumbs.db']
    }
    
    // Основной метод сканирования структуры
    async scanProjectStructure(){
        try{
            const files=await this.getAllFiles();
            const tree=this.buildTree(files);
            return tree
        }catch(error){
            console.error('Error scanning project:',error);
            return this.getDefaultStructure()
        }
    }
    
    // Получение списка всех файлов через fetch
    async getAllFiles(){
        const possibleFiles=[
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
        const existingFiles=[];
        for(const filePath of possibleFiles){
            try{
                const response=await fetch(filePath,{method:'HEAD'});
                if(response.ok){
                    existingFiles.push(filePath)
                }
            }catch(e){}
        }
        return existingFiles
    }
    
    // Построение дерева из списка файлов
    buildTree(files){
        const tree={};
        files.forEach(file=>{
            const parts=file.split('/');
            let current=tree;
            parts.forEach((part,index)=>{
                if(index===parts.length-1){
                    if(!current._files)current._files=[];
                    current._files.push(part)
                }else{
                    if(!current[part])current[part]={};
                    current=current[part]
                }
            })
        });
        return tree
    }
    
    // Форматирование дерева в строку
    formatTree(tree,prefix=''){
        let result='';
        const items=Object.keys(tree);
        const files=tree._files||[];
        const folders=items.filter(item=>item!=='_files');
        folders.forEach((folder,index)=>{
            const isLast=index===folders.length-1&&files.length===0;
            const connector=isLast?'└── ':'├── ';
            result+=`${prefix}${connector}${folder}/\n`;
            result+=this.formatTree(tree[folder],prefix+(isLast?'    ':'│   '))
        });
        files.forEach((file,index)=>{
            const isLast=index===files.length-1;
            const connector=isLast?'└── ':'├── ';
            result+=`${prefix}${connector}${file}\n`
        });
        return result
    }
    
    // Структура по умолчанию на случай ошибки
    getDefaultStructure(){
        return`last-spell-clone/\n├── index.html\n├── src/\n│   ├── assets/\n│   │   ├── images/\n│   │   │   ├── menu-background.png\n│   │   │   ├── logo.png\n│   │   │   └── ...\n│   │   ├── sounds/\n│   │   │   ├── menu-music.mp3\n│   │   │   └── ...\n│   │   └── fonts/\n│   ├── styles/\n│   │   ├── main.css\n│   │   ├── menu.css\n│   │   └── components/\n│   │       ├── buttons.css\n│   │       └── ...\n│   ├── scripts/\n│   │   ├── main.js\n│   │   ├── core/\n│   │   │   ├── Engine.js\n│   │   │   ├── Game.js\n│   │   │   └── StateManager.js\n│   │   ├── ui/\n│   │   │   ├── MenuManager.js\n│   │   │   ├── UIManager.js\n│   │   │   └── components/\n│   │   │       ├── Button.js\n│   │   │       └── ...\n│   │   ├── graphics/\n│   │   │   ├── Renderer.js\n│   │   │   ├── ParticleSystem.js\n│   │   │   └── AnimationManager.js\n│   │   ├── audio/\n│   │   │   ├── AudioManager.js\n│   │   │   └── SoundController.js\n│   │   └── utils/\n│   │       ├── helpers.js\n│   │       ├── constants.js\n│   │       └── projectScanner.js\n│   └── config/\n│       ├── gameConfig.js\n│       └── menuConfig.js\n├── README.md\n└── .gitignore`
    }
    
    // Получение структуры со статусами файлов
    async getProjectStructure(){
        const existingFiles=await this.getAllFiles();
        const tree=this.buildTree(existingFiles);
        let result='last-spell-clone/\n';
        result+=this.formatTreeWithStatus(tree,existingFiles);
        return result
    }
    
    // Форматирование дерева со статусами (✅ или ❌)
    formatTreeWithStatus(tree,existingFiles,prefix=''){
        let result='';
        const items=Object.keys(tree);
        const files=tree._files||[];
        const folders=items.filter(item=>item!=='_files');
        folders.forEach((folder,index)=>{
            const isLast=index===folders.length-1&&files.length===0;
            const connector=isLast?'└── ':'├── ';
            const exists=this.folderHasFiles(tree[folder]);
            const status=exists?' ✅':' ❌';
            result+=`${prefix}${connector}${folder}/${status}\n`;
            result+=this.formatTreeWithStatus(tree[folder],existingFiles,prefix+(isLast?'    ':'│   '))
        });
        files.forEach((file,index)=>{
            const isLast=index===files.length-1;
            const connector=isLast?'└── ':'├── ';
            const fullPath=this.findFilePath(tree,file);
            const exists=existingFiles.includes(fullPath);
            const status=exists?' ✅':' ❌';
            result+=`${prefix}${connector}${file}${status}\n`
        });
        return result
    }
    
    // Поиск полного пути к файлу в дереве
    findFilePath(tree,targetFile,currentPath=''){
        const items=Object.keys(tree);
        const files=tree._files||[];
        if(files.includes(targetFile)){
            return currentPath?`${currentPath}/${targetFile}`:targetFile
        }
        const folders=items.filter(item=>item!=='_files');
        for(const folder of folders){
            const newPath=currentPath?`${currentPath}/${folder}`:folder;
            const result=this.findFilePath(tree[folder],targetFile,newPath);
            if(result)return result
        }
        return null
    }
    
    // Проверка наличия файлов в папке
    folderHasFiles(folder){
        const files=folder._files||[];
        const folders=Object.keys(folder).filter(item=>item!=='_files');
        if(files.length>0)return true;
        for(const subFolder of folders){
            if(this.folderHasFiles(folder[subFolder]))return true
        }
        return false
    }
    
    // Генерация структуры для копирования в буфер
    async generateStructureForAI(){
        const existingFiles=await this.getAllFiles();
        let structure='last-spell-clone/\n';
        const tree=this.buildTree(existingFiles);
        structure+=this.formatTreeWithPaths(tree,'');
        return structure
    }
    
    // Форматирование дерева с путями
    formatTreeWithPaths(tree,prefix=''){
        let result='';
        const items=Object.keys(tree);
        const files=tree._files||[];
        const folders=items.filter(item=>item!=='_files');
        folders.forEach((folder,index)=>{
            const isLast=index===folders.length-1&&files.length===0;
            const connector=isLast?'└── ':'├── ';
            const path=prefix?`${prefix}/${folder}`:folder;
            result+=`${prefix}${connector}${folder}/\n`;
            result+=this.formatTreeWithPaths(tree[folder],path)
        });
        files.forEach((file,index)=>{
            const isLast=index===files.length-1;
            const connector=isLast?'└── ':'├── ';
            const path=prefix?`${prefix}/${file}`:file;
            result+=`${prefix}${connector}${file}\n`
        });
        return result
    }
}
