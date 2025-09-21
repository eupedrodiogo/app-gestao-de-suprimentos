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
            const orders = data.data || [];
            displayOrders(orders);
        })
        .catch(error => {
            console.error('Erro ao carregar pedidos:', error);
            hideLoadingState();
            
            // Show error message in table
            const tbody = document.querySelector('#ordersTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i> 
                            Erro ao carregar pedidos: ${error.message}
                        </td>
                    </tr>
                `;
            }
        });
}

function showAddOrderModal() {
    const modal = document.getElementById('addOrderModal');
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
    const tbody = document.querySelector('#ordersTable tbody');
    if (tbody) {
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum pedido encontrado</td></tr>';
        } else {
            // Display orders
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.supplier}</td>
                    <td>${order.date}</td>
                    <td>R$ ${order.total}</td>
                    <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="editOrder(${order.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                            <i class="bi bi-trash"></i>
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
    const tbody = document.querySelector('#ordersTable tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayOrders
}

function viewOrder(id) {
    console.log('Visualizando pedido:', id);
    // Implement view functionality
}

function editOrder(id) {
    console.log('Editando pedido:', id);
    // Implement edit functionality
}

function deleteOrder(id) {
    console.log('Excluindo pedido:', id);
    // Implement delete functionality
}