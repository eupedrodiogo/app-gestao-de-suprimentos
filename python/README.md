# Sistema Python - Recursos Avançados

Este módulo Python adiciona recursos avançados ao sistema de gestão de suprimentos, incluindo análise de dados, predições com machine learning, relatórios automatizados e visualizações interativas.

## 🚀 Recursos Implementados

### 📊 Analytics (Análise de Dados)
- Métricas financeiras avançadas
- Análise de inventário e rotatividade
- Performance de fornecedores
- Indicadores de performance (KPIs)
- Análise de tendências e correlações

### 🔮 Predictions (Predições com ML)
- Predição de demanda usando Random Forest
- Otimização de estoque com Gradient Boosting
- Análise de performance de fornecedores
- Modelos de machine learning treinados automaticamente

### 📈 Visualization (Visualizações)
- Dashboards interativos de inventário
- Análises visuais de fornecedores
- Gráficos de tendências financeiras
- Gráficos preditivos
- Gráficos personalizáveis

### 📋 Reports (Relatórios Avançados)
- Relatórios executivos completos
- Análise de riscos
- Recomendações automatizadas
- Exportação em múltiplos formatos

### 🤖 Automation (Automação)
- Backup automático de dados
- Relatórios agendados
- Sistema de alertas
- Agendador de tarefas

## 📦 Instalação

1. **Instalar dependências:**
   ```bash
   cd python
   python install.py
   ```

2. **Ou manualmente:**
   ```bash
   pip install -r requirements.txt
   ```

## 🏃‍♂️ Execução

### Modo Produção
```bash
python main.py
```

### Modo Desenvolvimento
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## 🌐 API Endpoints

### Analytics
- `GET /analytics/summary` - Resumo geral
- `GET /analytics/trends` - Análise de tendências
- `GET /analytics/correlations` - Correlações de dados

### Predictions
- `POST /predictions/demand` - Predição de demanda
- `POST /predictions/stock-optimization` - Otimização de estoque
- `GET /predictions/supplier-performance` - Performance de fornecedores

### Reports
- `GET /reports/advanced` - Relatório avançado
- `GET /reports/charts/{chart_type}` - Gráficos específicos

### Visualization
- `GET /visualization/dashboard/inventory` - Dashboard de inventário
- `GET /visualization/analysis/suppliers` - Análise de fornecedores
- `GET /visualization/trends/financial` - Tendências financeiras
- `POST /visualization/custom` - Gráficos personalizados

### Automation
- `POST /automation/backup` - Backup manual
- `GET /automation/alerts` - Verificar alertas
- `POST /automation/scheduler` - Configurar agendador

## 🔧 Configuração

As configurações estão no arquivo `config.py`:

- **API_HOST**: Host do servidor (padrão: 0.0.0.0)
- **API_PORT**: Porta do servidor (padrão: 8001)
- **NODE_API_URL**: URL da API Node.js (padrão: http://localhost:3000)
- **DEBUG**: Modo debug (padrão: True)

## 📁 Estrutura de Arquivos

```
python/
├── main.py              # Servidor FastAPI principal
├── config.py            # Configurações do sistema
├── requirements.txt     # Dependências Python
├── install.py          # Script de instalação
├── README.md           # Documentação
└── modules/
    ├── __init__.py     # Inicialização do módulo
    ├── analytics.py    # Serviço de análise
    ├── predictions.py  # Serviço de predições
    ├── reports.py      # Serviço de relatórios
    ├── automation.py   # Serviço de automação
    └── visualization.py # Serviço de visualização
```

## 🔗 Integração

O sistema Python integra-se com a API Node.js existente através de:
- Requisições HTTP para obter dados
- Processamento avançado com pandas/numpy
- Machine learning com scikit-learn
- Visualizações com matplotlib/plotly

## 📊 Tecnologias Utilizadas

- **FastAPI**: Framework web moderno e rápido
- **Pandas**: Manipulação e análise de dados
- **Scikit-learn**: Machine learning
- **Matplotlib/Seaborn**: Visualizações estáticas
- **Plotly**: Visualizações interativas
- **NumPy**: Computação numérica
- **Httpx**: Cliente HTTP assíncrono

## 🚀 Próximos Passos

1. Configurar variáveis de ambiente
2. Executar o servidor Python
3. Testar endpoints via documentação automática em `/docs`
4. Integrar com o frontend existente