/**
 * BIBLIOTECA DE ÍCONES SVG PROFISSIONAIS
 * Sistema de Gestão de Suprimentos - Ambiente Corporativo
 * 
 * Ícones otimizados para alta qualidade visual e performance
 */

const CorporateIcons = {
    // Navegação e Sistema
    dashboard: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
    </svg>`,
    
    products: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" fill="currentColor"/>
    </svg>`,
    
    suppliers: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="currentColor"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    quotes: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="currentColor"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    orders: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4zM9 3v1h6V3H9zm9 5H6v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z" fill="currentColor"/>
        <path d="M9 11v6M15 11v6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    
    reports: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/>
        <path d="M7 12l3-3 2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="7" cy="12" r="1" fill="white"/>
        <circle cx="10" cy="9" r="1" fill="white"/>
        <circle cx="12" cy="11" r="1" fill="white"/>
        <circle cx="16" cy="7" r="1" fill="white"/>
    </svg>`,
    
    // Ações e Controles
    add: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    edit: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="currentColor"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="white"/>
    </svg>`,
    
    delete: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    close: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    search: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
        <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    refresh: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    // Analytics e IA
    analytics: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/>
        <path d="M8 15l2-6 3 3 3-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    ai: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="currentColor"/>
        <circle cx="9" cy="10" r="1" fill="white"/>
        <circle cx="15" cy="10" r="1" fill="white"/>
        <path d="M9 14s1.5 2 3 2 3-2 3-2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    
    predictions: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="8" r="1" fill="white"/>
    </svg>`,
    
    // Visualizações
    chart: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/>
        <rect x="7" y="10" width="2" height="7" fill="white"/>
        <rect x="11" y="8" width="2" height="9" fill="white"/>
        <rect x="15" y="12" width="2" height="5" fill="white"/>
    </svg>`,
    
    download: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    fullscreen: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    // Status e Sistema
    status: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    success: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    // Ferramentas
    tools: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor"/>
    </svg>`,
    
    automation: `<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1" fill="none"/>
    </svg>`
};

/**
 * Função para criar um ícone SVG
 * @param {string} iconName - Nome do ícone
 * @param {string} className - Classes CSS adicionais
 * @param {Object} attributes - Atributos adicionais
 * @returns {string} HTML do ícone SVG
 */
function createIcon(iconName, className = '', attributes = {}) {
    if (!CorporateIcons[iconName]) {
        console.warn(`Ícone '${iconName}' não encontrado`);
        return '';
    }
    
    let icon = CorporateIcons[iconName];
    
    // Adicionar classes CSS
    if (className) {
        icon = icon.replace('class="icon"', `class="icon ${className}"`);
    }
    
    // Adicionar atributos
    Object.keys(attributes).forEach(attr => {
        const value = attributes[attr];
        icon = icon.replace('<svg', `<svg ${attr}="${value}"`);
    });
    
    return icon;
}

/**
 * Função para substituir um elemento por um ícone SVG
 * @param {HTMLElement} element - Elemento a ser substituído
 * @param {string} iconName - Nome do ícone
 * @param {string} className - Classes CSS adicionais
 */
function replaceWithIcon(element, iconName, className = '') {
    const iconHTML = createIcon(iconName, className, {
        'aria-hidden': 'true'
    });
    
    if (iconHTML) {
        element.outerHTML = iconHTML;
    }
}

/**
 * Função para inicializar ícones em uma página
 */
function initializeIcons() {
    // Substituir ícones automaticamente baseado em data-attributes
    document.querySelectorAll('[data-icon]').forEach(element => {
        const iconName = element.getAttribute('data-icon');
        const className = element.getAttribute('data-icon-class') || '';
        replaceWithIcon(element, iconName, className);
    });
}

// Exportar para uso global
window.CorporateIcons = CorporateIcons;
window.createIcon = createIcon;
window.replaceWithIcon = replaceWithIcon;
window.initializeIcons = initializeIcons;

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIcons);
} else {
    initializeIcons();
}