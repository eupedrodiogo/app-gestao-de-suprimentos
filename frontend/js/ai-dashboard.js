// AI Dashboard JavaScript
class AIDashboard {
    constructor() {
        this.charts = {};
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.isLoading = false;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initWebSocket();
        this.loadInitialData();
        this.initializeCharts();
        this.init3DVisualization();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Product selection for prediction
        document.getElementById('productSelect').addEventListener('change', (e) => {
            this.loadPrediction(e.target.value);
        });

        // Refresh buttons
        document.querySelectorAll('.btn-refresh').forEach(btn => {
            btn.addEventListener('click', () => {
                this.refreshData();
            });
        });

        // Export buttons
        document.querySelectorAll('.btn-export').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.export;
                this.exportData(type);
            });
        });
    }

    async loadInitialData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadProducts(),
                this.loadPrediction(),
                this.loadOptimization(),
                this.loadSeasonalInsights()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showError('Erro ao carregar dados do dashboard');
        } finally {
            this.hideLoading();
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/produtos');
            const products = await response.json();
            
            const select = document.getElementById('productSelect');
            select.innerHTML = '<option value="">Selecione um produto...</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    async loadPrediction(productId = null) {
        try {
            const url = productId ? 
                `/api/ai/predict-demand?productId=${productId}` : 
                '/api/ai/predict-demand';
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.updatePredictionDisplay(data);
            this.updatePredictionChart(data);
        } catch (error) {
            console.error('Erro ao carregar predição:', error);
            this.showError('Erro ao carregar análise preditiva');
        }
    }

    updatePredictionDisplay(data) {
        // Update prediction summary
        const summary = document.querySelector('.prediction-summary');
        if (summary && data.prediction) {
            summary.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="prediction-metric">
                            <span class="metric-value">${data.prediction.demandaPrevisao || 0}</span>
                            <span class="metric-label">Demanda Prevista</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="prediction-metric">
                            <span class="metric-value">${data.prediction.tendencia || 'Estável'}</span>
                            <span class="metric-label">Tendência</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="prediction-metric">
                            <span class="confidence-indicator confidence-${data.prediction.confianca?.toLowerCase() || 'média'}">
                                <i class="fas fa-chart-line"></i>
                                Confiança: ${data.prediction.confianca || 'Média'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update recommendations
        const recommendationsList = document.querySelector('.recommendations-list');
        if (recommendationsList && data.recomendacoes) {
            recommendationsList.innerHTML = data.recomendacoes.map(rec => `
                <div class="recommendation-item">
                    <div class="recommendation-header">
                        <span class="recommendation-icon">${this.getRecommendationIcon(rec.tipo)}</span>
                        <strong>${rec.tipo}</strong>
                        <span class="recommendation-priority priority-${rec.prioridade?.toLowerCase() || 'média'}">
                            ${rec.prioridade || 'Média'}
                        </span>
                    </div>
                    <p class="mb-0">${rec.descricao}</p>
                </div>
            `).join('');
        }
    }

    getRecommendationIcon(tipo) {
        const icons = {
            'Reabastecer': '📦',
            'Aumentar Estoque': '📈',
            'Promoção': '🏷️',
            'Reduzir Pedidos': '📉',
            'Monitorar': '👁️'
        };
        return icons[tipo] || '💡';
    }

    async loadOptimization() {
        try {
            const response = await fetch('/api/ai/stock-optimization');
            const data = await response.json();
            
            this.updateOptimizationMetrics(data.metricas);
            this.updateOptimizationTable(data.produtos);
        } catch (error) {
            console.error('Erro ao carregar otimização:', error);
        }
    }

    updateOptimizationMetrics(metricas) {
        if (!metricas) return;

        const metricsContainer = document.querySelector('.optimization-metrics');
        if (metricsContainer) {
            metricsContainer.innerHTML = `
                <div class="col-md-3">
                    <div class="optimization-metric critical">
                        <div class="metric-icon">⚠️</div>
                        <span class="metric-number">${metricas.criticos || 0}</span>
                        <span class="metric-text">Críticos</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="optimization-metric low">
                        <div class="metric-icon">📉</div>
                        <span class="metric-number">${metricas.baixos || 0}</span>
                        <span class="metric-text">Baixo Estoque</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="optimization-metric excess">
                        <div class="metric-icon">📊</div>
                        <span class="metric-number">${metricas.excessos || 0}</span>
                        <span class="metric-text">Excesso</span>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="optimization-metric optimal">
                        <div class="metric-icon">✅</div>
                        <span class="metric-number">${metricas.otimos || 0}</span>
                        <span class="metric-text">Ótimos</span>
                    </div>
                </div>
            `;
        }
    }

    updateOptimizationTable(produtos) {
        if (!produtos) return;

        const tableBody = document.querySelector('.optimization-table tbody');
        if (tableBody) {
            tableBody.innerHTML = produtos.map(produto => `
                <tr>
                    <td>${produto.nome}</td>
                    <td>${produto.estoqueAtual}</td>
                    <td>${produto.velocidadeVenda}</td>
                    <td>${produto.diasEstoque}</td>
                    <td>
                        <span class="status-badge status-${produto.status?.toLowerCase() || 'optimal'}">
                            ${produto.status || 'Ótimo'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }

    async loadSeasonalInsights() {
        try {
            const response = await fetch('/api/ai/seasonal-analysis');
            const data = await response.json();
            
            this.updateSeasonalInsights(data.insights);
            this.updateActivityHeatmap(data.atividade);
        } catch (error) {
            console.error('Erro ao carregar insights sazonais:', error);
        }
    }

    updateSeasonalInsights(insights) {
        if (!insights) return;

        const container = document.querySelector('.seasonal-insights');
        if (container) {
            container.innerHTML = insights.map(insight => `
                <div class="insight-item">
                    <div class="insight-icon">${this.getInsightIcon(insight.tipo)}</div>
                    <div class="insight-content">
                        <h6>${insight.titulo}</h6>
                        <p>${insight.descricao}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    getInsightIcon(tipo) {
        const icons = {
            'sazonal': '🌟',
            'tendencia': '📈',
            'anomalia': '⚡',
            'oportunidade': '💎'
        };
        return icons[tipo] || '📊';
    }

    updateActivityHeatmap(atividade) {
        if (!atividade) return;

        const heatmap = document.querySelector('.activity-heatmap');
        if (heatmap) {
            heatmap.innerHTML = '';
            
            for (let hour = 0; hour < 24; hour++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                
                const intensity = atividade[hour] || 0;
                if (intensity > 80) cell.classList.add('heatmap-very-high');
                else if (intensity > 60) cell.classList.add('heatmap-high');
                else if (intensity > 30) cell.classList.add('heatmap-medium');
                else cell.classList.add('heatmap-low');
                
                cell.title = `${hour}:00 - Atividade: ${intensity}%`;
                heatmap.appendChild(cell);
            }
        }
    }

    initializeCharts() {
        // Prediction Trend Chart
        const predictionCtx = document.getElementById('predictionChart');
        if (predictionCtx) {
            this.charts.prediction = new Chart(predictionCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Demanda Histórica',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Previsão',
                        data: [],
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            this.charts.performance = new Chart(performanceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Críticos', 'Baixo Estoque', 'Excesso', 'Ótimos'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#dc3545',
                            '#ffc107',
                            '#17a2b8',
                            '#28a745'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    updatePredictionChart(data) {
        if (!this.charts.prediction || !data.historico) return;

        const chart = this.charts.prediction;
        const historico = data.historico;
        const previsao = data.previsao || [];

        chart.data.labels = [...historico.map(h => h.periodo), ...previsao.map(p => p.periodo)];
        chart.data.datasets[0].data = [...historico.map(h => h.demanda), ...new Array(previsao.length).fill(null)];
        chart.data.datasets[1].data = [...new Array(historico.length).fill(null), ...previsao.map(p => p.demanda)];
        
        chart.update();
    }

    init3DVisualization() {
        const container = document.querySelector('.threejs-container');
        if (!container || !window.THREE) return;

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        // Create 3D data visualization
        this.create3DDataVisualization();

        // Camera position
        this.camera.position.z = 5;

        // Start animation
        this.animate3D();

        // Handle resize
        window.addEventListener('resize', () => {
            if (container.clientWidth > 0) {
                this.camera.aspect = container.clientWidth / container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });
    }

    create3DDataVisualization() {
        // Create animated cubes representing data points
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const materials = [
            new THREE.MeshBasicMaterial({ color: 0x667eea }),
            new THREE.MeshBasicMaterial({ color: 0x764ba2 }),
            new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
            new THREE.MeshBasicMaterial({ color: 0xff6b6b })
        ];

        for (let i = 0; i < 50; i++) {
            const material = materials[i % materials.length];
            const cube = new THREE.Mesh(geometry, material);
            
            cube.position.x = (Math.random() - 0.5) * 10;
            cube.position.y = (Math.random() - 0.5) * 10;
            cube.position.z = (Math.random() - 0.5) * 10;
            
            cube.userData = {
                originalPosition: cube.position.clone(),
                speed: Math.random() * 0.02 + 0.01
            };
            
            this.scene.add(cube);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    animate3D() {
        this.animationId = requestAnimationFrame(() => this.animate3D());

        // Animate cubes
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.originalPosition) {
                child.rotation.x += child.userData.speed;
                child.rotation.y += child.userData.speed;
                
                // Floating animation
                child.position.y = child.userData.originalPosition.y + Math.sin(Date.now() * child.userData.speed) * 0.5;
            }
        });

        // Rotate camera around the scene
        const time = Date.now() * 0.0005;
        this.camera.position.x = Math.cos(time) * 8;
        this.camera.position.z = Math.sin(time) * 8;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }

    startRealTimeUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.refreshData();
            }
        }, 30000);

        // Update 3D visualization every 5 seconds
        setInterval(() => {
            this.update3DData();
        }, 5000);
    }

    update3DData() {
        if (!this.scene) return;

        // Simulate real-time data updates by changing cube colors
        this.scene.children.forEach(child => {
            if (child.material && child.material.color) {
                const colors = [0x667eea, 0x764ba2, 0x00ff88, 0xff6b6b, 0xffd93d];
                const newColor = colors[Math.floor(Math.random() * colors.length)];
                child.material.color.setHex(newColor);
            }
        });
    }

    async refreshData() {
        this.showLoading();
        try {
            await this.loadInitialData();
            this.showSuccess('Dados atualizados com sucesso!');
        } catch (error) {
            this.showError('Erro ao atualizar dados');
        } finally {
            this.hideLoading();
        }
    }

    exportData(type) {
        // Simulate data export
        const data = {
            timestamp: new Date().toISOString(),
            type: type,
            data: 'Dados exportados com sucesso'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-dashboard-${type}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSuccess(`Dados de ${type} exportados com sucesso!`);
    }

    showLoading() {
        this.isLoading = true;
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // WebSocket Methods
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.websocket = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    setupWebSocketHandlers() {
        this.websocket.onopen = () => {
            console.log('🔌 WebSocket conectado');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            
            // Inscrever-se em canais
            this.subscribeToChannels();
        };

        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }
        };

        this.websocket.onclose = () => {
            console.log('🔌 WebSocket desconectado');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.scheduleReconnect();
        };

        this.websocket.onerror = (error) => {
            console.error('Erro WebSocket:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        };
    }

    subscribeToChannels() {
        const channels = ['metrics', 'predictions', 'alerts', 'inventory'];
        channels.forEach(channel => {
            this.sendWebSocketMessage({
                type: 'subscribe',
                data: { channel: channel }
            });
        });
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'initial':
                console.log('Dados iniciais recebidos:', data.data);
                break;
                
            case 'real-time-update':
                this.handleRealTimeUpdate(data.data);
                break;
                
            case 'channel-data':
                this.handleChannelData(data.channel, data.data);
                break;
                
            case 'alert':
                this.handleNewAlert(data.data);
                break;
                
            case 'notification':
                this.showNotification(data.data);
                break;
                
            case 'pong':
                // Resposta ao ping
                break;
                
            default:
                console.log('Tipo de mensagem desconhecido:', data.type);
        }
    }

    handleRealTimeUpdate(data) {
        // Atualizar métricas
        if (data.metrics) {
            this.updateMetricsDisplay(data.metrics);
        }
        
        // Atualizar predições
        if (data.predictions) {
            this.updatePredictionsDisplay(data.predictions);
        }
        
        // Atualizar alertas
        if (data.alerts) {
            this.updateAlertsDisplay(data.alerts);
        }
        
        // Atualizar inventário
        if (data.inventory) {
            this.updateInventoryDisplay(data.inventory);
        }
        
        // Atualizar performance
        if (data.performance) {
            this.updatePerformanceDisplay(data.performance);
        }
    }

    handleChannelData(channel, data) {
        switch (channel) {
            case 'metrics':
                this.updateMetricsDisplay(data);
                break;
            case 'predictions':
                this.updatePredictionsDisplay(data);
                break;
            case 'alerts':
                this.updateAlertsDisplay(data);
                break;
            case 'inventory':
                this.updateInventoryDisplay(data);
                break;
        }
    }

    updateMetricsDisplay(metrics) {
        // Atualizar cards de métricas
        const elements = {
            'total-products': metrics.totalProducts,
            'low-stock': metrics.lowStock,
            'critical-stock': metrics.criticalStock,
            'optimal-stock': metrics.optimalStock,
            'accuracy-value': metrics.accuracy?.toFixed(1) + '%',
            'processing-time': metrics.processingTime?.toFixed(0) + 'ms',
            'active-alerts': metrics.activeAlerts
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 1000);
            }
        });
    }

    updatePredictionsDisplay(predictions) {
        if (!Array.isArray(predictions)) return;
        
        const container = document.querySelector('.predictions-list');
        if (!container) return;
        
        container.innerHTML = predictions.map(pred => `
            <div class="prediction-item ${pred.trend === 'up' ? 'trend-up' : 'trend-down'}">
                <div class="prediction-product">${pred.product}</div>
                <div class="prediction-values">
                    <span class="current">${pred.currentDemand}</span>
                    <span class="arrow">${pred.trend === 'up' ? '↗' : '↘'}</span>
                    <span class="predicted">${pred.predictedDemand}</span>
                </div>
                <div class="prediction-confidence">${pred.confidence?.toFixed(1)}%</div>
                <div class="prediction-change ${pred.changePercent >= 0 ? 'positive' : 'negative'}">
                    ${pred.changePercent >= 0 ? '+' : ''}${pred.changePercent}%
                </div>
            </div>
        `).join('');
    }

    updateAlertsDisplay(alerts) {
        if (!Array.isArray(alerts)) return;
        
        const container = document.querySelector('.alerts-list');
        if (!container) return;
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item severity-${alert.severidade} ${alert.isNew ? 'new-alert' : ''}">
                <div class="alert-icon">
                    ${alert.severidade === 'alta' ? '🚨' : alert.severidade === 'média' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.tipo}</div>
                    <div class="alert-product">${alert.produto}</div>
                    <div class="alert-message">${alert.mensagem}</div>
                </div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    updateInventoryDisplay(inventory) {
        if (!Array.isArray(inventory)) return;
        
        const tbody = document.querySelector('#optimization-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = inventory.map(item => `
            <tr class="status-${item.status}">
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.minStock}</td>
                <td>${item.maxStock}</td>
                <td>${item.velocity?.toFixed(1)}</td>
                <td>
                    <span class="status-badge status-${item.status}">
                        ${item.status === 'critical' ? 'Crítico' : 
                          item.status === 'low' ? 'Baixo' : 'Ótimo'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    updatePerformanceDisplay(performance) {
        // Atualizar indicadores de performance
        const perfElements = {
            'cpu-usage': performance.cpuUsage?.toFixed(1) + '%',
            'memory-usage': performance.memoryUsage?.toFixed(1) + '%',
            'response-time': performance.responseTime?.toFixed(0) + 'ms',
            'active-connections': performance.activeConnections
        };

        Object.entries(perfElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    handleNewAlert(alert) {
        // Mostrar notificação de novo alerta
        this.showNotification({
            type: 'alert',
            title: alert.tipo,
            message: `${alert.produto}: ${alert.mensagem}`,
            severity: alert.severidade
        });
        
        // Adicionar efeito visual
        const alertsCard = document.querySelector('.alerts-card');
        if (alertsCard) {
            alertsCard.classList.add('new-alert-received');
            setTimeout(() => alertsCard.classList.remove('new-alert-received'), 2000);
        }
    }

    sendWebSocketMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.initWebSocket();
            }, delay);
        } else {
            console.error('Máximo de tentativas de reconexão atingido');
            this.updateConnectionStatus(false, 'Falha na conexão');
        }
    }

    updateConnectionStatus(connected, message = '') {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
            statusElement.textContent = connected ? 'Conectado' : (message || 'Desconectado');
        }
        
        // Atualizar indicador visual
        const indicator = document.querySelector('.connection-indicator');
        if (indicator) {
            indicator.className = `connection-indicator ${connected ? 'connected' : 'disconnected'}`;
        }
    }

    destroy() {
        // Cleanup WebSocket
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        // Cleanup animations
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });

        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.remove();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiDashboard = new AIDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.aiDashboard) {
        window.aiDashboard.destroy();
    }
});