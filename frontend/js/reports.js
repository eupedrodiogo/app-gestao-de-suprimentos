// Reports Page JavaScript
console.log('🚀 Arquivo reports.js carregado!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de Relatórios carregada - DOM ready');
    
    // Initialize reports functionality
    initializeReports();
    
    // Load initial data
    loadReportsData();
});

function initializeReports() {
    // Add event listeners for report generation buttons
    const generateInventoryBtn = document.getElementById('generateInventoryReport');
    if (generateInventoryBtn) {
        generateInventoryBtn.addEventListener('click', generateInventoryReport);
    }
    
    const generateSalesBtn = document.getElementById('generateSalesReport');
    if (generateSalesBtn) {
        generateSalesBtn.addEventListener('click', generateSalesReport);
    }
    
    const generateSuppliersBtn = document.getElementById('generateSuppliersReport');
    if (generateSuppliersBtn) {
        generateSuppliersBtn.addEventListener('click', generateSuppliersReport);
    }
    
    const generateFinancialBtn = document.getElementById('generateFinancialReport');
    if (generateFinancialBtn) {
        generateFinancialBtn.addEventListener('click', generateFinancialReport);
    }
    
    // Initialize date range pickers
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        endDate.value = today.toISOString().split('T')[0];
        startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
}

function loadReportsData() {
    console.log('Carregando dados dos relatórios...');
    
    // Load summary statistics
    loadSummaryStats();
}

function loadSummaryStats() {
    // Show loading state
    showLoadingState();
    
    // Make API calls to get summary data
    Promise.all([
        fetch('/api/products/count'),
        fetch('/api/suppliers/count'),
        fetch('/api/orders/count'),
        fetch('/api/quotes/count')
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(data => {
        hideLoadingState();
        
        // Update summary cards
        updateSummaryCard('totalProducts', data[0].count || 0);
        updateSummaryCard('totalSuppliers', data[1].count || 0);
        updateSummaryCard('totalOrders', data[2].count || 0);
        updateSummaryCard('totalQuotes', data[3].count || 0);
    })
    .catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
        hideLoadingState();
        showToast('Erro', 'Erro ao carregar estatísticas do sistema.', 'error');
    });
}

function updateSummaryCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value.toLocaleString('pt-BR');
    }
}

function generateInventoryReport() {
    console.log('Gerando relatório de estoque...');
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('generateInventoryReport');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/inventory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_prazos_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de prazos gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deadlinesReportModal'));
        modal.hide();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-deadlines-final'
        });
        showToast('Erro', 'Erro ao gerar relatório de prazos.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}

function generateSalesReport() {
    console.log('Gerando relatório de vendas...');
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('generateSalesReport');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/sales', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_vendas_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de vendas gerado com sucesso!', 'success');
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-sales'
        });
        showToast('Erro', 'Erro ao gerar relatório de vendas.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.textContent = originalText;
    });
}

function generateSuppliersReport() {
    console.log('Gerando relatório de fornecedores...');
    
    // Show loading state
    const btn = document.getElementById('generateSuppliersReport');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/suppliers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_fornecedores_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de fornecedores gerado com sucesso!', 'success');
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-suppliers'
        });
        showToast('Erro', 'Erro ao gerar relatório de fornecedores.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.textContent = originalText;
    });
}

function generateFinancialReport() {
    console.log('Gerando relatório financeiro...');
    
    const startDate = document.getElementById('financialStartDate').value;
    const endDate = document.getElementById('financialEndDate').value;
    const type = document.getElementById('financialType').value;
    const category = document.getElementById('financialCategory').value;
    const supplier = document.getElementById('financialSupplier').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Prepare request data
    const requestData = {
        startDate: startDate,
        endDate: endDate
    };
    
    if (type) requestData.type = type;
    if (category) requestData.category = category;
    if (supplier) requestData.supplier = supplier;
    
    // Make API call to generate report
    fetch('/api/reports/financial', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_financeiro_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Close modal and show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('financialReportModal'));
        modal.hide();
        showToast('Sucesso', 'Relatório financeiro gerado com sucesso!', 'success');
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-financial'
        });
        showToast('Erro', 'Erro ao gerar relatório financeiro.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = '📥 Gerar Relatório';
    });
}

function showLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(element => {
        element.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
    });
}

function hideLoadingState() {
    // Loading state will be replaced by actual data
}

// Modal Functions
function showOrdersReportModal() {
    console.log('Abrindo modal de relatório de pedidos...');
    const modal = new bootstrap.Modal(document.getElementById('ordersReportModal'));
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('ordersStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('ordersEndDate').value = today.toISOString().split('T')[0];
    
    // Load suppliers for filter
    loadSuppliersForFilter('ordersSupplier');
    
    modal.show();
}

function showSuppliersReportModal() {
    const modal = new bootstrap.Modal(document.getElementById('suppliersReportModal'));
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('suppliersStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('suppliersEndDate').value = today.toISOString().split('T')[0];
    
    modal.show();
}

function showProductsReportModal() {
    showToast('Em Desenvolvimento', 'Relatório de produtos em desenvolvimento.', 'info');
}

function showFinancialReportModal() {
    console.log('Abrindo modal do relatório financeiro...');
    
    try {
        // Verificar se o modal existe
        const modalElement = document.getElementById('financialReportModal');
        console.log('Modal element found:', modalElement);
        
        if (!modalElement) {
            log.error({
                message: 'Modal financialReportModal não encontrado!',
                component: 'reports-modal'
            });
            showToast('Erro', 'Modal do relatório financeiro não encontrado.', 'error');
            return;
        }
        
        // Abrir modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('Modal aberto com sucesso');
        
        // Definir datas padrão
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const startDateElement = document.getElementById('financialStartDate');
        const endDateElement = document.getElementById('financialEndDate');
        
        console.log('Start date element:', startDateElement);
        console.log('End date element:', endDateElement);
        
        if (startDateElement) {
            startDateElement.value = firstDay.toISOString().split('T')[0];
        }
        if (endDateElement) {
            endDateElement.value = today.toISOString().split('T')[0];
        }
        
        // Carregar fornecedores para filtro
        console.log('Carregando fornecedores para filtro...');
        loadSuppliersForFilter('financialSupplier');
        
    } catch (error) {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-financial-modal'
        });
        showToast('Erro', 'Erro ao abrir modal do relatório financeiro.', 'error');
    }
}

function showQuotesReportModal() {
    showToast('Em Desenvolvimento', 'Relatório de cotações em desenvolvimento.', 'info');
}

function showDeadlinesReportModal() {
    showToast('Em Desenvolvimento', 'Relatório de prazos em desenvolvimento.', 'info');
}

// Report Generation Functions
function generateOrdersReport() {
    const startDate = document.getElementById('ordersStartDate').value;
    const endDate = document.getElementById('ordersEndDate').value;
    const status = document.getElementById('ordersStatus').value;
    const supplier = document.getElementById('ordersSupplier').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.querySelector('#ordersReportModal .btn-primary');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Prepare request data
    const requestData = {
        startDate: startDate,
        endDate: endDate
    };
    
    if (status) requestData.status = status;
    if (supplier) requestData.supplierId = supplier;
    
    // Make API call to generate report
    fetch('/api/reports/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_pedidos_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de pedidos gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ordersReportModal'));
        modal.hide();
        
        // Add to recent reports
        addToRecentReports('Pedidos', `${startDate} a ${endDate}`, new Date().toLocaleString('pt-BR'));
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-orders'
        });
        showToast('Erro', 'Erro ao gerar relatório de pedidos.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}

function generateSuppliersReport() {
    const startDate = document.getElementById('suppliersStartDate').value;
    const endDate = document.getElementById('suppliersEndDate').value;
    const status = document.getElementById('suppliersStatus').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.querySelector('#suppliersReportModal .btn-success');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Prepare request data
    const requestData = {
        startDate: startDate,
        endDate: endDate
    };
    
    if (status) requestData.status = status;
    
    // Make API call to generate report
    fetch('/api/reports/suppliers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_fornecedores_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de fornecedores gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('suppliersReportModal'));
        modal.hide();
        
        // Add to recent reports
        addToRecentReports('Fornecedores', `${startDate} a ${endDate}`, new Date().toLocaleString('pt-BR'));
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-suppliers'
        });
        showToast('Erro', 'Erro ao gerar relatório de fornecedores.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}

// Helper Functions
function loadSuppliersForFilter(selectId) {
    fetch('/api/suppliers')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById(selectId);
            const suppliers = data.data || [];
            
            // Clear existing options (except "Todos")
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add supplier options
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'reports-load-suppliers'
            });
        });
}

function addToRecentReports(type, period, generatedAt) {
    const tbody = document.getElementById('recent-reports');
    
    // Remove "no reports" message if it exists
    const noReportsRow = tbody.querySelector('td[colspan="5"]');
    if (noReportsRow) {
        noReportsRow.parentElement.remove();
    }
    
    // Create new row
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${type}</td>
        <td>${period}</td>
        <td>${generatedAt}</td>
        <td><span class="badge bg-success">Concluído</span></td>
        <td>
            <button class="btn btn-sm btn-outline-primary" onclick="downloadReport('${type}', '${period}')">
                📥 Download
            </button>
        </td>
    `;
    
    // Add to top of table
    tbody.insertBefore(row, tbody.firstChild);
    
    // Keep only last 10 reports
    while (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

function downloadReport(type, period) {
    showToast('Info', 'Funcionalidade de re-download em desenvolvimento.', 'info');
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

// Generate Orders Report
function generateOrdersReport() {
    console.log('Gerando relatório de pedidos...');
    
    const startDate = document.getElementById('ordersStartDate').value;
    const endDate = document.getElementById('ordersEndDate').value;
    const status = document.getElementById('ordersStatus').value;
    const supplier = document.getElementById('ordersSupplier').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.querySelector('#ordersReportModal .btn-primary');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            status: status,
            supplier: supplier
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_pedidos_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de pedidos gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ordersReportModal'));
        modal.hide();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-orders-pdf'
        });
        showToast('Erro', 'Erro ao gerar relatório de pedidos.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}

// Generate Products Report
function generateProductsReport() {
    console.log('Gerando relatório de produtos...');
    
    const startDate = document.getElementById('productsStartDate').value;
    const endDate = document.getElementById('productsEndDate').value;
    const category = document.getElementById('productsCategory').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Convert dates to ISO8601 format
    const startDateISO = new Date(startDate + 'T00:00:00.000Z').toISOString();
    const endDateISO = new Date(endDate + 'T23:59:59.999Z').toISOString();
    
    // Show loading state
    const btn = document.querySelector('#productsReportModal .btn-info');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            startDate: startDateISO,
            endDate: endDateISO,
            category: category
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_produtos_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de produtos gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productsReportModal'));
        modal.hide();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-products-pdf'
        });
        showToast('Erro', 'Erro ao gerar relatório de produtos.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}

// Generate Quotes Report
function generateQuotesReport() {
    console.log('Gerando relatório de cotações...');
    
    const startDate = document.getElementById('quotesStartDate').value;
    const endDate = document.getElementById('quotesEndDate').value;
    const status = document.getElementById('quotesStatus').value;
    const supplier = document.getElementById('quotesSupplier').value;
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione o período do relatório.', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.querySelector('#quotesReportModal .btn-secondary');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Gerando...';
    
    // Make API call to generate report
    fetch('/api/reports/quotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            status: status,
            supplier: supplier
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download the report file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_cotacoes_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Sucesso', 'Relatório de cotações gerado com sucesso!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quotesReportModal'));
        modal.hide();
    })
    .catch(error => {
        log.error({
            message: error.message,
            stack: error.stack,
            component: 'reports-quotes-pdf'
        });
        showToast('Erro', 'Erro ao gerar relatório de cotações.', 'error');
    })
    .finally(() => {
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = originalText;
    });
}