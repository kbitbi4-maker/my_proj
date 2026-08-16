export class ProjectScanner{
    constructor(){
        // Простой список файлов с пометками
        this.files = {
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
    
    // Простое получение структуры
    getStructure(){
        let result = 'last-spell-clone/\n';
        result += '├── index.html ✅\n';
        result += '├── README.md ✅\n';
        result += '├── .gitignore ✅\n';
        result += '├── src/\n';
        result += '│   ├── assets/\n';
        result += '│   │   ├── images/\n';
        result += '│   │   │   ├── menu-background.png ❌\n';
        result += '│   │   │   ├── logo.png ❌\n';
        result += '│   │   │   └── ... ❌\n';
        result += '│   │   ├── sounds/\n';
        result += '│   │   │   ├── menu-music.mp3 ❌\n';
        result += '│   │   │   └── ... ❌\n';
        result += '│   │   └── fonts/ ❌\n';
        result += '│   ├── styles/\n';
        result += '│   │   ├── main.css ✅\n';
        result += '│   │   ├── menu.css ✅\n';
        result += '│   │   └── components/\n';
        result += '│   │       ├── buttons.css ❌\n';
        result += '│   │       └── ... ❌\n';
        result += '│   ├── scripts/\n';
        result += '│   │   ├── main.js ✅\n';
        result += '│   │   ├── core/\n';
        result += '│   │   │   ├── Engine.js ✅\n';
        result += '│   │   │   ├── Game.js ❌\n';
        result += '│   │   │   └── StateManager.js ❌\n';
        result += '│   │   ├── ui/\n';
        result += '│   │   │   ├── MenuManager.js ✅\n';
        result += '│   │   │   ├── UIManager.js ❌\n';
        result += '│   │   │   └── components/\n';
        result += '│   │   │       ├── Button.js ❌\n';
        result += '│   │   │       └── ... ❌\n';
        result += '│   │   ├── graphics/\n';
        result += '│   │   │   ├── Renderer.js ❌\n';
        result += '│   │   │   ├── ParticleSystem.js ❌\n';
        result += '│   │   │   └── AnimationManager.js ❌\n';
        result += '│   │   ├── audio/\n';
        result += '│   │   │   ├── AudioManager.js ✅\n';
        result += '│   │   │   └── SoundController.js ❌\n';
        result += '│   │   └── utils/\n';
        result += '│   │       ├── helpers.js ❌\n';
        result += '│   │       ├── constants.js ❌\n';
        result += '│   │       └── projectScanner.js ✅\n';
        result += '│   └── config/\n';
        result += '│       ├── gameConfig.js ✅\n';
        result += '│       └── menuConfig.js ❌\n';
        result += '└── .gitignore ✅';
        
        return result;
    }
    
    getStructureForClipboard(){
        const structure = this.getStructure();
        const timestamp = new Date().toLocaleString();
        return `=== СТРУКТУРА ПРОЕКТА ===\nВерсия: v1.0.2.21\nДата: ${timestamp}\n\n${structure}\n\n=== КОНЕЦ СТРУКТУРЫ ===`;
    }
}
