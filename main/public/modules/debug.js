// Debug Module - helps with development and debugging

export const DEBUG = true; // Set to false in production

export function debugLog(message, ...args) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}

export function debugError(message, error) {
    if (DEBUG) {
        console.error(`[ERROR] ${message}`, error);
    }
}

// Element checker - helps debug missing elements
export function checkElements(elementIds) {
    const missing = elementIds.filter(id => !document.getElementById(id));
    
    if (missing.length > 0) {
        debugError('Missing elements:', missing);
        return false;
    }
    
    return true;
}