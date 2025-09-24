class ChatbotApp {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = 'user_' + Date.now();
        this.isTyping = false;
        this.messageHistory = [];
        this.settings = this.loadSettings();
        this.recognition = null;
        this.isListening = false;
        this.currentContext = {};
        this.suggestions = [];
        this.analytics = {
            messageCount: 0,
            sessionStart: Date.now(),
            totalConfidence: 0,
            intentAccuracy: 0
        };
        
        // Elementos DOM
        this.elements = {};
        
        // WebSocket para tempo real
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Emojis por categoria
        this.emojis = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
            people: ['👤', '👥', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️'],
            objects: ['📦', '📋', '📊', '📈', '📉', '💼', '🗂️', '📁', '📂', '🗃️', '🗄️', '📅', '📆', '🗓️', '📇', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑'],
            symbols: ['⚡', '🔥', '💧', '❄️', '☀️', '⭐', '🌟', '✨', '⚠️', '🚫', '✅', '❌', '❓', '❗', '💯', '🔔', '🔕', '📢', '📣', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎯', '🎪', '🎨']
        };
    }

    // Inicialização
    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeWebSocket();
        this.initializeSpeechRecognition();
        this.loadConversationHistory();
        this.applySettings();
        this.startAnalytics();
        
        console.log('Chatbot inicializado com sucesso');
    }

    initializeElements() {
        this.elements = {
            // Chat
            chatMessages: document.getElementById('chat-messages'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            typingIndicator: document.getElementById('typing-indicator'),
            
            // Header
            botStatus: document.getElementById('bot-status'),
            clearChat: document.getElementById('clear-chat'),
            settingsBtn: document.getElementById('settings-btn'),
            minimizeBtn: document.getElementById('minimize-btn'),
            
            // Input area
            voiceBtn: document.getElementById('voice-btn'),
            emojiBtn: document.getElementById('emoji-btn'),
            attachBtn: document.getElementById('attach-btn'),
            charCount: document.getElementById('char-count'),
            connectionStatus: document.getElementById('connection-status'),
            
            // Modais e painéis
            settingsModal: document.getElementById('settings-modal'),
            closeSettings: document.getElementById('close-settings'),
            sidebar: document.getElementById('chatbot-sidebar'),
            closeSidebar: document.getElementById('close-sidebar'),
            emojiPicker: document.getElementById('emoji-picker'),
            voiceIndicator: document.getElementById('voice-indicator'),
            stopVoice: document.getElementById('stop-voice'),
            suggestionsPanel: document.getElementById('suggestions-panel'),
            closeSuggestions: document.getElementById('close-suggestions'),
            contextMenu: document.getElementById('context-menu'),
            loadingOverlay: document.getElementById('loading-overlay'),
            toastContainer: document.getElementById('toast-container'),
            analyticsPanel: document.getElementById('analytics-panel'),
            closeAnalytics: document.getElementById('close-analytics'),
            
            // Settings
            themeSelect: document.getElementById('theme-select'),
            typingSpeed: document.getElementById('typing-speed'),
            soundEnabled: document.getElementById('sound-enabled'),
            notificationsEnabled: document.getElementById('notifications-enabled'),
            voiceEnabled: document.getElementById('voice-enabled'),
            resetSettings: document.getElementById('reset-settings'),
            saveSettings: document.getElementById('save-settings'),
            
            // Analytics
            totalMessages: document.getElementById('total-messages'),
            sessionDuration: document.getElementById('session-duration'),
            avgConfidence: document.getElementById('avg-confidence'),
            intentAccuracy: document.getElementById('intent-accuracy')
        };
    }

    setupEventListeners() {
        // Input de mensagem
        this.elements.messageInput.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });
        
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Botões principais
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        this.elements.emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
        this.elements.attachBtn.addEventListener('click', () => this.handleFileAttachment());
        
        // Header actions
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.minimizeBtn.addEventListener('click', () => this.minimizeChat());
        
        // Modais
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.closeSidebar.addEventListener('click', () => this.closeSidebar());
        this.elements.stopVoice.addEventListener('click', () => this.stopVoiceRecognition());
        this.elements.closeSuggestions.addEventListener('click', () => this.closeSuggestions());
        this.elements.closeAnalytics.addEventListener('click', () => this.closeAnalytics());
        
        // Settings
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings.addEventListener('click', () => this.resetSettings());
        
        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });
        
        // Context menu
        this.elements.chatMessages.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.message')) {
                e.preventDefault();
                this.showContextMenu(e, e.target.closest('.message'));
            }
        });
        
        // Fechar menus ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-picker')) {
                this.elements.emojiPicker.style.display = 'none';
            }
            if (!e.target.closest('.context-menu')) {
                this.elements.contextMenu.style.display = 'none';
            }
        });
        
        // Emoji picker
        this.setupEmojiPicker();
        
        // Resize do textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    // WebSocket
    initializeWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket conectado');
                this.updateConnectionStatus(true);
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket desconectado');
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('Erro no WebSocket:', error);
                this.updateConnectionStatus(false);
            };
            
        } catch (error) {
            console.error('Erro ao inicializar WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'bot_response':
                this.displayBotMessage(data.message, data.suggestions, data.actions);
                break;
            case 'typing_start':
                this.showTypingIndicator();
                break;
            case 'typing_stop':
                this.hideTypingIndicator();
                break;
            case 'system_notification':
                this.showToast(data.message, 'info');
                break;
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.pow(2, this.reconnectAttempts) * 1000;
            setTimeout(() => {
                this.reconnectAttempts++;
                this.initializeWebSocket();
            }, delay);
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = this.elements.connectionStatus;
        const botStatusElement = this.elements.botStatus;
        
        if (connected) {
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Conectado';
            statusElement.style.color = 'var(--success-color)';
            botStatusElement.innerHTML = '<i class="fas fa-circle online"></i> Online';
        } else {
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Desconectado';
            statusElement.style.color = 'var(--error-color)';
            botStatusElement.innerHTML = '<i class="fas fa-circle"></i> Offline';
        }
    }

    // Speech Recognition
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'pt-BR';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.elements.voiceBtn.classList.add('recording');
                this.elements.voiceIndicator.style.display = 'block';
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.messageInput.value = transcript;
                this.autoResizeTextarea();
                this.updateCharCount();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.elements.voiceBtn.classList.remove('recording');
                this.elements.voiceIndicator.style.display = 'none';
            };
            
            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.showToast('Erro no reconhecimento de voz', 'error');
                this.stopVoiceRecognition();
            };
        } else {
            this.elements.voiceBtn.style.display = 'none';
            console.warn('Reconhecimento de voz não suportado');
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Erro ao iniciar reconhecimento de voz:', error);
                this.showToast('Erro ao iniciar reconhecimento de voz', 'error');
            }
        }
    }

    stopVoiceRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    // Mensagens
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Adicionar mensagem do usuário
        this.addUserMessage(message);
        
        // Limpar input
        this.elements.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateCharCount();
        
        // Mostrar indicador de digitação
        this.showTypingIndicator();
        
        try {
            // Enviar para o backend
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId: this.userId,
                    sessionId: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Simular delay de digitação
                await this.simulateTypingDelay(data.response);
                
                // Adicionar resposta do bot
                this.addBotMessage(data.response, data.suggestions, data.actions);
                
                // Atualizar contexto
                this.currentContext = data.context || {};
                
                // Atualizar analytics
                this.updateAnalytics(data);
                
                // Salvar no histórico
                this.saveToHistory({
                    userMessage: message,
                    botResponse: data.response,
                    timestamp: new Date().toISOString(),
                    intent: data.intent,
                    confidence: data.confidence
                });
                
            } else {
                throw new Error(data.error || 'Erro ao processar mensagem');
            }
            
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.addBotMessage('Desculpe, ocorreu um erro. Tente novamente.', [], []);
            this.showToast('Erro ao enviar mensagem', 'error');
        } finally {
            this.hideTypingIndicator();
        }
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        this.analytics.messageCount++;
    }

    addBotMessage(message, suggestions = [], actions = []) {
        const messageElement = this.createMessageElement(message, 'bot', suggestions, actions);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Reproduzir som se habilitado
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        // Mostrar notificação se habilitado
        if (this.settings.notificationsEnabled && document.hidden) {
            this.showNotification('Nova mensagem do assistente', message);
        }
    }

    createMessageElement(message, type, suggestions = [], actions = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        content.appendChild(text);
        content.appendChild(time);
        
        // Adicionar sugestões se for mensagem do bot
        if (type === 'bot' && suggestions.length > 0) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'quick-actions';
            
            suggestions.forEach(suggestion => {
                const button = document.createElement('button');
                button.className = 'quick-action';
                button.setAttribute('data-action', suggestion);
                button.innerHTML = `<i class="fas fa-lightbulb"></i> ${suggestion}`;
                suggestionsDiv.appendChild(button);
            });
            
            content.appendChild(suggestionsDiv);
        }
        
        // Adicionar ações se for mensagem do bot
        if (type === 'bot' && actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'action-button';
                button.setAttribute('data-action', JSON.stringify(action));
                button.innerHTML = `<i class="fas fa-external-link-alt"></i> ${action.type}`;
                actionsDiv.appendChild(button);
            });
            
            content.appendChild(actionsDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        return messageDiv;
    }

    async simulateTypingDelay(message) {
        const baseDelay = 1000;
        const charDelay = message.length * 20;
        const speedMultiplier = this.settings.typingSpeed / 3;
        
        const totalDelay = (baseDelay + charDelay) * speedMultiplier;
        
        return new Promise(resolve => {
            setTimeout(resolve, Math.min(totalDelay, 3000));
        });
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.elements.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 100);
    }

    // Quick Actions
    handleQuickAction(action) {
        this.elements.messageInput.value = action;
        this.autoResizeTextarea();
        this.updateCharCount();
        this.sendMessage();
    }

    // Input handling
    handleInputChange(e) {
        this.updateCharCount();
        this.toggleSendButton();
    }

    updateCharCount() {
        const length = this.elements.messageInput.value.length;
        this.elements.charCount.textContent = `${length}/500`;
        
        if (length > 450) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else if (length > 480) {
            this.elements.charCount.style.color = 'var(--error-color)';
        } else {
            this.elements.charCount.style.color = 'var(--text-muted)';
        }
    }

    toggleSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText || this.isTyping;
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // Emoji Picker
    setupEmojiPicker() {
        const categories = document.querySelectorAll('.emoji-category');
        const emojiGrid = document.getElementById('emoji-grid');
        
        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                
                const categoryName = category.getAttribute('data-category');
                this.loadEmojis(categoryName, emojiGrid);
            });
        });
        
        // Carregar emojis padrão
        this.loadEmojis('smileys', emojiGrid);
    }

    loadEmojis(category, container) {
        container.innerHTML = '';
        
        const emojis = this.emojis[category] || [];
        emojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'emoji-item';
            emojiElement.textContent = emoji;
            emojiElement.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            container.appendChild(emojiElement);
        });
    }

    toggleEmojiPicker() {
        const isVisible = this.elements.emojiPicker.style.display === 'block';
        this.elements.emojiPicker.style.display = isVisible ? 'none' : 'block';
    }

    insertEmoji(emoji) {
        const input = this.elements.messageInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;
        
        this.autoResizeTextarea();
        this.updateCharCount();
        this.elements.emojiPicker.style.display = 'none';
        input.focus();
    }

    // Context Menu
    showContextMenu(event, messageElement) {
        const contextMenu = this.elements.contextMenu;
        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        
        // Adicionar listeners para as ações
        const items = contextMenu.querySelectorAll('.context-item');
        items.forEach(item => {
            item.onclick = () => {
                const action = item.getAttribute('data-action');
                this.handleContextAction(action, messageElement);
                contextMenu.style.display = 'none';
            };
        });
    }

    handleContextAction(action, messageElement) {
        const messageText = messageElement.querySelector('.message-text').textContent;
        
        switch (action) {
            case 'copy':
                navigator.clipboard.writeText(messageText);
                this.showToast('Mensagem copiada', 'success');
                break;
            case 'delete':
                messageElement.remove();
                this.showToast('Mensagem excluída', 'success');
                break;
            case 'reply':
                this.elements.messageInput.value = `Respondendo: "${messageText.substring(0, 50)}..." `;
                this.elements.messageInput.focus();
                break;
            case 'forward':
                // Implementar funcionalidade de encaminhar
                this.showToast('Funcionalidade em desenvolvimento', 'info');
                break;
        }
    }

    // Settings
    openSettings() {
        this.elements.settingsModal.classList.add('open');
        this.loadCurrentSettings();
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('open');
    }

    loadCurrentSettings() {
        this.elements.themeSelect.value = this.settings.theme;
        this.elements.typingSpeed.value = this.settings.typingSpeed;
        this.elements.soundEnabled.checked = this.settings.soundEnabled;
        this.elements.notificationsEnabled.checked = this.settings.notificationsEnabled;
        this.elements.voiceEnabled.checked = this.settings.voiceEnabled;
    }

    saveSettings() {
        this.settings = {
            theme: this.elements.themeSelect.value,
            typingSpeed: parseInt(this.elements.typingSpeed.value),
            soundEnabled: this.elements.soundEnabled.checked,
            notificationsEnabled: this.elements.notificationsEnabled.checked,
            voiceEnabled: this.elements.voiceEnabled.checked
        };
        
        localStorage.setItem('chatbot_settings', JSON.stringify(this.settings));
        this.applySettings();
        this.closeSettings();
        this.showToast('Configurações salvas', 'success');
    }

    resetSettings() {
        this.settings = this.getDefaultSettings();
        this.loadCurrentSettings();
        this.showToast('Configurações restauradas', 'info');
    }

    loadSettings() {
        const saved = localStorage.getItem('chatbot_settings');
        return saved ? JSON.parse(saved) : this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            typingSpeed: 3,
            soundEnabled: true,
            notificationsEnabled: true,
            voiceEnabled: false
        };
    }

    applySettings() {
        // Aplicar tema
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Configurar reconhecimento de voz
        if (this.settings.voiceEnabled && this.recognition) {
            this.elements.voiceBtn.style.display = 'block';
        } else {
            this.elements.voiceBtn.style.display = 'none';
        }
    }

    // Utilities
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    clearChat() {
        if (confirm('Tem certeza que deseja limpar a conversa?')) {
            this.elements.chatMessages.innerHTML = '';
            this.messageHistory = [];
            this.analytics.messageCount = 0;
            this.showToast('Conversa limpa', 'success');
        }
    }

    minimizeChat() {
        document.body.classList.toggle('minimized');
    }

    closeSidebar() {
        this.elements.sidebar.classList.remove('open');
    }

    closeSuggestions() {
        this.elements.suggestionsPanel.style.display = 'none';
    }

    closeAnalytics() {
        this.elements.analyticsPanel.style.display = 'none';
    }

    handleFileAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processFileAttachment(file);
            }
        };
        input.click();
    }

    processFileAttachment(file) {
        // Implementar upload de arquivo
        this.showToast('Funcionalidade de anexo em desenvolvimento', 'info');
    }

    // Notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body.substring(0, 100),
                icon: '/favicon.ico'
            });
        }
    }

    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play().catch(() => {});
        } catch (error) {
            console.warn('Erro ao reproduzir som:', error);
        }
    }

    // Analytics
    startAnalytics() {
        setInterval(() => {
            this.updateAnalyticsDisplay();
        }, 5000);
    }

    updateAnalytics(data) {
        if (data.confidence) {
            this.analytics.totalConfidence += data.confidence;
        }
        
        if (data.intent) {
            // Calcular precisão da intenção
            this.analytics.intentAccuracy = this.calculateIntentAccuracy();
        }
    }

    updateAnalyticsDisplay() {
        const duration = Math.floor((Date.now() - this.analytics.sessionStart) / 60000);
        const avgConfidence = this.analytics.messageCount > 0 ? 
            Math.round((this.analytics.totalConfidence / this.analytics.messageCount) * 100) : 0;
        
        if (this.elements.totalMessages) {
            this.elements.totalMessages.textContent = this.analytics.messageCount;
        }
        if (this.elements.sessionDuration) {
            this.elements.sessionDuration.textContent = `${duration}min`;
        }
        if (this.elements.avgConfidence) {
            this.elements.avgConfidence.textContent = `${avgConfidence}%`;
        }
        if (this.elements.intentAccuracy) {
            this.elements.intentAccuracy.textContent = `${this.analytics.intentAccuracy}%`;
        }
    }

    calculateIntentAccuracy() {
        // Implementar cálculo de precisão baseado no feedback do usuário
        return Math.floor(Math.random() * 20) + 80; // Simulado
    }

    // History
    saveToHistory(conversation) {
        this.messageHistory.push(conversation);
        
        // Manter apenas as últimas 100 conversas
        if (this.messageHistory.length > 100) {
            this.messageHistory = this.messageHistory.slice(-100);
        }
        
        localStorage.setItem('chatbot_history', JSON.stringify(this.messageHistory));
    }

    loadConversationHistory() {
        const saved = localStorage.getItem('chatbot_history');
        if (saved) {
            this.messageHistory = JSON.parse(saved);
        }
    }

    // Cleanup
    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        // Remover event listeners
        // Implementar cleanup completo se necessário
    }
}

// Inicialização global
window.ChatbotApp = ChatbotApp;