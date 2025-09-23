"""
API Python para recursos avançados de gestão de suprimentos
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import sys
from pathlib import Path

# Adicionar o diretório atual ao path
sys.path.append(str(Path(__file__).parent))

from config import settings
from modules.analytics import AnalyticsService
from modules.predictions import PredictionService
from modules.reports import ReportsService
from modules.automation import AutomationService
from modules.visualization import VisualizationService

# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Criar instância do FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="API Python para recursos avançados de análise e automação"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciar serviços
analytics_service = AnalyticsService()
prediction_service = PredictionService()
reports_service = ReportsService()
automation_service = AutomationService()
visualization_service = VisualizationService()

@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": f"Bem-vindo ao {settings.app_name}",
        "version": settings.version,
        "status": "online"
    }

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    return {
        "status": "healthy",
        "timestamp": analytics_service.get_current_timestamp(),
        "services": {
            "analytics": "online",
            "predictions": "online",
            "reports": "online",
            "automation": "online"
        }
    }

# Rotas de Analytics
@app.get(f"{settings.api_prefix}/analytics/summary")
async def get_analytics_summary():
    """Obter resumo analítico dos dados"""
    try:
        summary = await analytics_service.get_summary()
        return summary
    except Exception as e:
        logger.error(f"Erro ao obter resumo analítico: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/analytics/trends")
async def get_trends(period: str = "30d"):
    """Obter tendências de dados"""
    try:
        trends = await analytics_service.get_trends(period)
        return trends
    except Exception as e:
        logger.error(f"Erro ao obter tendências: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/analytics/correlations")
async def get_correlations():
    """Obter correlações entre variáveis"""
    try:
        correlations = await analytics_service.get_correlations()
        return correlations
    except Exception as e:
        logger.error(f"Erro ao obter correlações: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/analytics/performance")
async def get_performance():
    """Obter métricas de performance"""
    try:
        performance = await analytics_service.get_performance()
        return performance
    except Exception as e:
        logger.error(f"Erro ao obter performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/analytics/suppliers")
async def get_supplier_analytics():
    """Obter analytics de fornecedores"""
    try:
        suppliers = await analytics_service.get_supplier_analytics()
        return suppliers
    except Exception as e:
        logger.error(f"Erro ao obter analytics de fornecedores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rotas de Predições
@app.get(f"{settings.api_prefix}/predictions/demand")
async def predict_demand(product_id: int, days_ahead: int = 30):
    """Predizer demanda de produto"""
    try:
        prediction = await prediction_service.predict_demand(product_id, days_ahead)
        return prediction
    except Exception as e:
        logger.error(f"Erro ao predizer demanda: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/predictions/stock-optimization")
async def optimize_stock():
    """Otimizar níveis de estoque"""
    try:
        optimization = await prediction_service.optimize_stock()
        return optimization
    except Exception as e:
        logger.error(f"Erro ao otimizar estoque: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/predictions/supplier-performance")
async def predict_supplier_performance():
    """Predizer performance de fornecedores"""
    try:
        performance = await prediction_service.predict_supplier_performance()
        return performance
    except Exception as e:
        logger.error(f"Erro ao predizer performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/predictions/price-prediction")
async def predict_prices():
    """Predizer preços de produtos"""
    try:
        prices = await prediction_service.predict_prices()
        return prices
    except Exception as e:
        logger.error(f"Erro ao predizer preços: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rotas de Relatórios
@app.get(f"{settings.api_prefix}/reports/advanced")
async def generate_advanced_report(report_type: str = "comprehensive"):
    """Gerar relatório avançado"""
    try:
        report = await reports_service.generate_advanced_report(report_type)
        return report
    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.api_prefix}/reports/charts")
async def generate_charts(chart_type: str = "all"):
    """Gerar gráficos avançados"""
    try:
        charts = await reports_service.generate_charts(chart_type)
        return charts
    except Exception as e:
        logger.error(f"Erro ao gerar gráficos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === ROTAS DE VISUALIZAÇÃO ===

@app.get("/visualization/dashboard/inventory")
async def get_inventory_dashboard():
    """Obter dashboard de inventário"""
    try:
        dashboard = await visualization_service.create_inventory_dashboard()
        return {"status": "success", "data": dashboard}
    except Exception as e:
        logger.error(f"Erro ao criar dashboard de inventário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization/analysis/suppliers")
async def get_supplier_analysis():
    """Obter análise visual de fornecedores"""
    try:
        analysis = await visualization_service.create_supplier_analysis()
        return {"status": "success", "data": analysis}
    except Exception as e:
        logger.error(f"Erro ao criar análise de fornecedores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization/trends/financial")
async def get_financial_trends():
    """Obter tendências financeiras"""
    try:
        trends = await visualization_service.create_financial_trends()
        return {"status": "success", "data": trends}
    except Exception as e:
        logger.error(f"Erro ao criar tendências financeiras: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization/predictions")
async def get_predictive_charts():
    """Obter gráficos de predição"""
    try:
        charts = await visualization_service.create_predictive_charts()
        return {"status": "success", "data": charts}
    except Exception as e:
        logger.error(f"Erro ao criar gráficos preditivos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualization/custom")
async def create_custom_chart(chart_config: dict):
    """Criar gráfico personalizado"""
    try:
        chart = await visualization_service.create_custom_chart(chart_config)
        return {"status": "success", "data": chart}
    except Exception as e:
        logger.error(f"Erro ao criar gráfico personalizado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization/charts")
async def get_all_charts():
    """Obter lista de todos os gráficos"""
    try:
        charts = await visualization_service.get_all_charts()
        return {"status": "success", "data": charts}
    except Exception as e:
        logger.error(f"Erro ao listar gráficos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === ROTAS DE AUTOMAÇÃO ===

@app.post("/automation/backup")
async def trigger_backup():
    """Executar backup automático"""
    try:
        result = await automation_service.backup_database()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Erro no backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/automation/reports")
async def generate_automated_report():
    """Gerar relatório automatizado"""
    try:
        result = await automation_service.generate_automated_reports()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Erro ao gerar relatório automatizado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/automation/alerts")
async def check_alerts():
    """Verificar alertas do sistema"""
    try:
        alerts = await automation_service.check_alerts()
        return {"status": "success", "data": alerts}
    except Exception as e:
        logger.error(f"Erro ao verificar alertas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/automation/scheduler")
async def setup_scheduler():
    """Configurar agendador de tarefas"""
    try:
        result = await automation_service.setup_scheduler()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Erro ao configurar agendador: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info(f"Iniciando {settings.app_name} v{settings.version}")
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )