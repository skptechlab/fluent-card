// fullscreen.js - YouTube-style fullscreen landscape functionality

export class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.originalOrientation = null;
        this.lockOrientationSupported = 'orientation' in screen && 'lock' in screen.orientation;
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
    }
    
    handleFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        if (!this.isFullscreen) {
            this.unlockOrientation();
        }
    }
    
    async enterFullscreen() {
        try {
            const element = document.documentElement;
            
            // Request fullscreen
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
            
            // Lock orientation to landscape after entering fullscreen
            setTimeout(() => {
                this.lockToLandscape();
            }, 100);
            
            this.isFullscreen = true;
            console.log('Entered fullscreen landscape mode');
            
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
            // Fallback: just try to lock orientation without fullscreen
            this.lockToLandscape();
        }
    }
    
    async exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
            
            this.unlockOrientation();
            this.isFullscreen = false;
            console.log('Exited fullscreen mode');
            
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
            this.unlockOrientation();
        }
    }
    
    async lockToLandscape() {
        if (!this.lockOrientationSupported) {
            console.log('Screen orientation lock not supported');
            return;
        }
        
        try {
            // Store original orientation if not already stored
            if (!this.originalOrientation && screen.orientation) {
                this.originalOrientation = screen.orientation.type;
            }
            
            // Try to lock to landscape
            await screen.orientation.lock('landscape');
            console.log('Orientation locked to landscape');
            
        } catch (error) {
            console.log('Could not lock orientation to landscape:', error.message);
            
            // Fallback: try specific landscape orientations
            try {
                await screen.orientation.lock('landscape-primary');
            } catch (fallbackError) {
                try {
                    await screen.orientation.lock('landscape-secondary');
                } catch (finalError) {
                    console.log('All landscape orientation lock attempts failed');
                }
            }
        }
    }
    
    unlockOrientation() {
        if (!this.lockOrientationSupported) {
            return;
        }
        
        try {
            screen.orientation.unlock();
            console.log('Orientation unlocked');
        } catch (error) {
            console.log('Could not unlock orientation:', error.message);
        }
    }
    
    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Show/hide fullscreen instruction for mobile users
    showFullscreenHint() {
        if (this.isMobile() && !this.isFullscreen) {
            const hint = document.createElement('div');
            hint.className = 'fullscreen-hint';
            hint.innerHTML = `
                <div class="fullscreen-hint-content">
                    <p>🌟 For the best experience, rotate to landscape mode!</p>
                    <button onclick="this.parentElement.parentElement.remove()">Got it!</button>
                </div>
            `;
            hint.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                text-align: center;
                z-index: 10000;
                font-family: 'Roboto', sans-serif;
            `;
            document.body.appendChild(hint);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (hint.parentElement) {
                    hint.remove();
                }
            }, 5000);
        }
    }
}

// Create singleton instance
export const fullscreenManager = new FullscreenManager();

// CSS for fullscreen styling
export function injectFullscreenStyles() {
    const styleId = 'fullscreen-styles';
    if (document.getElementById(styleId)) {
        return; // Already injected
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Fullscreen optimizations */
        body:fullscreen,
        body:-webkit-full-screen,
        body:-moz-full-screen,
        body:-ms-fullscreen {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        /* Game canvas fullscreen adjustments */
        body:fullscreen #gameCanvas,
        body:-webkit-full-screen #gameCanvas,
        body:-moz-full-screen #gameCanvas,
        body:-ms-fullscreen #gameCanvas {
            width: 100vw !important;
            height: 100vh !important;
        }
        
        /* UI overlay fullscreen adjustments */
        body:fullscreen .ui-overlay,
        body:-webkit-full-screen .ui-overlay,
        body:-moz-full-screen .ui-overlay,
        body:-ms-fullscreen .ui-overlay {
            width: 100vw !important;
            height: 100vh !important;
        }
        
        /* Control buttons in fullscreen - make menu button more prominent */
        body:fullscreen .control-buttons,
        body:-webkit-full-screen .control-buttons,
        body:-moz-full-screen .control-buttons,
        body:-ms-fullscreen .control-buttons {
            z-index: 1000;
        }
        
        /* Fullscreen hint styling */
        .fullscreen-hint-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px;
            border-radius: 10px;
            margin: 0 20px;
        }
        
        .fullscreen-hint-content button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
        }
        
        .fullscreen-hint-content button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        /* Landscape orientation hints */
        @media screen and (orientation: portrait) and (max-width: 768px) {
            .landscape-hint {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(90deg);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 10001;
                font-size: 18px;
            }
        }
    `;
    document.head.appendChild(style);
}