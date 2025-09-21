# Instalação do Node.js

Para executar este projeto, você precisa ter o Node.js instalado.

## Passos para instalação:

### 1. Download do Node.js
- Acesse: https://nodejs.org/
- Baixe a versão LTS (recomendada)
- Execute o instalador e siga as instruções

### 2. Verificação da instalação
Após a instalação, abra um novo terminal e execute:
```bash
node --version
npm --version
```

### 3. Instalação das dependências do projeto

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### 4. Executar o projeto

#### Iniciar o backend:
```bash
cd backend
npm start
```

#### Servir o frontend (opcional):
```bash
cd frontend
npm run serve
```

O backend servirá automaticamente os arquivos do frontend em http://localhost:3000

## Estrutura do projeto após instalação:

```
gestão de suprimentos/
├── backend/           # Servidor Node.js + Express
│   ├── controllers/   # Controladores da API
│   ├── database/      # Configuração do banco
│   ├── middleware/    # Middlewares customizados
│   ├── routes/        # Rotas organizadas
│   ├── scripts/       # Scripts utilitários
│   └── server.js      # Arquivo principal
├── frontend/          # Interface web
│   ├── assets/        # Recursos estáticos
│   ├── components/    # Componentes reutilizáveis
│   ├── css/           # Estilos
│   ├── js/            # JavaScript
│   └── index.html     # Página principal
└── docs/              # Documentação
```