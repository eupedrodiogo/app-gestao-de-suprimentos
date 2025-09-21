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
    console.log('Carregando fornecedores...');
    
    // Show loading state
    showLoadingState();
    
    // Make API call to get suppliers
    fetch('/api/suppliers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar fornecedores');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fornecedores carregados:', data);
            hideLoadingState();
            
            // Display suppliers data
            let suppliers = data.suppliers || data || [];
            // Ensure suppliers is always an array
            if (!Array.isArray(suppliers)) {
                suppliers = [];
            }
            displaySuppliers(suppliers);
        })
        .catch(error => {
            console.error('Erro ao carregar fornecedores:', error);
            hideLoadingState();
            
            // Show error message
            const tbody = document.querySelector('#suppliers-table');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar fornecedores</td></tr>';
            }
            
            showToast('Erro', 'Erro ao carregar fornecedores', 'error');
        });
}

function showAddSupplierModal() {
    // Limpar formulário
    const form = document.getElementById('supplierForm');
    if (form) {
        form.reset();
        document.getElementById('supplierId').value = '';
    }
    
    // Definir título do modal para novo fornecedor
    const modalTitle = document.getElementById('supplierModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Novo Fornecedor';
    }
    
    // Abrir modal
    const modal = document.getElementById('supplierModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#suppliersTable tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2 mb-0">Carregando fornecedores...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displaySuppliers function
}

function filterSuppliers() {
    const searchTerm = document.getElementById('searchSuppliers').value.toLowerCase();
    console.log('Filtrando fornecedores:', searchTerm);
    // Implement filter logic here
}

function displaySuppliers(suppliers) {
    const tbody = document.querySelector('#suppliers-table');
    if (tbody) {
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum fornecedor encontrado</td></tr>';
        } else {
            // Display suppliers
            tbody.innerHTML = suppliers.map(supplier => `
                <tr>
                    <td>${supplier.id || 'N/A'}</td>
                    <td>${supplier.name || 'N/A'}</td>
                    <td>${supplier.cnpj || 'N/A'}</td>
                    <td>${supplier.contact_name || 'N/A'}</td>
                    <td>${supplier.email || 'N/A'}</td>
                    <td>
                        <span class="badge ${supplier.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                            ${supplier.status || 'N/A'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editSupplier(${supplier.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#suppliers-table');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displaySuppliers
}

function editSupplier(id) {
    console.log('Editando fornecedor:', id);
    
    // Fetch supplier data from API
    fetch(`/api/suppliers/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const supplier = data.data || data;
            
            // Populate form with supplier data
            document.getElementById('supplierId').value = supplier.id || id;
            document.getElementById('supplierName').value = supplier.name || '';
            document.getElementById('supplierContact').value = supplier.contact || '';
            document.getElementById('supplierEmail').value = supplier.email || '';
            document.getElementById('supplierPhone').value = supplier.phone || '';
            document.getElementById('supplierCnpj').value = supplier.cnpj || '';
            document.getElementById('supplierStatus').value = supplier.status || 'ativo';
            document.getElementById('supplierAddress').value = supplier.address || '';
            document.getElementById('supplierNotes').value = supplier.notes || '';
            
            // Update modal title
            const modalTitle = document.getElementById('supplierModalTitle');
            if (modalTitle) modalTitle.textContent = 'Editar Fornecedor';
            
            // Show modal
            const modal = document.getElementById('supplierModal');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar fornecedor:', error);
            showToast('Erro', 'Erro ao carregar dados do fornecedor.', 'error');
        });
}

function deleteSupplier(id) {
    console.log('Excluindo fornecedor:', id);
    
    // Show confirmation dialog
    if (!confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Make API call to delete supplier
    fetch(`/api/suppliers/${id}`, {
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
        console.log('Fornecedor excluído com sucesso:', data);
        showToast('Sucesso', 'Fornecedor excluído com sucesso!', 'success');
        
        // Reload suppliers list
        loadSuppliers();
    })
    .catch(error => {
        console.error('Erro ao excluir fornecedor:', error);
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao excluir fornecedor: ${errorMessage}`, 'error');
    });
}

function saveSupplier() {
    const form = document.getElementById('supplierForm');
    const supplierId = document.getElementById('supplierId').value;
    
    // Get form data
    const supplierData = {
        name: document.getElementById('supplierName').value.trim(),
        contact_name: document.getElementById('supplierContact').value.trim(),
        email: document.getElementById('supplierEmail').value.trim(),
        phone: document.getElementById('supplierPhone').value.trim(),
        cnpj: document.getElementById('supplierCnpj').value.trim(),
        status: document.getElementById('supplierStatus').value,
        address: document.getElementById('supplierAddress').value.trim(),
        notes: document.getElementById('supplierNotes').value.trim()
    };
    
    // Validate required fields
    if (!supplierData.name || !supplierData.cnpj) {
        showToast('Erro', 'Por favor, preencha todos os campos obrigatórios (Nome e CNPJ).', 'error');
        return;
    }
    
    // Validate email format if provided
    if (supplierData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(supplierData.email)) {
            showToast('Erro', 'Por favor, digite um email válido.', 'error');
            return;
        }
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#supplierModal .btn-primary');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';
    
    // Determine if it's create or update
    const isUpdate = supplierId && supplierId.trim() !== '';
    const url = isUpdate ? `/api/suppliers/${supplierId}` : '/api/suppliers';
    const method = isUpdate ? 'PUT' : 'POST';
    
    // Make API call
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Fornecedor salvo com sucesso:', data);
        
        // Show success message
        const action = isUpdate ? 'atualizado' : 'criado';
        showToast('Sucesso', `Fornecedor ${action} com sucesso!`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('supplierModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        document.getElementById('supplierId').value = '';
        
        // Reload suppliers list
        loadSuppliers();
    })
    .catch(error => {
        console.error('Erro ao salvar fornecedor:', error);
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao salvar fornecedor: ${errorMessage}`, 'error');
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