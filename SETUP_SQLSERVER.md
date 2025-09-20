# Guia de Configuração do SQL Server

Este guia irá ajudá-lo a configurar o SQL Server para o Sistema de Gestão de Suprimentos.

## 📋 Pré-requisitos

### 1. Instalar Node.js
- Baixe e instale o Node.js versão 16 ou superior: https://nodejs.org/
- Verifique a instalação: `node --version` e `npm --version`

### 2. Instalar SQL Server

#### Opção A: SQL Server Express (Recomendado)
1. Acesse: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Clique em "Download now" na seção "Express"
3. Execute o instalador e escolha "Basic"
4. Anote o nome da instância (geralmente `SQLEXPRESS`)

#### Opção B: SQL Server LocalDB
1. Baixe o SQL Server Express LocalDB
2. Execute: `sqllocaldb create MSSQLLocalDB`
3. Execute: `sqllocaldb start MSSQLLocalDB`

## ⚙️ Configuração

### 1. Configurar SQL Server Authentication

#### Para SQL Server Express:
1. Abra o SQL Server Management Studio (SSMS)
2. Conecte-se ao servidor: `localhost\SQLEXPRESS`
3. Clique com botão direito no servidor → Properties
4. Vá para "Security" → Selecione "SQL Server and Windows Authentication mode"
5. Reinicie o serviço SQL Server

#### Habilitar usuário 'sa':
1. No SSMS, vá para Security → Logins
2. Clique com botão direito em 'sa' → Properties
3. Defina uma senha forte
4. Em "Status", marque "Enabled"

### 2. Configurar Firewall (se necessário)
```cmd
# Abrir porta 1433 no Windows Firewall
netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
```

### 3. Configurar arquivo .env
Edite o arquivo `.env` na raiz do projeto:

```env
# Para SQL Server Express
DB_SERVER=localhost\\SQLEXPRESS
DB_PORT=1433
DB_DATABASE=gestao_suprimentos
DB_USER=sa
DB_PASSWORD=SuaSenhaSegura123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Para LocalDB
# DB_SERVER=(localdb)\\MSSQLLocalDB
# DB_PORT=1433
# DB_DATABASE=gestao_suprimentos
# DB_USER=
# DB_PASSWORD=
# DB_ENCRYPT=false
# DB_TRUST_SERVER_CERTIFICATE=true
```

## 🚀 Executar o Sistema

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco de dados
```bash
# Executar migração e popular com dados de exemplo
npm run setup

# Ou executar separadamente:
npm run migrate  # Apenas criar estrutura
npm run seed     # Apenas popular dados
```

### 3. Iniciar servidor
```bash
npm start
```

### 4. Acessar aplicação
- Frontend: http://localhost:3000
- API Health Check: http://localhost:3000/api/health

## 🔧 Comandos Úteis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Apenas migração (criar tabelas)
npm run migrate

# Apenas popular dados de exemplo
npm run seed

# Popular dados forçando limpeza
npm run seed -- --force

# Verificar logs
npm run logs
```

## 🐛 Solução de Problemas

### Erro: "Login failed for user 'sa'"
- Verifique se a autenticação SQL está habilitada
- Confirme se o usuário 'sa' está habilitado
- Verifique a senha no arquivo .env

### Erro: "Cannot connect to server"
- Verifique se o SQL Server está rodando
- Confirme o nome da instância (SQLEXPRESS, MSSQLSERVER, etc.)
- Verifique se a porta 1433 está aberta

### Erro: "Database does not exist"
- Execute `npm run migrate` para criar o banco
- Verifique as permissões do usuário para criar bancos

### Erro: "Certificate error"
- Adicione `DB_TRUST_SERVER_CERTIFICATE=true` no .env
- Ou configure um certificado SSL válido

## 📊 Estrutura do Banco

O sistema criará automaticamente:

### Tabelas:
- `suppliers` - Fornecedores
- `products` - Produtos
- `quotes` - Cotações
- `quote_items` - Itens de cotação
- `orders` - Pedidos
- `order_items` - Itens de pedido
- `inventory` - Controle de estoque

### Índices:
- Otimizações para consultas frequentes
- Chaves estrangeiras para integridade

### Dados de Exemplo:
- 5 fornecedores
- 20 produtos
- 10 cotações
- 8 pedidos
- Movimentações de estoque

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs em `logs/app.log`
2. Execute `npm run health` para diagnóstico
3. Consulte a documentação do SQL Server
4. Verifique as configurações de rede e firewall