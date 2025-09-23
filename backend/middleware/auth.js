const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Chave secreta para JWT (deve ser movida para variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura_aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthMiddleware {
    // Gerar token JWT
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role || 'user' 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    // Hash de senha
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verificar senha
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Middleware de autenticação
    static authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso requerido'
            });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token inválido ou expirado'
                });
            }

            req.user = user;
            next();
        });
    }

    // Middleware para verificar roles específicas
    static requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autenticado'
                });
            }

            const userRole = req.user.role || 'user';
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Permissão insuficiente'
                });
            }

            next();
        };
    }

    // Middleware opcional (não requer autenticação, mas adiciona user se token válido)
    static optionalAuth(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                req.user = null;
            } else {
                req.user = user;
            }
            next();
        });
    }
}

module.exports = AuthMiddleware;