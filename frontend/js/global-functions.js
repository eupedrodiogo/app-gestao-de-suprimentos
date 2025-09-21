// Global JavaScript Functions for Supply Management System

// Utility Functions
const Utils = {
    // Format currency values
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Format date values
    formatDate: (date) => {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    },

    // Format numbers
    formatNumber: (value, decimals = 2) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    // Debounce function for search inputs
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Toast Notification System
const Toast = {
    show: (message, type = 'info', duration = 3000) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-${Toast.getIcon(type)}"></i>
                <span>${message}</span>
                <button class="toast-close" onclick="Toast.close(this.parentElement.parentElement)">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        const container = Toast.getContainer();
        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => Toast.close(toast), duration);
        }

        return toast;
    },

    close: (toast) => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },

    getIcon: (type) => {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    },

    getContainer: () => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
};

// Form Validation
const FormValidator = {
    rules: {
        required: (value) => value.trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
        cpf: (value) => FormValidator.validateCPF(value),
        cnpj: (value) => FormValidator.validateCNPJ(value),
        minLength: (value, min) => value.length >= min,
        maxLength: (value, max) => value.length <= max,
        number: (value) => !isNaN(value) && value !== '',
        positive: (value) => parseFloat(value) > 0
    },

    messages: {
        required: 'Este campo é obrigatório',
        email: 'Digite um email válido',
        phone: 'Digite um telefone válido (XX) XXXXX-XXXX',
        cpf: 'Digite um CPF válido',
        cnpj: 'Digite um CNPJ válido',
        minLength: 'Mínimo de {min} caracteres',
        maxLength: 'Máximo de {max} caracteres',
        number: 'Digite apenas números',
        positive: 'Digite um valor positivo'
    },

    validate: (form) => {
        const errors = [];
        const inputs = form.querySelectorAll('[data-validate]');

        inputs.forEach(input => {
            const rules = input.dataset.validate.split('|');
            const value = input.value;
            const fieldName = input.dataset.fieldName || input.name || 'Campo';

            rules.forEach(rule => {
                const [ruleName, ...params] = rule.split(':');
                
                if (FormValidator.rules[ruleName]) {
                    const isValid = FormValidator.rules[ruleName](value, ...params);
                    
                    if (!isValid) {
                        let message = FormValidator.messages[ruleName] || 'Campo inválido';
                        
                        // Replace placeholders
                        params.forEach((param, index) => {
                            message = message.replace(`{${Object.keys(params)[index]}}`, param);
                        });
                        
                        errors.push({
                            field: input,
                            message: `${fieldName}: ${message}`
                        });
                        
                        FormValidator.showFieldError(input, message);
                    } else {
                        FormValidator.clearFieldError(input);
                    }
                }
            });
        });

        return errors;
    },

    showFieldError: (field, message) => {
        FormValidator.clearFieldError(field);
        
        field.classList.add('is-invalid');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    },

    clearFieldError: (field) => {
        field.classList.remove('is-invalid');
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    validateCPF: (cpf) => {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        
        return remainder === parseInt(cpf.charAt(10));
    },

    validateCNPJ: (cnpj) => {
        cnpj = cnpj.replace(/[^\d]/g, '');
        
        if (cnpj.length !== 14) return false;
        
        // Validate check digits
        let length = cnpj.length - 2;
        let numbers = cnpj.substring(0, length);
        let digits = cnpj.substring(length);
        let sum = 0;
        let pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;
        
        length = length + 1;
        numbers = cnpj.substring(0, length);
        sum = 0;
        pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        
        return result === parseInt(digits.charAt(1));
    }
};

// Loading Spinner
const Loading = {
    show: (target = document.body) => {
        const spinner = document.createElement('div');
        spinner.className = 'loading-overlay';
        spinner.innerHTML = `
            <div class="spinner">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;
        
        target.appendChild(spinner);
        return spinner;
    },

    hide: (spinner) => {
        if (spinner && spinner.parentElement) {
            spinner.parentElement.removeChild(spinner);
        }
    }
};

// Modal Helper
const Modal = {
    show: (title, content, options = {}) => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog ${options.size || ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
        return bsModal;
    },

    confirm: (message, callback) => {
        const footer = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="confirm-btn">Confirmar</button>
        `;
        
        const modal = Modal.show('Confirmação', message, { footer });
        
        document.getElementById('confirm-btn').addEventListener('click', () => {
            callback();
            modal.hide();
        });
    }
};

// Input Masks
const InputMask = {
    apply: () => {
        // CPF Mask
        document.querySelectorAll('[data-mask="cpf"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        });

        // CNPJ Mask
        document.querySelectorAll('[data-mask="cnpj"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                e.target.value = value;
            });
        });

        // Phone Mask
        document.querySelectorAll('[data-mask="phone"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                e.target.value = value;
            });
        });

        // Currency Mask
        document.querySelectorAll('[data-mask="currency"]').forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = (value / 100).toFixed(2) + '';
                value = value.replace('.', ',');
                value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                e.target.value = 'R$ ' + value;
            });
        });
    }
};

// Initialize global functions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    InputMask.apply();
    
    // Add form validation to all forms with data-validate attribute
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const errors = FormValidator.validate(form);
            
            if (errors.length === 0) {
                // Form is valid, proceed with submission
                if (form.dataset.submitCallback) {
                    window[form.dataset.submitCallback](form);
                } else {
                    form.submit();
                }
            } else {
                Toast.show('Por favor, corrija os erros no formulário', 'error');
            }
        });
    });
});

// Export for use in other scripts
window.Utils = Utils;
window.Toast = Toast;
window.FormValidator = FormValidator;
window.Loading = Loading;
window.Modal = Modal;
window.InputMask = InputMask;