const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Dados realistas e detalhados para demonstração
const produtos = [
    { 
        id: 1, 
        nome: 'Notebook Dell Inspiron 15 3000', 
        codigo: 'NB-DELL-3000-15',
        preco: 2899.90, 
        categoria: 'Informática',
        subcategoria: 'Notebooks',
        marca: 'Dell',
        descricao: 'Notebook com processador Intel Core i5, 8GB RAM, SSD 256GB',
        estoque: 25,
        estoqueMinimo: 5,
        unidade: 'UN',
        status: 'Ativo',
        dataUltimaCompra: '2024-01-15',
        fornecedorPrincipal: 'TechSupply Ltda'
    },
    { 
        id: 2, 
        nome: 'Mouse Óptico Logitech M100', 
        codigo: 'MS-LOG-M100',
        preco: 45.90, 
        categoria: 'Informática',
        subcategoria: 'Periféricos',
        marca: 'Logitech',
        descricao: 'Mouse óptico com cabo USB, 1000 DPI',
        estoque: 150,
        estoqueMinimo: 20,
        unidade: 'UN',
        status: 'Ativo',
        dataUltimaCompra: '2024-01-20',
        fornecedorPrincipal: 'InfoTech Distribuidora'
    },
    { 
        id: 3, 
        nome: 'Papel A4 Sulfite 75g - Resma 500 folhas', 
        codigo: 'PP-A4-75G-500',
        preco: 28.50, 
        categoria: 'Material de Escritório',
        subcategoria: 'Papelaria',
        marca: 'Chamex',
        descricao: 'Papel sulfite branco A4, gramatura 75g/m², resma com 500 folhas',
        estoque: 80,
        estoqueMinimo: 15,
        unidade: 'RESMA',
        status: 'Ativo',
        dataUltimaCompra: '2024-01-18',
        fornecedorPrincipal: 'Papelaria Central'
    },
    { 
        id: 4, 
        nome: 'Cadeira Ergonômica Presidente', 
        codigo: 'CD-ERG-PRES-001',
        preco: 850.00, 
        categoria: 'Mobiliário',
        subcategoria: 'Cadeiras',
        marca: 'FlexForm',
        descricao: 'Cadeira presidente ergonômica com apoio lombar, braços reguláveis',
        estoque: 12,
        estoqueMinimo: 3,
        unidade: 'UN',
        status: 'Ativo',
        dataUltimaCompra: '2024-01-10',
        fornecedorPrincipal: 'Móveis Corporativos S.A.'
    },
    { 
        id: 5, 
        nome: 'Toner HP LaserJet CF283A Preto', 
        codigo: 'TN-HP-CF283A',
        preco: 189.90, 
        categoria: 'Informática',
        subcategoria: 'Consumíveis',
        marca: 'HP',
        descricao: 'Cartucho de toner original HP para impressoras LaserJet Pro',
        estoque: 8,
        estoqueMinimo: 5,
        unidade: 'UN',
        status: 'Estoque Baixo',
        dataUltimaCompra: '2024-01-22',
        fornecedorPrincipal: 'TechSupply Ltda'
    }
];

const fornecedores = [
    { 
        id: 1, 
        nome: 'TechSupply Ltda', 
        razaoSocial: 'TechSupply Tecnologia e Suprimentos Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'vendas@techsupply.com.br', 
        telefone: '(11) 3456-7890',
        celular: '(11) 99876-5432',
        endereco: 'Rua das Tecnologias, 123 - São Paulo/SP',
        cep: '01234-567',
        contato: 'Carlos Silva',
        categoria: 'Informática',
        status: 'Ativo',
        prazoEntrega: '5-7 dias úteis',
        condicoesPagamento: '30/60 dias',
        avaliacaoQualidade: 4.8,
        dataUltimaCompra: '2024-01-22'
    },
    { 
        id: 2, 
        nome: 'InfoTech Distribuidora', 
        razaoSocial: 'InfoTech Distribuidora de Equipamentos Ltda',
        cnpj: '98.765.432/0001-10',
        email: 'comercial@infotech.com.br', 
        telefone: '(11) 2345-6789',
        celular: '(11) 98765-4321',
        endereco: 'Av. Paulista, 456 - São Paulo/SP',
        cep: '01310-100',
        contato: 'Ana Santos',
        categoria: 'Informática',
        status: 'Ativo',
        prazoEntrega: '3-5 dias úteis',
        condicoesPagamento: '28 dias',
        avaliacaoQualidade: 4.5,
        dataUltimaCompra: '2024-01-20'
    },
    { 
        id: 3, 
        nome: 'Papelaria Central', 
        razaoSocial: 'Papelaria Central Materiais de Escritório Ltda',
        cnpj: '11.222.333/0001-44',
        email: 'pedidos@papelariacentral.com.br', 
        telefone: '(11) 3333-4444',
        celular: '(11) 97777-8888',
        endereco: 'Rua do Comércio, 789 - São Paulo/SP',
        cep: '03456-789',
        contato: 'Roberto Oliveira',
        categoria: 'Material de Escritório',
        status: 'Ativo',
        prazoEntrega: '2-4 dias úteis',
        condicoesPagamento: '21/35 dias',
        avaliacaoQualidade: 4.2,
        dataUltimaCompra: '2024-01-18'
    },
    { 
        id: 4, 
        nome: 'Móveis Corporativos S.A.', 
        razaoSocial: 'Móveis Corporativos Sociedade Anônima',
        cnpj: '55.666.777/0001-88',
        email: 'vendas@moveiscorporativos.com.br', 
        telefone: '(11) 4444-5555',
        celular: '(11) 96666-7777',
        endereco: 'Rua dos Móveis, 321 - São Paulo/SP',
        cep: '04567-890',
        contato: 'Mariana Costa',
        categoria: 'Mobiliário',
        status: 'Ativo',
        prazoEntrega: '10-15 dias úteis',
        condicoesPagamento: '45/60 dias',
        avaliacaoQualidade: 4.6,
        dataUltimaCompra: '2024-01-10'
    }
];

const cotacoes = [
    { 
        id: 1, 
        numero: 'COT-2024-001',
        fornecedor: 'TechSupply Ltda', 
        fornecedorId: 1,
        produto: 'Notebook Dell Inspiron 15 3000', 
        produtoId: 1,
        quantidade: 10,
        precoUnitario: 2750.00,
        precoTotal: 27500.00,
        prazoEntrega: '7 dias úteis',
        condicoesPagamento: '30 dias',
        validadeCotacao: '2024-02-15',
        status: 'Pendente',
        observacoes: 'Desconto para quantidade acima de 10 unidades',
        dataCotacao: '2024-01-25',
        responsavel: 'João Silva'
    },
    { 
        id: 2, 
        numero: 'COT-2024-002',
        fornecedor: 'InfoTech Distribuidora', 
        fornecedorId: 2,
        produto: 'Mouse Óptico Logitech M100', 
        produtoId: 2,
        quantidade: 50,
        precoUnitario: 42.90,
        precoTotal: 2145.00,
        prazoEntrega: '5 dias úteis',
        condicoesPagamento: '28 dias',
        validadeCotacao: '2024-02-10',
        status: 'Aprovada',
        observacoes: 'Frete grátis para pedidos acima de R$ 2.000',
        dataCotacao: '2024-01-20',
        responsavel: 'Maria Santos'
    },
    { 
        id: 3, 
        numero: 'COT-2024-003',
        fornecedor: 'Papelaria Central', 
        fornecedorId: 3,
        produto: 'Papel A4 Sulfite 75g - Resma 500 folhas', 
        produtoId: 3,
        quantidade: 100,
        precoUnitario: 26.80,
        precoTotal: 2680.00,
        prazoEntrega: '3 dias úteis',
        condicoesPagamento: '21 dias',
        validadeCotacao: '2024-02-20',
        status: 'Em Análise',
        observacoes: 'Preço promocional válido até o final do mês',
        dataCotacao: '2024-01-23',
        responsavel: 'Carlos Oliveira'
    }
];

const pedidos = [
    { 
        id: 1, 
        numero: 'PED-2024-001',
        fornecedor: 'TechSupply Ltda',
        fornecedorId: 1,
        produto: 'Toner HP LaserJet CF283A Preto', 
        produtoId: 5,
        quantidade: 15,
        precoUnitario: 189.90,
        valorTotal: 2848.50,
        dataPedido: '2024-01-22',
        previsaoEntrega: '2024-01-29',
        status: 'Em Andamento',
        observacoes: 'Urgente - estoque em nível crítico',
        responsavel: 'Ana Costa',
        numeroNF: '',
        dataEntrega: null
    },
    { 
        id: 2, 
        numero: 'PED-2024-002',
        fornecedor: 'InfoTech Distribuidora',
        fornecedorId: 2,
        produto: 'Mouse Óptico Logitech M100', 
        produtoId: 2,
        quantidade: 50,
        precoUnitario: 42.90,
        valorTotal: 2145.00,
        dataPedido: '2024-01-20',
        previsaoEntrega: '2024-01-25',
        status: 'Entregue',
        observacoes: 'Entrega conforme prazo estabelecido',
        responsavel: 'Maria Santos',
        numeroNF: 'NF-456789',
        dataEntrega: '2024-01-25'
    },
    { 
        id: 3, 
        numero: 'PED-2024-003',
        fornecedor: 'Móveis Corporativos S.A.',
        fornecedorId: 4,
        produto: 'Cadeira Ergonômica Presidente', 
        produtoId: 4,
        quantidade: 8,
        precoUnitario: 820.00,
        valorTotal: 6560.00,
        dataPedido: '2024-01-15',
        previsaoEntrega: '2024-01-30',
        status: 'Aguardando Entrega',
        observacoes: 'Montagem incluída no preço',
        responsavel: 'Roberto Silva',
        numeroNF: 'NF-123456',
        dataEntrega: null
    }
];

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor mobile funcionando!', timestamp: new Date().toISOString() });
});

app.get('/api/produtos', (req, res) => {
    res.json(produtos);
});

app.get('/api/fornecedores', (req, res) => {
    res.json(fornecedores);
});

app.get('/api/cotacoes', (req, res) => {
    res.json(cotacoes);
});

app.get('/api/pedidos', (req, res) => {
    res.json(pedidos);
});

// Rotas de notificações
app.get('/api/notifications', (req, res) => {
    const notifications = [
        {
            id: 1,
            title: 'Estoque Crítico - Toner HP',
            message: 'Toner HP LaserJet CF283A Preto com apenas 8 unidades em estoque (mínimo: 5)',
            type: 'warning',
            severity: 'high',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            read: false,
            category: 'estoque',
            produto: 'Toner HP LaserJet CF283A Preto',
            action: 'Solicitar reposição urgente'
        },
        {
            id: 2,
            title: 'Pedido Entregue',
            message: 'PED-2024-002: 50 unidades de Mouse Óptico Logitech M100 entregues com sucesso',
            type: 'success',
            severity: 'medium',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
            read: false,
            category: 'pedidos',
            numeroPedido: 'PED-2024-002',
            fornecedor: 'InfoTech Distribuidora'
        },
        {
            id: 3,
            title: 'Cotação Pendente',
            message: 'COT-2024-001: Aguardando aprovação para compra de 10 Notebooks Dell (R$ 27.500,00)',
            type: 'info',
            severity: 'medium',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
            read: false,
            category: 'cotacoes',
            numeroCotacao: 'COT-2024-001',
            valor: 27500.00
        },
        {
            id: 4,
            title: 'Novo Fornecedor Cadastrado',
            message: 'Móveis Corporativos S.A. foi adicionado com sucesso ao sistema',
            type: 'success',
            severity: 'low',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
            read: true,
            category: 'fornecedores',
            fornecedor: 'Móveis Corporativos S.A.'
        },
        {
            id: 5,
            title: 'Prazo de Entrega Próximo',
            message: 'PED-2024-003: Cadeiras Ergonômicas com previsão de entrega para 30/01/2024',
            type: 'warning',
            severity: 'medium',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
            read: false,
            category: 'pedidos',
            numeroPedido: 'PED-2024-003',
            dataEntrega: '2024-01-30'
        }
    ];
    
    const critical = notifications.filter(n => n.severity === 'critical').length;
    const high = notifications.filter(n => n.severity === 'high').length;
    const medium = notifications.filter(n => n.severity === 'medium').length;
    const low = notifications.filter(n => n.severity === 'low').length;
    
    res.json({
        notifications: notifications,
        total: notifications.length,
        critical: critical,
        high: high,
        medium: medium,
        low: low,
        unread: notifications.filter(n => !n.read).length
    });
});

app.get('/api/notifications/summary', (req, res) => {
    res.json({
        hasNotifications: true,
        urgentCount: 2, // Estoque crítico + prazo de entrega próximo
        totalCount: 5,
        unreadCount: 4,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 3,
        lowCount: 1
    });
});

app.post('/api/notifications/:notificationId/read', (req, res) => {
    res.json({ success: true, message: 'Notificação marcada como lida' });
});

// Rota para dashboard
app.get('/api/dashboard', (req, res) => {
    const produtosEstoqueBaixo = produtos.filter(p => p.estoque <= p.estoqueMinimo).length;
    const valorTotalEstoque = produtos.reduce((total, p) => total + (p.preco * p.estoque), 0);
    const cotacoesPendentes = cotacoes.filter(c => c.status === 'Pendente' || c.status === 'Em Análise').length;
    const pedidosAndamento = pedidos.filter(p => p.status === 'Em Andamento' || p.status === 'Aguardando Entrega').length;
    const valorTotalPedidos = pedidos.reduce((total, p) => total + p.total, 0);
    
    res.json({
        totalProdutos: produtos.length,
        totalFornecedores: fornecedores.length,
        cotacoesPendentes: cotacoesPendentes,
        pedidosAndamento: pedidosAndamento,
        produtosEstoqueBaixo: produtosEstoqueBaixo,
        valorTotalEstoque: valorTotalEstoque,
        valorTotalPedidos: valorTotalPedidos,
        fornecedoresAtivos: fornecedores.filter(f => f.status === 'Ativo').length,
        produtosAtivos: produtos.filter(p => p.status === 'Ativo').length,
        cotacoesAprovadas: cotacoes.filter(c => c.status === 'Aprovada').length,
        pedidosEntregues: pedidos.filter(p => p.status === 'Entregue').length,
        alertas: {
            estoqueCritico: produtosEstoqueBaixo,
            cotacoesPendentes: cotacoesPendentes,
            pedidosAtrasados: 0 // Pode ser calculado baseado na data de entrega
        }
    });
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
});

app.get('/test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Teste Mobile - Gestão de Suprimentos</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
                .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
                .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                button { background: #007bff; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .result { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Teste de Acesso Mobile</h1>
                <div class="status success">
                    ✅ Servidor funcionando na porta 4000!
                </div>
                <div class="status info">
                    📱 IP da rede: 192.168.1.6:4000
                </div>
                
                <h2>Testes de API:</h2>
                <button onclick="testAPI('/api/health')">Testar Health</button>
                <button onclick="testAPI('/api/produtos')">Testar Produtos</button>
                <button onclick="testAPI('/api/dashboard')">Testar Dashboard</button>
                
                <div id="results"></div>
                
                <h2>Links de Acesso:</h2>
                <p><strong>Local:</strong> <a href="http://localhost:4000">http://localhost:4000</a></p>
                <p><strong>Mobile:</strong> <a href="http://192.168.1.6:4000">http://192.168.1.6:4000</a></p>
                <p><strong>Mobile App:</strong> <a href="http://192.168.1.6:4000/mobile">http://192.168.1.6:4000/mobile</a></p>
            </div>
            
            <script>
                async function testAPI(endpoint) {
                    const resultsDiv = document.getElementById('results');
                    try {
                        const response = await fetch(endpoint);
                        const data = await response.json();
                        resultsDiv.innerHTML += '<div class="result"><strong>' + endpoint + ':</strong> ' + JSON.stringify(data, null, 2) + '</div>';
                    } catch (error) {
                        resultsDiv.innerHTML += '<div class="result" style="color: red;"><strong>' + endpoint + ':</strong> Erro - ' + error.message + '</div>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Detectar IP local automaticamente
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal && !name.toLowerCase().includes('virtualbox')) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('🚀 Servidor Mobile Definitivo iniciado!');
    console.log('📱 Acesso Mobile: http://' + localIP + ':' + PORT);
    console.log('💻 Acesso Local: http://localhost:' + PORT);
    console.log('🧪 Página de Teste: http://' + localIP + ':' + PORT + '/test');
    console.log('📊 API Health: http://' + localIP + ':' + PORT + '/api/health');
    console.log('');
    console.log('✅ Servidor pronto para acesso mobile!');
});

module.exports = app;