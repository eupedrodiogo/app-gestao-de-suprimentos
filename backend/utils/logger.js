const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuração de formatos
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Criar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'gestao-suprimentos' },
    transports: [
        // Arquivo para todos os logs
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Arquivo apenas para erros
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Arquivo para auditoria (login, logout, operações críticas)
        new winston.transports.File({
            filename: path.join(logsDir, 'audit.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        })
    ],
});

// Adicionar console apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Métodos de conveniência
const log = {
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },
    
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },
    
    // Log específico para auditoria
    audit: (action, user, details = {}) => {
        logger.info('AUDIT', {
            action,
            user: user?.id || user,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Log para operações de banco de dados
    database: (operation, query, params = [], duration = null) => {
        logger.debug('DATABASE', {
            operation,
            query: query.substring(0, 200), // Limitar tamanho da query no log
            params: params.length > 0 ? params : undefined,
            duration: duration ? `${duration}ms` : undefined
        });
    },
    
    // Log para requisições HTTP
    request: (req, res, duration) => {
        const { method, url, ip, headers } = req;
        logger.info('REQUEST', {
            method,
            url,
            ip,
            userAgent: headers['user-agent'],
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            user: req.user?.id || 'anonymous'
        });
    },
    
    // Log para erros de validação
    validation: (errors, req) => {
        logger.warn('VALIDATION_ERROR', {
            path: req.path,
            method: req.method,
            errors: errors.map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            })),
            user: req.user?.id || 'anonymous'
        });
    }
};

module.exports = log;