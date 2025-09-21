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
}

function loadQuotes() {
    console.log('Carregando cotações...');
    
    // Show loading state
    showLoadingState();
    
    // Make API call to get quotes
    fetch('/api/quotes')
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
            const quotes = data.data || [];
            displayQuotes(quotes);
        })
        .catch(error => {
            console.error('Erro ao carregar cotações:', error);
            hideLoadingState();
            
            // Show error message in table
            const tbody = document.querySelector('#quotesTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i> 
                            Erro ao carregar cotações: ${error.message}
                        </td>
                    </tr>
                `;
            }
        });
}

function showAddQuoteModal() {
    const modal = document.getElementById('addQuoteModal');
    if (modal) {
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
    const tbody = document.querySelector('#quotesTable tbody');
    if (tbody) {
        if (quotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma cotação encontrada</td></tr>';
        } else {
            // Display quotes
            tbody.innerHTML = quotes.map(quote => `
                <tr>
                    <td>${quote.id}</td>
                    <td>${quote.supplier}</td>
                    <td>${quote.date}</td>
                    <td>R$ ${quote.total}</td>
                    <td><span class="badge bg-${getStatusColor(quote.status)}">${quote.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewQuote(${quote.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="editQuote(${quote.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteQuote(${quote.id})">
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
        case 'Aprovada': return 'success';
        case 'Rejeitada': return 'danger';
        default: return 'secondary';
    }
}

function showLoadingState() {
    const tbody = document.querySelector('#quotesTable tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

function hideLoadingState() {
    // Loading state will be replaced by displayQuotes
}

function viewQuote(id) {
    console.log('Visualizando cotação:', id);
    // Implement view functionality
}

function editQuote(id) {
    console.log('Editando cotação:', id);
    // Implement edit functionality
}

function deleteQuote(id) {
    console.log('Excluindo cotação:', id);
    // Implement delete functionality
}