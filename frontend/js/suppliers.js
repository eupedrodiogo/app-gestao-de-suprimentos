// Suppliers Page JavaScript

console.log('Suppliers page loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    console.log('Inicializando página de Fornecedores...');
    
    // Carregar fornecedores
    loadSuppliers();
    
    // Configurar event listener para o botão "Novo Fornecedor"
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', function() {
            console.log('Botão Novo Fornecedor clicado');
            openNewSupplierModal();
        });
        console.log('Event listener do botão Novo Fornecedor configurado');
    } else {
        console.error('Botão "Novo Fornecedor" não encontrado!');
    }
});

function loadSuppliers() {
    console.log('=== CARREGANDO FORNECEDORES ===');
    
    const tbody = document.querySelector('#suppliers-table');
    console.log('Elemento tbody encontrado:', tbody);
    
    if (!tbody) {
        console.error('Elemento #suppliers-table não encontrado!');
        return;
    }
    
    // Mostrar loading
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando fornecedores...</td></tr>';
    
    // Fazer requisição para API
    fetch('/api/fornecedores')
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('=== DADOS RECEBIDOS DA API ===');
            console.log('Data:', data);
            console.log('Tipo:', typeof data);
            console.log('É array:', Array.isArray(data));
            
            // Extrair o array de dados da resposta da API
            let suppliers = [];
            if (data && data.success && Array.isArray(data.data)) {
                suppliers = data.data;
            } else if (Array.isArray(data)) {
                suppliers = data;
            }
            
            console.log('Suppliers extraídos:', suppliers);
            console.log('Length:', suppliers.length);
            
            // Verificar se temos dados
            if (!suppliers || suppliers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum fornecedor encontrado</td></tr>';
                return;
            }
            
            // Exibir dados usando nomes corretos das propriedades em português
            let html = '';
            suppliers.forEach(supplier => {
                html += `
                    <tr>
                        <td>${supplier.id || 'N/A'}</td>
                        <td>${supplier.nome || 'N/A'}</td>
                        <td>${supplier.cnpj || 'N/A'}</td>
                        <td>${supplier.contato || 'N/A'}</td>
                        <td>${supplier.email || 'N/A'}</td>
                        <td>
                            <span class="badge ${supplier.status === 'ativo' ? 'bg-success' : 'bg-secondary'}">
                                ${supplier.status || 'N/A'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editSupplier(${supplier.id})">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.id})">Excluir</button>
                        </td>
                    </tr>
                `;
            });
            
            console.log('=== INSERINDO HTML NA TABELA ===');
            console.log('HTML gerado:', html.substring(0, 200) + '...');
            tbody.innerHTML = html;
            console.log('=== HTML INSERIDO COM SUCESSO ===');
        })
        .catch(error => {
            console.error('Erro ao carregar fornecedores:', error);
        });
}

// Função para editar fornecedor
function editSupplier(id) {
    console.log('Editando fornecedor ID:', id);
    
    // Buscar dados do fornecedor
    fetch(`/api/fornecedores/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const supplier = data.data;
                
                // Alterar título do modal para edição
                document.getElementById('supplierModalTitle').textContent = 'Editar Fornecedor';
                
                // Preencher modal de edição
                document.getElementById('supplierId').value = supplier.id;
                document.getElementById('supplierName').value = supplier.name || '';
                document.getElementById('supplierCnpj').value = supplier.cnpj || '';
                document.getElementById('supplierContact').value = supplier.contact || supplier.contact_name || '';
                document.getElementById('supplierEmail').value = supplier.email || '';
                document.getElementById('supplierStatus').value = supplier.status || 'ativo';
                document.getElementById('supplierPhone').value = supplier.phone || '';
                document.getElementById('supplierAddress').value = supplier.address || '';
                document.getElementById('supplierNotes').value = supplier.notes || '';
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('supplierModal'));
                modal.show();
            }
        })
        .catch(error => {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'suppliers-load'
            });
            alert('Erro ao carregar dados do fornecedor');
        });
}

// Função para salvar fornecedor (criar ou editar)
function saveSupplier() {
    const id = document.getElementById('supplierId').value;
    const name = document.getElementById('supplierName').value;
    const cnpj = document.getElementById('supplierCnpj').value;
    const contact = document.getElementById('supplierContact').value;
    const phone = document.getElementById('supplierPhone').value;
    const email = document.getElementById('supplierEmail').value;
    const status = document.getElementById('supplierStatus').value;
    const address = document.getElementById('supplierAddress').value;
    const notes = document.getElementById('supplierNotes').value;

    // Validação básica
    if (!name || !cnpj) {
        alert('Nome e CNPJ são obrigatórios!');
        return;
    }

    const supplierData = {
        name: name,
        cnpj: cnpj,
        contact_name: contact,
        phone: phone,
        email: email,
        status: status,
        address: address,
        notes: notes
    };

    const isEdit = id && id !== '';
    const url = isEdit ? `/api/fornecedores/${id}` : '/api/fornecedores';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(isEdit ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!');
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('supplierModal'));
            modal.hide();
            
            // Limpar formulário
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierId').value = '';
            document.getElementById('supplierModalTitle').textContent = 'Novo Fornecedor';
            
            // Recarregar lista
            loadSuppliers();
        } else {
            alert('Erro ao salvar fornecedor: ' + (data.message || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        log.error('Erro ao salvar fornecedor', { 
            error: error.message, 
            stack: error.stack,
            supplierData: supplierData,
            component: 'suppliers-save'
        });
        showErrorMessage('Erro ao salvar fornecedor');
    });
}

// Função para excluir fornecedor
function deleteSupplier(id) {
    console.log('Excluindo fornecedor ID:', id);
    
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        fetch(`/api/fornecedores/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Fornecedor excluído com sucesso!');
                loadSuppliers(); // Recarregar lista
            } else {
                alert('Erro ao excluir fornecedor: ' + (data.message || 'Erro desconhecido'));
            }
        })
        .catch(error => {
            log.error('Erro ao excluir fornecedor', { 
                error: error.message, 
                stack: error.stack,
                supplierId: supplierId,
                component: 'suppliers-delete'
            });
            showErrorMessage('Erro ao excluir fornecedor');
        });
    }
}

// Função para abrir modal de novo fornecedor
function openNewSupplierModal() {
    console.log('=== ABRINDO MODAL NOVO FORNECEDOR ===');
    
    // Limpar formulário
    const form = document.getElementById('supplierForm');
    if (form) {
        form.reset();
        console.log('Formulário resetado');
    }
    
    // Limpar ID (para indicar que é um novo fornecedor)
    const supplierIdField = document.getElementById('supplierId');
    if (supplierIdField) {
        supplierIdField.value = '';
        console.log('Campo ID limpo');
    }
    
    // Definir título do modal
    const modalTitle = document.getElementById('supplierModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Novo Fornecedor';
        console.log('Título do modal definido');
    }
    
    // Definir status padrão como "ativo"
    const statusField = document.getElementById('supplierStatus');
    if (statusField) {
        statusField.value = 'ativo';
        console.log('Status padrão definido como ativo');
    }
    
    // Abrir modal
    const modal = document.getElementById('supplierModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        console.log('Modal aberto com sucesso');
    } else {
        log.error({
            message: 'Modal supplierModal não encontrado!',
            stack: new Error().stack,
            component: 'suppliers-modal'
        });
        alert('Erro: Modal não encontrado!');
    }
}