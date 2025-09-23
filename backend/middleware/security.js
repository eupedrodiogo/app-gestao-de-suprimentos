const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const log = require('../utils/logger');

/**
 * Middleware de segurança integrado
 * Combina várias proteções de segurança
 */
class SecurityMiddleware {
    
    /**
     * Configura CORS com políticas restritivas
     */
    static configureCORS() {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080'
        ];
        
        // Adiciona origens do ambiente de produção
        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL);
        }
        
        return cors({
            origin: function (origin, callback) {
                // Permite requests sem origin (mobile apps, etc.)
                if (!origin) return callback(null, true);
                
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Não permitido pelo CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            maxAge: 86400 // 24 horas
        });
    }
    
    /**
     * Configura rate limiting por endpoint
     */
    static configureRateLimit() {
        // Rate limit geral
        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100, // máximo 100 requests por IP
            message: {
                success: false,
                message: 'Muitas requisições. Tente novamente em 15 minutos.'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        
        // Rate limit para login (mais restritivo)
        const loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 5, // máximo 5 tentativas de login
            message: {
                success: false,
                message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
            },
            skipSuccessfulRequests: true
        });
        
        // Rate limit para criação de recursos
        const createLimiter = rateLimit({
            windowMs: 60 * 1000, // 1 minuto
            max: 10, // máximo 10 criações por minuto
            message: {
                success: false,
                message: 'Muitas criações. Aguarde 1 minuto.'
            }
        });
        
        return {
            general: generalLimiter,
            login: loginLimiter,
            create: createLimiter
        };
    }
    
    /**
     * Configura Helmet para proteções de cabeçalho
     */
    static configureHelmet() {
        return helmet({
            // Política de Segurança de Conteúdo
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            
            // Proteção contra clickjacking
            frameguard: { action: 'deny' },
            
            // Remove cabeçalho X-Powered-By
            hidePoweredBy: true,
            
            // Força HTTPS em produção
            hsts: {
                maxAge: 31536000, // 1 ano
                includeSubDomains: true,
                preload: true
            },
            
            // Previne MIME type sniffing
            noSniff: true,
            
            // Proteção XSS
            xssFilter: true,
            
            // Política de referrer
            referrerPolicy: { policy: 'same-origin' }
        });
    }
    
    /**
     * Middleware para logging de segurança
     */
    static securityLogger(req, res, next) {
        const startTime = Date.now();
        
        // Log da requisição
        console.log(`[SECURITY] ${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
        
        // Detecta tentativas suspeitas
        const suspiciousPatterns = [
            /\.\.\//,  // Path traversal
            /<script/i, // XSS
            /union.*select/i, // SQL Injection
            /javascript:/i, // JavaScript injection
            /vbscript:/i, // VBScript injection
            /onload=/i, // Event handler injection
            /onerror=/i // Event handler injection
        ];
        
        const requestData = JSON.stringify({
            url: req.url,
            body: req.body,
            query: req.query,
            params: req.params
        });
        
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
        
        if (isSuspicious) {
            console.warn(`[SECURITY ALERT] Suspicious request detected from IP ${req.ip}: ${req.method} ${req.url}`);
            
            // Em produção, você pode querer bloquear ou alertar
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({
                    success: false,
                    message: 'Requisição inválida detectada'
                });
            }
        }
        
        // Override do res.json para log de resposta
        const originalJson = res.json;
        res.json = function(data) {
            const duration = Date.now() - startTime;
            console.log(`[SECURITY] Response: ${res.statusCode} - Duration: ${duration}ms`);
            
            if (res.statusCode >= 400) {
                console.warn(`[SECURITY] Error response: ${res.statusCode} - ${req.method} ${req.url}`);
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    }
    
    /**
     * Middleware para validar Content-Type
     */
    static validateContentType(req, res, next) {
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.headers['content-type'];
            
            if (!contentType || !contentType.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Content-Type deve ser application/json'
                });
            }
        }
        
        next();
    }
    
    /**
     * Middleware para sanitizar cabeçalhos
     */
    static sanitizeHeaders(req, res, next) {
        // Remove cabeçalhos potencialmente perigosos
        const dangerousHeaders = [
            'x-forwarded-host',
            'x-forwarded-server',
            'x-real-ip'
        ];
        
        dangerousHeaders.forEach(header => {
            if (req.headers[header]) {
                delete req.headers[header];
            }
        });
        
        // Valida User-Agent
        const userAgent = req.headers['user-agent'];
        if (userAgent && userAgent.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'User-Agent inválido'
            });
        }
        
        next();
    }
    
    /**
     * Middleware para detectar bots maliciosos
     */
    static detectMaliciousBots(req, res, next) {
        const userAgent = req.headers['user-agent'] || '';
        
        const maliciousBots = [
            /sqlmap/i,
            /nikto/i,
            /nessus/i,
            /openvas/i,
            /nmap/i,
            /masscan/i,
            /zap/i,
            /burp/i
        ];
        
        const isMaliciousBot = maliciousBots.some(pattern => pattern.test(userAgent));
        
        if (isMaliciousBot) {
            console.warn(`[SECURITY ALERT] Malicious bot detected: ${userAgent} from IP ${req.ip}`);
            
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }
        
        next();
    }
    
    /**
     * Sistema de proteção contra força bruta
     */
    static bruteForcePrevention() {
        const attempts = new Map(); // IP -> { count, lastAttempt, blockedUntil }
        const MAX_ATTEMPTS = 5;
        const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
        const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutos
        
        return {
            // Middleware para verificar se IP está bloqueado
            checkBlocked: (req, res, next) => {
                const ip = req.ip || req.connection.remoteAddress;
                const now = Date.now();
                const record = attempts.get(ip);
                
                if (record && record.blockedUntil && now < record.blockedUntil) {
                     const remainingTime = Math.ceil((record.blockedUntil - now) / 1000 / 60);
                     log.security('Tentativa de acesso de IP bloqueado', { 
                         ip, 
                         remainingMinutes: remainingTime 
                     });
                     
                     return res.status(429).json({
                         success: false,
                         message: `IP bloqueado temporariamente. Tente novamente em ${remainingTime} minutos.`,
                         blockedUntil: new Date(record.blockedUntil).toISOString()
                     });
                 }
                
                next();
            },
            
            // Registrar tentativa de login falhada
            recordFailedAttempt: (req) => {
                const ip = req.ip || req.connection.remoteAddress;
                const now = Date.now();
                let record = attempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: null };
                
                // Reset contador se passou da janela de tempo
                if (now - record.lastAttempt > ATTEMPT_WINDOW) {
                    record.count = 0;
                }
                
                record.count++;
                record.lastAttempt = now;
                
                // Bloquear se excedeu tentativas
                 if (record.count >= MAX_ATTEMPTS) {
                     record.blockedUntil = now + BLOCK_DURATION;
                     log.security('IP bloqueado por excesso de tentativas de login', { 
                         ip, 
                         attempts: record.count,
                         blockedUntil: new Date(record.blockedUntil).toISOString()
                     });
                 }
                
                attempts.set(ip, record);
                
                // Limpeza periódica de registros antigos
                if (Math.random() < 0.01) { // 1% de chance
                    this.cleanupOldRecords(attempts, now);
                }
            },
            
            // Limpar registro após login bem-sucedido
            clearAttempts: (req) => {
                const ip = req.ip || req.connection.remoteAddress;
                attempts.delete(ip);
            }
        };
    }
    
    /**
     * Limpa registros antigos do sistema de força bruta
     */
    static cleanupOldRecords(attempts, now) {
        const CLEANUP_AGE = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const [ip, record] of attempts.entries()) {
            if (now - record.lastAttempt > CLEANUP_AGE) {
                attempts.delete(ip);
            }
        }
    }

    /**
     * Aplica todas as proteções de segurança
     */
    static applyAllProtections(app) {
        // Helmet para proteções de cabeçalho
        app.use(this.configureHelmet());
        
        // CORS
        app.use(this.configureCORS());
        
        // Rate limiting geral
        const rateLimiters = this.configureRateLimit();
        app.use('/api/', rateLimiters.general);
        
        // Middlewares de segurança customizados
        app.use(this.securityLogger);
        app.use(this.sanitizeHeaders);
        app.use(this.detectMaliciousBots);
        app.use(this.validateContentType);
        
        // Configurar proteção contra força bruta
        const bruteForceProtection = this.bruteForcePrevention();
        
        return {
            ...rateLimiters,
            bruteForce: bruteForceProtection
        };
    }
}

module.exports = SecurityMiddleware;