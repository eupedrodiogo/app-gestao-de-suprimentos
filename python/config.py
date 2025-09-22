"""
Configurações do sistema Python para gestão de suprimentos
"""
import os
from pathlib import Path
from typing import Optional

class Settings:
    """Configurações da aplicação"""
    
    def __init__(self):
        # Configurações básicas
        self.app_name = os.getenv("APP_NAME", "Supply Management Analytics")
        self.version = os.getenv("VERSION", "1.0.0")
        self.debug = os.getenv("DEBUG", "False").lower() == "true"
        
        # Configurações do banco de dados
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./data/supply_management.db")
        
        # Configurações da API
        self.api_host = os.getenv("API_HOST", "localhost")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.api_prefix = os.getenv("API_PREFIX", "/api/v1")
        
        # Configurações do Node.js server
        self.nodejs_api_url = os.getenv("NODEJS_API_URL", "http://localhost:3000/api")
        
        # Configurações de ML
        self.ml_model_path = os.getenv("ML_MODEL_PATH", "./models")
        self.prediction_confidence_threshold = float(os.getenv("PREDICTION_CONFIDENCE_THRESHOLD", "0.8"))
        
        # Configurações de relatórios
        self.reports_output_path = os.getenv("REPORTS_OUTPUT_PATH", "./reports")
        self.chart_output_path = os.getenv("CHART_OUTPUT_PATH", "./charts")
        
        # Configurações de logging
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.log_file = os.getenv("LOG_FILE", "./logs/app.log")
        
        # Configurações de backup
        self.backup_path = os.getenv("BACKUP_PATH", "./backups")
        self.backup_retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))

# Instância global das configurações
settings = Settings()

# Criar diretórios necessários
def create_directories():
    """Cria os diretórios necessários para a aplicação"""
    directories = [
        Path(settings.ml_model_path),
        Path(settings.reports_output_path),
        Path(settings.chart_output_path),
        Path(settings.backup_path),
        Path("./logs"),
        Path("./data")
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

# Executar criação de diretórios na importação
create_directories()