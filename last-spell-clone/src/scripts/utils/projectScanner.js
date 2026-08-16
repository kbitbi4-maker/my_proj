export class ProjectScanner{
    constructor(){
        this.projectFiles = {
            'index.html': true,
            'README.md': true,
            '.gitignore': true,
            'src/assets/images/menu-background.png': false,
            'src/assets/images/logo.png': false,
            'src/assets/sounds/menu-music.mp3': false,
            'src/assets/fonts/': false,
            'src/styles/main.css': true,
            'src/styles/menu.css': true,
            'src/styles/components/buttons.css': false,
            'src/scripts/main.js': true,
            'src/scripts/core/Engine.js': true,
            'src/scripts/core/Game.js': false,
            'src/scripts/core/StateManager.js': false,
            'src/scripts/ui/MenuManager.js': true,
            'src/scripts/ui/UIManager.js': false,
            'src/scripts/ui/components/Button.js': false,
            'src/scripts/graphics/Renderer.js': false,
            'src/scripts/graphics/ParticleSystem.js': false,
            'src/scripts/graphics/AnimationManager.js': false,
            'src/scripts/audio/AudioManager.js': true,
            'src/scripts/audio/SoundController.js': false,
            'src/scripts/utils/helpers.js': false,
            'src/scripts/utils/constants.js': false,
            'src/scripts/utils/projectScanner.js': true,
            'src/config/gameConfig.js': true,
            'src/config/menuConfig.js': false
        }
    }
    
    generateStructureForAI(){
        let result = 'last-spell-clone/\n';
        result += this.buildTreeWithStatus();
        return result
    }
    
    buildTreeWithStatus(){
        const tree = {};
        const sortedFiles = Object.keys(this.projectFiles).sort();
        
        sortedFiles.forEach(filePath => {
            const parts = filePath.split('/');
            let current = tree;
            
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    if (!current._files) current._files = [];
                    const exists = this.projectFiles[filePath];
                    current._files.push({
                        name: part,
                        exists: exists,
                        path: filePath
                    });
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });
        
        return this.formatTreeWithStatus(tree, '')
    }
    
    formatTreeWithStatus(tree, prefix){
        let result = '';
        const items = Object.keys(tree);
        const files = tree._files || [];
        const folders = items.filter(item => item !== '_files');
        
        folders.forEach((folder, index) => {
            const isLast = index === folders.length - 1 && files.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            const hasFiles = this.folderHasFiles(tree[folder]);
            const status = hasFiles ? ' ✅' : ' ❌';
            result += `${prefix}${connector}${folder}/${status}\n`;
            result += this.formatTreeWithStatus(tree[folder], prefix + (isLast ? '    ' : '│   '))
        });
        
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
    
    getStructureForClipboard(){
        const structure = this.generateStructureForAI();
        const timestamp = new Date().toLocaleString();
        return `=== СТРУКТУРА ПРОЕКТА ===\nВерсия: v1.0.2.21\nДата: ${timestamp}\n\n${structure}\n\n=== КОНЕЦ СТРУКТУРЫ ===`
    }
}
