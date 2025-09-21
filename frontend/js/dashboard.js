// Dashboard Page JavaScript
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
});

function initializeDashboard() {
    console.log('Inicializando dashboard...');
    
    // Initialize charts
    initializeCharts();
    
    // Check system health
    checkSystemHealth();
}

function loadDashboardData() {
    console.log('Carregando dados do dashboard...');
    
    // Load real data from API
    Promise.all([
        loadKPIData(),
        loadChartData(),
        loadAlertData()
    ]).then(() => {
        console.log('Dados do dashboard carregados com sucesso');
    }).catch(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
        showToast('Erro ao carregar dados do dashboard', 'error');
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

    } catch (error) {
        console.error('Erro ao carregar KPIs:', error);
    }
}

function updateKPICard(elementId, value, change, trend) {
    const valueElement = document.getElementById(elementId);
    const changeElement = document.getElementById(elementId.replace('total-', '') + '-change');
    const trendElement = document.getElementById(elementId.replace('total-', '') + '-trend');

    if (valueElement) valueElement.textContent = value;
    if (changeElement) changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    if (trendElement) {
        trendElement.className = `bi ${trend === 'up' ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`;
    }
}

function initializeCharts() {
    // Initialize Sales Chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Vendas (R$)',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Produtos Vendidos',
                    data: [65, 89, 72, 105, 98, 125],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
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
                            display: true,
                            text: 'Mês'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Vendas (R$)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Quantidade'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    // Initialize Stock Chart
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx) {
        stockChart = new Chart(stockCtx, {
            type: 'doughnut',
            data: {
                labels: ['Eletrônicos', 'Escritório', 'Limpeza', 'Segurança', 'Outros'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
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
        console.error('Erro ao atualizar gráficos:', error);
    }
}

async function loadAlertData() {
    try {
        // Simulate loading alert data
        console.log('Carregando alertas...');
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
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