// In your ui.js
import { Navigation } from './components.js';
// UI Module - handles all user interface interactions

/**
 * Initialize navigation functionality
 */
export function initNavigation() {
    const navTrigger = document.getElementById('nav-trigger');
    const mainNav = document.getElementById('main-nav');
    
    // Check if elements exist before adding listeners
    if (!navTrigger || !mainNav) {
        console.warn('Navigation elements not found');
        return;
    }
    
    navTrigger.addEventListener('click', function() {
        // Toggle navigation visibility
        mainNav.classList.toggle('hidden');
        
        // Optional: update trigger button text/state
        navTrigger.setAttribute('aria-expanded', 
            mainNav.classList.contains('hidden') ? 'false' : 'true');
    });
}

/**
 * Initialize header animations
 */
export function initHeaderAnimation() {
    const header = document.getElementById('main-header');
    
    if (!header) {
        console.warn('Header element not found');
        return;
    }
    
    // Your header animation logic here
    // Example: add animation class after page load
    setTimeout(() => {
        header.classList.add('animated');
    }, 100);
}

/**
 * Initialize all UI components
 */
export function initUI() {
    initNavigation();
    initHeaderAnimation();
    
    // Add other UI initializations here
}
export function initNavigation() {
    try {
        new Navigation('nav-trigger', 'main-nav');
    } catch (error) {
        console.error('Failed to initialize navigation:', error);
    }
}