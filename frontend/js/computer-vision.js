class ComputerVisionApp {
    constructor() {
        this.camera = null;
        this.canvas = null;
        this.context = null;
        this.isAnalyzing = false;
        this.analysisHistory = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadPerformanceStats();
        await this.loadAnalysisHistory();
        this.initCharts();
        this.startPerformanceUpdates();
    }

    setupElements() {
        // Camera elements
        this.cameraFeed = document.getElementById('camera-feed');
        this.captureCanvas = document.getElementById('capture-canvas');
        this.context = this.captureCanvas.getContext('2d');
        this.imagePreview = document.getElementById('image-preview');
        this.previewImage = document.getElementById('preview-image');
        
        // Control elements
        this.startCameraBtn = document.getElementById('start-camera');
        this.captureBtn = document.getElementById('capture-photo');
        this.uploadBtn = document.getElementById('upload-image');
        this.imageUpload = document.getElementById('image-upload');
        this.analyzeBtn = document.getElementById('analyze-image');
        
        // Analysis elements
        this.analysisType = document.getElementById('analysis-type');
        this.expectedCategory = document.getElementById('expected-category');
        this.analysisResults = document.getElementById('analysis-results');
        this.analysisLoading = document.getElementById('analysis-loading');
        
        // Stats elements
        this.totalAnalyses = document.getElementById('total-analyses');
        this.accuracyRate = document.getElementById('accuracy-rate');
        this.avgProcessing = document.getElementById('avg-processing');
        this.successRate = document.getElementById('success-rate');
        
        // History elements
        this.historyTable = document.getElementById('history-tbody');
    }

    setupEventListeners() {
        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.uploadBtn.addEventListener('click', () => this.imageUpload.click());
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Analysis
        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        
        // Modal events
        document.getElementById('export-analysis').addEventListener('click', () => this.exportAnalysis());
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            });
            
            this.cameraFeed.srcObject = stream;
            this.camera = stream;
            
            this.startCameraBtn.disabled = true;
            this.captureBtn.disabled = false;
            
            this.showNotification('Câmera iniciada com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            this.showNotification('Erro ao acessar câmera. Verifique as permissões.', 'error');
        }
    }

    capturePhoto() {
        if (!this.camera) return;
        
        const video = this.cameraFeed;
        this.captureCanvas.width = video.videoWidth;
        this.captureCanvas.height = video.videoHeight;
        
        this.context.drawImage(video, 0, 0);
        
        // Convert to blob and display
        this.captureCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            this.previewImage.src = url;
            this.imagePreview.style.display = 'block';
            this.cameraFeed.style.display = 'none';
            
            this.analyzeBtn.disabled = false;
            this.showNotification('Foto capturada! Pronta para análise.', 'success');
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecione um arquivo de imagem válido.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.imagePreview.style.display = 'block';
            this.cameraFeed.style.display = 'none';
            
            this.analyzeBtn.disabled = false;
            this.showNotification('Imagem carregada! Pronta para análise.', 'success');
        };
        reader.readAsDataURL(file);
    }

    async analyzeImage() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.analysisLoading.style.display = 'block';
        this.analysisResults.style.display = 'none';
        
        try {
            // Get image data
            const imageData = this.getImageData();
            const analysisType = this.analysisType.value;
            const expectedCategory = this.expectedCategory.value;
            
            // Send to API
            const response = await fetch('/api/computer-vision/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData,
                    analysisType,
                    expectedCategory
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayAnalysisResults(result);
                this.addToHistory(result);
                this.showNotification('Análise concluída com sucesso!', 'success');
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Erro na análise:', error);
            this.showNotification('Erro durante a análise: ' + error.message, 'error');
        } finally {
            this.isAnalyzing = false;
            this.analysisLoading.style.display = 'none';
            this.analysisResults.style.display = 'block';
        }
    }

    getImageData() {
        // Convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = this.previewImage;
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    displayAnalysisResults(result) {
        const { analysis } = result;
        
        let html = `
            <div class="animate-fade-in">
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-brain me-2"></i>
                            Análise Geral
                        </h6>
                        <span class="confidence-badge ${this.getConfidenceClass(analysis.overallConfidence)}">
                            ${(analysis.overallConfidence * 100).toFixed(1)}% confiança
                        </span>
                    </div>
                    <p class="mb-2"><strong>Tempo de processamento:</strong> ${result.processingTime}</p>
                    <p class="mb-0"><strong>ID da análise:</strong> ${result.analysisId}</p>
                </div>
        `;

        // Classification results
        if (analysis.classification) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-tags me-2"></i>
                            Classificação
                        </h6>
                        <span class="confidence-badge ${this.getConfidenceClass(analysis.classification.confidence)}">
                            ${(analysis.classification.confidence * 100).toFixed(1)}%
                        </span>
                    </div>
                    <p class="mb-2"><strong>Categoria:</strong> ${analysis.classification.category}</p>
                    <p class="mb-2"><strong>Subcategoria:</strong> ${analysis.classification.subcategory}</p>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-primary" style="width: ${analysis.classification.confidence * 100}%"></div>
                    </div>
                    <small class="text-muted">Alternativas: ${analysis.classification.alternativeCategories.map(alt => alt.category).join(', ')}</small>
                </div>
            `;
        }

        // Quality assessment
        if (analysis.quality) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-star me-2"></i>
                            Avaliação de Qualidade
                        </h6>
                        <span class="confidence-badge ${this.getQualityClass(analysis.quality.score)}">
                            ${analysis.quality.score.toFixed(1)}/100
                        </span>
                    </div>
                    <p class="mb-2"><strong>Condição:</strong> ${analysis.quality.condition}</p>
                    <div class="progress mb-2">
                        <div class="progress-bar ${this.getQualityProgressClass(analysis.quality.score)}" 
                             style="width: ${analysis.quality.score}%"></div>
                    </div>
                    ${analysis.quality.defects.length > 0 ? 
                        `<p class="mb-0"><strong>Defeitos detectados:</strong> ${analysis.quality.defects.join(', ')}</p>` : 
                        '<p class="mb-0 text-success">Nenhum defeito detectado</p>'
                    }
                </div>
            `;
        }

        // Barcode detection
        if (analysis.barcode) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-barcode me-2"></i>
                            Código de Barras
                        </h6>
                        <span class="confidence-badge ${analysis.barcode.detected ? 'confidence-high' : 'confidence-low'}">
                            ${analysis.barcode.detected ? 'Detectado' : 'Não detectado'}
                        </span>
                    </div>
                    ${analysis.barcode.detected ? 
                        `<p class="mb-2"><strong>Código:</strong> <code>${analysis.barcode.code}</code></p>
                         <p class="mb-0"><strong>Formato:</strong> ${analysis.barcode.format}</p>` :
                        `<p class="mb-0 text-muted">${analysis.barcode.reason}</p>`
                    }
                </div>
            `;
        }

        // Dimensions
        if (analysis.dimensions) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-ruler me-2"></i>
                            Dimensões Estimadas
                        </h6>
                        <span class="confidence-badge ${this.getConfidenceClass(analysis.dimensions.confidence)}">
                            ${(analysis.dimensions.confidence * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div class="row">
                        <div class="col-4">
                            <strong>Largura:</strong><br>
                            ${analysis.dimensions.width.toFixed(1)} ${analysis.dimensions.unit}
                        </div>
                        <div class="col-4">
                            <strong>Altura:</strong><br>
                            ${analysis.dimensions.height.toFixed(1)} ${analysis.dimensions.unit}
                        </div>
                        <div class="col-4">
                            <strong>Profundidade:</strong><br>
                            ${analysis.dimensions.depth.toFixed(1)} ${analysis.dimensions.unit}
                        </div>
                    </div>
                    <small class="text-muted mt-2 d-block">${analysis.dimensions.estimationMethod}</small>
                </div>
            `;
        }

        // Features
        if (analysis.features) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-eye me-2"></i>
                            Características Visuais
                        </h6>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Cores dominantes:</strong></p>
                            <p class="mb-2">${analysis.features.dominantColors.join(', ')}</p>
                            <p class="mb-1"><strong>Textura:</strong> ${analysis.features.texture}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Forma:</strong> ${analysis.features.shape}</p>
                            <p class="mb-1"><strong>Material estimado:</strong> ${analysis.features.materialEstimate}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h6 class="result-title">
                            <i class="fas fa-lightbulb me-2"></i>
                            Recomendações
                        </h6>
                    </div>
                    <ul class="list-unstyled mb-0">
            `;
            
            analysis.recommendations.forEach(rec => {
                const iconClass = rec.priority === 'high' ? 'fas fa-exclamation-triangle text-danger' :
                                rec.priority === 'medium' ? 'fas fa-info-circle text-warning' :
                                'fas fa-check-circle text-success';
                
                html += `
                    <li class="mb-2">
                        <i class="${iconClass} me-2"></i>
                        ${rec.message}
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }

        html += '</div>';
        
        this.analysisResults.innerHTML = html;
    }

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'confidence-high';
        if (confidence >= 0.6) return 'confidence-medium';
        return 'confidence-low';
    }

    getQualityClass(score) {
        if (score >= 80) return 'confidence-high';
        if (score >= 60) return 'confidence-medium';
        return 'confidence-low';
    }

    getQualityProgressClass(score) {
        if (score >= 80) return 'bg-success';
        if (score >= 60) return 'bg-warning';
        return 'bg-danger';
    }

    addToHistory(result) {
        const historyItem = {
            id: result.analysisId,
            timestamp: result.timestamp,
            analysisType: this.analysisType.value,
            category: result.analysis.classification?.category || 'N/A',
            confidence: result.analysis.overallConfidence,
            processingTime: result.processingTime,
            status: 'completed'
        };
        
        this.analysisHistory.unshift(historyItem);
        this.updateHistoryTable();
    }

    updateHistoryTable() {
        const tbody = this.historyTable;
        tbody.innerHTML = '';
        
        this.analysisHistory.slice(0, 10).forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(item.timestamp).toLocaleString('pt-BR')}</td>
                <td><span class="badge bg-primary">${this.getAnalysisTypeLabel(item.analysisType)}</span></td>
                <td>${item.category}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${this.getConfidenceClass(item.confidence) === 'confidence-high' ? 'bg-success' : 
                                                   this.getConfidenceClass(item.confidence) === 'confidence-medium' ? 'bg-warning' : 'bg-danger'}" 
                             style="width: ${item.confidence * 100}%">
                            ${(item.confidence * 100).toFixed(1)}%
                        </div>
                    </div>
                </td>
                <td>${item.processingTime}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="computerVision.viewAnalysisDetails('${item.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getAnalysisTypeLabel(type) {
        const labels = {
            'complete': 'Completa',
            'barcode': 'Código de Barras',
            'quality': 'Qualidade',
            'dimensions': 'Dimensões'
        };
        return labels[type] || type;
    }

    async loadPerformanceStats() {
        try {
            const response = await fetch('/api/computer-vision/performance-stats');
            const data = await response.json();
            
            if (data.success) {
                this.updatePerformanceStats(data.stats);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    updatePerformanceStats(stats) {
        this.totalAnalyses.textContent = stats.totalAnalyses.toLocaleString();
        this.accuracyRate.textContent = (stats.successRate * 100).toFixed(1) + '%';
        this.avgProcessing.textContent = stats.averageProcessingTime;
        this.successRate.textContent = (stats.successRate * 100).toFixed(1) + '%';
    }

    async loadAnalysisHistory() {
        try {
            const response = await fetch('/api/computer-vision/history?limit=10');
            const data = await response.json();
            
            if (data.success) {
                this.analysisHistory = data.history;
                this.updateHistoryTable();
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    initCharts() {
        this.initCategoryChart();
        this.initDailyChart();
    }

    initCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Outros'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#64748b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initDailyChart() {
        const ctx = document.getElementById('daily-chart').getContext('2d');
        const days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        });
        
        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Análises',
                    data: [45, 52, 38, 67, 73, 89, 95],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    startPerformanceUpdates() {
        setInterval(() => {
            this.loadPerformanceStats();
        }, 30000); // Update every 30 seconds
    }

    viewAnalysisDetails(analysisId) {
        // Implementation for viewing detailed analysis
        console.log('Viewing details for analysis:', analysisId);
    }

    exportAnalysis() {
        // Implementation for exporting analysis results
        console.log('Exporting analysis results');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application
let computerVision;
document.addEventListener('DOMContentLoaded', () => {
    computerVision = new ComputerVisionApp();
});