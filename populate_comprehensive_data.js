const Database = require('./backend/database/database.js');

class ComprehensiveDataPopulator {
    constructor() {
        this.db = new Database();
    }

    async init() {
        await this.db.connect();
        console.log('🔗 Conectado ao banco de dados');
    }

    async populateAll() {
        try {
            console.log('🚀 Iniciando população de dados completos...');
            
            // Criar fornecedores especializados
            const suppliers = await this.createSpecializedSuppliers();
            console.log(`✅ ${suppliers.length} fornecedores especializados criados`);
            
            // Criar produtos por categoria
            const hygieneProducts = await this.createHygieneProducts();
            console.log(`✅ ${hygieneProducts.length} produtos de higiene e limpeza criados`);
            
            const disposableProducts = await this.createDisposableProducts();
            console.log(`✅ ${disposableProducts.length} produtos descartáveis criados`);
            
            const graphicProducts = await this.createGraphicProducts();
            console.log(`✅ ${graphicProducts.length} produtos gráficos criados`);
            
            const officeProducts = await this.createOfficeProducts();
            console.log(`✅ ${officeProducts.length} produtos de escritório criados`);
            
            const maintenanceProducts = await this.createMaintenanceProducts();
            console.log(`✅ ${maintenanceProducts.length} produtos de manutenção predial criados`);
            
            console.log('🎉 População de dados completa!');
            
        } catch (error) {
            console.error('❌ Erro ao popular dados:', error);
            throw error;
        }
    }

    async createSpecializedSuppliers() {
        const suppliers = [
            // Fornecedores de Higiene e Limpeza
            {
                cnpj: '12.345.678/0001-90',
                name: 'HigiClean Distribuidora',
                contact_name: 'Sandra Limpeza',
                email: 'sandra@higiclean.com.br',
                phone: '(11) 3333-4444',
                address: 'Rua da Limpeza, 100',
                city: 'São Paulo',
                state: 'SP',
                zip_code: '01234-100',
                specialty: 'Higiene e Limpeza'
            },
            {
                cnpj: '23.456.789/0001-01',
                name: 'Produtos de Limpeza Master',
                contact_name: 'Carlos Detergente',
                email: 'carlos@limpezamaster.com.br',
                phone: '(21) 2222-3333',
                address: 'Av. Higiene, 200',
                city: 'Rio de Janeiro',
                state: 'RJ',
                zip_code: '20234-200',
                specialty: 'Higiene e Limpeza'
            },
            
            // Fornecedores de Descartáveis
            {
                cnpj: '34.567.890/0001-12',
                name: 'Descartáveis Premium',
                contact_name: 'Ana Descartável',
                email: 'ana@descartaveispremium.com.br',
                phone: '(31) 4444-5555',
                address: 'Rua dos Copos, 300',
                city: 'Belo Horizonte',
                state: 'MG',
                zip_code: '30234-300',
                specialty: 'Descartáveis'
            },
            {
                cnpj: '45.678.901/0001-23',
                name: 'EcoDescart Sustentável',
                contact_name: 'Pedro Ecológico',
                email: 'pedro@ecodescart.com.br',
                phone: '(41) 5555-6666',
                address: 'Av. Sustentável, 400',
                city: 'Curitiba',
                state: 'PR',
                zip_code: '80234-400',
                specialty: 'Descartáveis Ecológicos'
            },
            
            // Fornecedores de Material Gráfico
            {
                cnpj: '56.789.012/0001-34',
                name: 'Gráfica Total Suprimentos',
                contact_name: 'Mariana Impressão',
                email: 'mariana@graficatotal.com.br',
                phone: '(51) 6666-7777',
                address: 'Rua da Impressão, 500',
                city: 'Porto Alegre',
                state: 'RS',
                zip_code: '90234-500',
                specialty: 'Material Gráfico'
            },
            {
                cnpj: '67.890.123/0001-45',
                name: 'Print & Design Supplies',
                contact_name: 'Roberto Designer',
                email: 'roberto@printdesign.com.br',
                phone: '(62) 7777-8888',
                address: 'Av. Design, 600',
                city: 'Goiânia',
                state: 'GO',
                zip_code: '74234-600',
                specialty: 'Material Gráfico e Design'
            },
            
            // Fornecedores de Material de Escritório
            {
                cnpj: '78.901.234/0001-56',
                name: 'Escritório Completo Ltda',
                contact_name: 'Julia Papelaria',
                email: 'julia@escritoriocompleto.com.br',
                phone: '(85) 8888-9999',
                address: 'Rua do Escritório, 700',
                city: 'Fortaleza',
                state: 'CE',
                zip_code: '60234-700',
                specialty: 'Material de Escritório'
            },
            {
                cnpj: '89.012.345/0001-67',
                name: 'Office Solutions Pro',
                contact_name: 'Fernando Caneta',
                email: 'fernando@officesolutions.com.br',
                phone: '(71) 9999-0000',
                address: 'Av. Corporativa, 800',
                city: 'Salvador',
                state: 'BA',
                zip_code: '40234-800',
                specialty: 'Soluções de Escritório'
            },
            
            // Fornecedores de Manutenção Predial
            {
                cnpj: '90.123.456/0001-78',
                name: 'Manutenção & Ferramentas',
                contact_name: 'José Martelo',
                email: 'jose@manutencaoferramentas.com.br',
                phone: '(61) 1111-2222',
                address: 'Rua das Ferramentas, 900',
                city: 'Brasília',
                state: 'DF',
                zip_code: '70234-900',
                specialty: 'Manutenção Predial'
            },
            {
                cnpj: '01.234.567/0001-89',
                name: 'Predial Tech Suprimentos',
                contact_name: 'Carla Chave',
                email: 'carla@predialtech.com.br',
                phone: '(27) 2222-3333',
                address: 'Av. Manutenção, 1000',
                city: 'Vitória',
                state: 'ES',
                zip_code: '29234-000',
                specialty: 'Tecnologia Predial'
            }
        ];

        const createdSuppliers = [];
        for (const supplier of suppliers) {
            try {
                const result = await this.db.adicionarFornecedor(supplier);
                createdSuppliers.push(result);
            } catch (error) {
                console.log(`⚠️ Fornecedor ${supplier.name} pode já existir`);
            }
        }
        
        return createdSuppliers;
    }

    async createHygieneProducts() {
        const products = [
            // Produtos de Limpeza
            {
                code: 'LMP001',
                name: 'Detergente Neutro 5L',
                description: 'Detergente neutro concentrado para limpeza geral',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 25.90,
                stock: 50,
                min_stock: 10,
                supplier_id: 1
            },
            {
                code: 'LMP002',
                name: 'Desinfetante Hospitalar 1L',
                description: 'Desinfetante hospitalar com ação bactericida',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 18.50,
                stock: 75,
                min_stock: 15,
                supplier_id: 1
            },
            {
                code: 'LMP003',
                name: 'Álcool Gel 70% 500ml',
                description: 'Álcool gel antisséptico para higienização das mãos',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 12.90,
                stock: 100,
                min_stock: 20,
                supplier_id: 1
            },
            {
                code: 'LMP004',
                name: 'Sabão Líquido Antibacteriano 5L',
                description: 'Sabão líquido com ação antibacteriana para banheiros',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 32.00,
                stock: 40,
                min_stock: 8,
                supplier_id: 2
            },
            {
                code: 'LMP005',
                name: 'Limpador Multiuso 2L',
                description: 'Limpador multiuso para diversas superfícies',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 15.75,
                stock: 60,
                min_stock: 12,
                supplier_id: 2
            },
            {
                code: 'LMP006',
                name: 'Água Sanitária 2L',
                description: 'Água sanitária para desinfecção e branqueamento',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 8.90,
                stock: 80,
                min_stock: 16,
                supplier_id: 1
            },
            {
                code: 'LMP007',
                name: 'Limpa Vidros 500ml',
                description: 'Produto específico para limpeza de vidros e espelhos',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 9.50,
                stock: 45,
                min_stock: 9,
                supplier_id: 2
            },
            {
                code: 'LMP008',
                name: 'Cera Líquida Incolor 750ml',
                description: 'Cera líquida para proteção e brilho de pisos',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 22.00,
                stock: 30,
                min_stock: 6,
                supplier_id: 1
            },
            {
                code: 'LMP009',
                name: 'Removedor de Gordura 1L',
                description: 'Removedor de gordura para cozinhas e áreas industriais',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 28.50,
                stock: 35,
                min_stock: 7,
                supplier_id: 2
            },
            {
                code: 'LMP010',
                name: 'Papel Higiênico Folha Dupla',
                description: 'Papel higiênico folha dupla, pacote com 12 rolos',
                category: 'Higiene e Limpeza',
                unit: 'PCT',
                price: 24.90,
                stock: 120,
                min_stock: 24,
                supplier_id: 1
            },
            {
                code: 'LMP011',
                name: 'Papel Toalha Interfolhado',
                description: 'Papel toalha interfolhado para dispensers, pacote com 1000 folhas',
                category: 'Higiene e Limpeza',
                unit: 'PCT',
                price: 18.00,
                stock: 90,
                min_stock: 18,
                supplier_id: 2
            },
            {
                code: 'LMP012',
                name: 'Sabonete Líquido Glicerinado 5L',
                description: 'Sabonete líquido glicerinado para dispensers',
                category: 'Higiene e Limpeza',
                unit: 'UN',
                price: 45.00,
                stock: 25,
                min_stock: 5,
                supplier_id: 1
            }
        ];

        const createdProducts = [];
        for (const product of products) {
            try {
                const result = await this.db.adicionarProduto(product);
                createdProducts.push(result);
            } catch (error) {
                console.log(`⚠️ Produto ${product.name} pode já existir`);
            }
        }
        
        return createdProducts;
    }

    async createDisposableProducts() {
        const products = [
            {
                code: 'DESC001',
                name: 'Copo Descartável 200ml',
                description: 'Copo descartável transparente 200ml, pacote com 100 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 12.50,
                stock: 200,
                min_stock: 40,
                supplier_id: 3
            },
            {
                code: 'DESC002',
                name: 'Prato Descartável Branco',
                description: 'Prato descartável branco 21cm, pacote com 50 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 15.90,
                stock: 150,
                min_stock: 30,
                supplier_id: 3
            },
            {
                code: 'DESC003',
                name: 'Garfo Descartável Cristal',
                description: 'Garfo descartável cristal, pacote com 50 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 8.75,
                stock: 180,
                min_stock: 36,
                supplier_id: 4
            },
            {
                code: 'DESC004',
                name: 'Guardanapo de Papel',
                description: 'Guardanapo de papel branco, pacote com 100 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 6.50,
                stock: 250,
                min_stock: 50,
                supplier_id: 3
            },
            {
                code: 'DESC005',
                name: 'Sacola Plástica 30x40cm',
                description: 'Sacola plástica resistente 30x40cm, pacote com 100 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 22.00,
                stock: 100,
                min_stock: 20,
                supplier_id: 4
            },
            {
                code: 'DESC006',
                name: 'Marmita Descartável 750ml',
                description: 'Marmita descartável com tampa 750ml, pacote com 25 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 28.90,
                stock: 80,
                min_stock: 16,
                supplier_id: 3
            },
            {
                code: 'DESC007',
                name: 'Copo Café Descartável 50ml',
                description: 'Copo descartável para café 50ml, pacote com 100 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 9.90,
                stock: 300,
                min_stock: 60,
                supplier_id: 4
            },
            {
                code: 'DESC008',
                name: 'Bandeja Descartável Retangular',
                description: 'Bandeja descartável retangular 35x25cm, pacote com 20 unidades',
                category: 'Descartáveis',
                unit: 'PCT',
                price: 18.50,
                stock: 120,
                min_stock: 24,
                supplier_id: 3
            }
        ];

        const createdProducts = [];
        for (const product of products) {
            try {
                const result = await this.db.adicionarProduto(product);
                createdProducts.push(result);
            } catch (error) {
                console.log(`⚠️ Produto ${product.name} pode já existir`);
            }
        }
        
        return createdProducts;
    }

    async createGraphicProducts() {
        const products = [
            {
                code: 'GRAF001',
                name: 'Papel Fotográfico A4 230g',
                description: 'Papel fotográfico glossy A4 230g, pacote com 50 folhas',
                category: 'Material Gráfico',
                unit: 'PCT',
                price: 45.90,
                stock: 60,
                min_stock: 12,
                supplier_id: 5
            },
            {
                code: 'GRAF002',
                name: 'Cartolina Colorida A3',
                description: 'Cartolina colorida A3 180g, pacote com 25 folhas sortidas',
                category: 'Material Gráfico',
                unit: 'PCT',
                price: 32.50,
                stock: 80,
                min_stock: 16,
                supplier_id: 6
            },
            {
                code: 'GRAF003',
                name: 'Papel Couché 115g A4',
                description: 'Papel couché fosco 115g A4, pacote com 250 folhas',
                category: 'Material Gráfico',
                unit: 'PCT',
                price: 55.00,
                stock: 40,
                min_stock: 8,
                supplier_id: 5
            },
            {
                code: 'GRAF004',
                name: 'Tinta para Impressora HP Preta',
                description: 'Cartucho de tinta preta compatível HP 664XL',
                category: 'Material Gráfico',
                unit: 'UN',
                price: 85.00,
                stock: 25,
                min_stock: 5,
                supplier_id: 6
            },
            {
                code: 'GRAF005',
                name: 'Tinta para Impressora Canon Colorida',
                description: 'Kit cartuchos coloridos compatível Canon PG-245/CL-246',
                category: 'Material Gráfico',
                unit: 'KIT',
                price: 120.00,
                stock: 20,
                min_stock: 4,
                supplier_id: 5
            },
            {
                code: 'GRAF006',
                name: 'Papel Adesivo A4 Branco',
                description: 'Papel adesivo branco A4 para impressão, pacote com 100 folhas',
                category: 'Material Gráfico',
                unit: 'PCT',
                price: 38.90,
                stock: 50,
                min_stock: 10,
                supplier_id: 6
            },
            {
                code: 'GRAF007',
                name: 'Laminação Plastificadora A4',
                description: 'Filme para plastificação A4 125 micras, pacote com 100 unidades',
                category: 'Material Gráfico',
                unit: 'PCT',
                price: 42.00,
                stock: 35,
                min_stock: 7,
                supplier_id: 5
            },
            {
                code: 'GRAF008',
                name: 'Banner Lona 440g m²',
                description: 'Lona para banner 440g por metro quadrado',
                category: 'Material Gráfico',
                unit: 'M2',
                price: 15.50,
                stock: 100,
                min_stock: 20,
                supplier_id: 6
            }
        ];

        const createdProducts = [];
        for (const product of products) {
            try {
                const result = await this.db.adicionarProduto(product);
                createdProducts.push(result);
            } catch (error) {
                console.log(`⚠️ Produto ${product.name} pode já existir`);
            }
        }
        
        return createdProducts;
    }

    async createOfficeProducts() {
        const products = [
            {
                code: 'ESC001',
                name: 'Caneta Esferográfica Azul BIC',
                description: 'Caneta esferográfica azul BIC Cristal, caixa com 50 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 45.00,
                stock: 80,
                min_stock: 16,
                supplier_id: 7
            },
            {
                code: 'ESC002',
                name: 'Lápis HB Faber-Castell',
                description: 'Lápis grafite HB Faber-Castell, caixa com 72 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 65.00,
                stock: 60,
                min_stock: 12,
                supplier_id: 8
            },
            {
                code: 'ESC003',
                name: 'Borracha Branca Mercur',
                description: 'Borracha branca Mercur nº 40, caixa com 40 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 28.00,
                stock: 100,
                min_stock: 20,
                supplier_id: 7
            },
            {
                code: 'ESC004',
                name: 'Grampeador Médio 26/6',
                description: 'Grampeador médio para grampos 26/6, capacidade 25 folhas',
                category: 'Material de Escritório',
                unit: 'UN',
                price: 35.90,
                stock: 40,
                min_stock: 8,
                supplier_id: 8
            },
            {
                code: 'ESC005',
                name: 'Grampos 26/6 Galvanizado',
                description: 'Grampos galvanizados 26/6, caixa com 5000 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 12.50,
                stock: 150,
                min_stock: 30,
                supplier_id: 7
            },
            {
                code: 'ESC006',
                name: 'Pasta Suspensa A4',
                description: 'Pasta suspensa A4 com visor, caixa com 25 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 85.00,
                stock: 30,
                min_stock: 6,
                supplier_id: 8
            },
            {
                code: 'ESC007',
                name: 'Clips Nº 2 Galvanizado',
                description: 'Clips galvanizados nº 2, caixa com 500 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 8.90,
                stock: 200,
                min_stock: 40,
                supplier_id: 7
            },
            {
                code: 'ESC008',
                name: 'Fita Adesiva Transparente',
                description: 'Fita adesiva transparente 12mm x 30m, pacote com 10 unidades',
                category: 'Material de Escritório',
                unit: 'PCT',
                price: 22.00,
                stock: 90,
                min_stock: 18,
                supplier_id: 8
            },
            {
                code: 'ESC009',
                name: 'Marcador de Texto Amarelo',
                description: 'Marcador de texto amarelo, caixa com 12 unidades',
                category: 'Material de Escritório',
                unit: 'CX',
                price: 36.00,
                stock: 70,
                min_stock: 14,
                supplier_id: 7
            },
            {
                code: 'ESC010',
                name: 'Caderno Universitário 200 Folhas',
                description: 'Caderno universitário capa dura 200 folhas',
                category: 'Material de Escritório',
                unit: 'UN',
                price: 18.50,
                stock: 120,
                min_stock: 24,
                supplier_id: 8
            }
        ];

        const createdProducts = [];
        for (const product of products) {
            try {
                const result = await this.db.adicionarProduto(product);
                createdProducts.push(result);
            } catch (error) {
                console.log(`⚠️ Produto ${product.name} pode já existir`);
            }
        }
        
        return createdProducts;
    }

    async createMaintenanceProducts() {
        const products = [
            {
                code: 'MAN001',
                name: 'Chave de Fenda 6mm',
                description: 'Chave de fenda cabo isolado 6mm x 150mm',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 15.90,
                stock: 50,
                min_stock: 10,
                supplier_id: 9
            },
            {
                code: 'MAN002',
                name: 'Chave Phillips 6mm',
                description: 'Chave Phillips cabo isolado 6mm x 150mm',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 16.50,
                stock: 45,
                min_stock: 9,
                supplier_id: 10
            },
            {
                code: 'MAN003',
                name: 'Martelo Unha 300g',
                description: 'Martelo unha cabo fibra 300g',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 28.90,
                stock: 30,
                min_stock: 6,
                supplier_id: 9
            },
            {
                code: 'MAN004',
                name: 'Furadeira Elétrica 500W',
                description: 'Furadeira elétrica 500W com maleta e brocas',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 185.00,
                stock: 15,
                min_stock: 3,
                supplier_id: 10
            },
            {
                code: 'MAN005',
                name: 'Parafuso Phillips 3x25mm',
                description: 'Parafuso Phillips cabeça chata 3x25mm, caixa com 100 unidades',
                category: 'Manutenção Predial',
                unit: 'CX',
                price: 12.00,
                stock: 80,
                min_stock: 16,
                supplier_id: 9
            },
            {
                code: 'MAN006',
                name: 'Bucha S6 com Parafuso',
                description: 'Bucha S6 com parafuso 4x40mm, caixa com 50 unidades',
                category: 'Manutenção Predial',
                unit: 'CX',
                price: 18.50,
                stock: 60,
                min_stock: 12,
                supplier_id: 10
            },
            {
                code: 'MAN007',
                name: 'Fita Isolante Preta 19mm',
                description: 'Fita isolante preta 19mm x 20m',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 8.90,
                stock: 100,
                min_stock: 20,
                supplier_id: 9
            },
            {
                code: 'MAN008',
                name: 'Lâmpada LED 9W Branca',
                description: 'Lâmpada LED bulbo 9W luz branca 6500K',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 12.50,
                stock: 150,
                min_stock: 30,
                supplier_id: 10
            },
            {
                code: 'MAN009',
                name: 'Tomada 2P+T 10A Branca',
                description: 'Tomada 2P+T 10A padrão brasileiro branca',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 9.90,
                stock: 120,
                min_stock: 24,
                supplier_id: 9
            },
            {
                code: 'MAN010',
                name: 'Interruptor Simples Branco',
                description: 'Interruptor simples 10A padrão brasileiro branco',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 7.50,
                stock: 140,
                min_stock: 28,
                supplier_id: 10
            },
            {
                code: 'MAN011',
                name: 'Cabo Flexível 2,5mm Azul',
                description: 'Cabo flexível 2,5mm² azul, rolo com 100 metros',
                category: 'Manutenção Predial',
                unit: 'RL',
                price: 185.00,
                stock: 20,
                min_stock: 4,
                supplier_id: 9
            },
            {
                code: 'MAN012',
                name: 'Cano PVC 20mm',
                description: 'Cano PVC rígido 20mm x 3m para instalações elétricas',
                category: 'Manutenção Predial',
                unit: 'UN',
                price: 8.50,
                stock: 200,
                min_stock: 40,
                supplier_id: 10
            }
        ];

        const createdProducts = [];
        for (const product of products) {
            try {
                const result = await this.db.adicionarProduto(product);
                createdProducts.push(result);
            } catch (error) {
                console.log(`⚠️ Produto ${product.name} pode já existir`);
            }
        }
        
        return createdProducts;
    }

    async close() {
        await this.db.disconnect();
        console.log('🔒 Conexão com banco de dados fechada');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const populator = new ComprehensiveDataPopulator();
    
    populator.init()
        .then(() => populator.populateAll())
        .then(() => populator.close())
        .catch(error => {
            console.error('❌ Erro:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveDataPopulator;