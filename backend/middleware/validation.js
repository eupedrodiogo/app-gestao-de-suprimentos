const validator = require('validator');
const xss = require('xss');

/**
 * Middleware de validação e sanitização de dados
 * Protege contra XSS, SQL Injection e outros ataques
 */
class ValidationMiddleware {
    
    /**
     * Sanitiza strings removendo scripts maliciosos
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        // Remove XSS
        let sanitized = xss(str, {
            whiteList: {}, // Remove todas as tags HTML
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
        });
        
        // Remove caracteres perigosos para SQL
        sanitized = sanitized.replace(/['"\\;]/g, '');
        
        // Trim espaços
        return sanitized.trim();
    }
    
    /**
     * Sanitiza objeto recursivamente
     */
    static sanitizeObject(obj) {
        if (obj === null || obj === undefined) return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeString(key);
                sanitized[sanitizedKey] = this.sanitizeObject(value);
            }
            return sanitized;
        }
        
        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }
        
        return obj;
    }
    
    /**
     * Middleware para sanitizar dados de entrada
     */
    static sanitizeInput(req, res, next) {
        try {
            // Sanitiza body
            if (req.body) {
                req.body = ValidationMiddleware.sanitizeObject(req.body);
            }
            
            // Sanitiza query parameters
            if (req.query) {
                req.query = ValidationMiddleware.sanitizeObject(req.query);
            }
            
            // Sanitiza params
            if (req.params) {
                req.params = ValidationMiddleware.sanitizeObject(req.params);
            }
            
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Dados de entrada inválidos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Valida email
     */
    static validateEmail(email) {
        return validator.isEmail(email) && email.length <= 255;
    }
    
    /**
     * Valida senha
     */
    static validatePassword(password) {
        return password && 
               password.length >= 8 && 
               password.length <= 128 &&
               /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
    }
    
    /**
     * Valida ID numérico
     */
    static validateId(id) {
        return validator.isInt(String(id), { min: 1 });
    }
    
    /**
     * Valida data
     */
    static validateDate(date) {
        return validator.isISO8601(date);
    }
    
    /**
     * Valida número decimal
     */
    static validateDecimal(value) {
        return validator.isDecimal(String(value), { decimal_digits: '0,2' });
    }
    
    /**
     * Middleware para validar dados de usuário
     */
    static validateUser(req, res, next) {
        const { email, password, name } = req.body;
        const errors = [];
        
        if (email && !ValidationMiddleware.validateEmail(email)) {
            errors.push('Email inválido');
        }
        
        if (password && !ValidationMiddleware.validatePassword(password)) {
            errors.push('Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número');
        }
        
        if (name && (name.length < 2 || name.length > 100)) {
            errors.push('Nome deve ter entre 2 e 100 caracteres');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Dados de usuário inválidos',
                errors
            });
        }
        
        next();
    }
    
    /**
     * Middleware para validar dados de produto
     */
    static validateProduct(req, res, next) {
        const { name, price, category, description } = req.body;
        const errors = [];
        
        if (name && (name.length < 2 || name.length > 255)) {
            errors.push('Nome do produto deve ter entre 2 e 255 caracteres');
        }
        
        if (price && !ValidationMiddleware.validateDecimal(price)) {
            errors.push('Preço deve ser um número decimal válido');
        }
        
        if (category && category.length > 100) {
            errors.push('Categoria deve ter no máximo 100 caracteres');
        }
        
        if (description && description.length > 1000) {
            errors.push('Descrição deve ter no máximo 1000 caracteres');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Dados de produto inválidos',
                errors
            });
        }
        
        next();
    }
    
    /**
     * Middleware para validar dados de fornecedor
     */
    static validateSupplier(req, res, next) {
        const { name, email, phone, cnpj } = req.body;
        const errors = [];
        
        if (name && (name.length < 2 || name.length > 255)) {
            errors.push('Nome do fornecedor deve ter entre 2 e 255 caracteres');
        }
        
        if (email && !ValidationMiddleware.validateEmail(email)) {
            errors.push('Email inválido');
        }
        
        if (phone && !validator.isMobilePhone(phone, 'pt-BR')) {
            errors.push('Telefone inválido');
        }
        
        if (cnpj && !validator.isLength(cnpj, { min: 14, max: 18 })) {
            errors.push('CNPJ inválido');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Dados de fornecedor inválidos',
                errors
            });
        }
        
        next();
    }
    
    /**
     * Middleware para validar dados de pedido
     */
    static validateOrder(req, res, next) {
        const { supplier_id, items, delivery_date } = req.body;
        const errors = [];
        
        if (supplier_id && !ValidationMiddleware.validateId(supplier_id)) {
            errors.push('ID do fornecedor inválido');
        }
        
        if (delivery_date && !ValidationMiddleware.validateDate(delivery_date)) {
            errors.push('Data de entrega inválida');
        }
        
        if (items && Array.isArray(items)) {
            items.forEach((item, index) => {
                if (!ValidationMiddleware.validateId(item.product_id)) {
                    errors.push(`ID do produto inválido no item ${index + 1}`);
                }
                if (!validator.isInt(String(item.quantity), { min: 1 })) {
                    errors.push(`Quantidade inválida no item ${index + 1}`);
                }
                if (item.price && !ValidationMiddleware.validateDecimal(item.price)) {
                    errors.push(`Preço inválido no item ${index + 1}`);
                }
            });
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Dados de pedido inválidos',
                errors
            });
        }
        
        next();
    }
    
    /**
     * Middleware para validar status de pedido
     */
    static validateOrderStatus(req, res, next) {
        const { status } = req.body;
        const validStatuses = ['pendente', 'aprovado', 'em_transito', 'entregue', 'cancelado'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido',
                errors: [`Status deve ser um dos seguintes: ${validStatuses.join(', ')}`]
            });
        }
        
        // Sanitizar status
        req.body.status = validator.escape(status);
        next();
    }
    
    /**
     * Middleware para limitar tamanho do payload
     */
    static limitPayloadSize(maxSize = '10mb') {
        return (req, res, next) => {
            const contentLength = req.headers['content-length'];
            
            if (contentLength) {
                const sizeInBytes = parseInt(contentLength);
                const maxSizeInBytes = this.parseSize(maxSize);
                
                if (sizeInBytes > maxSizeInBytes) {
                    return res.status(413).json({
                        success: false,
                        message: 'Payload muito grande'
                    });
                }
            }
            
            next();
        };
    }
    
    /**
     * Converte string de tamanho para bytes
     */
    static parseSize(size) {
        const units = {
            'b': 1,
            'kb': 1024,
            'mb': 1024 * 1024,
            'gb': 1024 * 1024 * 1024
        };
        
        const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
        if (!match) return 1024 * 1024; // Default 1MB
        
        const [, number, unit] = match;
        return parseInt(number) * units[unit];
    }
    
    /**
     * Middleware para rate limiting básico
     */
    static rateLimit(windowMs = 15 * 60 * 1000, max = 100) {
        const requests = new Map();
        
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Limpa requests antigos
            for (const [key, timestamp] of requests.entries()) {
                if (timestamp < windowStart) {
                    requests.delete(key);
                }
            }
            
            // Conta requests do IP
            const ipRequests = Array.from(requests.entries())
                .filter(([key]) => key.startsWith(ip))
                .length;
            
            if (ipRequests >= max) {
                return res.status(429).json({
                    success: false,
                    message: 'Muitas requisições. Tente novamente mais tarde.'
                });
            }
            
            // Adiciona request atual
            requests.set(`${ip}-${now}`, now);
            
            next();
        };
    }
}

module.exports = ValidationMiddleware;