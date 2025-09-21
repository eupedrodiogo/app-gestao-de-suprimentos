// Suppliers Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de Fornecedores carregada');
    
    // Initialize suppliers functionality
    initializeSuppliers();
    
    // Load suppliers data
    loadSuppliers();
});

function initializeSuppliers() {
    // Add event listeners for supplier forms and buttons
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', showAddSupplierModal);
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchSuppliers');
    if (searchInput) {
        searchInput.addEventListener('input', filterSuppliers);
    }
}

function loadSuppliers() {
    // Simulate loading suppliers data
    console.log('Carregando fornecedores...');
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call
    setTimeout(() => {
        hideLoadingState();
        displaySuppliers([]);
    }, 1000);
}

function showAddSupplierModal() {
    const modal = document.getElementById('addSupplierModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function filterSuppliers() {
    const searchTerm = document.getElementById('searchSuppliers').value.toLowerCase();
    console.log('Filtrando fornecedores:', searchTerm);
    // Implement filter logic here
}

function displaySuppliers(suppliers) {
    const tbody = document.querySelector('#suppliersTable tbody');
    if (tbody) {
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum fornecedor encontrado</td></tr>';
        } else {
            // Display suppliers
            tbody.innerHTML = suppliers.map(supplier => `
                <tr>
                    <td>${supplier.id}</td>
                    <td>${supplier.name}</td>
                    <td>${supplier.contact}</td>
                    <td>${supplier.email}</td>
                    <td>${supplier.phone}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editSupplier(${supplier.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#suppliersTable tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displaySuppliers
}

function editSupplier(id) {
    console.log('Editando fornecedor:', id);
    // Implement edit functionality
}

function deleteSupplier(id) {
    console.log('Excluindo fornecedor:', id);
    // Implement delete functionality
}