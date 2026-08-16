import { Engine } from './core/Engine.js';
import { MenuManager } from './ui/MenuManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

class Game {
    constructor() {
        this.engine = new Engine();
        this.menuManager = new MenuManager();
        this.audioManager = new AudioManager();
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize engine
            await this.engine.init();
            
            // Initialize audio
            await this.audioManager.init();
            
            // Initialize menu
            this.menuManager.init();
            
            // Set up menu background animation
            this.setupMenuBackground();
            
            // Play menu music
            this.audioManager.playMenuMusic();
            
            this.isInitialized = true;
            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    setupMenuBackground() {
        const canvas = document.getElementById('menu-canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Animate the background
        this.animateBackground(ctx, canvas);
    }

    animateBackground(ctx, canvas) {
        // Simple particle system for embers
        const particles = [];
        const numParticles = 50;

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: -(Math.random() * 0.5 + 0.1),
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw dark background
            ctx.fillStyle = '#0a0505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw some pixel-art style wall
            this.drawPixelWall(ctx, canvas);
            
            // Update and draw particles
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.y < 0) {
                    p.y = canvas.height;
                    p.x = Math.random() * canvas.width;
                }
                
                ctx.fillStyle = `rgba(200, 100, 50, ${p.opacity})`;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    drawPixelWall(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Draw a simple pixel-art wall
        const wallY = height * 0.6;
        const wallHeight = height * 0.3;
        
        // Wall base
        ctx.fillStyle = '#2a1a1a';
        ctx.fillRect(0, wallY, width, wallHeight);
        
        // Brick pattern (simplified pixel art)
        const brickWidth = 40;
        const brickHeight = 20;
        
        for (let row = 0; row < wallHeight / brickHeight; row++) {
            const offset = row % 2 === 0 ? 0 : brickWidth / 2;
            for (let col = -1; col < width / brickWidth + 1; col++) {
                const x = col * brickWidth + offset;
                const y = wallY + row * brickHeight;
                
                ctx.fillStyle = row % 2 === 0 ? '#3a2a2a' : '#4a3a3a';
                ctx.fillRect(x, y, brickWidth - 1, brickHeight - 1);
                
                // Add some damage/broken bricks
                if (Math.random() > 0.95) {
                    ctx.fillStyle = '#1a0a0a';
                    ctx.fillRect(x + 5, y + 5, 10, 10);
                }
            }
        }
        
        // Draw fire effect at the top
        this.drawPixelFire(ctx, width, height);
    }

    drawPixelFire(ctx, width, height) {
        const fireX = width * 0.4;
        const fireY = height * 0.3;
        const fireWidth = width * 0.2;
        const fireHeight = height * 0.3;
        
        // Simple pixel fire
        const colors = [
            'rgba(200, 50, 0, 0.5)',
            'rgba(255, 100, 0, 0.3)',
            'rgba(255, 200, 0, 0.2)'
        ];
        
        for (let i = 0; i < 20; i++) {
            const x = fireX + Math.random() * fireWidth;
            const y = fireY + Math.random() * fireHeight;
            const size = Math.random() * 8 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
        }
    }

    // ... other game methods
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game; // For debugging
    game.init();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('menu-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
