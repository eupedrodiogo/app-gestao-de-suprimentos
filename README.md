# Sistema de Gestão de Suprimentos

Um sistema completo para gerenciamento de suprimentos, fornecedores, cotações e pedidos com banco de dados SQL Server.

## 🚀 Funcionalidades

- **Dashboard** - Visão geral com métricas e gráficos
- **Produtos** - Cadastro e gerenciamento de produtos
- **Fornecedores** - Gestão de fornecedores e contatos
- **Cotações** - Sistema de cotações e comparação de preços
- **Pedidos** - Controle de pedidos de compra
- **Inventário** - Controle de estoque e movimentações
- **Relatórios** - Relatórios detalhados e análises

## 📋 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [npm](https://www.npmjs.com/) (geralmente vem com o Node.js)
- SQL Server (LocalDB, Express ou versão completa)
- SQL Server Management Studio (opcional, para administração)

### Verificar instalação:
```bash
node --version
npm --version
```

## 🗄️ Configuração do Banco de Dados

### Opção 1: SQL Server LocalDB (Recomendado para desenvolvimento)
```bash
# Instalar SQL Server LocalDB
# Download: https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb

# Verificar instalação
sqllocaldb info
```

### Opção 2: SQL Server Express
```bash
# Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
# Escolha "Express" para instalação gratuita
```

## 🛠️ Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

4. **Configure o arquivo `.env` com suas credenciais do SQL Server:**
```env
# Configurações do SQL Server
DB_SERVER=localhost\\SQLEXPRESS
DB_PORT=1433
DB_DATABASE=gestao_suprimentos
DB_USER=sa
DB_PASSWORD=sua_senha_aqui
DB_ENCRYPT=true

# Configurações do servidor
PORT=3000
NODE_ENV=development
```

5. **Execute a migração e população do banco:**
```bash
npm run setup
```

6. **Inicie o servidor:**
```bash
npm start
```

7. **Para desenvolvimento (com auto-reload):**
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
gestão-de-suprimentos/
├── controllers/           # Controladores da API
│   ├── ProductController.js
│   ├── SupplierController.js
│   ├── QuoteController.js
│   ├── OrderController.js
│   └── InventoryController.js
├── database.js           # Configuração do banco SQLite
├── server.js            # Servidor Express
├── init-database.js     # Script de inicialização do BD
├── index.html           # Interface principal
├── styles.css           # Estilos CSS
├── script.js            # JavaScript frontend
├── package.json         # Dependências e scripts
└── README.md           # Este arquivo
```

## 🌐 Acesso

Após iniciar o servidor, acesse:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

## 📊 API Endpoints

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto

### Fornecedores
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor
- `PUT /api/suppliers/:id` - Atualizar fornecedor
- `DELETE /api/suppliers/:id` - Excluir fornecedor

### Cotações
- `GET /api/quotes` - Listar cotações
- `POST /api/quotes` - Criar cotação
- `PUT /api/quotes/:id` - Atualizar cotação
- `DELETE /api/quotes/:id` - Excluir cotação

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Criar pedido
- `PUT /api/orders/:id` - Atualizar pedido
- `DELETE /api/orders/:id` - Excluir pedido

### Inventário
- `GET /api/inventory` - Listar inventário
- `POST /api/inventory/adjust` - Ajustar estoque
- `GET /api/inventory/movements` - Movimentações
- `GET /api/inventory/alerts` - Alertas de estoque

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de produção
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run init-db` - Inicializa o banco de dados
- `npm test` - Executa os testes

## 💾 Banco de Dados

O sistema utiliza SQLite como banco de dados, que é criado automaticamente no arquivo `database.sqlite` na raiz do projeto.

### Tabelas principais:
- **products** - Produtos
- **suppliers** - Fornecedores
- **quotes** - Cotações
- **quote_items** - Itens de cotação
- **orders** - Pedidos
- **order_items** - Itens de pedido
- **inventory_movements** - Movimentações de estoque
- **categories** - Categorias

## 🎨 Interface

A interface é totalmente responsiva e moderna, com:
- Design clean e profissional
- Gráficos interativos
- Tabelas com filtros e ordenação
- Modais para entrada de dados
- Alertas e notificações
- Tema escuro/claro

## 🔒 Segurança

O sistema inclui:
- Rate limiting para APIs
- Validação de dados
- Sanitização de entradas
- Headers de segurança
- Logs de auditoria

## 📈 Métricas e Relatórios

- Dashboard com KPIs principais
- Gráficos de vendas e estoque
- Relatórios de fornecedores
- Análise de cotações
- Controle de inventário
- Alertas automáticos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do projeto.

---

**Desenvolvido com ❤️ para gestão eficiente de suprimentos**