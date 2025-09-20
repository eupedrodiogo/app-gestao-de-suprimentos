// Supply Management System JavaScript

// Global Variables
let currentSection = 'dashboard';
let products = [];
let suppliers = [];
let quotes = [];
let orders = [];
let inventory = [];
let activities = [];

// Data Management
class DataManager {
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static load(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeNavigation();
    initializeForms();
    updateDashboard();
    populateSelects();
    
    // Load sample data if empty
    if (products.length === 0) {
        loadSampleData();
    }
});

// Load Data from LocalStorage
function loadData() {
    products = DataManager.load('products');
    suppliers = DataManager.load('suppliers');
    quotes = DataManager.load('quotes');
    orders = DataManager.load('orders');
    inventory = DataManager.load('inventory');
    activities = DataManager.load('activities');
}

// Save Data to LocalStorage
function saveData() {
    DataManager.save('products', products);
    DataManager.save('suppliers', suppliers);
    DataManager.save('quotes', quotes);
    DataManager.save('orders', orders);
    DataManager.save('inventory', inventory);
    DataManager.save('activities', activities);
}

// Navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showSection(section);
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    currentSection = sectionName;
    
    // Update section content
    switch(sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            updateProductsTable();
            break;
        case 'suppliers':
            updateSuppliersTable();
            break;
        case 'quotes':
            updateQuotesTable();
            break;
        case 'orders':
            updateOrdersTable();
            break;
        case 'inventory':
            updateInventoryTable();
            break;
        case 'reports':
            updateReports();
            break;
    }
}

// Dashboard Functions
function updateDashboard() {
    // Update cards
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('total-suppliers').textContent = suppliers.filter(s => s.status === 'ativo').length;
    document.getElementById('total-quotes').textContent = quotes.filter(q => q.status === 'pendente').length;
    document.getElementById('total-orders').textContent = orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length;
    
    // Update activities
    updateActivities();
    
    // Update charts
    updateCharts();
}

function updateActivities() {
    const activityList = document.getElementById('activity-list');
    const recentActivities = activities.slice(-5).reverse();
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <strong>${activity.type}</strong> - ${activity.description}
            <br><small>${formatDate(activity.date)}</small>
        </div>
    `).join('');
}

function addActivity(type, description) {
    activities.push({
        id: DataManager.generateId(),
        type: type,
        description: description,
        date: new Date().toISOString()
    });
    saveData();
}

// Chart Functions
function updateCharts() {
    updateOrdersChart();
    updateExpensesChart();
}

function updateOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ordersByStatus),
            datasets: [{
                data: Object.values(ordersByStatus),
                backgroundColor: [
                    '#667eea',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#f8d7da'
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

function updateExpensesChart() {
    const ctx = document.getElementById('expensesChart');
    if (!ctx) return;
    
    // Generate sample monthly data
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const expenses = months.map(() => Math.floor(Math.random() * 50000) + 10000);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Gastos (R$)',
                data: expenses,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Product Management
function updateProductsTable() {
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>R$ ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge status-${product.status}">${product.status}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function addProduct(productData) {
    const product = {
        id: DataManager.generateId(),
        ...productData,
        status: 'ativo',
        createdAt: new Date().toISOString()
    };
    
    products.push(product);
    
    // Add to inventory
    inventory.push({
        id: DataManager.generateId(),
        productId: product.id,
        currentStock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock || product.stock * 2,
        status: getInventoryStatus(product.stock, product.minStock)
    });
    
    saveData();
    addActivity('Produto', `Produto "${product.name}" adicionado`);
    updateProductsTable();
    updateDashboard();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Fill form with product data
    document.getElementById('product-code').value = product.code;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-category-select').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-min-stock').value = product.minStock;
    
    // Store editing ID
    document.getElementById('productForm').dataset.editingId = id;
    
    openModal('productModal');
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        const product = products.find(p => p.id === id);
        products = products.filter(p => p.id !== id);
        inventory = inventory.filter(i => i.productId !== id);
        
        saveData();
        addActivity('Produto', `Produto "${product.name}" removido`);
        updateProductsTable();
        updateDashboard();
    }
}

// Supplier Management
function updateSuppliersTable() {
    const tbody = document.getElementById('suppliers-table');
    tbody.innerHTML = suppliers.map(supplier => `
        <tr>
            <td>${supplier.cnpj}</td>
            <td>${supplier.name}</td>
            <td>${supplier.contact}</td>
            <td>${supplier.email}</td>
            <td>${supplier.phone}</td>
            <td><span class="status-badge status-${supplier.status}">${supplier.status}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editSupplier('${supplier.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${supplier.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function addSupplier(supplierData) {
    const supplier = {
        id: DataManager.generateId(),
        ...supplierData,
        status: 'ativo',
        createdAt: new Date().toISOString()
    };
    
    suppliers.push(supplier);
    saveData();
    addActivity('Fornecedor', `Fornecedor "${supplier.name}" adicionado`);
    updateSuppliersTable();
    updateDashboard();
    populateSelects();
}

function editSupplier(id) {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;
    
    // Fill form with supplier data
    document.getElementById('supplier-cnpj').value = supplier.cnpj;
    document.getElementById('supplier-name').value = supplier.name;
    document.getElementById('supplier-contact').value = supplier.contact;
    document.getElementById('supplier-email').value = supplier.email;
    document.getElementById('supplier-phone').value = supplier.phone;
    document.getElementById('supplier-address').value = supplier.address || '';
    
    // Store editing ID
    document.getElementById('supplierForm').dataset.editingId = id;
    
    openModal('supplierModal');
}

function deleteSupplier(id) {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        const supplier = suppliers.find(s => s.id === id);
        suppliers = suppliers.filter(s => s.id !== id);
        
        saveData();
        addActivity('Fornecedor', `Fornecedor "${supplier.name}" removido`);
        updateSuppliersTable();
        updateDashboard();
        populateSelects();
    }
}

// Quote Management
function updateQuotesTable() {
    const tbody = document.getElementById('quotes-table');
    tbody.innerHTML = quotes.map(quote => {
        const supplier = suppliers.find(s => s.id === quote.supplierId);
        return `
            <tr>
                <td>${quote.number}</td>
                <td>${supplier ? supplier.name : 'N/A'}</td>
                <td>${formatDate(quote.requestDate)}</td>
                <td>${formatDate(quote.deliveryDate)}</td>
                <td>R$ ${quote.totalValue.toFixed(2)}</td>
                <td><span class="status-badge status-${quote.status}">${quote.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="approveQuote('${quote.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectQuote('${quote.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function addQuote(quoteData) {
    const quote = {
        id: DataManager.generateId(),
        number: `COT-${Date.now()}`,
        ...quoteData,
        status: 'pendente',
        requestDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    quotes.push(quote);
    saveData();
    addActivity('Cotação', `Cotação ${quote.number} criada`);
    updateQuotesTable();
    updateDashboard();
    populateSelects();
}

function approveQuote(id) {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
        quote.status = 'aprovada';
        saveData();
        addActivity('Cotação', `Cotação ${quote.number} aprovada`);
        updateQuotesTable();
        updateDashboard();
    }
}

function rejectQuote(id) {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
        quote.status = 'rejeitada';
        saveData();
        addActivity('Cotação', `Cotação ${quote.number} rejeitada`);
        updateQuotesTable();
        updateDashboard();
    }
}

// Order Management
function updateOrdersTable() {
    const tbody = document.getElementById('orders-table');
    tbody.innerHTML = orders.map(order => {
        const supplier = suppliers.find(s => s.id === order.supplierId);
        return `
            <tr>
                <td>${order.number}</td>
                <td>${supplier ? supplier.name : 'N/A'}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td>${formatDate(order.deliveryDate)}</td>
                <td>R$ ${order.totalValue.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function addOrder(orderData) {
    const order = {
        id: DataManager.generateId(),
        number: `PED-${Date.now()}`,
        ...orderData,
        status: 'pendente',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    orders.push(order);
    saveData();
    addActivity('Pedido', `Pedido ${order.number} criado`);
    updateOrdersTable();
    updateDashboard();
}

function updateOrderStatus(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    const statuses = ['pendente', 'aprovado', 'em_transito', 'entregue'];
    const currentIndex = statuses.indexOf(order.status);
    
    if (currentIndex < statuses.length - 1) {
        order.status = statuses[currentIndex + 1];
        saveData();
        addActivity('Pedido', `Status do pedido ${order.number} atualizado para ${order.status}`);
        updateOrdersTable();
        updateDashboard();
    }
}

function cancelOrder(id) {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = 'cancelado';
            saveData();
            addActivity('Pedido', `Pedido ${order.number} cancelado`);
            updateOrdersTable();
            updateDashboard();
        }
    }
}

// Inventory Management
function updateInventoryTable() {
    const tbody = document.getElementById('inventory-table');
    tbody.innerHTML = inventory.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return '';
        
        return `
            <tr>
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.minStock}</td>
                <td>${item.maxStock}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="adjustInventory('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getInventoryStatus(currentStock, minStock) {
    if (currentStock <= minStock) return 'baixo';
    if (currentStock <= minStock * 2) return 'normal';
    return 'alto';
}

function adjustInventory(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    const product = products.find(p => p.id === item.productId);
    if (!product) return;
    
    // Fill form
    document.getElementById('inventory-product').value = item.productId;
    document.getElementById('inventoryForm').dataset.editingId = id;
    
    openModal('inventoryModal');
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Clear forms
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        delete form.dataset.editingId;
    }
}

// Form Initialization
function initializeForms() {
    // Product Form
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            code: document.getElementById('product-code').value,
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category-select').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            minStock: parseInt(document.getElementById('product-min-stock').value)
        };
        
        const editingId = this.dataset.editingId;
        if (editingId) {
            // Update existing product
            const product = products.find(p => p.id === editingId);
            Object.assign(product, formData);
            
            // Update inventory
            const inventoryItem = inventory.find(i => i.productId === editingId);
            if (inventoryItem) {
                inventoryItem.currentStock = formData.stock;
                inventoryItem.minStock = formData.minStock;
                inventoryItem.status = getInventoryStatus(formData.stock, formData.minStock);
            }
            
            addActivity('Produto', `Produto "${product.name}" atualizado`);
        } else {
            addProduct(formData);
        }
        
        saveData();
        updateProductsTable();
        updateInventoryTable();
        updateDashboard();
        closeModal('productModal');
    });
    
    // Supplier Form
    document.getElementById('supplierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            cnpj: document.getElementById('supplier-cnpj').value,
            name: document.getElementById('supplier-name').value,
            contact: document.getElementById('supplier-contact').value,
            email: document.getElementById('supplier-email').value,
            phone: document.getElementById('supplier-phone').value,
            address: document.getElementById('supplier-address').value
        };
        
        const editingId = this.dataset.editingId;
        if (editingId) {
            // Update existing supplier
            const supplier = suppliers.find(s => s.id === editingId);
            Object.assign(supplier, formData);
            addActivity('Fornecedor', `Fornecedor "${supplier.name}" atualizado`);
        } else {
            addSupplier(formData);
        }
        
        saveData();
        updateSuppliersTable();
        updateDashboard();
        closeModal('supplierModal');
    });
    
    // Quote Form
    document.getElementById('quoteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productItems = document.querySelectorAll('#quote-products .product-item');
        const items = Array.from(productItems).map(item => ({
            productId: item.querySelector('.quote-product').value,
            quantity: parseInt(item.querySelector('.quote-quantity').value),
            unitPrice: parseFloat(item.querySelector('.quote-unit-price').value)
        }));
        
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        
        const formData = {
            supplierId: document.getElementById('quote-supplier').value,
            deliveryDate: document.getElementById('quote-delivery-date').value,
            items: items,
            totalValue: totalValue
        };
        
        addQuote(formData);
        closeModal('quoteModal');
    });
    
    // Order Form
    document.getElementById('orderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productItems = document.querySelectorAll('#order-products .product-item');
        const items = Array.from(productItems).map(item => ({
            productId: item.querySelector('.order-product').value,
            quantity: parseInt(item.querySelector('.order-quantity').value),
            unitPrice: parseFloat(item.querySelector('.order-unit-price').value)
        }));
        
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        
        const formData = {
            supplierId: document.getElementById('order-supplier').value,
            deliveryDate: document.getElementById('order-delivery-date').value,
            items: items,
            totalValue: totalValue
        };
        
        addOrder(formData);
        closeModal('orderModal');
    });
    
    // Inventory Form
    document.getElementById('inventoryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('inventory-product').value;
        const type = document.getElementById('inventory-type').value;
        const quantity = parseInt(document.getElementById('inventory-quantity').value);
        const reason = document.getElementById('inventory-reason').value;
        
        const inventoryItem = inventory.find(i => i.productId === productId);
        const product = products.find(p => p.id === productId);
        
        if (inventoryItem && product) {
            let newStock = inventoryItem.currentStock;
            
            switch(type) {
                case 'entrada':
                    newStock += quantity;
                    break;
                case 'saida':
                    newStock -= quantity;
                    break;
                case 'ajuste':
                    newStock = quantity;
                    break;
            }
            
            inventoryItem.currentStock = Math.max(0, newStock);
            inventoryItem.status = getInventoryStatus(inventoryItem.currentStock, inventoryItem.minStock);
            product.stock = inventoryItem.currentStock;
            
            addActivity('Estoque', `Ajuste de estoque: ${product.name} - ${type} de ${quantity} unidades`);
            
            saveData();
            updateInventoryTable();
            updateProductsTable();
            updateDashboard();
        }
        
        closeModal('inventoryModal');
    });
}

// Populate Select Options
function populateSelects() {
    // Supplier selects
    const supplierSelects = document.querySelectorAll('#quote-supplier, #order-supplier');
    supplierSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um fornecedor</option>' +
            suppliers.map(supplier => `<option value="${supplier.id}">${supplier.name}</option>`).join('');
        select.value = currentValue;
    });
    
    // Product selects
    const productSelects = document.querySelectorAll('.quote-product, .order-product, #inventory-product');
    productSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um produto</option>' +
            products.map(product => `<option value="${product.id}">${product.name}</option>`).join('');
        select.value = currentValue;
    });
    
    // Quote select for orders
    const quoteSelect = document.getElementById('order-quote');
    if (quoteSelect) {
        const approvedQuotes = quotes.filter(q => q.status === 'aprovada');
        quoteSelect.innerHTML = '<option value="">Selecione uma cotação (opcional)</option>' +
            approvedQuotes.map(quote => `<option value="${quote.id}">${quote.number}</option>`).join('');
    }
}

// Product Item Management
function addProductItem() {
    const container = document.getElementById('quote-products');
    const newItem = document.createElement('div');
    newItem.className = 'product-item';
    newItem.innerHTML = `
        <select class="quote-product" required>
            <option value="">Selecione um produto</option>
            ${products.map(product => `<option value="${product.id}">${product.name}</option>`).join('')}
        </select>
        <input type="number" class="quote-quantity" placeholder="Quantidade" required>
        <input type="number" class="quote-unit-price" placeholder="Preço unitário" step="0.01" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeProductItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newItem);
}

function addOrderProductItem() {
    const container = document.getElementById('order-products');
    const newItem = document.createElement('div');
    newItem.className = 'product-item';
    newItem.innerHTML = `
        <select class="order-product" required>
            <option value="">Selecione um produto</option>
            ${products.map(product => `<option value="${product.id}">${product.name}</option>`).join('')}
        </select>
        <input type="number" class="order-quantity" placeholder="Quantidade" required>
        <input type="number" class="order-unit-price" placeholder="Preço unitário" step="0.01" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeProductItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newItem);
}

function removeProductItem(button) {
    button.parentElement.remove();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Search and Filter Functions
function setupFilters() {
    // Product filters
    document.getElementById('product-search')?.addEventListener('input', filterProducts);
    document.getElementById('product-category')?.addEventListener('change', filterProducts);
    
    // Supplier filters
    document.getElementById('supplier-search')?.addEventListener('input', filterSuppliers);
    document.getElementById('supplier-status')?.addEventListener('change', filterSuppliers);
    
    // Quote filters
    document.getElementById('quote-search')?.addEventListener('input', filterQuotes);
    document.getElementById('quote-status')?.addEventListener('change', filterQuotes);
    
    // Order filters
    document.getElementById('order-search')?.addEventListener('input', filterOrders);
    document.getElementById('order-status')?.addEventListener('change', filterOrders);
    
    // Inventory filters
    document.getElementById('inventory-search')?.addEventListener('input', filterInventory);
    document.getElementById('inventory-status')?.addEventListener('change', filterInventory);
}

function filterProducts() {
    const search = document.getElementById('product-search').value.toLowerCase();
    const category = document.getElementById('product-category').value;
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search) || 
                            product.code.toLowerCase().includes(search);
        const matchesCategory = !category || product.category === category;
        
        return matchesSearch && matchesCategory;
    });
    
    updateProductsTableWithData(filteredProducts);
}

function updateProductsTableWithData(data) {
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = data.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>R$ ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge status-${product.status}">${product.status}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Reports
function updateReports() {
    const reportPreview = document.getElementById('report-preview');
    reportPreview.innerHTML = `
        <h3>Relatório de Produtos</h3>
        <p>Total de produtos: ${products.length}</p>
        <p>Produtos ativos: ${products.filter(p => p.status === 'ativo').length}</p>
        <p>Valor total em estoque: R$ ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}</p>
        
        <h3>Relatório de Fornecedores</h3>
        <p>Total de fornecedores: ${suppliers.length}</p>
        <p>Fornecedores ativos: ${suppliers.filter(s => s.status === 'ativo').length}</p>
        
        <h3>Relatório de Pedidos</h3>
        <p>Total de pedidos: ${orders.length}</p>
        <p>Pedidos pendentes: ${orders.filter(o => o.status === 'pendente').length}</p>
        <p>Valor total de pedidos: R$ ${orders.reduce((sum, o) => sum + o.totalValue, 0).toFixed(2)}</p>
    `;
}

function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        alert(`Relatório de ${reportType} gerado com sucesso!\nPeríodo: ${startDate} a ${endDate}`);
    }, 2000);
}

// Loading Functions
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Sample Data
function loadSampleData() {
    // Sample Products
    const sampleProducts = [
        {
            id: DataManager.generateId(),
            code: 'PROD001',
            name: 'Notebook Dell Inspiron',
            description: 'Notebook para uso corporativo',
            category: 'eletrônicos',
            price: 2500.00,
            stock: 10,
            minStock: 5,
            status: 'ativo',
            createdAt: new Date().toISOString()
        },
        {
            id: DataManager.generateId(),
            code: 'PROD002',
            name: 'Papel A4 500 folhas',
            description: 'Papel sulfite branco',
            category: 'escritório',
            price: 25.00,
            stock: 100,
            minStock: 20,
            status: 'ativo',
            createdAt: new Date().toISOString()
        },
        {
            id: DataManager.generateId(),
            code: 'PROD003',
            name: 'Detergente Neutro 5L',
            description: 'Detergente para limpeza geral',
            category: 'limpeza',
            price: 15.50,
            stock: 50,
            minStock: 10,
            status: 'ativo',
            createdAt: new Date().toISOString()
        }
    ];
    
    // Sample Suppliers
    const sampleSuppliers = [
        {
            id: DataManager.generateId(),
            cnpj: '12.345.678/0001-90',
            name: 'TechSupply Ltda',
            contact: 'João Silva',
            email: 'contato@techsupply.com',
            phone: '(11) 9999-9999',
            address: 'Rua das Tecnologias, 123',
            status: 'ativo',
            createdAt: new Date().toISOString()
        },
        {
            id: DataManager.generateId(),
            cnpj: '98.765.432/0001-10',
            name: 'Office Solutions',
            contact: 'Maria Santos',
            email: 'vendas@officesolutions.com',
            phone: '(11) 8888-8888',
            address: 'Av. Comercial, 456',
            status: 'ativo',
            createdAt: new Date().toISOString()
        }
    ];
    
    products = sampleProducts;
    suppliers = sampleSuppliers;
    
    // Create inventory for sample products
    inventory = sampleProducts.map(product => ({
        id: DataManager.generateId(),
        productId: product.id,
        currentStock: product.stock,
        minStock: product.minStock,
        maxStock: product.stock * 2,
        status: getInventoryStatus(product.stock, product.minStock)
    }));
    
    // Sample activities
    activities = [
        {
            id: DataManager.generateId(),
            type: 'Sistema',
            description: 'Sistema inicializado com dados de exemplo',
            date: new Date().toISOString()
        }
    ];
    
    saveData();
    populateSelects();
    setupFilters();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Initialize filters after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupFilters, 100);
});