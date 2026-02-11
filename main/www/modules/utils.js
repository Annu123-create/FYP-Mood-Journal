// Utility Module - reusable helper functions

/**
 * Safe event listener attachment
 * @param {string} elementId - ID of the element
 * @param {string} eventType - Event type to listen for
 * @param {Function} callback - Function to execute
 * @returns {boolean} - Whether the listener was attached successfully
 */
export function safeAddListener(elementId, eventType, callback) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.warn(`Element with ID "${elementId}" not found`);
        return false;
    }
    
    element.addEventListener(eventType, callback);
    return true;
}

/**
 * Wait for DOM to be ready
 * @param {Function} callback - Function to execute when DOM is ready
 */
export function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}