/**
 * PerformanceMonitor - Monitoramento e otimização de performance
 * Coleta métricas, identifica gargalos e sugere otimizações
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            fcp: 1800, // First Contentful Paint
            lcp: 2500, // Largest Contentful Paint
            fid: 100,  // First Input Delay
            cls: 0.1,  // Cumulative Layout Shift
            ttfb: 600  // Time to First Byte
        };
        
        this.init();
    }

    init() {
        this.setupPerformanceObservers();
        this.monitorResourceLoading();
        this.trackUserInteractions();
        this.setupMemoryMonitoring();
        this.startPeriodicReporting();
    }

    /**
     * Configura observadores de performance
     */
    setupPerformanceObservers() {
        // Observer para Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            this.createObserver('largest-contentful-paint', (entries) => {
                const lcp = entries[entries.length - 1];
                this.recordMetric('lcp', lcp.startTime);
            });

            // First Input Delay
            this.createObserver('first-input', (entries) => {
                const fid = entries[0];
                this.recordMetric('fid', fid.processingStart - fid.startTime);
            });

            // Cumulative Layout Shift
            this.createObserver('layout-shift', (entries) => {
                let cls = 0;
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                });
                this.recordMetric('cls', cls);
            });

            // Long Tasks
            this.createObserver('longtask', (entries) => {
                entries.forEach(entry => {
                    this.recordMetric('longtask', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    });
                });
            });

            // Navigation Timing
            this.createObserver('navigation', (entries) => {
                const nav = entries[0];
                this.recordMetric('ttfb', nav.responseStart - nav.requestStart);
                this.recordMetric('domContentLoaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
                this.recordMetric('loadComplete', nav.loadEventEnd - nav.loadEventStart);
            });

            // Resource Timing
            this.createObserver('resource', (entries) => {
                entries.forEach(entry => {
                    this.analyzeResourceTiming(entry);
                });
            });
        }

        // First Contentful Paint (fallback)
        this.measureFCP();
    }

    /**
     * Cria um observer de performance
     */
    createObserver(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            
            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            console.warn(`Não foi possível criar observer para ${type}:`, error);
        }
    }

    /**
     * Mede First Contentful Paint
     */
    measureFCP() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
            this.recordMetric('fcp', fcpEntry.startTime);
        }
    }

    /**
     * Monitora carregamento de recursos
     */
    monitorResourceLoading() {
        const resourceTypes = ['script', 'stylesheet', 'image', 'font'];
        
        resourceTypes.forEach(type => {
            this.trackResourceType(type);
        });
    }

    /**
     * Rastreia tipo específico de recurso
     */
    trackResourceType(type) {
        const resources = performance.getEntriesByType('resource')
            .filter(entry => entry.initiatorType === type);
        
        resources.forEach(resource => {
            this.analyzeResourceTiming(resource);
        });
    }

    /**
     * Analisa timing de recursos
     */
    analyzeResourceTiming(entry) {
        const timing = {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || entry.encodedBodySize,
            duration: entry.responseEnd - entry.requestStart,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
            ttfb: entry.responseStart - entry.requestStart,
            download: entry.responseEnd - entry.responseStart,
            cached: entry.transferSize === 0 && entry.encodedBodySize > 0
        };

        this.recordMetric('resource', timing);
        this.checkResourceThresholds(timing);
    }

    /**
     * Verifica limites de recursos
     */
    checkResourceThresholds(timing) {
        const warnings = [];

        if (timing.duration > 3000) {
            warnings.push(`Recurso lento: ${timing.name} (${timing.duration}ms)`);
        }

        if (timing.size > 1024 * 1024) { // 1MB
            warnings.push(`Recurso grande: ${timing.name} (${(timing.size / 1024 / 1024).toFixed(2)}MB)`);
        }

        if (timing.ttfb > 1000) {
            warnings.push(`TTFB alto: ${timing.name} (${timing.ttfb}ms)`);
        }

        if (warnings.length > 0) {
            this.recordMetric('warning', warnings);
        }
    }

    /**
     * Rastreia interações do usuário
     */
    trackUserInteractions() {
        const events = ['click', 'scroll', 'keydown', 'touchstart'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.measureInteractionTiming(eventType, event);
            }, { passive: true });
        });
    }

    /**
     * Mede timing de interações
     */
    measureInteractionTiming(type, event) {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordMetric('interaction', {
                type,
                duration,
                target: event.target.tagName,
                timestamp: startTime
            });
        });
    }

    /**
     * Monitora uso de memória
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.recordMetric('memory', {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                });
            }, 30000); // A cada 30 segundos
        }
    }

    /**
     * Registra métrica
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push({
            value,
            timestamp: Date.now()
        });

        // Limita histórico
        const history = this.metrics.get(name);
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        this.checkThresholds(name, value);
    }

    /**
     * Verifica limites de performance
     */
    checkThresholds(name, value) {
        const threshold = this.thresholds[name];
        if (!threshold) return;

        const numericValue = typeof value === 'object' ? value.duration || value.value : value;
        
        if (numericValue > threshold) {
            this.reportPerformanceIssue(name, numericValue, threshold);
        }
    }

    /**
     * Reporta problema de performance
     */
    reportPerformanceIssue(metric, value, threshold) {
        const issue = {
            metric,
            value,
            threshold,
            severity: this.calculateSeverity(value, threshold),
            timestamp: Date.now(),
            suggestions: this.getSuggestions(metric, value)
        };

        this.recordMetric('issue', issue);
        
        if (window.NotificationService) {
            window.NotificationService.show(
                `Performance: ${metric} acima do limite (${value}ms > ${threshold}ms)`,
                'warning'
            );
        }
    }

    /**
     * Calcula severidade do problema
     */
    calculateSeverity(value, threshold) {
        const ratio = value / threshold;
        
        if (ratio > 3) return 'critical';
        if (ratio > 2) return 'high';
        if (ratio > 1.5) return 'medium';
        return 'low';
    }

    /**
     * Obtém sugestões de otimização
     */
    getSuggestions(metric, value) {
        const suggestions = {
            fcp: [
                'Otimize recursos críticos',
                'Use preload para recursos importantes',
                'Minimize CSS e JS críticos'
            ],
            lcp: [
                'Otimize imagens grandes',
                'Use lazy loading',
                'Melhore tempo de resposta do servidor'
            ],
            fid: [
                'Reduza JavaScript de terceiros',
                'Use web workers para tarefas pesadas',
                'Implemente code splitting'
            ],
            cls: [
                'Defina dimensões para imagens',
                'Reserve espaço para anúncios',
                'Use transform em vez de propriedades de layout'
            ],
            longtask: [
                'Divida tarefas longas',
                'Use requestIdleCallback',
                'Implemente debouncing'
            ]
        };

        return suggestions[metric] || ['Analise o código relacionado'];
    }

    /**
     * Inicia relatórios periódicos
     */
    startPeriodicReporting() {
        setInterval(() => {
            this.generateReport();
        }, 60000); // A cada minuto
    }

    /**
     * Gera relatório de performance
     */
    generateReport() {
        const report = {
            timestamp: Date.now(),
            coreWebVitals: this.getCoreWebVitals(),
            resourceSummary: this.getResourceSummary(),
            interactionSummary: this.getInteractionSummary(),
            memorySummary: this.getMemorySummary(),
            issues: this.getRecentIssues(),
            recommendations: this.getRecommendations()
        };

        this.recordMetric('report', report);
        return report;
    }

    /**
     * Obtém Core Web Vitals
     */
    getCoreWebVitals() {
        return {
            fcp: this.getLatestMetric('fcp'),
            lcp: this.getLatestMetric('lcp'),
            fid: this.getLatestMetric('fid'),
            cls: this.getLatestMetric('cls'),
            ttfb: this.getLatestMetric('ttfb')
        };
    }

    /**
     * Obtém resumo de recursos
     */
    getResourceSummary() {
        const resources = this.metrics.get('resource') || [];
        const recent = resources.slice(-50);
        
        return {
            total: recent.length,
            totalSize: recent.reduce((sum, r) => sum + (r.value.size || 0), 0),
            averageDuration: recent.reduce((sum, r) => sum + r.value.duration, 0) / recent.length,
            cached: recent.filter(r => r.value.cached).length
        };
    }

    /**
     * Obtém resumo de interações
     */
    getInteractionSummary() {
        const interactions = this.metrics.get('interaction') || [];
        const recent = interactions.slice(-100);
        
        return {
            total: recent.length,
            averageDelay: recent.reduce((sum, i) => sum + i.value.duration, 0) / recent.length,
            slowInteractions: recent.filter(i => i.value.duration > 100).length
        };
    }

    /**
     * Obtém resumo de memória
     */
    getMemorySummary() {
        const memory = this.getLatestMetric('memory');
        return memory ? {
            used: (memory.used / 1024 / 1024).toFixed(2) + 'MB',
            usage: memory.usage.toFixed(1) + '%',
            available: ((memory.limit - memory.used) / 1024 / 1024).toFixed(2) + 'MB'
        } : null;
    }

    /**
     * Obtém problemas recentes
     */
    getRecentIssues() {
        const issues = this.metrics.get('issue') || [];
        return issues.slice(-10);
    }

    /**
     * Obtém recomendações
     */
    getRecommendations() {
        const recommendations = [];
        const cwv = this.getCoreWebVitals();
        
        Object.entries(cwv).forEach(([metric, value]) => {
            if (value && value > this.thresholds[metric]) {
                recommendations.push(...this.getSuggestions(metric, value));
            }
        });

        return [...new Set(recommendations)];
    }

    /**
     * Obtém métrica mais recente
     */
    getLatestMetric(name) {
        const metrics = this.metrics.get(name);
        return metrics && metrics.length > 0 ? metrics[metrics.length - 1].value : null;
    }

    /**
     * Obtém todas as métricas
     */
    getAllMetrics() {
        const result = {};
        this.metrics.forEach((values, key) => {
            result[key] = values;
        });
        return result;
    }

    /**
     * Limpa métricas antigas
     */
    cleanup() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
        
        this.metrics.forEach((values, key) => {
            const filtered = values.filter(item => item.timestamp > cutoff);
            this.metrics.set(key, filtered);
        });
    }

    /**
     * Para todos os observadores
     */
    disconnect() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
    }
}

// Instância global
window.PerformanceMonitor = new PerformanceMonitor();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}