class VoiceRecognitionApp {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isProcessing = false;
        this.currentSession = null;
        this.settings = {
            language: 'pt-BR',
            sensitivity: 50,
            confidence: 70,
            voiceFeedback: true,
            soundEffects: true,
            wakeWord: true,
            continuousListening: false
        };
        this.commandHistory = [];
        this.voiceStats = {
            totalCommands: 0,
            successRate: 0,
            avgConfidence: 0,
            mostUsedCommand: '-'
        };
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.visualizer = null;
        this.wakeWordDetected = false;
        this.lastCommand = null;
        
        this.initializeElements();
        this.loadSettings();
        this.setupEventListeners();
    }

    // Inicializar elementos DOM
    initializeElements() {
        this.elements = {
            micButton: document.getElementById('micButton'),
            micIcon: document.getElementById('micIcon'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            voiceLevel: document.getElementById('voiceLevel'),
            transcript: document.getElementById('transcript'),
            confidenceFill: document.getElementById('confidenceFill'),
            confidenceValue: document.getElementById('confidenceValue'),
            resultText: document.getElementById('resultText'),
            resultActions: document.getElementById('resultActions'),
            historyList: document.getElementById('historyList'),
            settingsModal: document.getElementById('settingsModal'),
            helpModal: document.getElementById('helpModal'),
            suggestionsPanel: document.getElementById('suggestionsPanel'),
            suggestionsList: document.getElementById('suggestionsList'),
            voiceVisualizer: document.getElementById('voiceVisualizer'),
            visualizerCanvas: document.getElementById('visualizerCanvas'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer'),
            totalCommands: document.getElementById('totalCommands'),
            successRate: document.getElementById('successRate'),
            avgConfidence: document.getElementById('avgConfidence'),
            mostUsedCommand: document.getElementById('mostUsedCommand')
        };
    }

    // Inicializar aplicação
    async init() {
        try {
            await this.initializeSpeechRecognition();
            await this.initializeAudioContext();
            this.initializeVisualizer();
            this.loadCommandHistory();
            this.updateStats();
            this.showToast('Sistema de reconhecimento de voz inicializado', 'success');
            
            // Iniciar escuta contínua se habilitada
            if (this.settings.continuousListening) {
                this.startListening();
            }
        } catch (error) {
            console.error('Erro ao inicializar:', error);
            this.showToast('Erro ao inicializar sistema de voz', 'error');
        }
    }

    // Inicializar reconhecimento de fala
    async initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Reconhecimento de voz não suportado neste navegador');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.settings.language;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('listening', 'Ouvindo...');
            this.elements.micButton.classList.add('listening');
            this.startVisualizer();
        };

        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleSpeechError(event);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateStatus('ready', 'Pronto para ouvir');
            this.elements.micButton.classList.remove('listening');
            this.stopVisualizer();
            
            // Reiniciar escuta contínua se habilitada
            if (this.settings.continuousListening && !this.isProcessing) {
                setTimeout(() => this.startListening(), 1000);
            }
        };
    }

    // Inicializar contexto de áudio
    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
        } catch (error) {
            console.error('Erro ao inicializar áudio:', error);
        }
    }

    // Inicializar visualizador
    initializeVisualizer() {
        if (!this.elements.visualizerCanvas) return;
        
        this.visualizer = {
            canvas: this.elements.visualizerCanvas,
            ctx: this.elements.visualizerCanvas.getContext('2d'),
            animationId: null
        };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Redimensionar canvas
    resizeCanvas() {
        if (!this.visualizer) return;
        
        const canvas = this.visualizer.canvas;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    // Configurar ouvintes de eventos
    setupEventListeners() {
        // Botão do microfone
        this.elements.micButton.addEventListener('click', () => {
            this.toggleListening();
        });

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === ' ') {
                e.preventDefault();
                this.toggleListening();
            }
            if (e.key === 'Escape') {
                this.stopListening();
                this.closeAllModals();
            }
        });

        // Configurações
        this.setupSettingsListeners();
        
        // Comandos rápidos
        document.querySelectorAll('.command-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const command = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.executeQuickCommand(command);
            });
        });
    }

    // Configurar ouvintes das configurações
    setupSettingsListeners() {
        const settingsInputs = {
            language: document.getElementById('language'),
            sensitivity: document.getElementById('sensitivity'),
            confidence: document.getElementById('confidence'),
            voiceFeedback: document.getElementById('voiceFeedback'),
            soundEffects: document.getElementById('soundEffects'),
            wakeWord: document.getElementById('wakeWord'),
            continuousListening: document.getElementById('continuousListening')
        };

        Object.entries(settingsInputs).forEach(([key, element]) => {
            if (!element) return;
            
            element.addEventListener('change', () => {
                if (element.type === 'checkbox') {
                    this.settings[key] = element.checked;
                } else if (element.type === 'range') {
                    this.settings[key] = parseInt(element.value);
                    document.getElementById(key + 'Value').textContent = element.value + '%';
                } else {
                    this.settings[key] = element.value;
                }
                
                this.saveSettings();
                this.applySettings();
            });
        });
    }

    // Alternar escuta
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // Iniciar escuta
    startListening() {
        if (this.isListening || this.isProcessing) return;
        
        try {
            this.recognition.start();
            this.playSound('start');
        } catch (error) {
            console.error('Erro ao iniciar reconhecimento:', error);
            this.showToast('Erro ao iniciar reconhecimento de voz', 'error');
        }
    }

    // Parar escuta
    stopListening() {
        if (!this.isListening) return;
        
        try {
            this.recognition.stop();
            this.playSound('stop');
        } catch (error) {
            console.error('Erro ao parar reconhecimento:', error);
        }
    }

    // Processar resultado da fala
    handleSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
                this.processFinalTranscript(transcript, confidence);
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Atualizar interface com transcrição
        this.elements.transcript.textContent = finalTranscript || interimTranscript || 'Aguardando comando...';
    }

    // Processar transcrição final
    async processFinalTranscript(transcript, confidence) {
        this.isProcessing = true;
        this.updateStatus('processing', 'Processando comando...');
        this.elements.micButton.classList.add('processing');
        this.showLoading(true);
        
        try {
            // Verificar palavra de ativação
            if (this.settings.wakeWord && !this.wakeWordDetected) {
                if (this.detectWakeWord(transcript)) {
                    this.wakeWordDetected = true;
                    this.showToast('Palavra de ativação detectada', 'success');
                    this.playSound('wake');
                    return;
                } else {
                    this.updateStatus('ready', 'Aguardando palavra de ativação');
                    return;
                }
            }
            
            // Atualizar confiança
            this.updateConfidence(confidence * 100);
            
            // Verificar confiança mínima
            if ((confidence * 100) < this.settings.confidence) {
                this.showSuggestions(transcript);
                this.showToast('Comando não compreendido claramente', 'warning');
                return;
            }
            
            // Processar comando
            const result = await this.processVoiceCommand(transcript, confidence);
            this.handleCommandResult(result);
            
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            this.showToast('Erro ao processar comando', 'error');
        } finally {
            this.isProcessing = false;
            this.elements.micButton.classList.remove('processing');
            this.showLoading(false);
            this.updateStatus('ready', 'Pronto para ouvir');
            
            // Reset palavra de ativação após comando
            if (this.settings.wakeWord) {
                this.wakeWordDetected = false;
            }
        }
    }

    // Detectar palavra de ativação
    detectWakeWord(transcript) {
        const wakeWords = ['olá sistema', 'oi sistema', 'hey sistema', 'sistema'];
        const normalizedTranscript = transcript.toLowerCase().trim();
        
        return wakeWords.some(word => normalizedTranscript.includes(word));
    }

    // Processar comando de voz
    async processVoiceCommand(transcript, confidence) {
        try {
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transcript: transcript,
                    confidence: confidence,
                    userId: this.getCurrentUserId(),
                    sessionId: this.getSessionId()
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao processar comando:', error);
            return {
                success: false,
                message: 'Erro de comunicação com o servidor',
                error: error.message
            };
        }
    }

    // Processar resultado do comando
    handleCommandResult(result) {
        if (result.success) {
            this.elements.resultText.textContent = result.feedback || 'Comando executado com sucesso';
            this.executeCommand(result.command, result.result);
            this.playSound('success');
            this.showToast('Comando executado', 'success');
        } else {
            this.elements.resultText.textContent = result.message || 'Comando não reconhecido';
            if (result.suggestions) {
                this.showSuggestions(result.transcript, result.suggestions);
            }
            this.playSound('error');
            this.showToast(result.message || 'Comando não reconhecido', 'error');
        }
        
        // Adicionar ao histórico
        this.addToHistory(result);
        this.updateStats();
        
        // Feedback por voz
        if (this.settings.voiceFeedback) {
            this.speakFeedback(result.feedback || result.message);
        }
    }

    // Executar comando
    executeCommand(command, result) {
        switch (command.action) {
            case 'navigate':
                this.executeNavigation(command, result);
                break;
            case 'search':
                this.executeSearch(command, result);
                break;
            case 'create':
                this.executeCreate(command, result);
                break;
            case 'help':
                this.showHelp();
                break;
            case 'settings':
                this.openSettings();
                break;
            default:
                console.log('Comando executado:', command, result);
        }
    }

    // Executar navegação
    executeNavigation(command, result) {
        if (result.target === 'back') {
            history.back();
        } else {
            window.location.href = result.target;
        }
    }

    // Executar busca
    executeSearch(command, result) {
        if (result.results && result.results.length > 0) {
            this.showSearchResults(result.results);
        }
    }

    // Executar criação
    executeCreate(command, result) {
        if (result.nextStep === 'open_form') {
            // Abrir formulário apropriado
            console.log('Abrindo formulário para:', command.type);
        }
    }

    // Mostrar resultados de busca
    showSearchResults(results) {
        // Implementar exibição de resultados
        console.log('Resultados da busca:', results);
    }

    // Executar comando rápido
    executeQuickCommand(command) {
        this.elements.transcript.textContent = command;
        this.processFinalTranscript(command, 1.0);
    }

    // Tratar erro de fala
    handleSpeechError(event) {
        console.error('Erro de reconhecimento:', event.error);
        
        let message = 'Erro no reconhecimento de voz';
        switch (event.error) {
            case 'no-speech':
                message = 'Nenhuma fala detectada';
                break;
            case 'audio-capture':
                message = 'Erro ao capturar áudio';
                break;
            case 'not-allowed':
                message = 'Permissão de microfone negada';
                break;
            case 'network':
                message = 'Erro de rede';
                break;
        }
        
        this.showToast(message, 'error');
        this.updateStatus('error', message);
    }

    // Atualizar status
    updateStatus(status, text) {
        const statusDot = this.elements.statusIndicator.querySelector('.status-dot');
        statusDot.className = `status-dot ${status}`;
        this.elements.statusText.textContent = text;
    }

    // Atualizar confiança
    updateConfidence(confidence) {
        this.elements.confidenceFill.style.width = `${confidence}%`;
        this.elements.confidenceValue.textContent = `${Math.round(confidence)}%`;
    }

    // Iniciar visualizador
    startVisualizer() {
        if (!this.analyser || !this.visualizer) return;
        
        this.elements.voiceVisualizer.classList.add('active');
        this.drawVisualizer();
    }

    // Parar visualizador
    stopVisualizer() {
        this.elements.voiceVisualizer.classList.remove('active');
        if (this.visualizer.animationId) {
            cancelAnimationFrame(this.visualizer.animationId);
        }
    }

    // Desenhar visualizador
    drawVisualizer() {
        if (!this.analyser || !this.visualizer) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.visualizer.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            const canvas = this.visualizer.canvas;
            const ctx = this.visualizer.ctx;
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            // Calcular nível de voz
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            this.elements.voiceLevel.style.width = `${(average / 255) * 100}%`;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;
                
                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    // Mostrar sugestões
    showSuggestions(transcript, suggestions = []) {
        if (suggestions.length === 0) {
            this.elements.suggestionsPanel.classList.remove('active');
            return;
        }
        
        this.elements.suggestionsList.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion.command;
            item.addEventListener('click', () => {
                this.executeQuickCommand(suggestion.command);
                this.elements.suggestionsPanel.classList.remove('active');
            });
            this.elements.suggestionsList.appendChild(item);
        });
        
        this.elements.suggestionsPanel.classList.add('active');
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            this.elements.suggestionsPanel.classList.remove('active');
        }, 5000);
    }

    // Adicionar ao histórico
    addToHistory(result) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date(),
            transcript: result.transcript || this.elements.transcript.textContent,
            command: result.command,
            success: result.success,
            confidence: result.confidence
        };
        
        this.commandHistory.unshift(historyItem);
        
        // Manter apenas os últimos 50 comandos
        if (this.commandHistory.length > 50) {
            this.commandHistory = this.commandHistory.slice(0, 50);
        }
        
        this.saveCommandHistory();
        this.updateHistoryDisplay();
    }

    // Atualizar exibição do histórico
    updateHistoryDisplay() {
        this.elements.historyList.innerHTML = '';
        
        this.commandHistory.slice(0, 10).forEach(item => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.innerHTML = `
                <div class="history-content">
                    <div class="history-command">${item.transcript}</div>
                    <div class="history-time">${this.formatTime(item.timestamp)}</div>
                </div>
                <div class="history-status ${item.success ? 'success' : 'error'}">
                    ${item.success ? 'Sucesso' : 'Erro'}
                </div>
            `;
            this.elements.historyList.appendChild(historyElement);
        });
    }

    // Atualizar estatísticas
    updateStats() {
        const total = this.commandHistory.length;
        const successful = this.commandHistory.filter(item => item.success).length;
        const avgConf = this.commandHistory.reduce((sum, item) => sum + (item.confidence || 0), 0) / total;
        
        // Comando mais usado
        const commandCounts = {};
        this.commandHistory.forEach(item => {
            if (item.command && item.command.action) {
                commandCounts[item.command.action] = (commandCounts[item.command.action] || 0) + 1;
            }
        });
        
        const mostUsed = Object.entries(commandCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        this.voiceStats = {
            totalCommands: total,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
            avgConfidence: total > 0 ? Math.round(avgConf * 100) : 0,
            mostUsedCommand: mostUsed ? mostUsed[0] : '-'
        };
        
        // Atualizar interface
        this.elements.totalCommands.textContent = this.voiceStats.totalCommands;
        this.elements.successRate.textContent = this.voiceStats.successRate + '%';
        this.elements.avgConfidence.textContent = this.voiceStats.avgConfidence + '%';
        this.elements.mostUsedCommand.textContent = this.voiceStats.mostUsedCommand;
    }

    // Feedback por voz
    speakFeedback(text) {
        if (!this.settings.voiceFeedback || !text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.settings.language;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        speechSynthesis.speak(utterance);
    }

    // Reproduzir som
    playSound(type) {
        if (!this.settings.soundEffects) return;
        
        const sounds = {
            start: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
            stop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
            success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
            error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
            wake: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
        };
        
        if (sounds[type]) {
            const audio = new Audio(sounds[type]);
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Erro ao reproduzir som:', e));
        }
    }

    // Mostrar/ocultar loading
    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.add('active');
        } else {
            this.elements.loadingOverlay.classList.remove('active');
        }
    }

    // Mostrar toast
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${icons[type] || icons.info}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    // Carregar configurações
    loadSettings() {
        const saved = localStorage.getItem('voiceSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }

    // Salvar configurações
    saveSettings() {
        localStorage.setItem('voiceSettings', JSON.stringify(this.settings));
    }

    // Aplicar configurações
    applySettings() {
        if (this.recognition) {
            this.recognition.lang = this.settings.language;
        }
        
        // Atualizar interface das configurações
        const settingsInputs = {
            language: document.getElementById('language'),
            sensitivity: document.getElementById('sensitivity'),
            confidence: document.getElementById('confidence'),
            voiceFeedback: document.getElementById('voiceFeedback'),
            soundEffects: document.getElementById('soundEffects'),
            wakeWord: document.getElementById('wakeWord'),
            continuousListening: document.getElementById('continuousListening')
        };
        
        Object.entries(settingsInputs).forEach(([key, element]) => {
            if (!element) return;
            
            if (element.type === 'checkbox') {
                element.checked = this.settings[key];
            } else if (element.type === 'range') {
                element.value = this.settings[key];
                const valueElement = document.getElementById(key + 'Value');
                if (valueElement) {
                    valueElement.textContent = this.settings[key] + '%';
                }
            } else {
                element.value = this.settings[key];
            }
        });
    }

    // Carregar histórico de comandos
    loadCommandHistory() {
        const saved = localStorage.getItem('voiceCommandHistory');
        if (saved) {
            this.commandHistory = JSON.parse(saved).map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
        }
        this.updateHistoryDisplay();
    }

    // Salvar histórico de comandos
    saveCommandHistory() {
        localStorage.setItem('voiceCommandHistory', JSON.stringify(this.commandHistory));
    }

    // Limpar histórico
    clearHistory() {
        this.commandHistory = [];
        this.saveCommandHistory();
        this.updateHistoryDisplay();
        this.updateStats();
        this.showToast('Histórico limpo', 'success');
    }

    // Utilitários
    getCurrentUserId() {
        return localStorage.getItem('userId') || 'anonymous';
    }

    getSessionId() {
        if (!this.currentSession) {
            this.currentSession = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.currentSession;
    }

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Modais
    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    showHelp() {
        this.elements.helpModal.classList.add('active');
    }

    closeHelp() {
        this.elements.helpModal.classList.remove('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.elements.suggestionsPanel.classList.remove('active');
    }

    resetSettings() {
        this.settings = {
            language: 'pt-BR',
            sensitivity: 50,
            confidence: 70,
            voiceFeedback: true,
            soundEffects: true,
            wakeWord: true,
            continuousListening: false
        };
        this.saveSettings();
        this.applySettings();
        this.showToast('Configurações restauradas', 'success');
    }

    saveSettingsFromModal() {
        this.saveSettings();
        this.closeSettings();
        this.showToast('Configurações salvas', 'success');
    }
}

// Funções globais para compatibilidade com HTML
window.openSettings = function() {
    if (window.voiceApp) {
        window.voiceApp.openSettings();
    }
};

window.closeSettings = function() {
    if (window.voiceApp) {
        window.voiceApp.closeSettings();
    }
};

window.showHelp = function() {
    if (window.voiceApp) {
        window.voiceApp.showHelp();
    }
};

window.closeHelp = function() {
    if (window.voiceApp) {
        window.voiceApp.closeHelp();
    }
};

window.resetSettings = function() {
    if (window.voiceApp) {
        window.voiceApp.resetSettings();
    }
};

window.saveSettings = function() {
    if (window.voiceApp) {
        window.voiceApp.saveSettingsFromModal();
    }
};

window.clearHistory = function() {
    if (window.voiceApp) {
        window.voiceApp.clearHistory();
    }
};

window.executeQuickCommand = function(command) {
    if (window.voiceApp) {
        window.voiceApp.executeQuickCommand(command);
    }
};

// Fechar modais ao clicar fora
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Exportar classe
window.VoiceRecognitionApp = VoiceRecognitionApp;