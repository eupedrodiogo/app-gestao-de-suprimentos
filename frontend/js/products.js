// Products Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de Produtos carregada');
    
    // Initialize products functionality
    initializeProducts();
    
    // Load products data
    loadProducts();
});

function initializeProducts() {
    // Add event listeners for product forms and buttons
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductModal);
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
}

function loadProducts() {
    console.log('Carregando produtos...');
    
    // Show loading state
    showLoadingState();
    
    // Make API call to get products
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Produtos carregados:', data);
            hideLoadingState();
            // Extract the products array from the API response
            const products = data.data || [];
            displayProducts(products);
        })
        .catch(error => {
            console.error('Erro ao carregar produtos:', error);
            hideLoadingState();
            
            // Show error message in table
            const tbody = document.querySelector('#products-table');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i> 
                            Erro ao carregar produtos: ${error.message}
                        </td>
                    </tr>
                `;
            }
        });
}

function showAddProductModal() {
    console.log('showAddProductModal called'); // Debug log
    const modal = document.getElementById('productModal');
    if (modal) {
        console.log('Modal found'); // Debug log
        
        // Reset form and modal title for new product
        const form = document.getElementById('productForm');
        const productId = document.getElementById('productId');
        const modalTitle = document.getElementById('productModalTitle');
        
        if (form) form.reset();
        if (productId) productId.value = '';
        if (modalTitle) modalTitle.textContent = 'Novo Produto';
        
        // Generate automatic product code
        generateProductCode();
        
        // Check if bootstrap is available
        if (typeof bootstrap !== 'undefined') {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            console.log('Modal should be shown'); // Debug log
        } else {
            console.error('Bootstrap is not loaded');
        }
    } else {
        console.error('Modal not found');
    }
}

function generateProductCode() {
    // Generate a simple product code based on timestamp
    const timestamp = Date.now().toString().slice(-6);
    const code = `PROD${timestamp}`;
    const codeInput = document.getElementById('productCode');
    if (codeInput) {
        codeInput.value = code;
        console.log('Product code generated:', code); // Debug log
    } else {
        console.error('Product code input not found');
    }
}

function generateCodeFromCategory() {
    const category = document.getElementById('productCategory').value.trim();
    if (category) {
        // Get first 3 letters of category and add timestamp
        const categoryPrefix = category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        const code = `${categoryPrefix}${timestamp}`;
        document.getElementById('productCode').value = code;
    }
}

function validatePrice(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        input.setCustomValidity('O preço deve ser um número positivo');
        input.classList.add('is-invalid');
    } else {
        input.setCustomValidity('');
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }
}

function validateForm() {
    const form = document.getElementById('productForm');
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    });
    
    return isValid;
}

function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    console.log('Filtrando produtos:', searchTerm);
    // Implement filter logic here
}

function displayProducts(products) {
    const tbody = document.querySelector('#products-table');
    if (tbody) {
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado</td></tr>';
        } else {
            // Display products
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.nome}</td>
                    <td>${product.descricao || '-'}</td>
                    <td>${product.categoria}</td>
                    <td>${product.unidade}</td>
                    <td>R$ ${parseFloat(product.preco).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#products-table');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayProducts
}

function editProduct(id) {
    console.log('Editando produto:', id);
    
    // Fetch product data from API
    fetch(`/api/products/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const product = data.data || data;
            
            // Populate form with product data
            document.getElementById('productId').value = product.id || id;
            document.getElementById('productCode').value = product.code || '';
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productUnit').value = product.unit || '';
            document.getElementById('productPrice').value = product.price || '';
            document.getElementById('productStock').value = product.stock || 0;
            document.getElementById('productMinStock').value = product.min_stock || 0;
            
            // Update modal title
            const modalTitle = document.getElementById('productModalTitle');
            if (modalTitle) modalTitle.textContent = 'Editar Produto';
            
            // Show modal
            const modal = document.getElementById('productModal');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar produto:', error);
            showToast('Erro', 'Erro ao carregar dados do produto.', 'error');
        });
}

function deleteProduct(id) {
    console.log('Excluindo produto:', id);
    
    // Show confirmation dialog
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    // Make API call to delete product
    fetch(`/api/products/${id}`, {
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
        console.log('Produto excluído com sucesso:', data);
        showToast('Sucesso', 'Produto excluído com sucesso!', 'success');
        
        // Reload products list
        loadProducts();
    })
    .catch(error => {
        console.error('Erro ao excluir produto:', error);
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao excluir produto: ${errorMessage}`, 'error');
    });
}

function saveProduct() {
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId').value;
    
    // Get form data
    const productData = {
        code: document.getElementById('productCode').value.trim(),
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        unit: document.getElementById('productUnit').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value) || 0,
        min_stock: parseInt(document.getElementById('productMinStock').value) || 0,
        status: 'ativo'
    };
    
    // Validate required fields
    if (!productData.code || !productData.name || !productData.category || !productData.unit || !productData.price) {
        showToast('Erro', 'Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    // Validate code format
    if (productData.code.length < 3) {
        showToast('Erro', 'O código deve ter pelo menos 3 caracteres.', 'error');
        return;
    }
    
    // Validate price
    if (isNaN(productData.price) || productData.price <= 0) {
        showToast('Erro', 'O preço deve ser um número maior que zero.', 'error');
        return;
    }
    
    // Validate stock values
    if (productData.stock < 0 || productData.min_stock < 0) {
        showToast('Erro', 'Os valores de estoque não podem ser negativos.', 'error');
        return;
    }
    
    // Validate name length
    if (productData.name.length < 2) {
        showToast('Erro', 'O nome do produto deve ter pelo menos 2 caracteres.', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.querySelector('#productModal .btn-primary');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';
    
    // Determine if it's create or update
    const isUpdate = productId && productId.trim() !== '';
    const url = isUpdate ? `/api/products/${productId}` : '/api/products';
    const method = isUpdate ? 'PUT' : 'POST';
    
    // Make API call
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Produto salvo com sucesso:', data);
        
        // Show success message
        const action = isUpdate ? 'atualizado' : 'criado';
        showToast('Sucesso', `Produto ${action} com sucesso!`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        // Reset form
        form.reset();
        document.getElementById('productId').value = '';
        
        // Reload products list
        loadProducts();
    })
    .catch(error => {
        console.error('Erro ao salvar produto:', error);
        
        let errorMessage = 'Erro interno do servidor.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        }
        
        showToast('Erro', `Erro ao salvar produto: ${errorMessage}`, 'error');
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