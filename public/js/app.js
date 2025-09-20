// Configuração da API
const API_BASE_URL = '/api';

// Estado da aplicação
let currentSection = 'dashboard';
let currentData = {
    products: [],
    suppliers: [],
    quotes: [],
    orders: []
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Gestão de Suprimentos iniciado');
    
    // Carregar dashboard por padrão
    showSection('dashboard');
    
    // Verificar status da API
    checkApiHealth();
});

// Função para mostrar seções
function showSection(section) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar seção selecionada
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
        currentSection = section;
        
        // Atualizar navbar
        updateNavbar(section);
        
        // Carregar dados da seção
        loadSectionData(section);
    }
}

// Atualizar navbar ativa
function updateNavbar(activeSection) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${activeSection}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Carregar dados da seção
async function loadSectionData(section) {
    try {
        showLoading(true);
        
        switch (section) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'products':
                await loadProducts();
                break;
            case 'suppliers':
                await loadSuppliers();
                break;
            case 'quotes':
                await loadQuotes();
                break;
            case 'orders':
                await loadOrders();
                break;
        }
    } catch (error) {
        console.error(`Erro ao carregar ${section}:`, error);
        showError(`Erro ao carregar dados de ${section}`);
    } finally {
        showLoading(false);
    }
}

// Carregar dashboard
async function loadDashboard() {
    try {
        // Carregar estatísticas
        const [products, suppliers, quotes, orders] = await Promise.all([
            fetchAPI('/products'),
            fetchAPI('/suppliers'),
            fetchAPI('/quotes'),
            fetchAPI('/orders')
        ]);
        
        // Atualizar cards de estatísticas
        document.getElementById('total-products').textContent = products.data?.length || 0;
        document.getElementById('total-suppliers').textContent = suppliers.data?.length || 0;
        document.getElementById('total-quotes').textContent = quotes.data?.length || 0;
        document.getElementById('total-orders').textContent = orders.data?.length || 0;
        
        // Atualizar atividades recentes
        updateRecentActivities();
        
        // Atualizar status do sistema
        updateSystemStatus();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Mostrar valores padrão em caso de erro
        document.getElementById('total-products').textContent = '-';
        document.getElementById('total-suppliers').textContent = '-';
        document.getElementById('total-quotes').textContent = '-';
        document.getElementById('total-orders').textContent = '-';
    }
}

// Carregar produtos
async function loadProducts() {
    try {
        const response = await fetchAPI('/products');
        currentData.products = response.data || [];
        
        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '';
        
        if (currentData.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum produto encontrado</td></tr>';
            return;
        }
        
        currentData.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category || '-'}</td>
                <td>R$ ${parseFloat(product.price || 0).toFixed(2)}</td>
                <td>${product.stock_quantity || 0}</td>
                <td><span class="badge ${getStatusBadgeClass(product.status)}">${product.status || 'Ativo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar produtos</td></tr>';
    }
}

// Carregar fornecedores
async function loadSuppliers() {
    try {
        const response = await fetchAPI('/suppliers');
        currentData.suppliers = response.data || [];
        
        const tbody = document.querySelector('#suppliers-table tbody');
        tbody.innerHTML = '';
        
        if (currentData.suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum fornecedor encontrado</td></tr>';
            return;
        }
        
        currentData.suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${supplier.email || '-'}</td>
                <td>${supplier.phone || '-'}</td>
                <td>${supplier.city || '-'}</td>
                <td><span class="badge ${getStatusBadgeClass(supplier.status)}">${supplier.status || 'Ativo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editSupplier(${supplier.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSupplier(${supplier.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        const tbody = document.querySelector('#suppliers-table tbody');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar fornecedores</td></tr>';
    }
}

// Carregar cotações
async function loadQuotes() {
    try {
        const response = await fetchAPI('/quotes');
        currentData.quotes = response.data || [];
        
        const tbody = document.querySelector('#quotes-table tbody');
        tbody.innerHTML = '';
        
        if (currentData.quotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhuma cotação encontrada</td></tr>';
            return;
        }
        
        currentData.quotes.forEach(quote => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${quote.id}</td>
                <td>${quote.supplier_name || 'N/A'}</td>
                <td>${formatDate(quote.quote_date)}</td>
                <td>R$ ${parseFloat(quote.total_amount || 0).toFixed(2)}</td>
                <td><span class="badge ${getStatusBadgeClass(quote.status)}">${quote.status || 'Pendente'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editQuote(${quote.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteQuote(${quote.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar cotações:', error);
        const tbody = document.querySelector('#quotes-table tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar cotações</td></tr>';
    }
}

// Carregar pedidos
async function loadOrders() {
    try {
        const response = await fetchAPI('/orders');
        currentData.orders = response.data || [];
        
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';
        
        if (currentData.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum pedido encontrado</td></tr>';
            return;
        }
        
        currentData.orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.supplier_name || 'N/A'}</td>
                <td>${formatDate(order.order_date)}</td>
                <td>R$ ${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status || 'Pendente'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editOrder(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar pedidos</td></tr>';
    }
}

// Função para fazer requisições à API
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Verificar saúde da API
async function checkApiHealth() {
    try {
        const response = await fetchAPI('/health');
        console.log('API Status:', response);
        updateSystemStatus(true, 'API funcionando corretamente');
    } catch (error) {
        console.error('Erro ao verificar API:', error);
        updateSystemStatus(false, 'Erro de conexão com a API');
    }
}

// Atualizar status do sistema
function updateSystemStatus(isHealthy = null, message = '') {
    const statusElement = document.getElementById('system-status');
    
    if (isHealthy === null) {
        statusElement.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span>Verificando status...</span>
            </div>
        `;
        return;
    }
    
    const statusClass = isHealthy ? 'text-success' : 'text-danger';
    const statusIcon = isHealthy ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    const statusText = isHealthy ? 'Sistema Online' : 'Sistema com Problemas';
    
    statusElement.innerHTML = `
        <div class="d-flex align-items-center ${statusClass}">
            <i class="${statusIcon} me-2"></i>
            <div>
                <strong>${statusText}</strong>
                <br>
                <small>${message}</small>
            </div>
        </div>
    `;
}

// Atualizar atividades recentes
function updateRecentActivities() {
    const activitiesElement = document.getElementById('recent-activities');
    
    // Simulação de atividades recentes
    const activities = [
        { type: 'product', action: 'Produto adicionado', item: 'Notebook Dell', time: '2 min atrás' },
        { type: 'quote', action: 'Cotação criada', item: 'Cotação #123', time: '15 min atrás' },
        { type: 'order', action: 'Pedido aprovado', item: 'Pedido #456', time: '1 hora atrás' },
        { type: 'supplier', action: 'Fornecedor atualizado', item: 'TechCorp Ltda', time: '2 horas atrás' }
    ];
    
    activitiesElement.innerHTML = activities.map(activity => `
        <div class="d-flex align-items-center mb-2">
            <i class="fas fa-${getActivityIcon(activity.type)} text-primary me-2"></i>
            <div class="flex-grow-1">
                <small class="d-block">${activity.action}</small>
                <small class="text-muted">${activity.item}</small>
            </div>
            <small class="text-muted">${activity.time}</small>
        </div>
    `).join('');
}

// Obter ícone da atividade
function getActivityIcon(type) {
    const icons = {
        product: 'box',
        quote: 'file-invoice',
        order: 'shopping-cart',
        supplier: 'truck'
    };
    return icons[type] || 'circle';
}

// Obter classe do badge de status
function getStatusBadgeClass(status) {
    const statusClasses = {
        'Ativo': 'bg-success',
        'Inativo': 'bg-secondary',
        'Pendente': 'bg-warning',
        'Aprovado': 'bg-success',
        'Rejeitado': 'bg-danger',
        'Cancelado': 'bg-secondary',
        'Entregue': 'bg-success',
        'Em Andamento': 'bg-info'
    };
    return statusClasses[status] || 'bg-secondary';
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Mostrar/esconder loading
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

// Mostrar erro
function showError(message) {
    // Implementar toast ou modal de erro
    console.error(message);
    alert(message); // Temporário
}

// Funções de modal (placeholder)
function showProductModal() {
    alert('Modal de produto será implementado');
}

function showSupplierModal() {
    alert('Modal de fornecedor será implementado');
}

function showQuoteModal() {
    alert('Modal de cotação será implementado');
}

function showOrderModal() {
    alert('Modal de pedido será implementado');
}

// Funções de edição (placeholder)
function editProduct(id) {
    alert(`Editar produto ${id}`);
}

function editSupplier(id) {
    alert(`Editar fornecedor ${id}`);
}

function editQuote(id) {
    alert(`Editar cotação ${id}`);
}

function editOrder(id) {
    alert(`Editar pedido ${id}`);
}

// Funções de exclusão (placeholder)
function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        alert(`Excluir produto ${id}`);
    }
}

function deleteSupplier(id) {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        alert(`Excluir fornecedor ${id}`);
    }
}

function deleteQuote(id) {
    if (confirm('Tem certeza que deseja excluir esta cotação?')) {
        alert(`Excluir cotação ${id}`);
    }
}

function deleteOrder(id) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        alert(`Excluir pedido ${id}`);
    }
}