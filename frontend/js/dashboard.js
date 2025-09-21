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
        loadAlertData(),
        loadRecentSuppliers()
    ]).then(() => {
        console.log('Dados do dashboard carregados com sucesso');
    }).catch(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
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
        console.error('Erro ao verificar status do sistema:', error);
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
        console.error('API health check failed:', error);
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
        console.error('Database health check failed:', error);
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

        const response = await fetch('/api/products', {
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
        console.error('Erro ao salvar produto:', error);
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

// Função para carregar fornecedores recentes
async function loadRecentSuppliers() {
    try {
        const response = await fetch('/api/suppliers?limit=5');
        
        if (response.ok) {
            const data = await response.json();
            const suppliers = data.success ? data.data : data.data || [];
            displayRecentSuppliers(suppliers);
        } else {
            console.error('Erro ao carregar fornecedores:', response.statusText);
            displayRecentSuppliers([]);
        }
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        displayRecentSuppliers([]);
    }
}

// Função para exibir fornecedores recentes
function displayRecentSuppliers(suppliers) {
    const container = document.getElementById('recent-suppliers-list');
    
    if (!suppliers || suppliers.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-building"></i>
                <p class="mb-0">Nenhum fornecedor cadastrado ainda.</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="openNewSupplierModal()">
                    <i class="bi bi-plus"></i> Adicionar Primeiro Fornecedor
                </button>
            </div>
        `;
        return;
    }
    
    const suppliersHtml = suppliers.map(supplier => `
        <div class="row align-items-center py-2 border-bottom">
            <div class="col-md-4">
                <div class="d-flex align-items-center">
                    <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="bi bi-building text-white"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${supplier.name || 'Nome não informado'}</h6>
                        <small class="text-muted">${supplier.cnpj || 'CNPJ não informado'}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <small class="text-muted">Contato:</small><br>
                <span>${supplier.contact_name || supplier.contact || 'Não informado'}</span>
            </div>
            <div class="col-md-3">
                <small class="text-muted">Email:</small><br>
                <span>${supplier.email || 'Não informado'}</span>
            </div>
            <div class="col-md-2 text-end">
                <span class="badge ${supplier.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                    ${supplier.status || 'ativo'}
                </span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = suppliersHtml;
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

        const response = await fetch('/api/suppliers', {
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
            
            // Recarregar fornecedores recentes
            loadRecentSuppliers();
            
            // Limpar formulário
            form.reset();
        } else {
            const error = await response.json();
            showToast(error.error || error.message || 'Erro ao adicionar fornecedor', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar fornecedor:', error);
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

        const response = await fetch('/api/quotes', {
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
        console.error('Erro ao salvar cotação:', error);
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