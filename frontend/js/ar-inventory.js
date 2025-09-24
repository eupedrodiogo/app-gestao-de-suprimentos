// AR Inventory Management System
class ARInventoryManager {
    constructor() {
        this.isARSupported = false;
        this.isARActive = false;
        this.inventoryData = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        console.log('Inicializando AR Inventory Manager...');
        
        // Verificar suporte a AR
        await this.checkARSupport();
        
        // Carregar dados do inventário
        await this.loadInventoryData();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Inicializar interface
        this.initializeInterface();
        
        console.log('AR Inventory Manager inicializado com sucesso!');
    }

    async checkARSupport() {
        try {
            // Verificar se o navegador suporta WebXR
            if ('xr' in navigator) {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                this.isARSupported = isSupported;
                console.log('Suporte AR:', isSupported ? 'Disponível' : 'Não disponível');
            } else {
                console.log('WebXR não suportado neste navegador');
                this.isARSupported = false;
            }
        } catch (error) {
            console.log('Erro ao verificar suporte AR:', error);
            this.isARSupported = false;
        }

        // Verificar se A-Frame e AR.js estão carregados
        if (typeof AFRAME !== 'undefined') {
            console.log('A-Frame carregado com sucesso');
        }
    }

    async loadInventoryData() {
        try {
            // Simular dados do inventário (em produção, viria da API)
            this.inventoryData = [
                {
                    id: 1,
                    name: 'Caixas de Papelão',
                    type: 'box',
                    quantity: 150,
                    location: 'Setor A1',
                    status: 'high',
                    color: '#4CC3D9',
                    position: '0 0.5 -3',
                    rotation: '0 45 0'
                },
                {
                    id: 2,
                    name: 'Tambores Químicos',
                    type: 'cylinder',
                    quantity: 25,
                    location: 'Setor B2',
                    status: 'medium',
                    color: '#EF2D5E',
                    position: '2 0.5 -3',
                    rotation: '0 0 0'
                },
                {
                    id: 3,
                    name: 'Esferas Metálicas',
                    type: 'sphere',
                    quantity: 8,
                    location: 'Setor C3',
                    status: 'low',
                    color: '#FFC65D',
                    position: '-2 0.5 -3',
                    rotation: '0 0 0'
                },
                {
                    id: 4,
                    name: 'Containers',
                    type: 'box',
                    quantity: 75,
                    location: 'Setor D1',
                    status: 'high',
                    color: '#7BC8A4',
                    position: '1 0.5 -5',
                    rotation: '0 90 0'
                },
                {
                    id: 5,
                    name: 'Barris de Óleo',
                    type: 'cylinder',
                    quantity: 12,
                    location: 'Setor E2',
                    status: 'low',
                    color: '#FF6B6B',
                    position: '-1 0.5 -5',
                    rotation: '0 0 0'
                }
            ];

            console.log('Dados do inventário carregados:', this.inventoryData.length, 'itens');
        } catch (error) {
            console.error('Erro ao carregar dados do inventário:', error);
        }
    }

    setupEventListeners() {
        // Botão para iniciar AR
        const startARBtn = document.getElementById('startAR');
        if (startARBtn) {
            startARBtn.addEventListener('click', () => this.startAR());
        }

        // Botão para parar AR
        const stopARBtn = document.getElementById('stopAR');
        if (stopARBtn) {
            stopARBtn.addEventListener('click', () => this.stopAR());
        }

        // Botão para resetar posição
        const resetBtn = document.getElementById('resetPosition');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetPosition());
        }

        // Filtros de inventário
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Event listeners para A-Frame
        this.setupAFrameListeners();
    }

    setupAFrameListeners() {
        // Aguardar A-Frame carregar
        document.addEventListener('DOMContentLoaded', () => {
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.addEventListener('loaded', () => {
                    console.log('Cena A-Frame carregada');
                    this.onSceneLoaded();
                });

                scene.addEventListener('enter-vr', () => {
                    console.log('Entrando em modo AR');
                    this.onAREnter();
                });

                scene.addEventListener('exit-vr', () => {
                    console.log('Saindo do modo AR');
                    this.onARExit();
                });
            }
        });
    }

    initializeInterface() {
        // Atualizar estatísticas
        this.updateStats();
        
        // Renderizar inventário fallback
        this.renderFallbackInventory();
        
        // Configurar navegação
        this.setupNavigation();
    }

    async startAR() {
        try {
            console.log('Iniciando AR...');
            
            const scene = document.querySelector('a-scene');
            if (!scene) {
                throw new Error('Cena A-Frame não encontrada');
            }

            // Verificar permissões da câmera
            await this.requestCameraPermission();

            // Mostrar cena AR
            scene.style.display = 'block';
            
            // Ocultar fallback
            const fallback = document.querySelector('.fallback-container');
            if (fallback) {
                fallback.style.display = 'none';
            }

            // Atualizar UI
            this.updateARControls(true);
            
            // Gerar objetos 3D
            this.generateARObjects();

            this.isARActive = true;
            console.log('AR iniciado com sucesso');

        } catch (error) {
            console.error('Erro ao iniciar AR:', error);
            this.showError('Não foi possível iniciar o AR. Verifique as permissões da câmera.');
        }
    }

    stopAR() {
        try {
            console.log('Parando AR...');
            
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.style.display = 'none';
            }

            // Mostrar fallback
            const fallback = document.querySelector('.fallback-container');
            if (fallback) {
                fallback.style.display = 'block';
            }

            // Atualizar UI
            this.updateARControls(false);

            this.isARActive = false;
            console.log('AR parado com sucesso');

        } catch (error) {
            console.error('Erro ao parar AR:', error);
        }
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // Parar o stream imediatamente (só precisávamos da permissão)
            stream.getTracks().forEach(track => track.stop());
            
            console.log('Permissão da câmera concedida');
            return true;
        } catch (error) {
            console.error('Erro ao solicitar permissão da câmera:', error);
            throw new Error('Permissão da câmera negada');
        }
    }

    generateARObjects() {
        const scene = document.querySelector('a-scene');
        if (!scene) return;

        // Limpar objetos existentes
        const existingObjects = scene.querySelectorAll('.inventory-item');
        existingObjects.forEach(obj => obj.remove());

        // Gerar novos objetos baseados no filtro atual
        const filteredData = this.getFilteredData();
        
        filteredData.forEach((item, index) => {
            this.createARObject(item, index);
        });

        console.log(`Gerados ${filteredData.length} objetos AR`);
    }

    createARObject(item, index) {
        const scene = document.querySelector('a-scene');
        if (!scene) return;

        // Criar elemento baseado no tipo
        let element;
        switch (item.type) {
            case 'box':
                element = document.createElement('a-box');
                element.setAttribute('width', '1');
                element.setAttribute('height', '1');
                element.setAttribute('depth', '1');
                break;
            case 'cylinder':
                element = document.createElement('a-cylinder');
                element.setAttribute('radius', '0.5');
                element.setAttribute('height', '1.5');
                break;
            case 'sphere':
                element = document.createElement('a-sphere');
                element.setAttribute('radius', '0.5');
                break;
            default:
                element = document.createElement('a-box');
        }

        // Configurar propriedades
        element.setAttribute('position', item.position);
        element.setAttribute('rotation', item.rotation);
        element.setAttribute('color', item.color);
        element.setAttribute('class', 'inventory-item');
        element.setAttribute('data-item-id', item.id);

        // Adicionar animação
        element.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: 10000
        });

        // Adicionar texto informativo
        const text = document.createElement('a-text');
        text.setAttribute('value', `${item.name}\nQtd: ${item.quantity}\n${item.location}`);
        text.setAttribute('position', '0 1.5 0');
        text.setAttribute('align', 'center');
        text.setAttribute('color', '#000');
        text.setAttribute('scale', '0.5 0.5 0.5');
        
        element.appendChild(text);

        // Adicionar interatividade
        element.addEventListener('click', () => {
            this.onObjectClick(item);
        });

        // Adicionar à cena
        scene.appendChild(element);
    }

    onObjectClick(item) {
        console.log('Objeto clicado:', item);
        
        // Mostrar detalhes do item
        this.showItemDetails(item);
        
        // Adicionar efeito visual
        this.highlightObject(item.id);
    }

    showItemDetails(item) {
        // Criar modal ou painel de detalhes
        const details = `
            <div class="item-details-modal">
                <h3>${item.name}</h3>
                <p><strong>Quantidade:</strong> ${item.quantity}</p>
                <p><strong>Localização:</strong> ${item.location}</p>
                <p><strong>Status:</strong> ${this.getStatusText(item.status)}</p>
                <button onclick="this.parentElement.remove()">Fechar</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', details);
    }

    highlightObject(itemId) {
        const object = document.querySelector(`[data-item-id="${itemId}"]`);
        if (object) {
            // Adicionar animação de destaque
            object.setAttribute('animation__highlight', {
                property: 'scale',
                to: '1.2 1.2 1.2',
                dur: 500,
                direction: 'alternate',
                loop: 2
            });
        }
    }

    resetPosition() {
        console.log('Resetando posição...');
        
        // Resetar posição da câmera
        const camera = document.querySelector('a-camera');
        if (camera) {
            camera.setAttribute('position', '0 1.6 0');
            camera.setAttribute('rotation', '0 0 0');
        }

        // Regenerar objetos
        this.generateARObjects();
    }

    setFilter(filter) {
        console.log('Aplicando filtro:', filter);
        
        this.currentFilter = filter;
        
        // Atualizar botões de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Regenerar objetos se AR estiver ativo
        if (this.isARActive) {
            this.generateARObjects();
        }

        // Atualizar fallback
        this.renderFallbackInventory();
        
        // Atualizar estatísticas
        this.updateStats();
    }

    getFilteredData() {
        if (this.currentFilter === 'all') {
            return this.inventoryData;
        }
        
        return this.inventoryData.filter(item => item.status === this.currentFilter);
    }

    updateStats() {
        const filteredData = this.getFilteredData();
        const totalItems = filteredData.reduce((sum, item) => sum + item.quantity, 0);
        const lowStock = filteredData.filter(item => item.status === 'low').length;
        const locations = [...new Set(filteredData.map(item => item.location))].length;

        // Atualizar elementos de estatística
        const statsContainer = document.querySelector('.ar-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Total de Itens:</span>
                    <span class="stat-value">${totalItems}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Produtos:</span>
                    <span class="stat-value">${filteredData.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Estoque Baixo:</span>
                    <span class="stat-value">${lowStock}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Localizações:</span>
                    <span class="stat-value">${locations}</span>
                </div>
            `;
        }
    }

    renderFallbackInventory() {
        const grid = document.querySelector('.inventory-grid');
        if (!grid) return;

        const filteredData = this.getFilteredData();
        
        grid.innerHTML = filteredData.map(item => `
            <div class="inventory-card" data-item-id="${item.id}">
                <div class="item-3d ${item.type}" style="background: ${item.color}"></div>
                <h3>${item.name}</h3>
                <p>${item.location}</p>
                <span class="stock-level ${item.status}">
                    ${item.quantity} unidades - ${this.getStatusText(item.status)}
                </span>
            </div>
        `).join('');

        // Adicionar event listeners para cards
        grid.querySelectorAll('.inventory-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = parseInt(card.dataset.itemId);
                const item = this.inventoryData.find(i => i.id === itemId);
                if (item) {
                    this.onObjectClick(item);
                }
            });
        });
    }

    updateARControls(isActive) {
        const startBtn = document.getElementById('startAR');
        const stopBtn = document.getElementById('stopAR');
        const resetBtn = document.getElementById('resetPosition');

        if (startBtn) startBtn.style.display = isActive ? 'none' : 'inline-block';
        if (stopBtn) stopBtn.style.display = isActive ? 'inline-block' : 'none';
        if (resetBtn) resetBtn.style.display = isActive ? 'inline-block' : 'none';
    }

    setupNavigation() {
        // Configurar navegação inferior
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover classe active de todos
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Adicionar classe active ao clicado
                item.classList.add('active');
                
                // Navegar para a página
                const href = item.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            });
        });
    }

    getStatusText(status) {
        const statusMap = {
            'high': 'Estoque Alto',
            'medium': 'Estoque Médio',
            'low': 'Estoque Baixo'
        };
        return statusMap[status] || status;
    }

    showError(message) {
        // Criar notificação de erro
        const error = document.createElement('div');
        error.className = 'error-notification';
        error.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
        `;
        error.textContent = message;
        
        document.body.appendChild(error);
        
        // Remover após 5 segundos
        setTimeout(() => {
            error.remove();
        }, 5000);
    }

    onSceneLoaded() {
        console.log('Cena AR carregada e pronta');
        // Configurações adicionais após carregamento da cena
    }

    onAREnter() {
        console.log('Modo AR ativado');
        this.isARActive = true;
        this.updateARControls(true);
    }

    onARExit() {
        console.log('Modo AR desativado');
        this.isARActive = false;
        this.updateARControls(false);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.arInventoryManager = new ARInventoryManager();
});

// Funções globais para compatibilidade
function startAR() {
    if (window.arInventoryManager) {
        window.arInventoryManager.startAR();
    }
}

function stopAR() {
    if (window.arInventoryManager) {
        window.arInventoryManager.stopAR();
    }
}

function resetPosition() {
    if (window.arInventoryManager) {
        window.arInventoryManager.resetPosition();
    }
}

function setFilter(filter) {
    if (window.arInventoryManager) {
        window.arInventoryManager.setFilter(filter);
    }
}