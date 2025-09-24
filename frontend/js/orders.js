// Orders Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize orders functionality
    initializeOrders();
    
    // Make showAddOrderModal available globally for onclick (compatibility)
    window.showAddOrderModal = showAddOrderModal;
    
    // Setup button click listener
    const addOrderBtn = document.getElementById('addOrderBtn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAddOrderModal();
        });
    }

    // Load orders on page load
    loadOrders();
});

function initializeOrders() {
    console.log('🔧 DEBUG: initializeOrders chamada');
    console.log('🔧 DEBUG: User Agent:', navigator.userAgent);
    console.log('🔧 DEBUG: Screen width:', window.screen.width);
    console.log('🔧 DEBUG: Window width:', window.innerWidth);
    
    // Add event listener for the add order button
    const addOrderBtn = document.getElementById('addOrderBtn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', showAddOrderModal);
        console.log('🔧 DEBUG: Event listener adicionado ao addOrderBtn');
        
        // Test if button is clickable
        console.log('🔧 DEBUG: Button styles:', window.getComputedStyle(addOrderBtn));
        console.log('🔧 DEBUG: Button display:', window.getComputedStyle(addOrderBtn).display);
        console.log('🔧 DEBUG: Button pointer-events:', window.getComputedStyle(addOrderBtn).pointerEvents);
        console.log('🔧 DEBUG: Button z-index:', window.getComputedStyle(addOrderBtn).zIndex);
    } else {
        console.log('🔧 DEBUG: addOrderBtn não encontrado');
    }

    // Also look for buttons with onclick attribute
    const onclickButtons = document.querySelectorAll('button[onclick*="showAddOrderModal"]');
    console.log('🔧 DEBUG: Botões com onclick encontrados:', onclickButtons.length);
    onclickButtons.forEach((btn, index) => {
        console.log(`🔧 DEBUG: Botão ${index}:`, btn);
        console.log(`🔧 DEBUG: Botão ${index} display:`, window.getComputedStyle(btn).display);
        console.log(`🔧 DEBUG: Botão ${index} pointer-events:`, window.getComputedStyle(btn).pointerEvents);
    });

    // Initialize search functionality
    const searchInput = document.getElementById('searchOrders');
    if (searchInput) {
        searchInput.addEventListener('input', filterOrders);
    }

    // Add event listeners for quantity and price inputs
    document.addEventListener('input', function(e) {
        if (e.target.name === 'quantity' || e.target.name === 'price') {
            calculateItemTotal(e);
        }
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
    const hiddenId = document.getElementById('orderId');
    if (hiddenId) hiddenId.value = '';
    
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
    
    // Load suppliers and products for the modal
    loadSuppliersForModal();
    loadProductsForModal();
    
    // Get modal elements
    const modalTitle = document.getElementById('orderModalTitle');
    const orderModal = document.getElementById('orderModal');
    
    if (modalTitle) modalTitle.textContent = 'Novo Pedido';
    
    // Show modal
    if (orderModal) {
        try {
            // Check if Bootstrap is available
            if (typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(orderModal);
                bsModal.show();
            } else {
                // Fallback: show modal manually
                orderModal.style.display = 'block';
                orderModal.classList.add('show');
            }
        } catch (error) {
            console.error('Erro ao exibir modal:', error);
        }
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
    console.log('🔧 DEBUG: Editando pedido:', id);
    console.log('🔧 DEBUG: Tipo do ID:', typeof id);
    
    // Primeiro, carregar fornecedores e produtos
    loadSuppliersForModal();
    loadProductsForModal();
    
    // Aguardar um pouco para os dados carregarem e então buscar o pedido
    setTimeout(() => {
        fetch(`/api/orders/${id}`)
        .then(orderResponse => {
        console.log('🔧 DEBUG: Response status:', orderResponse.status);
        console.log('🔧 DEBUG: Response ok:', orderResponse.ok);
        
        if (!orderResponse.ok) {
            throw new Error(`HTTP error! status: ${orderResponse.status}`);
        }
        return orderResponse.json();
    })
    .then(data => {
        console.log('🔧 DEBUG: Dados recebidos da API:', data);
        const order = data.data || data;
        console.log('🔧 DEBUG: Objeto order extraído:', order);
        
        // Verificar se os elementos existem antes de tentar preenchê-los
        const orderIdField = document.getElementById('orderId');
        const orderSupplierField = document.getElementById('orderSupplier');
        const orderDateField = document.getElementById('orderDate');
        const orderDeliveryDateField = document.getElementById('orderDeliveryDate');
        const orderStatusField = document.getElementById('orderStatus');
        const orderPriorityField = document.getElementById('orderPriority');
        const orderNotesField = document.getElementById('orderNotes');
        const orderTotalField = document.getElementById('orderTotal');
        
        console.log('🔧 DEBUG: Campos encontrados:', {
            orderId: !!orderIdField,
            orderSupplier: !!orderSupplierField,
            orderDate: !!orderDateField,
            orderDeliveryDate: !!orderDeliveryDateField,
            orderStatus: !!orderStatusField,
            orderPriority: !!orderPriorityField,
            orderNotes: !!orderNotesField,
            orderTotal: !!orderTotalField
        });
        
        // Populate form with order data
        if (orderIdField) {
            orderIdField.value = order.id || id;
            console.log('🔧 DEBUG: orderId preenchido com:', order.id || id);
        }
        
        if (orderSupplierField) {
            orderSupplierField.value = order.supplier_id || '';
            console.log('🔧 DEBUG: orderSupplier preenchido com:', order.supplier_id || '');
        }
        
        if (orderDateField) {
            const dateValue = order.order_date || order.date || '';
            orderDateField.value = dateValue;
            console.log('🔧 DEBUG: orderDate preenchido com:', dateValue);
        }
        
        if (orderDeliveryDateField) {
            const deliveryDateValue = order.delivery_date || '';
            orderDeliveryDateField.value = deliveryDateValue;
            console.log('🔧 DEBUG: orderDeliveryDate preenchido com:', deliveryDateValue);
        }
        
        if (orderStatusField) {
            const statusValue = order.status || 'pendente';
            orderStatusField.value = statusValue;
            console.log('🔧 DEBUG: orderStatus preenchido com:', statusValue);
        }
        
        if (orderPriorityField) {
            const priorityValue = order.priority || 'media';
            orderPriorityField.value = priorityValue;
            console.log('🔧 DEBUG: orderPriority preenchido com:', priorityValue);
        }
        
        if (orderNotesField) {
            const notesValue = order.notes || order.observations || '';
            orderNotesField.value = notesValue;
            console.log('🔧 DEBUG: orderNotes preenchido com:', notesValue);
        }
        
        if (orderTotalField) {
            const totalValue = order.total_value || 0;
            orderTotalField.textContent = `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            console.log('🔧 DEBUG: orderTotal preenchido com:', totalValue);
        }
        
        // Populate order items
        populateOrderItems(order.items || []);
        
        // Update modal title
        const modalTitle = document.getElementById('orderModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Pedido';
            console.log('🔧 DEBUG: Título do modal atualizado');
        }
        
        // Show modal
        const modal = document.getElementById('orderModal');
        console.log('🔧 DEBUG: Modal encontrado:', !!modal);
        console.log('🔧 DEBUG: Bootstrap disponível:', typeof bootstrap !== 'undefined');
        
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            console.log('🔧 DEBUG: Modal exibido');
        } else if (modal) {
            // Fallback para mostrar modal sem Bootstrap
            modal.style.display = 'block';
                modal.classList.add('show');
                console.log('🔧 DEBUG: Modal exibido via fallback');
            }
        })
        .catch(error => {
            console.error('🔧 DEBUG: Erro na requisição:', error);
            console.error('🔧 DEBUG: Stack trace:', error.stack);
            
            if (typeof showToast === 'function') {
                showToast('Erro', 'Erro ao carregar dados do pedido.', 'error');
            } else {
                alert('Erro ao carregar dados do pedido: ' + error.message);
            }
        });
    }, 500); // Aguardar 500ms para os dados carregarem
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
    console.log('🔧 DEBUG: saveOrder() chamada');
    
    const form = document.getElementById('orderForm');
    const orderId = document.getElementById('orderId').value;
    
    console.log('🔧 DEBUG: Form encontrado:', !!form);
    console.log('🔧 DEBUG: Order ID:', orderId);
    
    // Get form data
    const orderData = {
        supplier_id: document.getElementById('orderSupplier').value,
        date: document.getElementById('orderDate').value,
        delivery_date: document.getElementById('orderDeliveryDate').value,
        status: document.getElementById('orderStatus').value,
        priority: document.getElementById('orderPriority').value,
        notes: document.getElementById('orderNotes').value.trim()
    };
    
    console.log('🔧 DEBUG: Order data:', orderData);
    
    // Collect order items
    const items = [];
    const rows = document.querySelectorAll('#orderItems tr');
    
    console.log('🔧 DEBUG: Linhas de itens encontradas:', rows.length);
    
    rows.forEach((row, index) => {
        const productSelect = row.querySelector('select[name="product"]');
        const quantityInput = row.querySelector('input[name="quantity"]');
        const priceInput = row.querySelector('input[name="price"]');
        
        console.log(`🔧 DEBUG: Item ${index}:`, {
            productSelect: !!productSelect,
            quantityInput: !!quantityInput,
            priceInput: !!priceInput
        });
        
        if (productSelect && quantityInput && priceInput) {
            const product = productSelect.value;
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            
            console.log(`🔧 DEBUG: Item ${index} valores:`, { product, quantity, price });
            
            if (product && quantity > 0 && price > 0) {
                items.push({
                    product_id: product,
                    quantity: quantity,
                    unit_price: price,
                    total: quantity * price
                });
            }
        }
    });
    
    orderData.items = items;
    
    console.log('🔧 DEBUG: Items coletados:', items);
    
    // Validate required fields
    if (!orderData.supplier_id || !orderData.date) {
        console.log('🔧 DEBUG: Validação falhou - campos obrigatórios');
        showToast('Erro', 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (items.length === 0) {
        console.log('🔧 DEBUG: Validação falhou - nenhum item');
        showToast('Erro', 'Por favor, adicione pelo menos um item ao pedido.', 'error');
        return;
    }
    
    console.log('🔧 DEBUG: Validação passou, prosseguindo com salvamento');
    
    // Show loading state
    const saveBtn = document.querySelector('#orderModal .btn-primary');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';
    
    // Determine if it's create or update
    const isUpdate = orderId && orderId.trim() !== '';
    const url = isUpdate ? `/api/orders/${orderId}` : '/api/orders';
    const method = isUpdate ? 'PUT' : 'POST';
    
    console.log('🔧 DEBUG: Fazendo requisição:', { url, method, orderData });
    
    // Make API call
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        console.log('🔧 DEBUG: Resposta recebida:', response.status, response.statusText);
        
        if (!response.ok) {
            return response.json().then(err => {
                console.log('🔧 DEBUG: Erro na resposta:', err);
                return Promise.reject(err);
            });
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
    
    // Load products for this new row
    const productSelect = newRow.querySelector('select[name="product"]');
    if (window.availableProducts && window.availableProducts.length > 0) {
        window.availableProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - R$ ${product.price}`;
            option.dataset.price = product.price;
            productSelect.appendChild(option);
        });
    }
    
    // Add event listener for product selection to auto-fill price
    productSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.price) {
            const priceInput = newRow.querySelector('input[name="price"]');
            priceInput.value = selectedOption.dataset.price;
            calculateItemTotal({ target: priceInput });
        }
    });
    
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

// Load suppliers for the modal
function loadSuppliersForModal() {
    console.log('🔧 DEBUG: Carregando fornecedores para o modal');
    
    fetch('/api/suppliers')
        .then(response => response.json())
        .then(suppliers => {
            console.log('🔧 DEBUG: Fornecedores carregados:', suppliers.length);
            const supplierSelect = document.getElementById('orderSupplier');
            if (supplierSelect) {
                supplierSelect.innerHTML = '<option value="">Selecione um fornecedor</option>';
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    supplierSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('🔧 DEBUG: Erro ao carregar fornecedores:', error);
        });
}

// Load products for the modal
function loadProductsForModal() {
    console.log('🔧 DEBUG: Carregando produtos para o modal');
    
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            console.log('🔧 DEBUG: Produtos carregados:', products.length);
            // Store products globally for use in order items
            window.availableProducts = products;
            
            // Update any existing product selects in order items
            const productSelects = document.querySelectorAll('#orderItems select[name="product"]');
            productSelects.forEach(select => {
                select.innerHTML = '<option value="">Selecione um produto</option>';
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} - R$ ${product.price}`;
                    option.dataset.price = product.price;
                    select.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('🔧 DEBUG: Erro ao carregar produtos:', error);
        });
}

// Populate order items in the table
function populateOrderItems(items) {
    console.log('🔧 DEBUG: Populando itens do pedido:', items);
    
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) {
        console.error('🔧 DEBUG: Container de itens não encontrado');
        return;
    }
    
    // Clear existing items
    orderItemsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        console.log('🔧 DEBUG: Nenhum item para popular, adicionando linha vazia');
        addOrderItem();
        return;
    }
    
    items.forEach((item, index) => {
        console.log(`🔧 DEBUG: Populando item ${index + 1}:`, item);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-control" name="product" required>
                    <option value="">Selecione um produto</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-control" name="quantity" min="1" value="${item.quantity || 1}" required>
            </td>
            <td>
                <input type="number" class="form-control" name="price" step="0.01" min="0" value="${item.unit_price || 0}" required>
            </td>
            <td>
                <span class="item-total">R$ ${(item.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(this)">
                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </td>
        `;
        
        orderItemsContainer.appendChild(row);
        
        // Populate product select with available products
        const productSelect = row.querySelector('select[name="product"]');
        if (window.availableProducts && productSelect) {
            window.availableProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - R$ ${product.price}`;
                option.dataset.price = product.price;
                
                // Select the current product
                if (product.id == item.product_id) {
                    option.selected = true;
                }
                
                productSelect.appendChild(option);
            });
        }
        
        // Add event listeners for calculations
        const quantityInput = row.querySelector('input[name="quantity"]');
        const priceInput = row.querySelector('input[name="price"]');
        
        [quantityInput, priceInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    updateItemTotal(row);
                    calculateOrderTotal();
                });
            }
        });
        
        if (productSelect) {
            productSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption && selectedOption.dataset.price) {
                    priceInput.value = selectedOption.dataset.price;
                    updateItemTotal(row);
                    calculateOrderTotal();
                }
            });
        }
    });
    
    // Recalculate total
    calculateOrderTotal();
}

// Update individual item total
function updateItemTotal(row) {
    const quantity = parseFloat(row.querySelector('input[name="quantity"]').value) || 0;
    const price = parseFloat(row.querySelector('input[name="price"]').value) || 0;
    const total = quantity * price;
    
    const totalSpan = row.querySelector('.item-total');
    if (totalSpan) {
        totalSpan.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}