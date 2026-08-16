export class MenuManager {
    constructor() {
        this.buttons = {};
        this.isVisible = true;
    }

    init() {
        // Get all menu buttons
        const btnIds = ['btn1', 'btn2', 'btn3', 'btn4'];
        
        btnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                this.buttons[id] = btn;
                this.setupButtonEvent(btn, id);
            }
        });
        
        // Add hover sound effect
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                // Play hover sound (will be implemented later)
                console.log('Button hover:', btn.id);
            });
        });
    }

    setupButtonEvent(button, id) {
        button.addEventListener('click', () => {
            console.log(`Button ${id} clicked`);
            // In future versions, this will handle menu navigation
            this.handleButtonClick(id);
        });
    }

    handleButtonClick(buttonId) {
        switch(buttonId) {
            case 'btn1':
                console.log('Continue game');
                break;
            case 'btn2':
                console.log('Open settings');
                break;
            case 'btn3':
                console.log('Show credits');
                break;
            case 'btn4':
                console.log('Exit game');
                break;
        }
    }

    show() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'flex';
        this.isVisible = true;
    }

    hide() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'none';
        this.isVisible = false;
    }
}
