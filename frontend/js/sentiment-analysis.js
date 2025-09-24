// Sentiment Analysis Application
class SentimentAnalysisApp {
    constructor() {
        this.chart = null;
        this.updateInterval = null;
        this.settings = {
            alertThreshold: 0.3,
            realTimeUpdates: true,
            updateInterval: 30000, // 30 seconds
            chartType: 'line',
            timeRange: '24h',
            autoRefresh: true
        };
        this.suppliers = [];
        this.alerts = [];
        this.sentimentData = {
            overall: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0
        };
        
        this.init();
    }

    async init() {
        try {
            this.initializeElements();
            this.setupEventListeners();
            await this.loadSettings();
            await this.loadInitialData();
            this.initializeChart();
            this.startRealTimeUpdates();
            
            console.log('Sentiment Analysis App initialized successfully');
        } catch (error) {
            console.error('Error initializing Sentiment Analysis App:', error);
            this.showToast('Erro ao inicializar aplicação', 'error');
        }
    }

    initializeElements() {
        // Dashboard elements
        this.overallScoreEl = document.getElementById('overallScore');
        this.overallLabelEl = document.getElementById('overallLabel');
        this.positiveCountEl = document.getElementById('positiveCount');
        this.negativeCountEl = document.getElementById('negativeCount');
        this.neutralCountEl = document.getElementById('neutralCount');
        this.positivePercentEl = document.getElementById('positivePercent');
        this.negativePercentEl = document.getElementById('negativePercent');
        this.neutralPercentEl = document.getElementById('neutralPercent');
        
        // Alerts
        this.alertCountEl = document.getElementById('alertCount');
        this.alertsListEl = document.getElementById('alertsList');
        
        // Trending
        this.trendingListEl = document.getElementById('trendingList');
        
        // Chart
        this.chartCanvasEl = document.getElementById('sentimentChart');
        
        // Suppliers
        this.suppliersGridEl = document.getElementById('suppliersGrid');
        this.supplierSearchEl = document.getElementById('supplierSearch');
        this.sentimentFilterEl = document.getElementById('sentimentFilter');
        this.sortByEl = document.getElementById('sortBy');
        
        // Feedback analyzer
        this.supplierSelectEl = document.getElementById('supplierSelect');
        this.categorySelectEl = document.getElementById('categorySelect');
        this.feedbackTextEl = document.getElementById('feedbackText');
        this.analyzerResultEl = document.getElementById('analyzerResult');
        this.resultScoreEl = document.getElementById('resultScore');
        this.resultLabelEl = document.getElementById('resultLabel');
        this.resultConfidenceEl = document.getElementById('resultConfidence');
        this.resultCategoryEl = document.getElementById('resultCategory');
        this.resultKeywordsEl = document.getElementById('resultKeywords');
        this.resultEmotionEl = document.getElementById('resultEmotion');
        
        // Modals
        this.settingsModalEl = document.getElementById('settingsModal');
        this.feedbackModalEl = document.getElementById('feedbackModal');
        
        // Loading and toast
        this.loadingOverlayEl = document.getElementById('loadingOverlay');
        this.toastContainerEl = document.getElementById('toastContainer');
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });

        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Trend filters
        document.querySelectorAll('.trend-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                this.setTrendFilter(e.target.dataset.period);
            });
        });

        // Chart controls
        document.getElementById('chartType')?.addEventListener('change', (e) => {
            this.updateChartType(e.target.value);
        });

        document.getElementById('timeRange')?.addEventListener('change', (e) => {
            this.updateTimeRange(e.target.value);
        });

        // Supplier controls
        this.supplierSearchEl?.addEventListener('input', (e) => {
            this.filterSuppliers();
        });

        this.sentimentFilterEl?.addEventListener('change', (e) => {
            this.filterSuppliers();
        });

        this.sortByEl?.addEventListener('change', (e) => {
            this.sortSuppliers(e.target.value);
        });

        // Feedback analyzer
        document.getElementById('analyzeFeedbackBtn')?.addEventListener('click', () => {
            this.analyzeFeedback();
        });

        document.getElementById('addFeedbackBtn')?.addEventListener('click', () => {
            this.openFeedbackModal();
        });

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Settings
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('saveFeedbackBtn')?.addEventListener('click', () => {
            this.saveFeedback();
        });

        // Real-time toggle
        document.getElementById('realTimeToggle')?.addEventListener('change', (e) => {
            this.toggleRealTimeUpdates(e.target.checked);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async loadSettings() {
        try {
            const savedSettings = localStorage.getItem('sentimentAnalysisSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
            this.applySettings();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    applySettings() {
        // Apply settings to UI elements - check if elements exist first
        const alertThreshold = document.getElementById('alertThreshold');
        if (alertThreshold) alertThreshold.value = this.settings.alertThreshold;
        
        const alertThresholdValue = document.getElementById('alertThresholdValue');
        if (alertThresholdValue) alertThresholdValue.textContent = this.settings.alertThreshold;
        
        const realTimeToggle = document.getElementById('realTimeToggle');
        if (realTimeToggle) realTimeToggle.checked = this.settings.realTimeUpdates;
        
        const updateInterval = document.getElementById('updateInterval');
        if (updateInterval) updateInterval.value = this.settings.updateInterval / 1000;
        
        const updateIntervalValue = document.getElementById('updateIntervalValue');
        if (updateIntervalValue) updateIntervalValue.textContent = `${this.settings.updateInterval / 1000}s`;
        
        const chartTypeSelect = document.getElementById('chartTypeSelect');
        if (chartTypeSelect) chartTypeSelect.value = this.settings.chartType;
        
        const timeRangeSelect = document.getElementById('timeRangeSelect');
        if (timeRangeSelect) timeRangeSelect.value = this.settings.timeRange;
        
        const autoRefreshToggle = document.getElementById('autoRefreshToggle');
        if (autoRefreshToggle) autoRefreshToggle.checked = this.settings.autoRefresh;
    }

    async loadInitialData() {
        this.showLoading('Carregando dados de sentimento...');
        
        try {
            // Load sentiment data
            await this.loadSentimentData();
            
            // Load suppliers
            await this.loadSuppliers();
            
            // Load alerts
            await this.loadAlerts();
            
            // Load trending data
            await this.loadTrendingData();
            
            // Update dashboard
            this.updateDashboard();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Erro ao carregar dados iniciais', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadSentimentData() {
        try {
            const response = await fetch('/api/sentiment/realtime');
            if (!response.ok) throw new Error('Failed to load sentiment data');
            
            this.sentimentData = await response.json();
        } catch (error) {
            console.error('Error loading sentiment data:', error);
            // Use mock data for demonstration
            this.sentimentData = {
                overall: 0.65,
                positive: 45,
                negative: 12,
                neutral: 23,
                total: 80
            };
        }
    }

    async loadSuppliers() {
        try {
            const response = await fetch('/api/sentiment/suppliers');
            if (!response.ok) throw new Error('Failed to load suppliers');
            
            const suppliersData = await response.json();
            this.suppliers = Array.isArray(suppliersData) ? suppliersData : (suppliersData.suppliers || []);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            // Use mock data for demonstration
            this.suppliers = this.generateMockSuppliers();
        }
        
        // Ensure suppliers is always an array
        if (!Array.isArray(this.suppliers)) {
            this.suppliers = [];
        }
        
        this.renderSuppliers();
        this.populateSupplierSelect();
    }

    async loadAlerts() {
        try {
            const response = await fetch('/api/sentiment/alerts');
            if (!response.ok) throw new Error('Failed to load alerts');
            
            const alertsData = await response.json();
            this.alerts = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
            // Use mock data for demonstration
            this.alerts = this.generateMockAlerts();
        }
        
        // Ensure alerts is always an array
        if (!Array.isArray(this.alerts)) {
            this.alerts = [];
        }
        
        this.renderAlerts();
    }

    async loadTrendingData() {
        try {
            const response = await fetch('/api/sentiment/trending?period=24h');
            if (!response.ok) throw new Error('Failed to load trending data');
            
            const trendingData = await response.json();
            // Ensure trendingData is an array
            const dataArray = Array.isArray(trendingData) ? trendingData : (trendingData.suppliers || []);
            this.renderTrending(dataArray);
        } catch (error) {
            console.error('Error loading trending data:', error);
            // Use mock data for demonstration
            this.renderTrending(this.generateMockTrending());
        }
    }

    updateDashboard() {
        // Update overall sentiment
        const score = this.sentimentData?.overall || 0;
        const label = this.getSentimentLabel(score);
        const color = this.getSentimentColor(score);
        
        if (this.overallScoreEl) {
            this.overallScoreEl.textContent = score.toFixed(2);
            this.overallScoreEl.style.color = color;
        }
        
        if (this.overallLabelEl) {
            this.overallLabelEl.textContent = label;
            this.overallLabelEl.style.backgroundColor = color + '20';
            this.overallLabelEl.style.color = color;
        }
        
        // Update breakdown
        const total = this.sentimentData?.total || 1;
        const positive = this.sentimentData?.positive || 0;
        const negative = this.sentimentData?.negative || 0;
        const neutral = this.sentimentData?.neutral || 0;
        
        if (this.positiveCountEl) this.positiveCountEl.textContent = positive;
        if (this.negativeCountEl) this.negativeCountEl.textContent = negative;
        if (this.neutralCountEl) this.neutralCountEl.textContent = neutral;
        
        if (this.positivePercentEl) {
            this.positivePercentEl.textContent = `${((positive / total) * 100).toFixed(1)}%`;
        }
        if (this.negativePercentEl) {
            this.negativePercentEl.textContent = `${((negative / total) * 100).toFixed(1)}%`;
        }
        if (this.neutralPercentEl) {
            this.neutralPercentEl.textContent = `${((neutral / total) * 100).toFixed(1)}%`;
        }
    }

    renderSuppliers() {
        if (!this.suppliersGridEl) return;
        
        const filteredSuppliers = this.getFilteredSuppliers();
        
        if (filteredSuppliers.length === 0) {
            this.suppliersGridEl.innerHTML = `
                <div class="no-suppliers">
                    <i class="fas fa-search"></i>
                    <p>Nenhum fornecedor encontrado</p>
                </div>
            `;
            return;
        }
        
        this.suppliersGridEl.innerHTML = filteredSuppliers.map(supplier => `
            <div class="supplier-card" data-supplier-id="${supplier.id}">
                <div class="supplier-header">
                    <div class="supplier-info">
                        <div class="supplier-avatar">
                            ${supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="supplier-details">
                            <h4>${supplier.name}</h4>
                            <p>${supplier.category}</p>
                        </div>
                    </div>
                    <div class="supplier-sentiment">
                        <div class="sentiment-score-display">
                            <span class="score-value ${this.getSentimentClass(supplier.sentiment)}">${supplier.sentiment.toFixed(2)}</span>
                            <i class="fas fa-${this.getSentimentIcon(supplier.sentiment)}"></i>
                        </div>
                        <div class="confidence-badge">
                            ${(supplier.confidence * 100).toFixed(0)}% confiança
                        </div>
                    </div>
                </div>
                <div class="supplier-metrics">
                    <div class="metric-item">
                        <span class="metric-value">${supplier.feedbackCount}</span>
                        <span class="metric-label">Feedbacks</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${supplier.trend > 0 ? '+' : ''}${(supplier.trend * 100).toFixed(1)}%</span>
                        <span class="metric-label">Tendência</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${supplier.volatility.toFixed(2)}</span>
                        <span class="metric-label">Volatilidade</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAlerts() {
        if (!this.alertsListEl || !this.alertCountEl) return;
        
        this.alertCountEl.textContent = this.alerts.length;
        
        if (this.alerts.length === 0) {
            this.alertsListEl.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhum alerta ativo</p>
                </div>
            `;
            return;
        }
        
        this.alertsListEl.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-header">
                    <span class="alert-title">${alert.title}</span>
                    <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
            </div>
        `).join('');
    }

    renderTrending(trendingData) {
        if (!this.trendingListEl) return;
        
        this.trendingListEl.innerHTML = trendingData.map(item => `
            <div class="trending-item">
                <div class="trending-info">
                    <div class="trending-avatar">
                        ${item.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="trending-name">${item.name}</span>
                </div>
                <div class="trending-trend ${item.trend > 0 ? 'improving' : 'declining'}">
                    <i class="fas fa-arrow-${item.trend > 0 ? 'up' : 'down'}"></i>
                    <span>${Math.abs(item.trend * 100).toFixed(1)}%</span>
                </div>
            </div>
        `).join('');
    }

    initializeChart() {
        if (!this.chartCanvasEl) return;
        
        const ctx = this.chartCanvasEl.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: this.settings.chartType,
            data: {
                labels: this.generateTimeLabels(),
                datasets: [{
                    label: 'Sentimento Geral',
                    data: this.generateMockChartData(),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Positivo',
                    data: this.generateMockChartData(0.7),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Negativo',
                    data: this.generateMockChartData(0.3),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Tempo'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Score de Sentimento'
                        },
                        min: -1,
                        max: 1
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    async analyzeFeedback() {
        const supplierSelect = this.supplierSelectEl?.value;
        const categorySelect = this.categorySelectEl?.value;
        const feedbackText = this.feedbackTextEl?.value?.trim();
        
        if (!feedbackText) {
            this.showToast('Por favor, insira um texto para análise', 'warning');
            return;
        }
        
        this.showLoading('Analisando sentimento...');
        
        try {
            const response = await fetch('/api/sentiment/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: feedbackText,
                    supplierId: supplierSelect,
                    category: categorySelect
                })
            });
            
            if (!response.ok) throw new Error('Failed to analyze sentiment');
            
            const result = await response.json();
            this.displayAnalysisResult(result);
            
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            // Use mock result for demonstration
            const mockResult = this.generateMockAnalysisResult(feedbackText);
            this.displayAnalysisResult(mockResult);
        } finally {
            this.hideLoading();
        }
    }

    displayAnalysisResult(result) {
        if (!this.analyzerResultEl) return;
        
        const score = result.sentiment;
        const label = this.getSentimentLabel(score);
        const color = this.getSentimentColor(score);
        
        if (this.resultScoreEl) {
            this.resultScoreEl.textContent = score.toFixed(2);
            this.resultScoreEl.className = `score ${this.getSentimentClass(score)}`;
        }
        
        if (this.resultLabelEl) {
            this.resultLabelEl.textContent = label;
            this.resultLabelEl.style.backgroundColor = color + '20';
            this.resultLabelEl.style.color = color;
        }
        
        if (this.resultConfidenceEl) {
            this.resultConfidenceEl.textContent = `${(result.confidence * 100).toFixed(1)}%`;
        }
        
        if (this.resultCategoryEl) {
            this.resultCategoryEl.textContent = result.category || 'Geral';
        }
        
        if (this.resultKeywordsEl) {
            this.resultKeywordsEl.textContent = result.keywords?.join(', ') || 'N/A';
        }
        
        if (this.resultEmotionEl) {
            this.resultEmotionEl.textContent = result.emotion || 'Neutro';
        }
        
        this.analyzerResultEl.classList.add('show');
        this.showToast('Análise de sentimento concluída', 'success');
    }

    startRealTimeUpdates() {
        if (!this.settings.realTimeUpdates) return;
        
        this.updateInterval = setInterval(async () => {
            try {
                await this.loadSentimentData();
                await this.loadSuppliers();
                await this.loadAlerts();
                this.updateDashboard();
                this.renderSuppliers();
                this.renderAlerts();
                this.updateChart();
            } catch (error) {
                console.error('Error in real-time update:', error);
            }
        }, this.settings.updateInterval);
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    toggleRealTimeUpdates(enabled) {
        this.settings.realTimeUpdates = enabled;
        
        if (enabled) {
            this.startRealTimeUpdates();
            this.showToast('Atualizações em tempo real ativadas', 'success');
        } else {
            this.stopRealTimeUpdates();
            this.showToast('Atualizações em tempo real desativadas', 'info');
        }
    }

    updateChart() {
        if (!this.chart) return;
        
        // Add new data point
        const newData = Math.random() * 2 - 1; // Random sentiment score
        this.chart.data.datasets[0].data.push(newData);
        this.chart.data.labels.push(new Date().toLocaleTimeString());
        
        // Keep only last 20 points
        if (this.chart.data.datasets[0].data.length > 20) {
            this.chart.data.datasets[0].data.shift();
            this.chart.data.labels.shift();
        }
        
        this.chart.update('none');
    }

    updateChartType(type) {
        if (!this.chart) return;
        
        this.chart.config.type = type;
        this.chart.update();
        this.settings.chartType = type;
    }

    updateTimeRange(range) {
        this.settings.timeRange = range;
        // Reload chart data for new time range
        this.loadChartData(range);
    }

    async loadChartData(timeRange) {
        try {
            const response = await fetch(`/api/sentiment/chart?range=${timeRange}`);
            if (!response.ok) throw new Error('Failed to load chart data');
            
            const data = await response.json();
            
            if (this.chart) {
                this.chart.data.labels = data.labels;
                this.chart.data.datasets[0].data = data.sentiment;
                this.chart.data.datasets[1].data = data.positive;
                this.chart.data.datasets[2].data = data.negative;
                this.chart.update();
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    setTrendFilter(period) {
        document.querySelectorAll('.trend-filter').forEach(filter => {
            filter.classList.remove('active');
        });
        
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
        
        this.loadTrendingData(period);
    }

    getFilteredSuppliers() {
        let filtered = [...this.suppliers];
        
        // Search filter
        const searchTerm = this.supplierSearchEl?.value?.toLowerCase() || '';
        if (searchTerm) {
            filtered = filtered.filter(supplier => 
                supplier.name.toLowerCase().includes(searchTerm) ||
                supplier.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sentiment filter
        const sentimentFilter = this.sentimentFilterEl?.value || 'all';
        if (sentimentFilter !== 'all') {
            filtered = filtered.filter(supplier => {
                const sentimentClass = this.getSentimentClass(supplier.sentiment);
                return sentimentClass === sentimentFilter;
            });
        }
        
        return filtered;
    }

    filterSuppliers() {
        this.renderSuppliers();
    }

    sortSuppliers(sortBy) {
        switch (sortBy) {
            case 'name':
                this.suppliers.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'sentiment':
                this.suppliers.sort((a, b) => b.sentiment - a.sentiment);
                break;
            case 'trend':
                this.suppliers.sort((a, b) => b.trend - a.trend);
                break;
            case 'feedbacks':
                this.suppliers.sort((a, b) => b.feedbackCount - a.feedbackCount);
                break;
            default:
                break;
        }
        
        this.renderSuppliers();
    }

    populateSupplierSelect() {
        if (!this.supplierSelectEl) return;
        
        this.supplierSelectEl.innerHTML = '<option value="">Selecione um fornecedor</option>' +
            this.suppliers.map(supplier => 
                `<option value="${supplier.id}">${supplier.name}</option>`
            ).join('');
    }

    openSettingsModal() {
        if (this.settingsModalEl) {
            this.settingsModalEl.classList.add('show');
        }
    }

    openFeedbackModal() {
        if (this.feedbackModalEl) {
            this.feedbackModalEl.classList.add('show');
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    saveSettings() {
        // Get settings from form
        this.settings.alertThreshold = parseFloat(document.getElementById('alertThreshold')?.value || 0.3);
        this.settings.realTimeUpdates = document.getElementById('realTimeToggle')?.checked || false;
        this.settings.updateInterval = parseInt(document.getElementById('updateInterval')?.value || 30) * 1000;
        this.settings.chartType = document.getElementById('chartTypeSelect')?.value || 'line';
        this.settings.timeRange = document.getElementById('timeRangeSelect')?.value || '24h';
        this.settings.autoRefresh = document.getElementById('autoRefreshToggle')?.checked || false;
        
        // Save to localStorage
        localStorage.setItem('sentimentAnalysisSettings', JSON.stringify(this.settings));
        
        // Apply settings
        this.applySettings();
        
        // Restart real-time updates if needed
        this.stopRealTimeUpdates();
        if (this.settings.realTimeUpdates) {
            this.startRealTimeUpdates();
        }
        
        this.closeModal(this.settingsModalEl);
        this.showToast('Configurações salvas com sucesso', 'success');
    }

    async saveFeedback() {
        const supplierSelect = document.getElementById('feedbackSupplier')?.value;
        const categorySelect = document.getElementById('feedbackCategory')?.value;
        const ratingInput = document.getElementById('feedbackRating')?.value;
        const commentInput = document.getElementById('feedbackComment')?.value;
        
        if (!supplierSelect || !categorySelect || !ratingInput || !commentInput) {
            this.showToast('Por favor, preencha todos os campos', 'warning');
            return;
        }
        
        this.showLoading('Salvando feedback...');
        
        try {
            const response = await fetch('/api/sentiment/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplierId: supplierSelect,
                    category: categorySelect,
                    rating: parseFloat(ratingInput),
                    comment: commentInput,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) throw new Error('Failed to save feedback');
            
            // Reset form
            document.getElementById('feedbackForm')?.reset();
            
            // Reload data
            await this.loadSuppliers();
            await this.loadSentimentData();
            this.updateDashboard();
            this.renderSuppliers();
            
            this.closeModal(this.feedbackModalEl);
            this.showToast('Feedback salvo com sucesso', 'success');
            
        } catch (error) {
            console.error('Error saving feedback:', error);
            this.showToast('Erro ao salvar feedback', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Utility methods
    getSentimentLabel(score) {
        if (score > 0.3) return 'Positivo';
        if (score < -0.3) return 'Negativo';
        return 'Neutro';
    }

    getSentimentClass(score) {
        if (score > 0.3) return 'positive';
        if (score < -0.3) return 'negative';
        return 'neutral';
    }

    getSentimentColor(score) {
        if (score > 0.3) return '#10b981';
        if (score < -0.3) return '#ef4444';
        return '#64748b';
    }

    getSentimentIcon(score) {
        if (score > 0.3) return 'smile';
        if (score < -0.3) return 'frown';
        return 'meh';
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    generateTimeLabels() {
        const labels = [];
        const now = new Date();
        
        for (let i = 19; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
            labels.push(time.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }));
        }
        
        return labels;
    }

    generateMockChartData(base = 0.5) {
        return Array.from({ length: 20 }, () => 
            base + (Math.random() - 0.5) * 0.6
        );
    }

    generateMockSuppliers() {
        const names = ['TechCorp', 'GlobalSupply', 'FastDelivery', 'QualityFirst', 'EcoMaterials', 'PremiumParts'];
        const categories = ['Eletrônicos', 'Materiais', 'Logística', 'Serviços', 'Sustentáveis', 'Premium'];
        
        return names.map((name, index) => ({
            id: index + 1,
            name,
            category: categories[index],
            sentiment: Math.random() * 2 - 1,
            confidence: 0.7 + Math.random() * 0.3,
            feedbackCount: Math.floor(Math.random() * 100) + 10,
            trend: (Math.random() - 0.5) * 0.4,
            volatility: Math.random() * 0.5
        }));
    }

    generateMockAlerts() {
        return [
            {
                id: 1,
                type: 'warning',
                title: 'Sentimento em Declínio',
                message: 'TechCorp apresenta tendência negativa nos últimos 3 dias',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                type: 'error',
                title: 'Alerta Crítico',
                message: 'FastDelivery com score abaixo do limite crítico',
                timestamp: new Date(Date.now() - 7200000).toISOString()
            }
        ];
    }

    generateMockTrending() {
        return [
            { name: 'QualityFirst', trend: 0.15 },
            { name: 'EcoMaterials', trend: 0.08 },
            { name: 'TechCorp', trend: -0.12 },
            { name: 'FastDelivery', trend: -0.05 }
        ];
    }

    generateMockAnalysisResult(text) {
        const words = text.toLowerCase().split(' ');
        const positiveWords = ['bom', 'ótimo', 'excelente', 'satisfeito', 'recomendo'];
        const negativeWords = ['ruim', 'péssimo', 'insatisfeito', 'problema', 'atraso'];
        
        let score = 0;
        const keywords = [];
        
        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw))) {
                score += 0.3;
                keywords.push(word);
            }
            if (negativeWords.some(nw => word.includes(nw))) {
                score -= 0.3;
                keywords.push(word);
            }
        });
        
        score = Math.max(-1, Math.min(1, score));
        
        return {
            sentiment: score,
            confidence: 0.8 + Math.random() * 0.2,
            category: 'Qualidade',
            keywords: keywords.slice(0, 5),
            emotion: score > 0.3 ? 'Satisfação' : score < -0.3 ? 'Insatisfação' : 'Neutro'
        };
    }

    showLoading(message = 'Carregando...') {
        if (this.loadingOverlayEl) {
            this.loadingOverlayEl.querySelector('p').textContent = message;
            this.loadingOverlayEl.classList.add('show');
        }
    }

    hideLoading() {
        if (this.loadingOverlayEl) {
            this.loadingOverlayEl.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainerEl) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${this.getToastTitle(type)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        this.toastContainerEl.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getToastTitle(type) {
        switch (type) {
            case 'success': return 'Sucesso';
            case 'error': return 'Erro';
            case 'warning': return 'Aviso';
            default: return 'Informação';
        }
    }
}

// Global functions for HTML interaction
function showSettings() {
    if (window.sentimentApp) {
        window.sentimentApp.openSettingsModal();
    }
}

function showAddFeedback() {
    if (window.sentimentApp) {
        window.sentimentApp.openFeedbackModal();
    }
}

function analyzeFeedback() {
    if (window.sentimentApp) {
        window.sentimentApp.analyzeFeedback();
    }
}

function saveSettings() {
    if (window.sentimentApp) {
        window.sentimentApp.saveSettings();
    }
}

function saveFeedback() {
    if (window.sentimentApp) {
        window.sentimentApp.saveFeedback();
    }
}

function updateSliderValue(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (slider && valueDisplay) {
        valueDisplay.textContent = sliderId.includes('Interval') ? `${slider.value}s` : slider.value;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sentimentApp = new SentimentAnalysisApp();
});