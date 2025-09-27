// Quotes Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de Cotações carregada');
    
    // Initialize quotes functionality
    initializeQuotes();
    
    // Load quotes data
    loadQuotes();
});

function initializeQuotes() {
    // Add event listeners for quote forms and buttons
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    if (addQuoteBtn) {
        addQuoteBtn.addEventListener('click', showAddQuoteModal);
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchQuotes');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuotes);
    }
    
    // Add event listeners for automatic total calculation
    const quantityInput = document.getElementById('quoteQuantity');
    const unitPriceInput = document.getElementById('quoteUnitPrice');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotal);
    }
    
    if (unitPriceInput) {
        unitPriceInput.addEventListener('input', calculateTotal);
    }
}

function calculateTotal() {
    const quantity = parseInt(document.getElementById('quoteQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('quoteUnitPrice').value) || 0;
    const total = quantity * unitPrice;
    
    const totalInput = document.getElementById('quoteTotal');
    if (totalInput) {
        totalInput.value = total > 0 ? `R$ ${total.toFixed(2).replace('.', ',')}` : '';
    }
}

function loadQuotes() {
    console.log('Carregando cotações...');
    
    // Show loading state
    showLoadingState();
    
    // Make API call to get quotes
    fetch('/api/cotacoes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Cotações carregadas:', data);
            hideLoadingState();
            // Extract the quotes array from the API response
            const quotes = data.data || data.quotes || data || [];
            displayQuotes(quotes);
        })
        .catch(error => {
            log.error('Erro ao carregar cotações', { 
                error: error.message, 
                stack: error.stack,
                component: 'quotes-load'
            });
            hideLoadingState();
            showErrorMessage('Erro ao carregar cotações');
        });
}

function showAddQuoteModal() {
    const modal = document.getElementById('addQuoteModal');
    if (modal) {
        // Clear form
        const form = document.getElementById('quoteForm');
        if (form) form.reset();
        
        // Set current date
        const dateInput = document.getElementById('quoteDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        // Clear total field
        const totalInput = document.getElementById('quoteTotal');
        if (totalInput) totalInput.value = '';
        
        // Set modal title
        const modalTitle = document.getElementById('addQuoteModalLabel');
        if (modalTitle) modalTitle.textContent = 'Nova Cotação';
        
        // Load suppliers and products data
        loadSuppliersForQuote();
        loadProductsForQuote();
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function filterQuotes() {
    const searchTerm = document.getElementById('searchQuotes').value.toLowerCase();
    console.log('Filtrando cotações:', searchTerm);
    // Implement filter logic here
}

function displayQuotes(quotes) {
    const tbody = document.querySelector('#quotes-table');
    if (tbody) {
        if (quotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma cotação encontrada</td></tr>';
        } else {
            // Display quotes using correct Portuguese property names
            tbody.innerHTML = quotes.map(quote => `
                <tr>
                    <td>${quote.numero || quote.id}</td>
                    <td>${quote.fornecedor || 'N/A'}</td>
                    <td>${quote.dataCotacao ? new Date(quote.dataCotacao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td>R$ ${parseFloat(quote.precoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><span class="badge bg-${getStatusColor(quote.status)}">${quote.status || 'N/A'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewQuote(${quote.id})">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="editQuote(${quote.id})">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteQuote(${quote.id})">
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
        case 'Aprovada': return 'success';
        case 'Rejeitada': return 'danger';
        default: return 'secondary';
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#quotes-table');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayQuotes
}

function viewQuote(id) {
    console.log('Visualizando cotação:', id);
    
    // Fetch quote data from API
    fetch(`/api/cotacoes/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const quote = data.data || data;
            
            // Show quote details in a modal or redirect to details page
            alert(`Detalhes da Cotação #${quote.id || id}\n\nFornecedor: ${quote.supplier_name || 'N/A'}\nData: ${quote.request_date || 'N/A'}\nTotal: R$ ${quote.total_value || '0,00'}\nStatus: ${quote.status || 'N/A'}\nDescrição: ${quote.notes || 'N/A'}`);
        })
        .catch(error => {
            console.error('Erro ao carregar cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: id,
                component: 'quotes-view'
            });
            showToast('Erro', 'Erro ao carregar dados da cotação.', 'error');
        });
}

function editQuote(id) {
    console.log('Editando cotação:', id);
    
    // First load suppliers and products, then fetch quote data
    Promise.all([
        loadSuppliersForQuote(),
        loadProductsForQuote()
    ]).then(() => {
        // Fetch quote data from API
        return fetch(`/api/cotacoes/${id}`);
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        const quote = data.data || data;
        
        // Populate form with quote data
        document.getElementById('quoteId').value = quote.id || id;
        
        // Set supplier - wait a bit for the select to be populated
        setTimeout(() => {
            const supplierField = document.getElementById('quoteSupplier');
            if (supplierField) {
                supplierField.value = quote.fornecedorId || '';
            }
        }, 100);
        
        document.getElementById('quoteDate').value = quote.dataCotacao || '';
        document.getElementById('quoteTotal').value = quote.precoTotal || '';
        
        // Set product - wait a bit for the select to be populated
        setTimeout(() => {
            const productField = document.getElementById('quoteProduct');
            if (productField) {
                productField.value = quote.produtoId || '';
            }
        }, 100);
        
        // Set quantity if field exists
        const quantityField = document.getElementById('quoteQuantity');
        if (quantityField) {
            quantityField.value = quote.quantidade || '';
        }
        
        // Set unit price if field exists
        const unitPriceField = document.getElementById('quoteUnitPrice');
        if (unitPriceField) {
            unitPriceField.value = quote.precoUnitario || '';
        }
        
        // Set status if field exists
        const statusField = document.getElementById('quoteStatus');
        if (statusField) {
            statusField.value = quote.status || 'Pendente';
        }
        
        // Check if notes field exists before setting it
        const notesField = document.getElementById('quoteNotes');
        if (notesField) {
            notesField.value = quote.observacoes || '';
        }
        
        // Update modal title
        const modalTitle = document.getElementById('addQuoteModalLabel') || document.getElementById('quoteModalTitle');
        if (modalTitle) modalTitle.textContent = 'Editar Cotação';
        
        // Show modal
        const modal = document.getElementById('addQuoteModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }).catch(error => {
        console.error('Erro ao carregar cotação', { 
            error: error.message, 
            stack: error.stack,
            quoteId: id,
            component: 'quotes-edit'
        });
        showToast('Erro', 'Erro ao carregar dados da cotação.', 'error');
    });
}

function deleteQuote(id) {
    console.log('Excluindo cotação:', id);
    
    // Show confirmation dialog
    if (!confirm('Tem certeza que deseja excluir esta cotação? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Make API call to delete quote
    fetch(`/api/cotacoes/${id}`, {
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
        console.log('Cotação excluída com sucesso:', data);
        showToast('Sucesso', 'Cotação excluída com sucesso!', 'success');
        
        // Reload quotes list
        loadQuotes();
    })
    .catch(error => {
        console.error('Erro ao excluir cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: id,
                component: 'quotes-delete'
            });
            const errorMessage = error.message || 'Erro desconhecido';
            showToast('Erro', `Erro ao excluir cotação: ${errorMessage}`, 'error');
    });
}

function saveQuote() {
    const form = document.getElementById('quoteForm');
    
    // Get form data
    const supplier = document.getElementById('quoteSupplier').value;
    const date = document.getElementById('quoteDate').value;
    const product = document.getElementById('quoteProduct').value;
    const quantity = parseInt(document.getElementById('quoteQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('quoteUnitPrice').value) || 0;
    const notes = document.getElementById('quoteNotes').value.trim();
    const total = quantity * unitPrice;
    
    const quoteData = {
        fornecedorId: supplier,
        produtoId: product,
        quantidade: quantity,
        precoUnitario: unitPrice,
        observacoes: notes,
        status: 'Pendente'
    };
    
    // Validate required fields
    if (!supplier || !date || !product || quantity <= 0 || unitPrice <= 0) {
        showToast('Erro', 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#addQuoteModal .btn-primary');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';
    
    // Create new quote
    const url = '/api/cotacoes';
    const method = 'POST';
    
    // Make API call
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Cotação salva com sucesso:', data);
        
        // Show success message
        showToast('Sucesso', 'Cotação criada com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addQuoteModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        
        // Reload quotes list
        loadQuotes();
    })
    .catch(error => {
        console.error('Erro ao salvar cotação:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        showToast('Erro', `Erro ao salvar cotação: ${errorMessage}`, 'error');
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

// Function to load suppliers for quote dropdown
async function loadSuppliersForQuote() {
    try {
        const response = await fetch('/api/fornecedores');
        if (response.ok) {
            const suppliers = await response.json();
            const supplierSelect = document.getElementById('quoteSupplier');
            
            if (supplierSelect) {
                // Clear existing options except the first one
                supplierSelect.innerHTML = '<option value="">Selecione um fornecedor</option>';
                
                // Add suppliers to dropdown
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.nome;
                    supplierSelect.appendChild(option);
                });
            }
            return suppliers;
        } else {
            console.error('Erro ao carregar fornecedores:', response.statusText);
            showToast('Erro', 'Erro ao carregar lista de fornecedores', 'error');
            throw new Error('Erro ao carregar fornecedores');
        }
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        showToast('Erro', 'Erro ao carregar lista de fornecedores', 'error');
        throw error;
    }
}

// Function to load products for quote dropdown
async function loadProductsForQuote() {
    try {
        const response = await fetch('/api/produtos');
        if (response.ok) {
            const products = await response.json();
            const productSelect = document.getElementById('quoteProduct');
            
            if (productSelect) {
                // Clear existing options except the first one
                productSelect.innerHTML = '<option value="">Selecione um produto</option>';
                
                // Add products to dropdown
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.nome} - ${product.codigo}`;
                    productSelect.appendChild(option);
                });
            }
            return products;
        } else {
            console.error('Erro ao carregar produtos:', response.statusText);
            showToast('Erro', 'Erro ao carregar lista de produtos', 'error');
            throw new Error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showToast('Erro', 'Erro ao carregar lista de produtos', 'error');
        throw error;
    }
}