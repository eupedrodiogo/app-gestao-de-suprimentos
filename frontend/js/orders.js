// Orders Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de Pedidos carregada');
    
    // Initialize orders functionality
    initializeOrders();
    
    // Load orders data
    loadOrders();
});

function initializeOrders() {
    // Add event listeners for order forms and buttons
    const addOrderBtn = document.getElementById('addOrderBtn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', showAddOrderModal);
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchOrders');
    if (searchInput) {
        searchInput.addEventListener('input', filterOrders);
    }
    
    // Add event listeners for existing order items
    const quantityInputs = document.querySelectorAll('#orderItems input[name="quantity"]');
    const priceInputs = document.querySelectorAll('#orderItems input[name="price"]');
    
    quantityInputs.forEach(input => {
        input.addEventListener('input', calculateItemTotal);
    });
    
    priceInputs.forEach(input => {
        input.addEventListener('input', calculateItemTotal);
    });
}

function loadOrders() {
    console.log('Carregando pedidos...');
    
    // Show loading state
    showLoadingState();
    
    // Make API call to get orders
    fetch('/api/orders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Pedidos carregados:', data);
            hideLoadingState();
            // Extract the orders array from the API response
            const orders = data.orders || data || [];
            displayOrders(orders);
        })
        .catch(error => {
            console.error('Erro ao carregar pedidos:', error);
            hideLoadingState();
            showErrorMessage('Erro ao carregar pedidos. Tente novamente.');
        });
}

function showAddOrderModal() {
    // Clear form
    const form = document.getElementById('orderForm');
    if (form) form.reset();
    
    // Clear hidden ID field
    const orderIdField = document.getElementById('orderId');
    if (orderIdField) orderIdField.value = '';
    
    // Set current date
    const dateField = document.getElementById('orderDate');
    if (dateField) {
        const today = new Date().toISOString().split('T')[0];
        dateField.value = today;
    }
    
    // Clear order items (keep only one empty row)
    const tbody = document.getElementById('orderItems');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td>
                    <select class="form-control" name="product" required>
                        <option value="">Selecione um produto</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control" name="quantity" min="1" required>
                </td>
                <td>
                    <input type="number" class="form-control" name="price" step="0.01" min="0" required>
                </td>
                <td>
                    <span class="item-total">R$ 0,00</span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(this)">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
        
        // Add event listeners to the new row
        const quantityInput = tbody.querySelector('input[name="quantity"]');
        const priceInput = tbody.querySelector('input[name="price"]');
        
        if (quantityInput) quantityInput.addEventListener('input', calculateItemTotal);
        if (priceInput) priceInput.addEventListener('input', calculateItemTotal);
    }
    
    // Reset total
    const totalElement = document.getElementById('orderTotal');
    if (totalElement) totalElement.textContent = 'R$ 0,00';
    
    // Set modal title
    const modalTitle = document.getElementById('orderModalTitle');
    if (modalTitle) modalTitle.textContent = 'Novo Pedido';
    
    // Show modal
    const modal = document.getElementById('orderModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function filterOrders() {
    const searchTerm = document.getElementById('searchOrders').value.toLowerCase();
    console.log('Filtrando pedidos:', searchTerm);
    // Implement filter logic here
}

function displayOrders(orders) {
    const tbody = document.querySelector('#orders-table');
    if (tbody) {
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum pedido encontrado</td></tr>';
        } else {
            // Display orders
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.order_number || order.id}</td>
                    <td>${order.supplier_name || order.supplier}</td>
                    <td>${order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td>R$ ${parseFloat(order.total_value || order.total).toFixed(2)}</td>
                    <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="editOrder(${order.id})">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                            🗑️
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'Pendente': return 'warning';
        case 'Processando': return 'info';
        case 'Enviado': return 'primary';
        case 'Entregue': return 'success';
        case 'Cancelado': return 'danger';
        default: return 'secondary';
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#orders-table');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayOrders
}

function viewOrder(id) {
    console.log('Visualizando pedido:', id);
    
    // Fetch order data from API
    fetch(`/api/orders/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const order = data.data || data;
            
            // Show order details in a modal or redirect to details page
            alert(`Detalhes do Pedido #${order.id || id}\n\nFornecedor: ${order.supplier || 'N/A'}\nData: ${order.date || 'N/A'}\nTotal: R$ ${order.total || '0,00'}\nStatus: ${order.status || 'N/A'}`);
        })
        .catch(error => {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'orders-view',
                orderId: id
            });
            showToast('Erro', 'Erro ao carregar dados do pedido.', 'error');
        });
}

function editOrder(id) {
    console.log('Editando pedido:', id);
    
    // Fetch order data from API
    fetch(`/api/orders/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const order = data.data || data;
            
            // Populate form with order data
            document.getElementById('orderId').value = order.id || id;
            document.getElementById('orderSupplier').value = order.supplier_id || '';
            document.getElementById('orderDate').value = order.date || '';
            document.getElementById('orderStatus').value = order.status || 'Pendente';
            document.getElementById('orderNotes').value = order.notes || '';
            
            // Update modal title
            const modalTitle = document.getElementById('orderModalTitle');
            if (modalTitle) modalTitle.textContent = 'Editar Pedido';
            
            // Show modal
            const modal = document.getElementById('orderModal');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        })
        .catch(error => {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'orders-load'
            });
            showToast('Erro', 'Erro ao carregar dados do pedido.', 'error');
        });
}

function deleteOrder(id) {
    console.log('Excluindo pedido:', id);
    
    // Show confirmation dialog
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Make API call to delete order
    fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Pedido excluído com sucesso:', data);
        showToast('Sucesso', 'Pedido excluído com sucesso!', 'success');
        
        // Reload orders list
        loadOrders();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'orders-delete'
        });
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao excluir pedido: ${errorMessage}`, 'error');
    });
}

function saveOrder() {
    const form = document.getElementById('orderForm');
    const orderId = document.getElementById('orderId').value;
    
    // Get form data
    const orderData = {
        supplier_id: document.getElementById('orderSupplier').value,
        date: document.getElementById('orderDate').value,
        delivery_date: document.getElementById('orderDeliveryDate').value,
        status: document.getElementById('orderStatus').value,
        priority: document.getElementById('orderPriority').value,
        notes: document.getElementById('orderNotes').value.trim()
    };
    
    // Collect order items
    const items = [];
    const rows = document.querySelectorAll('#orderItems tr');
    
    rows.forEach(row => {
        const product = row.querySelector('select[name="product"]').value;
        const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
        const price = parseFloat(row.querySelector('input[name="price"]').value) || 0;
        
        if (product && quantity > 0 && price > 0) {
            items.push({
                product_id: product,
                quantity: quantity,
                unit_price: price,
                total: quantity * price
            });
        }
    });
    
    orderData.items = items;
    
    // Validate required fields
    if (!orderData.supplier_id || !orderData.date) {
        showToast('Erro', 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (items.length === 0) {
        showToast('Erro', 'Por favor, adicione pelo menos um item ao pedido.', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#orderModal .btn-primary');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';
    
    // Determine if it's create or update
    const isUpdate = orderId && orderId.trim() !== '';
    const url = isUpdate ? `/api/orders/${orderId}` : '/api/orders';
    const method = isUpdate ? 'PUT' : 'POST';
    
    // Make API call
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Pedido salvo com sucesso:', data);
        
        // Show success message
        const action = isUpdate ? 'atualizado' : 'criado';
        showToast('Sucesso', `Pedido ${action} com sucesso!`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        document.getElementById('orderId').value = '';
        
        // Reload orders list
        loadOrders();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'orders-save'
        });
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao salvar pedido: ${errorMessage}`, 'error');
    })
    .finally(() => {
        // Restore button state
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    });
}

function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toast.querySelector('.toast-header');
    
    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Remove existing type classes
    toastHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white');
    
    // Add appropriate styling based on type
    switch(type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning');
            break;
        default:
            toastHeader.classList.add('bg-info', 'text-white');
    }
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function addOrderItem() {
    const tbody = document.getElementById('orderItems');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <select class="form-control" name="product" required>
                <option value="">Selecione um produto</option>
            </select>
        </td>
        <td>
            <input type="number" class="form-control" name="quantity" min="1" required>
        </td>
        <td>
            <input type="number" class="form-control" name="price" step="0.01" min="0" required>
        </td>
        <td>
            <span class="item-total">R$ 0,00</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(this)">
                🗑️
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Add event listeners for calculation
    const quantityInput = newRow.querySelector('input[name="quantity"]');
    const priceInput = newRow.querySelector('input[name="price"]');
    
    quantityInput.addEventListener('input', calculateItemTotal);
    priceInput.addEventListener('input', calculateItemTotal);
}

function removeOrderItem(button) {
    const row = button.closest('tr');
    const tbody = document.getElementById('orderItems');
    
    // Don't remove if it's the last row
    if (tbody.children.length > 1) {
        row.remove();
        calculateOrderTotal();
    }
}

function calculateItemTotal(event) {
    const row = event.target.closest('tr');
    const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
    const price = parseFloat(row.querySelector('input[name="price"]').value) || 0;
    const total = quantity * price;
    
    const totalSpan = row.querySelector('.item-total');
    totalSpan.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    calculateOrderTotal();
}

function calculateOrderTotal() {
    const rows = document.querySelectorAll('#orderItems tr');
    let total = 0;
    
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
        const price = parseFloat(row.querySelector('input[name="price"]').value) || 0;
        total += quantity * price;
    });
    
    const totalElement = document.getElementById('orderTotal');
    if (totalElement) {
        totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}