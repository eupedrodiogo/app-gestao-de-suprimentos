/**
 * Sistema de Logging para Frontend
 * Substitui console.error por um sistema estruturado de logs
 */

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Máximo de logs em memória
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
    }

    /**
     * Log de erro
     * @param {string} message - Mensagem do erro
     * @param {Object} context - Contexto adicional do erro
     */
    error(message, context = {}) {
        const logEntry = this._createLogEntry('ERROR', message, context);
        this._addLog(logEntry);
        
        // Em desenvolvimento, ainda mostra no console
        if (this.isDevelopment) {
            console.error(`[${logEntry.timestamp}] ${message}`, context);
        }
        
        // Enviar para servidor em produção (opcional)
        this._sendToServer(logEntry);
    }

    /**
     * Log de aviso
     * @param {string} message - Mensagem do aviso
     * @param {Object} context - Contexto adicional
     */
    warn(message, context = {}) {
        const logEntry = this._createLogEntry('WARN', message, context);
        this._addLog(logEntry);
        
        if (this.isDevelopment) {
            console.warn(`[${logEntry.timestamp}] ${message}`, context);
        }
    }

    /**
     * Log de informação
     * @param {string} message - Mensagem informativa
     * @param {Object} context - Contexto adicional
     */
    info(message, context = {}) {
        const logEntry = this._createLogEntry('INFO', message, context);
        this._addLog(logEntry);
        
        if (this.isDevelopment) {
            console.info(`[${logEntry.timestamp}] ${message}`, context);
        }
    }

    /**
     * Log de debug
     * @param {string} message - Mensagem de debug
     * @param {Object} context - Contexto adicional
     */
    debug(message, context = {}) {
        if (!this.isDevelopment) return;
        
        const logEntry = this._createLogEntry('DEBUG', message, context);
        this._addLog(logEntry);
        console.debug(`[${logEntry.timestamp}] ${message}`, context);
    }

    /**
     * Cria uma entrada de log estruturada
     * @private
     */
    _createLogEntry(level, message, context) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent,
                stack: context.stack || (new Error()).stack
            }
        };
    }

    /**
     * Adiciona log à lista em memória
     * @private
     */
    _addLog(logEntry) {
        this.logs.push(logEntry);
        
        // Remove logs antigos se exceder o limite
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * Envia logs para o servidor (em produção)
     * @private
     */
    _sendToServer(logEntry) {
        if (this.isDevelopment || logEntry.level !== 'ERROR') return;
        
        // Enviar apenas erros para o servidor em produção
        try {
            fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            }).catch(() => {
                // Falha silenciosa se não conseguir enviar
            });
        } catch (error) {
            // Falha silenciosa
        }
    }

    /**
     * Obtém todos os logs
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Obtém logs por nível
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Limpa todos os logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Exporta logs como JSON
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Criar instância global
const log = new Logger();

// Capturar erros não tratados
window.addEventListener('error', (event) => {
    log.error('Erro não tratado na aplicação', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
    });
});

// Capturar promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    log.error('Promise rejeitada não tratada', {
        reason: event.reason,
        stack: event.reason?.stack
    });
});

// Exportar para uso global
window.log = log;

export default log;