const Joi = require('joi');
const { generateToken, hashPassword, verifyPassword } = require('../middleware/auth');
const log = require('../utils/logger');

class AuthController {
    constructor(db, bruteForceProtection = null) {
        this.db = db;
        this.bruteForce = bruteForceProtection;
    }

    // Schema de validação para login
    static loginSchema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Email deve ter um formato válido',
            'any.required': 'Email é obrigatório'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Senha deve ter pelo menos 6 caracteres',
            'any.required': 'Senha é obrigatória'
        })
    });

    // Schema de validação para registro
    static registerSchema = Joi.object({
        name: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Nome deve ter pelo menos 2 caracteres',
            'string.max': 'Nome deve ter no máximo 100 caracteres',
            'any.required': 'Nome é obrigatório'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Email deve ter um formato válido',
            'any.required': 'Email é obrigatório'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Senha deve ter pelo menos 6 caracteres',
            'any.required': 'Senha é obrigatória'
        }),
        role: Joi.string().valid('admin', 'user', 'manager').default('user')
    });

    // Login de usuário
    async login(req, res) {
        try {
            const { error, value } = AuthController.loginSchema.validate(req.body);
            
            if (error) {
                log.validation('Erro de validação no login', { 
                    errors: error.details,
                    ip: req.ip 
                });
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            const { email, password } = value;

            // Buscar usuário no banco de dados
            const user = await this.db.get(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (!user) {
                // Registrar tentativa falhada para proteção contra força bruta
                if (this.bruteForce) {
                    this.bruteForce.recordFailedAttempt(req);
                }
                
                log.audit('Tentativa de login com email inexistente', { 
                    email, 
                    ip: req.ip 
                });
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

            // Verificar senha
            const isValidPassword = await verifyPassword(password, user.password);
            if (!isValidPassword) {
                // Registrar tentativa falhada para proteção contra força bruta
                if (this.bruteForce) {
                    this.bruteForce.recordFailedAttempt(req);
                }
                
                log.audit('Tentativa de login com senha incorreta', { 
                    email, 
                    ip: req.ip 
                });
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }
            
            // Limpar tentativas após login bem-sucedido
            if (this.bruteForce) {
                this.bruteForce.clearAttempts(req);
            }

            // Atualizar último login
            await this.db.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Gerar token JWT
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            log.audit('Login realizado com sucesso', { 
                userId: user.id, 
                email, 
                ip: req.ip 
            });

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            log.error('Erro no login', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Registro de usuário
    async register(req, res) {
        try {
            const { error, value } = AuthController.registerSchema.validate(req.body);
            
            if (error) {
                log.validation('Erro de validação no registro', { 
                    errors: error.details,
                    ip: req.ip 
                });
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            const { name, email, password, role } = value;

            // Verificar se email já existe
            const existingUser = await this.db.get(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser) {
                log.audit('Tentativa de registro com email já existente', { 
                    email, 
                    ip: req.ip 
                });
                return res.status(409).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }

            // Hash da senha
            const hashedPassword = await hashPassword(password);

            // Inserir usuário
            const result = await this.db.run(`
                INSERT INTO users (name, email, password, role, status, created_at)
                VALUES (?, ?, ?, ?, 'ativo', datetime('now'))
            `, [name, email, hashedPassword, role]);

            // Buscar usuário criado
            const newUser = await this.db.get(
                'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
                [result.lastID]
            );

            // Gerar token
            const token = generateToken({
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            });

            log.audit('Usuário registrado com sucesso', { 
                userId: result.lastID, 
                email, 
                ip: req.ip 
            });

            res.status(201).json({
                success: true,
                message: 'Usuário criado com sucesso',
                data: {
                    token,
                    user: {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role
                    }
                }
            });

        } catch (error) {
            log.error('Erro no registro', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Verificar token atual
    async verifyToken(req, res) {
        try {
            // O middleware já validou o token e adicionou o user ao req
            const user = await this.db.get(
                'SELECT id, name, email, role, status, created_at, last_login FROM users WHERE id = ? AND status = "ativo"',
                [req.user.id]
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            log.error('Erro na verificação do token', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Logout (invalidar token - implementação básica)
    async logout(req, res) {
        try {
            // Em uma implementação real, você poderia invalidar o token
            // Por exemplo, adicionando-o a uma blacklist
            log.audit('Logout realizado', { 
                userId: req.user?.id, 
                email: req.user?.email, 
                ip: req.ip 
            });
            
            res.json({
                success: true,
                message: 'Logout realizado com sucesso'
            });

        } catch (error) {
            log.error('Erro no logout', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = AuthController;