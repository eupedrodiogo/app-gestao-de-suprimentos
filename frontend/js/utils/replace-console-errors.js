/**
 * Script para substituir console.error por log.error em todos os arquivos JS
 * Execute este script para automatizar a migração do sistema de logging
 */

// Mapeamento de substituições comuns
const replacements = [
    {
        pattern: /console\.error\('([^']+)',\s*error\);/g,
        replacement: "log.error('$1', { error: error.message, stack: error.stack });"
    },
    {
        pattern: /console\.error\('([^']+):', error\);/g,
        replacement: "log.error('$1', { error: error.message, stack: error.stack });"
    },
    {
        pattern: /console\.error\('([^']+)',\s*([^)]+)\);/g,
        replacement: "log.error('$1', { error: $2?.message || $2, stack: $2?.stack });"
    },
    {
        pattern: /console\.error\('([^']+):', ([^)]+)\);/g,
        replacement: "log.error('$1', { error: $2?.message || $2, stack: $2?.stack });"
    },
    {
        pattern: /console\.error\('([^']+)'\);/g,
        replacement: "log.error('$1');"
    }
];

// Lista de arquivos que precisam do import do logger
const filesToUpdate = [
    'js/main.js',
    'js/dashboard.js',
    'js/products.js',
    'js/suppliers.js',
    'js/orders.js',
    'js/quotes.js',
    'js/reports.js',
    'js/app.js',
    'js/mobile-menu.js',
    'js/services/ApiService.js',
    'js/components/Dashboard.js',
    'js/utils/ComponentRegistry.js',
    'js/utils/ModuleLoader.js',
    'js/utils/LazyLoader.js'
];

// Função para adicionar import do logger se não existir
function addLoggerImport(content, filePath) {
    // Verificar se já tem o import
    if (content.includes("import log from") || content.includes("const log = require")) {
        return content;
    }
    
    // Determinar o caminho relativo para o logger
    const depth = (filePath.match(/\//g) || []).length - 1;
    const relativePath = '../'.repeat(depth) + 'utils/logger.js';
    
    // Adicionar import no início do arquivo
    const importStatement = `import log from '${relativePath}';\n\n`;
    
    // Encontrar onde inserir o import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Pular comentários iniciais
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//') || line.startsWith('/*') || line === '') {
            insertIndex = i + 1;
        } else {
            break;
        }
    }
    
    lines.splice(insertIndex, 0, `import log from '${relativePath}';`, '');
    return lines.join('\n');
}

// Função para aplicar substituições
function applyReplacements(content) {
    let updatedContent = content;
    
    replacements.forEach(({ pattern, replacement }) => {
        updatedContent = updatedContent.replace(pattern, replacement);
    });
    
    return updatedContent;
}

// Função principal para processar um arquivo
function processFile(filePath, content) {
    console.log(`Processando: ${filePath}`);
    
    // Adicionar import do logger
    let updatedContent = addLoggerImport(content, filePath);
    
    // Aplicar substituições
    updatedContent = applyReplacements(updatedContent);
    
    return updatedContent;
}

// Instruções de uso
console.log(`
=== Script de Migração de Logging ===

Este script substitui console.error por log.error em todos os arquivos JavaScript.

Para usar:
1. Execute este script no diretório frontend
2. O script processará automaticamente todos os arquivos listados
3. Verifique os resultados e teste a aplicação

Arquivos que serão processados:
${filesToUpdate.map(f => `- ${f}`).join('\n')}

Substituições que serão feitas:
- console.error('message', error) → log.error('message', { error: error.message, stack: error.stack })
- console.error('message:', error) → log.error('message', { error: error.message, stack: error.stack })
- console.error('message') → log.error('message')

Imports que serão adicionados:
- import log from './utils/logger.js' (com caminho relativo correto)
`);

// Exportar funções para uso manual se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processFile,
        addLoggerImport,
        applyReplacements,
        filesToUpdate,
        replacements
    };
}