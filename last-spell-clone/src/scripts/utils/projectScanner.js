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
    
    getStructure(){
        return `last-spell-clone/
├── index.html ✅
├── README.md ✅
├── .gitignore ✅
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── menu-background.png ❌
│   │   │   ├── logo.png ❌
│   │   │   └── ... ❌
│   │   ├── sounds/
│   │   │   ├── menu-music.mp3 ❌
│   │   │   └── ... ❌
│   │   └── fonts/ ❌
│   ├── styles/
│   │   ├── main.css ✅
│   │   ├── menu.css ✅
│   │   └── components/
│   │       ├── buttons.css ❌
│   │       └── ... ❌
│   ├── scripts/
│   │   ├── main.js ✅
│   │   ├── core/
│   │   │   ├── Engine.js ✅
│   │   │   ├── Game.js ❌
│   │   │   └── StateManager.js ❌
│   │   ├── ui/
│   │   │   ├── MenuManager.js ✅
│   │   │   ├── UIManager.js ❌
│   │   │   └── components/
│   │   │       ├── Button.js ❌
│   │   │       └── ... ❌
│   │   ├── graphics/
│   │   │   ├── Renderer.js ❌
│   │   │   ├── ParticleSystem.js ❌
│   │   │   └── AnimationManager.js ❌
│   │   ├── audio/
│   │   │   ├── AudioManager.js ✅
│   │   │   └── SoundController.js ❌
│   │   └── utils/
│   │       ├── helpers.js ❌
│   │       ├── constants.js ❌
│   │       └── projectScanner.js ✅
│   └── config/
│       ├── gameConfig.js ✅
│       └── menuConfig.js ❌
└── .gitignore ✅`;
    }
    
    getStructureForClipboard(){
        const structure = this.getStructure();
        const timestamp = new Date().toLocaleString();
        return `=== СТРУКТУРА ПРОЕКТА ===\nВерсия: v1.0.2.21\nДата: ${timestamp}\n\n${structure}\n\n=== КОНЕЦ СТРУКТУРЫ ===`;
    }
}
