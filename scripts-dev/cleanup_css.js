const fs = require('fs');
const filePath = process.argv[2];

let content = fs.readFileSync(filePath, 'utf8');

// Aggressive cleanup for fragmented properties (e.g., font - size -> font-size)
content = content.replace(/([a-z]+) - (size|weight|family|style|bottom|top|left|right|height|width|color|align|justify|direction|shadow|radius|index|events|type|decoration|count|background|template|columns|rows|gap|items|content|flow|wrap|behavior|overflow|fit|fill|axis|origin|timing|delay|duration|iteration|play|state|name|mode|fill|after|before|placeholder|webkit|moz|ms|o|box|sizing|backdrop|filter|selection|transform|transition)/gi, (match, p1, p2) => {
    // Check if there is really a space around the dash
    if (match.includes(' - ')) {
        return `${p1}-${p2}`;
    }
    return match;
});

// Fix variables with spaces around dashes e.g. var(--bg - card) -> var(--bg-card)
content = content.replace(/var\(--([a-z0-9-]+) - ([a-z0-9-]+)\)/gi, 'var(--$1-$2)');

// Fix specific known fragments that aren't caught by the general regex
const specificFragments = [
    'settings-container', 'settings-header', 'settings-section', 'section-icon',
    'form-group', 'setting-input', 'stats-container', 'stat-card', 'summary-item',
    'stats-header', 'stats-title', 'stats-controls', 'control-btn', 'control-emoji',
    'control-text', 'stats-grid', 'stat-icon', 'stat-content', 'stat-title',
    'chart-container', 'summary-stats', 'summary-label', 'summary-value',
    'insight-item', 'detailed-stats', 'mood-breakdown', 'breakdown-title',
    'breakdown-emoji', 'mood-list', 'mood-item', 'mood-info', 'mood-emoji',
    'mood-name', 'mood-stats', 'mood-count', 'mood-percentage', 'loading-stats',
    'loading-insights', 'loading-moods', 'no-data-message', 'no-data-emoji',
    'no-data-text', 'debug-info', 'deco-emoji', 'header-decoration', 'feedback-form',
    'previous-feedback-list', 'previous-feedback-item', 'help-page', 'about-page',
    'feature-item', 'feature-icon', 'team-members', 'team-member', 'member-avatar',
    'social-links', 'social-link', 'legal-links', 'legal-link', 'settings-actions',
    'btn-primary', 'btn-secondary', 'back-to-top'
];

specificFragments.forEach(frag => {
    const parts = frag.split('-');
    if (parts.length === 2) {
        const regex = new RegExp(`${parts[0]} - ${parts[1]}`, 'g');
        content = content.replace(regex, frag);
    }
});

// Fix pseudos
content = content.replace(/:: -webkit - scrollbar/g, '::-webkit-scrollbar');
content = content.replace(/-webkit - scrollbar - track/g, '-webkit-scrollbar-track');
content = content.replace(/-webkit - scrollbar - thumb/g, '-webkit-scrollbar-thumb');

// Fix percentage spaces
content = content.replace(/([0-9]+) %/g, '$1%');

// Fix math/values fragments
content = content.replace(/ease - in - out/g, 'ease-in-out');
content = content.replace(/ease - in/g, 'ease-in');
content = content.replace(/ease - out/g, 'ease-out');
content = content.replace(/repeat\(auto - fit/g, 'repeat(auto-fit');
content = content.replace(/repeat\(auto - fill/g, 'repeat(auto-fill');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned up CSS syntax (AGGRESSIVE) in ' + filePath);
