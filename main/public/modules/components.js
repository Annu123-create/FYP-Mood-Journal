// Component System - reusable UI components

export class Component {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) {
            throw new Error(`Component element "${elementId}" not found`);
        }
    }
    
    addListener(eventType, callback) {
        this.element.addEventListener(eventType, callback);
        return this;
    }
    
    addClass(className) {
        this.element.classList.add(className);
        return this;
    }
    
    removeClass(className) {
        this.element.classList.remove(className);
        return this;
    }
    
    toggleClass(className) {
        this.element.classList.toggle(className);
        return this;
    }
}

export class Navigation extends Component {
    constructor(triggerId, navId) {
        super(triggerId);
        this.nav = document.getElementById(navId);
        if (!this.nav) {
            throw new Error(`Navigation element "${navId}" not found`);
        }
        this.init();
    }
    
    init() {
        this.addListener('click', () => this.toggle());
    }
    
    toggle() {
        this.nav.classList.toggle('hidden');
        this.element.setAttribute('aria-expanded', 
            this.nav.classList.contains('hidden') ? 'false' : 'true');
    }
}