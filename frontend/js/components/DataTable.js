/**
 * Componente DataTable - Tabela de dados reutilizável com funcionalidades avançadas
 */

export class DataTable {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            // Configurações de dados
            data: [],
            columns: [],
            
            // Paginação
            pagination: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 25, 50, 100],
            
            // Ordenação
            sortable: true,
            defaultSort: null, // { column: 'name', direction: 'asc' }
            
            // Filtros
            searchable: true,
            searchPlaceholder: 'Pesquisar...',
            filters: [],
            
            // Seleção
            selectable: false,
            multiSelect: false,
            
            // Ações
            actions: [],
            rowActions: [],
            
            // Aparência
            striped: true,
            bordered: true,
            hover: true,
            responsive: true,
            
            // Carregamento
            loading: false,
            loadingText: 'Carregando...',
            
            // Estados vazios
            emptyText: 'Nenhum registro encontrado',
            emptyIcon: 'inbox',
            
            // Callbacks
            onRowClick: null,
            onRowSelect: null,
            onSort: null,
            onFilter: null,
            onPageChange: null,
            onPageSizeChange: null,
            
            // Configurações avançadas
            virtualScroll: false,
            fixedHeader: false,
            exportable: false,
            
            ...options
        };

        this.state = {
            currentPage: 1,
            sortColumn: this.options.defaultSort?.column || null,
            sortDirection: this.options.defaultSort?.direction || 'asc',
            searchTerm: '',
            filters: {},
            selectedRows: new Set(),
            filteredData: [],
            paginatedData: []
        };

        this.init();
    }

    /**
     * Inicializa o componente
     */
    init() {
        this.validateOptions();
        this.render();
        this.setupEventListeners();
        this.processData();
        this.emit('ready');
    }

    /**
     * Valida as opções fornecidas
     */
    validateOptions() {
        if (!Array.isArray(this.options.columns) || this.options.columns.length === 0) {
            throw new Error('DataTable: columns é obrigatório e deve ser um array não vazio');
        }

        // Validar estrutura das colunas
        this.options.columns.forEach((column, index) => {
            if (!column.key) {
                throw new Error(`DataTable: coluna ${index} deve ter uma propriedade 'key'`);
            }
            if (!column.title) {
                column.title = column.key;
            }
        });
    }

    /**
     * Renderiza a estrutura da tabela
     */
    render() {
        const tableClasses = [
            'data-table',
            this.options.striped ? 'data-table--striped' : '',
            this.options.bordered ? 'data-table--bordered' : '',
            this.options.hover ? 'data-table--hover' : '',
            this.options.responsive ? 'data-table--responsive' : ''
        ].filter(Boolean).join(' ');

        this.container.innerHTML = `
            <div class="data-table-container">
                <!-- Cabeçalho da tabela -->
                <div class="data-table__header">
                    <div class="data-table__header-left">
                        ${this.renderSearch()}
                        ${this.renderFilters()}
                    </div>
                    <div class="data-table__header-right">
                        ${this.renderActions()}
                        ${this.renderExport()}
                    </div>
                </div>

                <!-- Informações da tabela -->
                <div class="data-table__info" id="table-info">
                    <!-- Será preenchido dinamicamente -->
                </div>

                <!-- Wrapper da tabela -->
                <div class="data-table__wrapper">
                    <table class="${tableClasses}" id="data-table">
                        <thead class="data-table__head">
                            ${this.renderTableHeader()}
                        </thead>
                        <tbody class="data-table__body" id="table-body">
                            ${this.renderLoadingState()}
                        </tbody>
                    </table>
                </div>

                <!-- Rodapé da tabela -->
                <div class="data-table__footer">
                    <div class="data-table__footer-left">
                        ${this.renderPageSize()}
                        ${this.renderSelection()}
                    </div>
                    <div class="data-table__footer-right">
                        ${this.renderPagination()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o campo de pesquisa
     */
    renderSearch() {
        if (!this.options.searchable) return '';

        return `
            <div class="data-table__search">
                <div class="form-group">
                    <div class="input-group">
                        <div class="input-group__prepend">
                            <span class="input-group__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="M21 21l-4.35-4.35"></path>
                                </svg>
                            </span>
                        </div>
                        <input 
                            type="text" 
                            class="form-control" 
                            placeholder="${this.options.searchPlaceholder}"
                            id="table-search"
                            autocomplete="off"
                        >
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza os filtros
     */
    renderFilters() {
        if (!this.options.filters || this.options.filters.length === 0) return '';

        return `
            <div class="data-table__filters">
                ${this.options.filters.map(filter => this.renderFilter(filter)).join('')}
            </div>
        `;
    }

    /**
     * Renderiza um filtro individual
     */
    renderFilter(filter) {
        switch (filter.type) {
            case 'select':
                return `
                    <div class="form-group">
                        <label class="form-label">${filter.label}</label>
                        <select class="form-control" data-filter="${filter.key}">
                            <option value="">Todos</option>
                            ${filter.options.map(option => 
                                `<option value="${option.value}">${option.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            case 'date':
                return `
                    <div class="form-group">
                        <label class="form-label">${filter.label}</label>
                        <input type="date" class="form-control" data-filter="${filter.key}">
                    </div>
                `;
            default:
                return '';
        }
    }

    /**
     * Renderiza as ações globais
     */
    renderActions() {
        if (!this.options.actions || this.options.actions.length === 0) return '';

        return `
            <div class="data-table__actions">
                ${this.options.actions.map(action => `
                    <button 
                        class="btn ${action.class || 'btn--primary'}" 
                        data-action="${action.key}"
                        ${action.disabled ? 'disabled' : ''}
                    >
                        ${action.icon ? `<svg class="btn__icon">${action.icon}</svg>` : ''}
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renderiza opções de exportação
     */
    renderExport() {
        if (!this.options.exportable) return '';

        return `
            <div class="data-table__export">
                <div class="dropdown">
                    <button class="btn btn--outline" data-toggle="dropdown">
                        <svg class="btn__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Exportar
                    </button>
                    <div class="dropdown__menu">
                        <button class="dropdown__item" data-export="csv">CSV</button>
                        <button class="dropdown__item" data-export="excel">Excel</button>
                        <button class="dropdown__item" data-export="pdf">PDF</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o cabeçalho da tabela
     */
    renderTableHeader() {
        const selectColumn = this.options.selectable ? `
            <th class="data-table__th data-table__th--select">
                ${this.options.multiSelect ? `
                    <label class="checkbox">
                        <input type="checkbox" id="select-all">
                        <span class="checkbox__mark"></span>
                    </label>
                ` : ''}
            </th>
        ` : '';

        const columns = this.options.columns.map(column => {
            const sortable = this.options.sortable && column.sortable !== false;
            const sorted = this.state.sortColumn === column.key;
            const sortDirection = sorted ? this.state.sortDirection : '';
            
            return `
                <th 
                    class="data-table__th ${sortable ? 'data-table__th--sortable' : ''} ${sorted ? `data-table__th--sorted-${sortDirection}` : ''}"
                    data-column="${column.key}"
                    ${sortable ? 'role="button" tabindex="0"' : ''}
                >
                    <div class="data-table__th-content">
                        <span class="data-table__th-title">${column.title}</span>
                        ${sortable ? `
                            <span class="data-table__sort-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                            </span>
                        ` : ''}
                    </div>
                </th>
            `;
        }).join('');

        const actionsColumn = this.options.rowActions && this.options.rowActions.length > 0 ? `
            <th class="data-table__th data-table__th--actions">Ações</th>
        ` : '';

        return `
            <tr class="data-table__row">
                ${selectColumn}
                ${columns}
                ${actionsColumn}
            </tr>
        `;
    }

    /**
     * Renderiza o corpo da tabela
     */
    renderTableBody() {
        if (this.options.loading) {
            return this.renderLoadingState();
        }

        if (this.state.paginatedData.length === 0) {
            return this.renderEmptyState();
        }

        return this.state.paginatedData.map((row, index) => this.renderTableRow(row, index)).join('');
    }

    /**
     * Renderiza uma linha da tabela
     */
    renderTableRow(row, index) {
        const isSelected = this.state.selectedRows.has(row.id || index);
        const rowClass = `data-table__row ${isSelected ? 'data-table__row--selected' : ''}`;

        const selectCell = this.options.selectable ? `
            <td class="data-table__td data-table__td--select">
                <label class="checkbox">
                    <input 
                        type="checkbox" 
                        data-row-id="${row.id || index}"
                        ${isSelected ? 'checked' : ''}
                    >
                    <span class="checkbox__mark"></span>
                </label>
            </td>
        ` : '';

        const dataCells = this.options.columns.map(column => {
            const value = this.getCellValue(row, column);
            const formattedValue = this.formatCellValue(value, column);
            
            return `
                <td class="data-table__td" data-column="${column.key}">
                    ${formattedValue}
                </td>
            `;
        }).join('');

        const actionsCell = this.options.rowActions && this.options.rowActions.length > 0 ? `
            <td class="data-table__td data-table__td--actions">
                <div class="data-table__row-actions">
                    ${this.renderRowActions(row, index)}
                </div>
            </td>
        ` : '';

        return `
            <tr class="${rowClass}" data-row-index="${index}" data-row-id="${row.id || index}">
                ${selectCell}
                ${dataCells}
                ${actionsCell}
            </tr>
        `;
    }

    /**
     * Renderiza as ações de linha
     */
    renderRowActions(row, index) {
        return this.options.rowActions.map(action => {
            const isDisabled = action.disabled && action.disabled(row);
            
            return `
                <button 
                    class="btn btn--sm ${action.class || 'btn--outline'}"
                    data-action="${action.key}"
                    data-row-index="${index}"
                    ${isDisabled ? 'disabled' : ''}
                    title="${action.title || action.label}"
                >
                    ${action.icon ? `<svg class="btn__icon">${action.icon}</svg>` : ''}
                    ${action.showLabel !== false ? action.label : ''}
                </button>
            `;
        }).join('');
    }

    /**
     * Renderiza estado de carregamento
     */
    renderLoadingState() {
        const colspan = this.getColspan();
        
        return `
            <tr class="data-table__row data-table__row--loading">
                <td class="data-table__td" colspan="${colspan}">
                    <div class="data-table__loading">
                        <div class="loading-spinner"></div>
                        <span>${this.options.loadingText}</span>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderiza estado vazio
     */
    renderEmptyState() {
        const colspan = this.getColspan();
        
        return `
            <tr class="data-table__row data-table__row--empty">
                <td class="data-table__td" colspan="${colspan}">
                    <div class="data-table__empty">
                        <div class="empty-state">
                            <div class="empty-state__icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <polyline points="22 12 18 12 15 21 9 21 6 12 2 12"></polyline>
                                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                                </svg>
                            </div>
                            <div class="empty-state__title">${this.options.emptyText}</div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderiza seletor de tamanho da página
     */
    renderPageSize() {
        if (!this.options.pagination) return '';

        return `
            <div class="data-table__page-size">
                <label class="form-label">Mostrar:</label>
                <select class="form-control form-control--sm" id="page-size-select">
                    ${this.options.pageSizeOptions.map(size => `
                        <option value="${size}" ${size === this.options.pageSize ? 'selected' : ''}>
                            ${size}
                        </option>
                    `).join('')}
                </select>
                <span class="form-label">registros</span>
            </div>
        `;
    }

    /**
     * Renderiza informações de seleção
     */
    renderSelection() {
        if (!this.options.selectable) return '';

        return `
            <div class="data-table__selection" id="selection-info">
                <!-- Será preenchido dinamicamente -->
            </div>
        `;
    }

    /**
     * Renderiza paginação
     */
    renderPagination() {
        if (!this.options.pagination) return '';

        return `
            <div class="data-table__pagination" id="pagination">
                <!-- Será preenchido dinamicamente -->
            </div>
        `;
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Pesquisa
        const searchInput = this.container.querySelector('#table-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }

        // Filtros
        const filterElements = this.container.querySelectorAll('[data-filter]');
        filterElements.forEach(element => {
            element.addEventListener('change', (e) => {
                this.handleFilter(e.target.dataset.filter, e.target.value);
            });
        });

        // Ordenação
        const sortableHeaders = this.container.querySelectorAll('.data-table__th--sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header.dataset.column);
            });
            
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleSort(header.dataset.column);
                }
            });
        });

        // Seleção
        this.container.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                if (e.target.id === 'select-all') {
                    this.handleSelectAll(e.target.checked);
                } else if (e.target.dataset.rowId) {
                    this.handleRowSelect(e.target.dataset.rowId, e.target.checked);
                }
            }
        });

        // Clique em linha
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.data-table__row');
            if (row && !e.target.closest('input, button, a')) {
                this.handleRowClick(row);
            }
        });

        // Ações
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) {
                const button = e.target.closest('[data-action]');
                const action = button.dataset.action;
                const rowIndex = button.dataset.rowIndex;
                
                if (rowIndex !== undefined) {
                    this.handleRowAction(action, parseInt(rowIndex));
                } else {
                    this.handleAction(action);
                }
            }
        });

        // Tamanho da página
        const pageSizeSelect = this.container.querySelector('#page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.handlePageSizeChange(parseInt(e.target.value));
            });
        }
    }

    /**
     * Processa os dados (filtro, ordenação, paginação)
     */
    processData() {
        let data = [...this.options.data];

        // Aplicar pesquisa
        if (this.state.searchTerm) {
            data = this.filterBySearch(data, this.state.searchTerm);
        }

        // Aplicar filtros
        data = this.applyFilters(data);

        // Aplicar ordenação
        if (this.state.sortColumn) {
            data = this.sortData(data, this.state.sortColumn, this.state.sortDirection);
        }

        this.state.filteredData = data;

        // Aplicar paginação
        if (this.options.pagination) {
            const startIndex = (this.state.currentPage - 1) * this.options.pageSize;
            const endIndex = startIndex + this.options.pageSize;
            this.state.paginatedData = data.slice(startIndex, endIndex);
        } else {
            this.state.paginatedData = data;
        }

        this.updateTable();
        this.updateInfo();
        this.updatePagination();
        this.updateSelection();
    }

    /**
     * Atualiza a tabela
     */
    updateTable() {
        const tbody = this.container.querySelector('#table-body');
        if (tbody) {
            tbody.innerHTML = this.renderTableBody();
        }
    }

    /**
     * Atualiza informações da tabela
     */
    updateInfo() {
        const infoElement = this.container.querySelector('#table-info');
        if (!infoElement) return;

        const total = this.state.filteredData.length;
        const showing = this.state.paginatedData.length;
        const start = this.options.pagination ? (this.state.currentPage - 1) * this.options.pageSize + 1 : 1;
        const end = this.options.pagination ? start + showing - 1 : showing;

        if (total === 0) {
            infoElement.innerHTML = '';
            return;
        }

        infoElement.innerHTML = `
            <div class="data-table__info-text">
                Mostrando ${start} a ${end} de ${total} registros
                ${this.options.data.length !== total ? ` (filtrado de ${this.options.data.length} registros)` : ''}
            </div>
        `;
    }

    /**
     * Atualiza paginação
     */
    updatePagination() {
        const paginationElement = this.container.querySelector('#pagination');
        if (!paginationElement || !this.options.pagination) return;

        const totalPages = Math.ceil(this.state.filteredData.length / this.options.pageSize);
        
        if (totalPages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }

        const currentPage = this.state.currentPage;
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        let paginationHTML = `
            <div class="pagination">
                <button 
                    class="pagination__btn pagination__btn--prev" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    data-page="${currentPage - 1}"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    Anterior
                </button>
        `;

        // Primeira página
        if (startPage > 1) {
            paginationHTML += `
                <button class="pagination__btn" data-page="1">1</button>
                ${startPage > 2 ? '<span class="pagination__ellipsis">...</span>' : ''}
            `;
        }

        // Páginas visíveis
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button 
                    class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" 
                    data-page="${i}"
                >
                    ${i}
                </button>
            `;
        }

        // Última página
        if (endPage < totalPages) {
            paginationHTML += `
                ${endPage < totalPages - 1 ? '<span class="pagination__ellipsis">...</span>' : ''}
                <button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>
            `;
        }

        paginationHTML += `
                <button 
                    class="pagination__btn pagination__btn--next" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    data-page="${currentPage + 1}"
                >
                    Próximo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                </button>
            </div>
        `;

        paginationElement.innerHTML = paginationHTML;

        // Event listeners para paginação
        paginationElement.addEventListener('click', (e) => {
            if (e.target.closest('[data-page]')) {
                const page = parseInt(e.target.closest('[data-page]').dataset.page);
                this.goToPage(page);
            }
        });
    }

    /**
     * Atualiza informações de seleção
     */
    updateSelection() {
        const selectionElement = this.container.querySelector('#selection-info');
        if (!selectionElement || !this.options.selectable) return;

        const selectedCount = this.state.selectedRows.size;
        
        if (selectedCount === 0) {
            selectionElement.innerHTML = '';
            return;
        }

        selectionElement.innerHTML = `
            <div class="data-table__selection-text">
                ${selectedCount} ${selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
                <button class="btn btn--link btn--sm" id="clear-selection">
                    Limpar seleção
                </button>
            </div>
        `;

        // Event listener para limpar seleção
        const clearBtn = selectionElement.querySelector('#clear-selection');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }
    }

    /**
     * Handlers de eventos
     */
    handleSearch(term) {
        this.state.searchTerm = term;
        this.state.currentPage = 1;
        this.processData();
        this.emit('search', { term });
    }

    handleFilter(key, value) {
        this.state.filters[key] = value;
        this.state.currentPage = 1;
        this.processData();
        this.emit('filter', { key, value, filters: this.state.filters });
    }

    handleSort(column) {
        if (this.state.sortColumn === column) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortColumn = column;
            this.state.sortDirection = 'asc';
        }

        this.processData();
        this.updateTableHeader();
        this.emit('sort', { 
            column: this.state.sortColumn, 
            direction: this.state.sortDirection 
        });
    }

    handleRowClick(row) {
        if (this.options.onRowClick) {
            const rowIndex = parseInt(row.dataset.rowIndex);
            const rowData = this.state.paginatedData[rowIndex];
            this.options.onRowClick(rowData, rowIndex);
        }
        this.emit('rowClick', { row, data: this.state.paginatedData[parseInt(row.dataset.rowIndex)] });
    }

    handleRowSelect(rowId, checked) {
        if (checked) {
            this.state.selectedRows.add(rowId);
        } else {
            this.state.selectedRows.delete(rowId);
        }

        this.updateSelection();
        this.updateSelectAllCheckbox();
        
        if (this.options.onRowSelect) {
            this.options.onRowSelect(Array.from(this.state.selectedRows));
        }
        
        this.emit('rowSelect', { 
            selectedRows: Array.from(this.state.selectedRows),
            rowId,
            checked
        });
    }

    handleSelectAll(checked) {
        if (checked) {
            this.state.paginatedData.forEach((row, index) => {
                this.state.selectedRows.add(row.id || index);
            });
        } else {
            this.clearSelection();
        }

        this.updateTable();
        this.updateSelection();
        
        if (this.options.onRowSelect) {
            this.options.onRowSelect(Array.from(this.state.selectedRows));
        }
        
        this.emit('selectAll', { 
            selectedRows: Array.from(this.state.selectedRows),
            checked
        });
    }

    handleAction(action) {
        const actionConfig = this.options.actions.find(a => a.key === action);
        if (actionConfig && actionConfig.handler) {
            actionConfig.handler(Array.from(this.state.selectedRows));
        }
        this.emit('action', { action, selectedRows: Array.from(this.state.selectedRows) });
    }

    handleRowAction(action, rowIndex) {
        const actionConfig = this.options.rowActions.find(a => a.key === action);
        const rowData = this.state.paginatedData[rowIndex];
        
        if (actionConfig && actionConfig.handler) {
            actionConfig.handler(rowData, rowIndex);
        }
        
        this.emit('rowAction', { action, data: rowData, index: rowIndex });
    }

    handlePageSizeChange(pageSize) {
        this.options.pageSize = pageSize;
        this.state.currentPage = 1;
        this.processData();
        
        if (this.options.onPageSizeChange) {
            this.options.onPageSizeChange(pageSize);
        }
        
        this.emit('pageSizeChange', { pageSize });
    }

    /**
     * Métodos utilitários
     */
    getCellValue(row, column) {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        
        return this.getNestedValue(row, column.key);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    formatCellValue(value, column) {
        if (value === null || value === undefined) {
            return '<span class="text--muted">—</span>';
        }

        switch (column.type) {
            case 'date':
                return new Date(value).toLocaleDateString('pt-BR');
            case 'datetime':
                return new Date(value).toLocaleString('pt-BR');
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            case 'number':
                return new Intl.NumberFormat('pt-BR').format(value);
            case 'boolean':
                return value ? 
                    '<span class="badge badge--success">Sim</span>' : 
                    '<span class="badge badge--danger">Não</span>';
            default:
                return String(value);
        }
    }

    filterBySearch(data, term) {
        if (!term) return data;

        const searchTerm = term.toLowerCase();
        
        return data.filter(row => {
            return this.options.columns.some(column => {
                const value = this.getCellValue(row, column);
                return String(value).toLowerCase().includes(searchTerm);
            });
        });
    }

    applyFilters(data) {
        return data.filter(row => {
            return Object.entries(this.state.filters).every(([key, value]) => {
                if (!value) return true;
                
                const rowValue = this.getNestedValue(row, key);
                return String(rowValue) === String(value);
            });
        });
    }

    sortData(data, column, direction) {
        return [...data].sort((a, b) => {
            const aValue = this.getNestedValue(a, column);
            const bValue = this.getNestedValue(b, column);
            
            let comparison = 0;
            
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    updateTableHeader() {
        const thead = this.container.querySelector('.data-table__head');
        if (thead) {
            thead.innerHTML = this.renderTableHeader();
        }
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = this.container.querySelector('#select-all');
        if (!selectAllCheckbox) return;

        const visibleRowIds = this.state.paginatedData.map((row, index) => row.id || index);
        const selectedVisibleRows = visibleRowIds.filter(id => this.state.selectedRows.has(id));
        
        if (selectedVisibleRows.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedVisibleRows.length === visibleRowIds.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    getColspan() {
        let colspan = this.options.columns.length;
        if (this.options.selectable) colspan++;
        if (this.options.rowActions && this.options.rowActions.length > 0) colspan++;
        return colspan;
    }

    /**
     * API pública
     */
    setData(data) {
        this.options.data = data;
        this.state.currentPage = 1;
        this.clearSelection();
        this.processData();
    }

    getData() {
        return this.options.data;
    }

    getFilteredData() {
        return this.state.filteredData;
    }

    getSelectedRows() {
        return Array.from(this.state.selectedRows);
    }

    clearSelection() {
        this.state.selectedRows.clear();
        this.updateTable();
        this.updateSelection();
        this.updateSelectAllCheckbox();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.state.filteredData.length / this.options.pageSize);
        
        if (page < 1 || page > totalPages) return;
        
        this.state.currentPage = page;
        this.processData();
        
        if (this.options.onPageChange) {
            this.options.onPageChange(page);
        }
        
        this.emit('pageChange', { page });
    }

    setLoading(loading) {
        this.options.loading = loading;
        this.updateTable();
    }

    refresh() {
        this.processData();
    }

    /**
     * Sistema de eventos
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`datatable:${event}`, {
            detail: { table: this, ...data }
        });
        this.container.dispatchEvent(customEvent);
    }

    /**
     * Destruir componente
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.emit('destroyed');
    }
}