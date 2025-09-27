// Dashboard JavaScript

let salesChart = null;
let stockChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard carregado');
    
    // Initialize dashboard functionality
    initializeDashboard();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up auto-refresh
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    
    // Set up responsive chart handling
    setupResponsiveCharts();
});



function setupResponsiveCharts() {
    // Handle window resize for mobile devices
    window.addEventListener('resize', function() {
        if (salesChart) {
            salesChart.resize();
        }
        if (stockChart) {
            stockChart.resize();
        }
    });
    
    // Handle orientation change for mobile devices
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            if (salesChart) {
                salesChart.resize();
            }
            if (stockChart) {
                stockChart.resize();
            }
        }, 100);
    });
    
    // Force chart resize on mobile after DOM is fully loaded
    setTimeout(function() {
        if (window.innerWidth <= 768) {
            if (salesChart) {
                salesChart.resize();
            }
            if (stockChart) {
                stockChart.resize();
            }
        }
    }, 500);
}

// Função para detectar dispositivos móveis
function detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    
    // Detecta por user agent
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Detecta por largura da tela
    const isMobileScreen = screenWidth <= 768;
    
    // Detecta por touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const isMobile = isMobileUA || (isMobileScreen && isTouchDevice);
    
    console.log('Detecção de dispositivo móvel:', {
        userAgent: userAgent,
        screenWidth: screenWidth,
        isMobileUA: isMobileUA,
        isMobileScreen: isMobileScreen,
        isTouchDevice: isTouchDevice,
        isMobile: isMobile
    });
    
    return isMobile;
}

// Função para inicializar gráficos em dispositivos móveis
function initializeMobileCharts() {
    console.log('Inicializando gráficos para dispositivos móveis...');
    
    // Testa se Chart.js está disponível
    testChartJSAvailability().then(chartJSAvailable => {
        if (chartJSAvailable) {
            console.log('Chart.js disponível - usando gráficos padrão');
            initializeCharts();
        } else {
            console.log('Chart.js não disponível - usando fallback mobile');
            createMobileFallback();
        }
    }).catch(error => {
        console.error('Erro ao testar Chart.js:', error);
        console.log('Usando fallback mobile devido ao erro');
        createMobileFallback();
    });
}

// Função para testar disponibilidade do Chart.js
function testChartJSAvailability() {
    return new Promise((resolve) => {
        console.log('Testando disponibilidade do Chart.js...');
        
        // Verifica se Chart.js já está carregado
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js já está disponível');
            resolve(true);
            return;
        }
        
        // Tenta carregar Chart.js manualmente
        console.log('Tentando carregar Chart.js manualmente...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('Chart.js carregado com sucesso');
            resolve(true);
        };
        script.onerror = () => {
            console.log('Falha ao carregar Chart.js');
            resolve(false);
        };
        
        // Timeout de 5 segundos
        setTimeout(() => {
            if (typeof Chart === 'undefined') {
                console.log('Timeout ao carregar Chart.js');
                resolve(false);
            }
        }, 5000);
        
        document.head.appendChild(script);
    });
}

// Função para criar fallback mobile quando Chart.js não está disponível
function createMobileFallback() {
    console.log('Criando fallback mobile para gráficos...');
    
    // Encontra todos os canvas de gráficos
    const chartCanvases = document.querySelectorAll('canvas[id*="Chart"]');
    
    chartCanvases.forEach(canvas => {
        console.log('Criando gráfico mobile para:', canvas.id);
        drawMobileChart(canvas);
    });
    
    // Se não encontrou canvas, cria gráficos padrão
    if (chartCanvases.length === 0) {
        console.log('Nenhum canvas encontrado, criando gráficos padrão...');
        
        // Cria gráficos para os containers principais
        const containers = [
            'salesChart',
            'inventoryChart', 
            'ordersChart',
            'suppliersChart'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const canvas = document.createElement('canvas');
                canvas.id = containerId + 'Canvas';
                canvas.width = 300;
                canvas.height = 200;
                container.appendChild(canvas);
                drawMobileChart(canvas);
            }
        });
    }
}

// Função para desenhar gráficos customizados em dispositivos móveis
function drawMobileChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Ajusta dimensões do canvas baseado no container pai
    const container = canvas.parentElement;
    if (container) {
        const containerWidth = container.offsetWidth || 300;
        const containerHeight = container.offsetHeight || 200;
        canvas.width = Math.min(containerWidth - 20, 350);
        canvas.height = Math.min(containerHeight - 20, 250);
    }
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fundo com gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Bordas arredondadas
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 8);
    ctx.stroke();
    
    // Título dinâmico baseado no ID do canvas
    let title = 'Gráfico Mobile';
    let subtitle = 'Dados em tempo real';
    
    if (canvas.id.includes('sales') || canvas.id.includes('Sales')) {
        title = 'Vendas';
        subtitle = 'Últimos 6 meses';
    } else if (canvas.id.includes('inventory') || canvas.id.includes('Inventory')) {
        title = 'Estoque';
        subtitle = 'Níveis atuais';
    } else if (canvas.id.includes('orders') || canvas.id.includes('Orders')) {
        title = 'Pedidos';
        subtitle = 'Status atual';
    } else if (canvas.id.includes('suppliers') || canvas.id.includes('Suppliers')) {
        title = 'Fornecedores';
        subtitle = 'Desempenho';
    }
    
    // Título
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 25);
    
    // Subtítulo
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.fillText(subtitle, width / 2, 45);
    
    // Dados simulados mais realistas
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const data = [
        Math.floor(Math.random() * 50) + 30,
        Math.floor(Math.random() * 50) + 35,
        Math.floor(Math.random() * 50) + 40,
        Math.floor(Math.random() * 50) + 45,
        Math.floor(Math.random() * 50) + 50,
        Math.floor(Math.random() * 50) + 55
    ];
    
    // Área do gráfico
    const chartX = 50;
    const chartY = 60;
    const chartWidth = width - 100;
    const chartHeight = height - 120;
    
    // Grid de fundo
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // Linhas horizontais
    for (let i = 0; i <= 5; i++) {
        const y = chartY + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartWidth, y);
        ctx.stroke();
    }
    
    // Linhas verticais
    for (let i = 0; i <= 5; i++) {
        const x = chartX + (chartWidth / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, chartY);
        ctx.lineTo(x, chartY + chartHeight);
        ctx.stroke();
    }
    
    // Eixos principais
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    
    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.stroke();
    
    // Eixo X
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();
    
    // Calcula pontos do gráfico
    const maxValue = Math.max(...data);
    const points = data.map((value, index) => ({
        x: chartX + (chartWidth / (data.length - 1)) * index,
        y: chartY + chartHeight - (value / maxValue) * chartHeight
    }));
    
    // Área preenchida do gráfico
    ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartY + chartHeight);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, chartY + chartHeight);
    ctx.closePath();
    ctx.fill();
    
    // Linha do gráfico
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
    
    // Pontos de dados
    points.forEach(point => {
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Borda branca nos pontos
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Labels dos meses
    ctx.fillStyle = '#495057';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    months.forEach((month, index) => {
        const x = chartX + (chartWidth / (months.length - 1)) * index;
        ctx.fillText(month, x, chartY + chartHeight + 15);
    });
    
    // Valores no eixo Y
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * (5 - i));
        const y = chartY + (chartHeight / 5) * i + 5;
        ctx.fillText(value.toString(), chartX - 10, y);
    }
    
    // Indicador de status
    ctx.fillStyle = '#28a745';
    ctx.beginPath();
    ctx.arc(width - 20, 20, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#495057';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Online', width - 30, 25);
}

function initializeDashboard() {
    console.log('Inicializando dashboard...');
    
    // Detecta se é dispositivo móvel
    const isMobile = detectMobileDevice();
    
    if (isMobile) {
        console.log('Dispositivo móvel detectado - inicializando gráficos mobile');
        initializeMobileCharts();
    } else {
        console.log('Dispositivo desktop detectado - inicializando gráficos padrão');
        initializeCharts();
    }
    
    // Initialize other dashboard components
    checkSystemHealth();
    loadOrdersData();
}









function loadDashboardData() {
    console.log('Carregando dados do dashboard...');
    
    // Load real data from API
    Promise.all([
        loadKPIData(),
        loadChartData(),
        loadAlertData(),
        loadOrdersData()
    ]).then(() => {
        console.log('Dados do dashboard carregados com sucesso');
    }).catch(error => {
        console.error('Erro ao carregar dados do dashboard:', {
            message: error.message,
            stack: error.stack,
            component: 'dashboard-initialization'
        });
        Toast.show('Erro ao carregar dados do dashboard', 'error');
    });
}

async function loadKPIData() {
    try {
        // Simulate API call - replace with real API endpoints
        const mockData = {
            products: { total: 156, change: 12.5, trend: 'up' },
            suppliers: { total: 23, change: 8.3, trend: 'up' },
            quotes: { total: 45, change: -2.1, trend: 'down' },
            orders: { total: 89, change: 15.7, trend: 'up' },
            lowStock: 8,
            outOfStock: 3,
            totalValue: 125430.50,
            avgOrderValue: 1408.20
        };

        // Update KPI cards
        updateKPICard('total-products', mockData.products.total, mockData.products.change, mockData.products.trend);
        updateKPICard('total-suppliers', mockData.suppliers.total, mockData.suppliers.change, mockData.suppliers.trend);
        updateKPICard('total-quotes', mockData.quotes.total, mockData.quotes.change, mockData.quotes.trend);
        updateKPICard('total-orders', mockData.orders.total, mockData.orders.change, mockData.orders.trend);

        // Update additional metrics
        document.getElementById('low-stock-count').textContent = mockData.lowStock;
        document.getElementById('out-of-stock-count').textContent = mockData.outOfStock;
        document.getElementById('total-value').textContent = `R$ ${mockData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('avg-order-value').textContent = `R$ ${mockData.avgOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Load operational metrics
        loadOperationalMetrics();

    } catch (error) {
        console.error('Erro ao carregar KPIs', { 
            error: error.message, 
            stack: error.stack,
            component: 'dashboard-kpi'
        });
        // Show error state
        document.getElementById('kpi-cards').innerHTML = '<div class="alert alert-danger">Erro ao carregar KPIs</div>';
    }
}

// Função de fallback para dispositivos móveis
function createFallbackChart(canvasId, chartTitle) {
    console.log(`Criando fallback para ${chartTitle} no elemento ${canvasId}`);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas ${canvasId} não encontrado para fallback`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Configurar estilo
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Desenhar borda
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    
    // Desenhar texto
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `Gráfico ${chartTitle}`;
    const subText = 'Carregando...';
    
    ctx.fillText(text, width / 2, height / 2 - 10);
    ctx.font = '12px Arial';
    ctx.fillText(subText, width / 2, height / 2 + 15);
    
    // Tentar recriar o gráfico após 3 segundos
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            console.log(`Tentando recriar gráfico ${chartTitle}...`);
            initializeCharts();
        }
    }, 3000);
}

function updateKPICard(elementId, value, change, trend) {
    const valueElement = document.getElementById(elementId);
    const changeElement = document.getElementById(elementId.replace('total-', '') + '-change');
    const trendElement = document.getElementById(elementId.replace('total-', '') + '-trend');

    if (valueElement) valueElement.textContent = value;
    if (changeElement) changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    if (trendElement) {
        trendElement.textContent = trend === 'up' ? '⬆️' : '⬇️';
    }
}

function loadOperationalMetrics() {
    try {
        // Mock data for operational metrics
        const operationalData = {
            pendingDeliveries: Math.floor(Math.random() * 20) + 5,
            completedOrders: Math.floor(Math.random() * 50) + 30,
            processingOrders: Math.floor(Math.random() * 15) + 3,
            topProducts: Math.floor(Math.random() * 25) + 10
        };

        // Update operational metrics
        const pendingElement = document.getElementById('pending-deliveries');
        const completedElement = document.getElementById('completed-orders');
        const processingElement = document.getElementById('processing-orders');
        const topProductsElement = document.getElementById('top-products');

        if (pendingElement) pendingElement.textContent = operationalData.pendingDeliveries;
        if (completedElement) completedElement.textContent = operationalData.completedOrders;
        if (processingElement) processingElement.textContent = operationalData.processingOrders;
        if (topProductsElement) topProductsElement.textContent = operationalData.topProducts;

    } catch (error) {
        console.error('Erro ao carregar métricas operacionais', {
            error: error.message,
            stack: error.stack,
            component: 'dashboard-operational-metrics'
        });
        // Show error state
        document.getElementById('operational-metrics').innerHTML = '<div class="alert alert-danger">Erro ao carregar métricas</div>';
    }
}

function initializeCharts() {
    console.log('=== CHART DEBUG ===');
    console.log('Chart.js disponível:', typeof Chart !== 'undefined');
    console.log('Window width:', window.innerWidth);
    console.log('User agent:', navigator.userAgent);
    
    // Verificar se Chart.js está carregado
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está carregado! Tentando novamente em 2 segundos...');
        setTimeout(initializeCharts, 2000);
        return;
    }
    
    // Initialize Sales Chart
    const salesCtx = document.getElementById('salesChart');
    console.log('Sales canvas encontrado:', !!salesCtx);
    if (salesCtx) {
        // Garantir dimensões mínimas para o canvas
        if (salesCtx.clientWidth === 0 || salesCtx.clientHeight === 0) {
            console.log('Canvas sem dimensões, definindo dimensões padrão...');
            salesCtx.style.width = '100%';
            salesCtx.style.height = '300px';
            salesCtx.width = salesCtx.offsetWidth || 400;
            salesCtx.height = salesCtx.offsetHeight || 300;
        }
        
        console.log('Sales canvas dimensions:', salesCtx.offsetWidth, 'x', salesCtx.offsetHeight);
        console.log('Sales canvas style:', salesCtx.style.cssText);
        
        try {
            // Create gradient backgrounds for ultra-premium look
            const salesGradient = salesCtx.createLinearGradient(0, 0, 0, 400);
            salesGradient.addColorStop(0, 'rgba(103, 126, 234, 0.3)');
            salesGradient.addColorStop(0.5, 'rgba(103, 126, 234, 0.1)');
            salesGradient.addColorStop(1, 'rgba(103, 126, 234, 0.02)');
            
            const productsGradient = salesCtx.createLinearGradient(0, 0, 0, 400);
            productsGradient.addColorStop(0, 'rgba(118, 75, 162, 0.3)');
            productsGradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.1)');
            productsGradient.addColorStop(1, 'rgba(118, 75, 162, 0.02)');
            
            salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Vendas (R$)',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: 'rgba(103, 126, 234, 1)',
                    backgroundColor: salesGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(103, 126, 234, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: 'rgba(103, 126, 234, 1)',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    yAxisID: 'y'
                }, {
                    label: 'Produtos Vendidos',
                    data: [65, 89, 72, 105, 98, 125],
                    borderColor: 'rgba(118, 75, 162, 1)',
                    backgroundColor: productsGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(118, 75, 162, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: 'rgba(118, 75, 162, 1)',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: window.innerWidth > 768,
                            text: 'Mês'
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: window.innerWidth > 768,
                            text: 'Vendas (R$)'
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: window.innerWidth > 768,
                        position: 'right',
                        title: {
                            display: window.innerWidth > 768,
                            text: 'Quantidade'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: window.innerWidth <= 768 ? 'bottom' : 'top',
                        labels: {
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            },
                            padding: window.innerWidth <= 768 ? 10 : 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
            });
            console.log('Sales chart criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar sales chart:', error);
            createFallbackChart('salesChart', 'Vendas');
        }
    } else {
        console.error('Elemento salesChart não encontrado no DOM');
        createFallbackChart('salesChart', 'Vendas');
    }

    // Initialize Stock Chart
    const stockCtx = document.getElementById('stockChart');
    console.log('Stock canvas encontrado:', !!stockCtx);
    if (stockCtx) {
        // Garantir dimensões mínimas para o canvas
        if (stockCtx.clientWidth === 0 || stockCtx.clientHeight === 0) {
            console.log('Stock canvas sem dimensões, definindo dimensões padrão...');
            stockCtx.style.width = '100%';
            stockCtx.style.height = '300px';
            stockCtx.width = stockCtx.offsetWidth || 400;
            stockCtx.height = stockCtx.offsetHeight || 300;
        }
        
        console.log('Stock canvas dimensions:', stockCtx.offsetWidth, 'x', stockCtx.offsetHeight);
        console.log('Stock canvas style:', stockCtx.style.cssText);
        
        try {
            stockChart = new Chart(stockCtx, {
            type: 'doughnut',
            data: {
                labels: ['Eletrônicos', 'Escritório', 'Limpeza', 'Segurança', 'Outros'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        'rgba(103, 126, 234, 0.8)',
                        'rgba(17, 153, 142, 0.8)',
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(252, 70, 107, 0.8)',
                        'rgba(118, 75, 162, 0.8)'
                    ],
                    borderWidth: 3,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    hoverBackgroundColor: [
                        'rgba(103, 126, 234, 1)',
                        'rgba(17, 153, 142, 1)',
                        'rgba(240, 147, 251, 1)',
                        'rgba(252, 70, 107, 1)',
                        'rgba(118, 75, 162, 1)'
                    ],
                    hoverBorderColor: 'rgba(255, 255, 255, 1)',
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: window.innerWidth <= 768 ? 10 : 20,
                            usePointStyle: true,
                            font: {
                                size: window.innerWidth <= 768 ? 10 : 12
                            }
                        }
                    },
                    tooltip: {
                        titleFont: {
                            size: window.innerWidth <= 768 ? 12 : 14
                        },
                        bodyFont: {
                            size: window.innerWidth <= 768 ? 11 : 13
                        },
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
            });
            console.log('Stock chart criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar stock chart:', error);
            createFallbackChart('stockChart', 'Estoque');
        }
    } else {
        console.error('Elemento stockChart não encontrado no DOM');
        createFallbackChart('stockChart', 'Estoque');
    }
}

async function loadChartData() {
    try {
        // Update charts with new data
        if (salesChart) {
            // Simulate new data
            const newSalesData = [15000, 22000, 18000, 28000, 25000, 35000];
            const newProductData = [78, 95, 82, 115, 108, 140];
            
            salesChart.data.datasets[0].data = newSalesData;
            salesChart.data.datasets[1].data = newProductData;
            salesChart.update();
        }

        if (stockChart) {
            // Simulate new stock data
            const newStockData = [40, 22, 18, 12, 8];
            stockChart.data.datasets[0].data = newStockData;
            stockChart.update();
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos', {
            error: error.message,
            stack: error.stack,
            component: 'dashboard-charts'
        });
    }
}

async function loadAlertData() {
    try {
        // Simulate loading alert data
        console.log('Carregando alertas...');
    } catch (error) {
        console.error('Erro ao carregar alertas', {
            error: error.message,
            stack: error.stack,
            component: 'dashboard-alerts'
        });
    }
}

// Quick action functions
function quickAddProduct() {
    console.log('Adição rápida de produto');
    window.location.href = 'products.html';
}

function quickAddSupplier() {
    console.log('Adição rápida de fornecedor');
    window.location.href = 'suppliers.html';
}

function quickCreateOrder() {
    console.log('Criação rápida de pedido');
    window.location.href = 'orders.html';
}

function viewReports() {
    console.log('Visualizar relatórios');
    window.location.href = 'reports.html';
}

// System health check function
async function checkSystemHealth() {
    console.log('Verificando status do sistema...');
    
    try {
        // Update status indicators to checking state
        updateSystemStatus('checking');
        
        // Check API health
        const apiHealthy = await checkApiHealth();
        
        // Check database health
        const dbHealthy = await checkDatabaseHealth();
        
        // Update status indicators
        updateSystemStatus('completed', apiHealthy, dbHealthy);
        
        // Update last update time
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString('pt-BR');
        
        // Show notification using Toast from global-functions.js
        if (apiHealthy && dbHealthy) {
            Toast.show('Sistema funcionando normalmente', 'success');
        } else {
            Toast.show('Sistema com problemas detectados', 'warning');
        }
        
    } catch (error) {
        console.error('Erro ao verificar status do sistema', {
            error: error.message,
            stack: error.stack,
            component: 'system-health'
        });
        updateSystemStatus('error');
        Toast.show('Erro ao verificar status do sistema', 'error');
    }
}

async function checkApiHealth() {
    try {
        const response = await fetch('/api/health', {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        console.error('API health check failed', {
            error: error.message,
            stack: error.stack,
            component: 'api-health-check'
        });
        return false;
    }
}

async function checkDatabaseHealth() {
    try {
        const response = await fetch('/api/health/database', {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        console.error('Database health check failed', {
            error: error.message,
            stack: error.stack,
            component: 'database-health-check'
        });
        return false;
    }
}

function updateSystemStatus(state, apiHealthy = null, dbHealthy = null) {
    const apiStatus = document.getElementById('api-status');
    const dbStatus = document.getElementById('db-status');
    
    if (state === 'checking') {
        apiStatus.className = 'badge bg-warning';
        apiStatus.textContent = 'Verificando...';
        dbStatus.className = 'badge bg-warning';
        dbStatus.textContent = 'Verificando...';
    } else if (state === 'completed') {
        // Update API status
        apiStatus.className = apiHealthy ? 'badge bg-success' : 'badge bg-danger';
        apiStatus.textContent = apiHealthy ? 'Online' : 'Offline';
        
        // Update DB status
        dbStatus.className = dbHealthy ? 'badge bg-success' : 'badge bg-danger';
        dbStatus.textContent = dbHealthy ? 'Conectado' : 'Desconectado';
    } else if (state === 'error') {
        apiStatus.className = 'badge bg-secondary';
        apiStatus.textContent = 'Erro';
        dbStatus.className = 'badge bg-secondary';
        dbStatus.textContent = 'Erro';
    }
}

// Funções de navegação para os botões do menu
function navigateToProducts() {
    window.location.href = 'products.html';
}

function navigateToSuppliers() {
    window.location.href = 'suppliers.html';
}

function navigateToQuotes() {
    window.location.href = 'quotes.html';
}

function navigateToOrders() {
    window.location.href = 'orders.html';
}

function navigateToReports() {
    window.location.href = 'reports.html';
}

// Product modal functions
function openNewProductModal() {
    // Reset form
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Novo Produto';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function generateProductCode() {
    const category = document.getElementById('productCategory').value;
    let prefix = 'PROD';
    
    if (category) {
        prefix = category.substring(0, 3).toUpperCase();
    }
    
    const timestamp = Date.now().toString().slice(-6);
    const code = `${prefix}${timestamp}`;
    document.getElementById('productCode').value = code;
}

function generateCodeFromCategory() {
    const category = document.getElementById('productCategory').value;
    const codeField = document.getElementById('productCode');
    
    if (category && !codeField.value) {
        generateProductCode();
    }
}

function validatePrice(input) {
    const value = parseFloat(input.value);
    if (value < 0) {
        input.value = 0;
        showToast('O preço não pode ser negativo', 'warning');
    }
}

async function saveProduct() {
    try {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const productData = {
            code: formData.get('code'),
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            minStock: parseInt(formData.get('minStock')),
            supplier: formData.get('supplier'),
            description: formData.get('description')
        };

        const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
            
            // Mostrar toast de sucesso
            showToast('Produto adicionado com sucesso!', 'success');
            
            // Recarregar dados do dashboard
            loadDashboardData();
            
            // Limpar formulário
            form.reset();
        } else {
            const error = await response.json();
            showToast(error.message || 'Erro ao adicionar produto', 'error');
        }
    } catch (error) {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'dashboard-product-save'
        });
        showToast('Erro ao conectar com o servidor', 'error');
    }
}

// Função para abrir modal de fornecedor
function openNewSupplierModal() {
    // Limpar formulário
    const form = document.getElementById('supplierForm');
    if (form) {
        form.reset();
    }
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('supplierModal'));
    modal.show();
}

// Variável global para armazenar o período atual
let currentPeriod = 7;

// Função para filtrar pedidos por período
function filterOrdersByPeriod(days) {
    currentPeriod = days;
    
    // Atualizar botões ativos
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${days}d`).classList.add('active');
    
    // Recarregar dados
    loadOrdersData();
}

// Função para mostrar modal de data personalizada
function showCustomDateModal() {
    const modal = new bootstrap.Modal(document.getElementById('customDateModal'));
    
    // Definir datas padrão (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    modal.show();
}

// Função para aplicar filtro de data personalizada
function applyCustomDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('Por favor, selecione ambas as datas', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('A data inicial deve ser anterior à data final', 'error');
        return;
    }
    
    // Atualizar botões ativos
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('filter-custom').classList.add('active');
    
    // Definir período personalizado
    currentPeriod = 'custom';
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('customDateModal'));
    modal.hide();
    
    // Recarregar dados
    loadOrdersData(startDate, endDate);
}

// Função para carregar dados dos pedidos
async function loadOrdersData(startDate = null, endDate = null) {
    try {
        const response = await fetch('/api/pedidos');
        
        if (response.ok) {
            const orders = await response.json();
            console.log('Pedidos carregados:', orders);
            
            // Filtrar pedidos por período se especificado
            let filteredOrders = orders;
            
            if (currentPeriod === 'custom' && startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order_date || order.created_at);
                    return orderDate >= start && orderDate <= end;
                });
            } else if (typeof currentPeriod === 'number') {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - currentPeriod);
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order_date || order.created_at);
                    return orderDate >= cutoffDate;
                });
            }
            
            // Processar dados para estatísticas de status
            const statusCounts = {
                pending: 0,
                processing: 0,
                shipped: 0,
                completed: 0
            };
            
            filteredOrders.forEach(order => {
                const status = order.status?.toLowerCase();
                if (status === 'pendente' || status === 'pending') {
                    statusCounts.pending++;
                } else if (status === 'processando' || status === 'processing' || status === 'em processamento') {
                    statusCounts.processing++;
                } else if (status === 'enviado' || status === 'shipped') {
                    statusCounts.shipped++;
                } else if (status === 'concluido' || status === 'completed' || status === 'entregue') {
                    statusCounts.completed++;
                }
            });
            
            updateOrdersStatus(statusCounts);
            displayRecentOrders(filteredOrders.slice(0, 5)); // Mostrar apenas os 5 mais recentes
        } else {
            console.error('Erro ao carregar dados dos pedidos:', response.statusText);
            updateOrdersStatus({});
            displayRecentOrders([]);
        }
    } catch (error) {
        console.error('Erro ao carregar dados dos pedidos:', error);
        updateOrdersStatus({});
        displayRecentOrders([]);
    }
}

// Função para atualizar os cards de status dos pedidos
function updateOrdersStatus(status) {
    document.getElementById('pending-orders').textContent = status.pending || 0;
    document.getElementById('processing-orders').textContent = status.processing || 0;
    document.getElementById('shipped-orders').textContent = status.shipped || 0;
    document.getElementById('completed-orders').textContent = status.completed || 0;
}

// Função para exibir pedidos recentes
function displayRecentOrders(orders) {
    const container = document.getElementById('recent-orders-list');
    
    if (!orders || orders.length === 0) {
        console.log('Nenhum pedido encontrado, exibindo mensagem padrão');
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                📦
                <p class="mb-0">Nenhum pedido encontrado no período selecionado.</p>
                <a href="orders.html" class="btn btn-sm btn-primary mt-2">
                    ➕ Criar Novo Pedido
                </a>
            </div>
        `;
        return;
    }
    
    console.log('Processando pedidos para exibição...');
    const ordersHtml = orders.map((order, index) => {
        console.log(`Pedido ${index}:`, order);
        const statusConfig = getOrderStatusConfig(order.status);
        const orderDate = new Date(order.dataPedido || order.created_at || order.date).toLocaleDateString('pt-BR');
        
        return `
            <div class="row align-items-center py-2 border-bottom">
                <div class="col-md-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            📦
                        </div>
                        <div>
                            <h6 class="mb-0">#${order.numero || order.id}</h6>
                            <small class="text-muted">${orderDate}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <small class="text-muted">Fornecedor:</small><br>
                    <span>${order.fornecedor || 'Não informado'}</span>
                </div>
                <div class="col-md-2">
                    <small class="text-muted">Total:</small><br>
                    <span class="fw-bold">R$ ${(order.valorTotal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="col-md-2">
                    <span class="badge ${statusConfig.class}">
                        ${statusConfig.text}
                    </span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewOrder(${order.id})">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('HTML gerado:', ordersHtml);
    container.innerHTML = ordersHtml;
    console.log('=== FIM DEBUG displayRecentOrders ===');
}

// Função para obter configuração de status do pedido
function getOrderStatusConfig(status) {
    const configs = {
        'pending': { class: 'bg-warning', text: 'Pendente' },
        'processing': { class: 'bg-info', text: 'Em Processamento' },
        'shipped': { class: 'bg-primary', text: 'Enviado' },
        'completed': { class: 'bg-success', text: 'Concluído' },
        'cancelled': { class: 'bg-danger', text: 'Cancelado' }
    };
    
    return configs[status] || { class: 'bg-secondary', text: 'Desconhecido' };
}

// Função para visualizar detalhes do pedido
function viewOrder(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
}

// Função para salvar fornecedor
async function saveSupplier() {
    try {
        const form = document.getElementById('supplierForm');
        
        // Obter dados do formulário usando os IDs corretos dos campos
        const supplierData = {
            name: document.getElementById('supplierName').value.trim(),
            cnpj: document.getElementById('supplierCnpj').value.trim(),
            contact_name: document.getElementById('supplierContact').value.trim(),
            phone: document.getElementById('supplierPhone').value.trim(),
            email: document.getElementById('supplierEmail').value.trim(),
            address: document.getElementById('supplierAddress').value.trim(),
            status: document.getElementById('supplierStatus').value,
            notes: document.getElementById('supplierNotes').value.trim()
        };

        // Validação básica
        if (!supplierData.name) {
            showToast('Nome do fornecedor é obrigatório', 'error');
            return;
        }
        
        if (!supplierData.email) {
            showToast('Email é obrigatório', 'error');
            return;
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(supplierData.email)) {
            showToast('Por favor, digite um email válido', 'error');
            return;
        }

        const response = await fetch('/api/fornecedores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supplierData)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('supplierModal'));
            modal.hide();
            
            // Mostrar toast de sucesso
            showToast('Fornecedor adicionado com sucesso!', 'success');
            
            // Recarregar dados dos pedidos
            loadOrdersData();
            
            // Limpar formulário
            form.reset();
        } else {
            const error = await response.json();
            showToast(error.error || error.message || 'Erro ao adicionar fornecedor', 'error');
        }
    } catch (error) {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'dashboard-supplier-save'
        });
        showToast('Erro ao conectar com o servidor', 'error');
    }
}

// Função para abrir modal de cotação
function openNewQuoteModal() {
    // Limpar formulário
    const form = document.getElementById('quoteForm');
    if (form) {
        form.reset();
        // Definir data atual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quoteDate').value = today;
        document.getElementById('quoteValidUntil').value = today;
    }
    
    // Adicionar eventos de cálculo automático
    const quantityField = document.getElementById('quoteQuantity');
    const priceField = document.getElementById('quotePrice');
    
    if (quantityField && priceField) {
        quantityField.addEventListener('input', calculateTotalPrice);
        priceField.addEventListener('input', calculateTotalPrice);
    }
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('quoteModal'));
    modal.show();
}

// Função para salvar cotação
async function saveQuote() {
    try {
        const form = document.getElementById('quoteForm');
        const formData = new FormData(form);
        
        const quantity = parseInt(formData.get('quantity')) || 0;
        const unitPrice = parseFloat(formData.get('price')) || 0;
        const totalPrice = quantity * unitPrice;
        
        const quoteData = {
            supplier: formData.get('supplier'),
            date: formData.get('date'),
            validUntil: formData.get('validUntil'),
            product: formData.get('product'),
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            status: formData.get('status'),
            notes: formData.get('notes')
        };

        const response = await fetch('/api/cotacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quoteData)
        });

        if (response.ok) {
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('quoteModal'));
            modal.hide();
            
            // Mostrar toast de sucesso
            showToast('Cotação adicionada com sucesso!', 'success');
            
            // Recarregar dados do dashboard
            loadDashboardData();
            
            // Limpar formulário
            form.reset();
            document.getElementById('quoteTotal').textContent = 'R$ 0,00';
        } else {
            const error = await response.json();
            showToast(error.message || 'Erro ao adicionar cotação', 'error');
        }
    } catch (error) {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'dashboard-quote-save'
        });
        showToast('Erro ao conectar com o servidor', 'error');
    }
}

// Função para calcular preço total na cotação
function calculateTotalPrice() {
    const quantity = parseFloat(document.getElementById('quoteQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('quotePrice').value) || 0;
    const totalPrice = quantity * unitPrice;
    const totalField = document.getElementById('quoteTotal');
    if (totalField) {
        totalField.textContent = `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}



// Helper function to show analytics results in a modal
function showAnalyticsModal(title, data) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('analyticsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'analyticsModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="analyticsModalTitle">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="analyticsModalBody">
                        <pre id="analyticsData"></pre>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Update modal content
    document.getElementById('analyticsModalTitle').textContent = title;
    document.getElementById('analyticsData').textContent = JSON.stringify(data, null, 2);
    
    // Show modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}