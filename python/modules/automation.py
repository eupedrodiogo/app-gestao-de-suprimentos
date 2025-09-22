"""
Módulo de automação simplificado para gestão de suprimentos
"""

import httpx
import json
import schedule
import time
import threading
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import os
from pathlib import Path

class AutomationService:
    """Serviço de automação simplificado"""
    
    def __init__(self, node_api_url: str = "http://localhost:3000"):
        self.node_api_url = node_api_url
        self.logger = logging.getLogger(__name__)
        self.scheduler_running = False
        self.scheduler_thread = None
        
        # Criar diretórios necessários
        self.backup_dir = Path("../backups")
        self.reports_dir = Path("../reports")
        self.logs_dir = Path("../logs")
        
        for directory in [self.backup_dir, self.reports_dir, self.logs_dir]:
            directory.mkdir(exist_ok=True)
    
    async def _get_data_from_api(self, endpoint: str = "") -> Dict[str, Any]:
        """Obter dados da API Node.js"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.node_api_url}/api/{endpoint}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            self.logger.error(f"Erro ao obter dados da API: {e}")
            return {"error": str(e), "data": []}
    
    async def create_backup(self) -> Dict[str, Any]:
        """Criar backup dos dados"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_data = {}
            
            # Obter dados de todas as entidades
            entities = ["products", "suppliers", "orders"]
            
            for entity in entities:
                data = await self._get_data_from_api(entity)
                if "error" not in data:
                    backup_data[entity] = data.get('data', [])
                    self.logger.info(f"Backup de {entity}: {len(backup_data[entity])} registros")
                else:
                    self.logger.warning(f"Erro ao fazer backup de {entity}: {data['error']}")
                    backup_data[entity] = []
            
            # Adicionar metadados do backup
            backup_data["metadata"] = {
                "created_at": datetime.now().isoformat(),
                "version": "1.0",
                "total_records": sum(len(backup_data[entity]) for entity in entities),
                "entities": entities
            }
            
            # Salvar backup
            backup_filename = f"backup_{timestamp}.json"
            backup_path = self.backup_dir / backup_filename
            
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
            
            # Limpar backups antigos (manter apenas os últimos 10)
            self._cleanup_old_backups()
            
            return {
                "status": "success",
                "backup_file": backup_filename,
                "backup_path": str(backup_path),
                "total_records": backup_data["metadata"]["total_records"],
                "entities_backed_up": entities,
                "created_at": backup_data["metadata"]["created_at"]
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar backup: {e}")
            return {"status": "error", "error": str(e)}
    
    def _cleanup_old_backups(self, max_backups: int = 10):
        """Limpar backups antigos"""
        try:
            backup_files = list(self.backup_dir.glob("backup_*.json"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Remover backups excedentes
            for old_backup in backup_files[max_backups:]:
                old_backup.unlink()
                self.logger.info(f"Backup antigo removido: {old_backup.name}")
                
        except Exception as e:
            self.logger.error(f"Erro ao limpar backups antigos: {e}")
    
    async def generate_automated_reports(self) -> Dict[str, Any]:
        """Gerar relatórios automatizados"""
        try:
            from .reports import ReportsService
            
            reports_service = ReportsService(self.node_api_url)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Gerar diferentes tipos de relatórios
            reports_generated = []
            
            # Relatório de inventário
            try:
                inventory_report = await reports_service.generate_inventory_report()
                if "error" not in inventory_report:
                    report_filename = f"inventory_report_{timestamp}.json"
                    report_path = self.reports_dir / report_filename
                    
                    with open(report_path, 'w', encoding='utf-8') as f:
                        json.dump(inventory_report, f, indent=2, ensure_ascii=False, default=str)
                    
                    reports_generated.append({
                        "type": "inventory",
                        "filename": report_filename,
                        "status": "success"
                    })
                else:
                    reports_generated.append({
                        "type": "inventory",
                        "status": "error",
                        "error": inventory_report["error"]
                    })
            except Exception as e:
                reports_generated.append({
                    "type": "inventory",
                    "status": "error",
                    "error": str(e)
                })
            
            # Relatório de fornecedores
            try:
                supplier_report = await reports_service.generate_supplier_report()
                if "error" not in supplier_report:
                    report_filename = f"supplier_report_{timestamp}.json"
                    report_path = self.reports_dir / report_filename
                    
                    with open(report_path, 'w', encoding='utf-8') as f:
                        json.dump(supplier_report, f, indent=2, ensure_ascii=False, default=str)
                    
                    reports_generated.append({
                        "type": "supplier",
                        "filename": report_filename,
                        "status": "success"
                    })
                else:
                    reports_generated.append({
                        "type": "supplier",
                        "status": "error",
                        "error": supplier_report["error"]
                    })
            except Exception as e:
                reports_generated.append({
                    "type": "supplier",
                    "status": "error",
                    "error": str(e)
                })
            
            # Relatório financeiro
            try:
                financial_report = await reports_service.generate_financial_report()
                if "error" not in financial_report:
                    report_filename = f"financial_report_{timestamp}.json"
                    report_path = self.reports_dir / report_filename
                    
                    with open(report_path, 'w', encoding='utf-8') as f:
                        json.dump(financial_report, f, indent=2, ensure_ascii=False, default=str)
                    
                    reports_generated.append({
                        "type": "financial",
                        "filename": report_filename,
                        "status": "success"
                    })
                else:
                    reports_generated.append({
                        "type": "financial",
                        "status": "error",
                        "error": financial_report["error"]
                    })
            except Exception as e:
                reports_generated.append({
                    "type": "financial",
                    "status": "error",
                    "error": str(e)
                })
            
            successful_reports = [r for r in reports_generated if r["status"] == "success"]
            failed_reports = [r for r in reports_generated if r["status"] == "error"]
            
            return {
                "status": "completed",
                "generated_at": datetime.now().isoformat(),
                "total_reports": len(reports_generated),
                "successful_reports": len(successful_reports),
                "failed_reports": len(failed_reports),
                "reports": reports_generated,
                "summary": {
                    "success_rate": round(len(successful_reports) / len(reports_generated) * 100, 2) if reports_generated else 0,
                    "reports_directory": str(self.reports_dir)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatórios automatizados: {e}")
            return {"status": "error", "error": str(e)}
    
    async def check_stock_alerts(self) -> Dict[str, Any]:
        """Verificar alertas de estoque"""
        try:
            products_data = await self._get_data_from_api("products")
            products = products_data.get('data', [])
            
            if not products:
                return {"status": "no_data", "message": "Nenhum produto encontrado"}
            
            alerts = {
                "low_stock": [],
                "out_of_stock": [],
                "overstock": [],
                "critical": []
            }
            
            for product in products:
                quantity = int(product.get('quantity', 0))
                min_quantity = int(product.get('min_quantity', 10))  # Padrão: 10
                max_quantity = min_quantity * 5  # Máximo: 5x o mínimo
                
                product_info = {
                    "id": product.get('id'),
                    "name": product.get('name', 'Produto'),
                    "current_quantity": quantity,
                    "min_quantity": min_quantity,
                    "supplier_id": product.get('supplier_id'),
                    "price": float(product.get('price', 0))
                }
                
                # Verificar diferentes tipos de alerta
                if quantity == 0:
                    alerts["out_of_stock"].append(product_info)
                    alerts["critical"].append({**product_info, "alert_type": "out_of_stock"})
                elif quantity <= min_quantity:
                    alerts["low_stock"].append(product_info)
                    if quantity <= min_quantity * 0.5:  # Crítico se menos de 50% do mínimo
                        alerts["critical"].append({**product_info, "alert_type": "critical_low_stock"})
                elif quantity > max_quantity:
                    alerts["overstock"].append(product_info)
            
            # Calcular estatísticas
            total_alerts = sum(len(alerts[key]) for key in ["low_stock", "out_of_stock", "overstock"])
            critical_count = len(alerts["critical"])
            
            # Gerar recomendações
            recommendations = []
            
            if alerts["out_of_stock"]:
                recommendations.append(f"URGENTE: {len(alerts['out_of_stock'])} produtos sem estoque - reposição imediata necessária")
            
            if alerts["low_stock"]:
                recommendations.append(f"Reabastecer {len(alerts['low_stock'])} produtos com estoque baixo")
            
            if alerts["overstock"]:
                recommendations.append(f"Revisar {len(alerts['overstock'])} produtos com excesso de estoque")
            
            if critical_count == 0:
                recommendations.append("Níveis de estoque adequados - monitoramento contínuo recomendado")
            
            # Log dos alertas críticos
            if critical_count > 0:
                self.logger.warning(f"ALERTAS CRÍTICOS: {critical_count} produtos requerem atenção imediata")
            
            return {
                "status": "completed",
                "checked_at": datetime.now().isoformat(),
                "total_products_checked": len(products),
                "alerts_summary": {
                    "total_alerts": total_alerts,
                    "critical_alerts": critical_count,
                    "out_of_stock": len(alerts["out_of_stock"]),
                    "low_stock": len(alerts["low_stock"]),
                    "overstock": len(alerts["overstock"])
                },
                "alerts": alerts,
                "recommendations": recommendations,
                "priority_actions": [
                    alert for alert in alerts["critical"]
                ]
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao verificar alertas de estoque: {e}")
            return {"status": "error", "error": str(e)}
    
    def start_scheduler(self) -> Dict[str, Any]:
        """Iniciar agendador de tarefas"""
        try:
            if self.scheduler_running:
                return {"status": "already_running", "message": "Agendador já está em execução"}
            
            # Configurar tarefas agendadas
            schedule.clear()  # Limpar tarefas anteriores
            
            # Backup diário às 2:00 AM
            schedule.every().day.at("02:00").do(self._run_async_task, self.create_backup)
            
            # Relatórios semanais às segundas-feiras às 8:00 AM
            schedule.every().monday.at("08:00").do(self._run_async_task, self.generate_automated_reports)
            
            # Verificação de estoque a cada 4 horas
            schedule.every(4).hours.do(self._run_async_task, self.check_stock_alerts)
            
            # Iniciar thread do agendador
            self.scheduler_running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.scheduler_thread.start()
            
            scheduled_jobs = []
            for job in schedule.jobs:
                scheduled_jobs.append({
                    "task": str(job.job_func),
                    "next_run": str(job.next_run),
                    "interval": str(job.interval),
                    "unit": str(job.unit)
                })
            
            self.logger.info("Agendador de tarefas iniciado com sucesso")
            
            return {
                "status": "started",
                "started_at": datetime.now().isoformat(),
                "scheduled_jobs": scheduled_jobs,
                "total_jobs": len(scheduled_jobs)
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao iniciar agendador: {e}")
            return {"status": "error", "error": str(e)}
    
    def stop_scheduler(self) -> Dict[str, Any]:
        """Parar agendador de tarefas"""
        try:
            if not self.scheduler_running:
                return {"status": "not_running", "message": "Agendador não está em execução"}
            
            self.scheduler_running = False
            schedule.clear()
            
            if self.scheduler_thread and self.scheduler_thread.is_alive():
                # Aguardar thread terminar (máximo 5 segundos)
                self.scheduler_thread.join(timeout=5)
            
            self.logger.info("Agendador de tarefas parado")
            
            return {
                "status": "stopped",
                "stopped_at": datetime.now().isoformat(),
                "message": "Agendador parado com sucesso"
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao parar agendador: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """Obter status do agendador"""
        try:
            if not self.scheduler_running:
                return {
                    "status": "stopped",
                    "running": False,
                    "scheduled_jobs": 0
                }
            
            scheduled_jobs = []
            for job in schedule.jobs:
                scheduled_jobs.append({
                    "task": str(job.job_func).split('.')[-1],
                    "next_run": str(job.next_run),
                    "interval": str(job.interval),
                    "unit": str(job.unit),
                    "last_run": str(job.last_run) if job.last_run else "Never"
                })
            
            return {
                "status": "running",
                "running": True,
                "scheduled_jobs": len(scheduled_jobs),
                "jobs_details": scheduled_jobs,
                "thread_alive": self.scheduler_thread.is_alive() if self.scheduler_thread else False
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao obter status do agendador: {e}")
            return {"status": "error", "error": str(e)}
    
    def _run_scheduler(self):
        """Executar loop do agendador"""
        while self.scheduler_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Verificar a cada minuto
            except Exception as e:
                self.logger.error(f"Erro no loop do agendador: {e}")
                time.sleep(60)
    
    def _run_async_task(self, coro):
        """Executar tarefa assíncrona no agendador"""
        import asyncio
        try:
            # Criar novo loop para a thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(coro())
            loop.close()
            
            self.logger.info(f"Tarefa agendada executada: {coro.__name__}")
            return result
        except Exception as e:
            self.logger.error(f"Erro ao executar tarefa agendada {coro.__name__}: {e}")
    
    async def run_maintenance_tasks(self) -> Dict[str, Any]:
        """Executar tarefas de manutenção"""
        try:
            maintenance_results = []
            
            # 1. Limpeza de logs antigos
            try:
                log_files = list(self.logs_dir.glob("*.log"))
                old_logs = [f for f in log_files if (datetime.now() - datetime.fromtimestamp(f.stat().st_mtime)).days > 30]
                
                for old_log in old_logs:
                    old_log.unlink()
                
                maintenance_results.append({
                    "task": "log_cleanup",
                    "status": "success",
                    "details": f"Removidos {len(old_logs)} logs antigos"
                })
            except Exception as e:
                maintenance_results.append({
                    "task": "log_cleanup",
                    "status": "error",
                    "error": str(e)
                })
            
            # 2. Limpeza de relatórios antigos
            try:
                report_files = list(self.reports_dir.glob("*.json"))
                old_reports = [f for f in report_files if (datetime.now() - datetime.fromtimestamp(f.stat().st_mtime)).days > 60]
                
                for old_report in old_reports:
                    old_report.unlink()
                
                maintenance_results.append({
                    "task": "report_cleanup",
                    "status": "success",
                    "details": f"Removidos {len(old_reports)} relatórios antigos"
                })
            except Exception as e:
                maintenance_results.append({
                    "task": "report_cleanup",
                    "status": "error",
                    "error": str(e)
                })
            
            # 3. Verificação de integridade dos backups
            try:
                backup_files = list(self.backup_dir.glob("backup_*.json"))
                valid_backups = 0
                
                for backup_file in backup_files:
                    try:
                        with open(backup_file, 'r', encoding='utf-8') as f:
                            backup_data = json.load(f)
                            if "metadata" in backup_data and "entities" in backup_data["metadata"]:
                                valid_backups += 1
                    except:
                        continue
                
                maintenance_results.append({
                    "task": "backup_integrity_check",
                    "status": "success",
                    "details": f"{valid_backups}/{len(backup_files)} backups válidos"
                })
            except Exception as e:
                maintenance_results.append({
                    "task": "backup_integrity_check",
                    "status": "error",
                    "error": str(e)
                })
            
            successful_tasks = len([r for r in maintenance_results if r["status"] == "success"])
            
            return {
                "status": "completed",
                "executed_at": datetime.now().isoformat(),
                "total_tasks": len(maintenance_results),
                "successful_tasks": successful_tasks,
                "failed_tasks": len(maintenance_results) - successful_tasks,
                "tasks": maintenance_results
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao executar tarefas de manutenção: {e}")
            return {"status": "error", "error": str(e)}
    
    async def backup_database(self) -> Dict[str, Any]:
        """Executar backup do banco de dados"""
        try:
            return await self.create_backup()
        except Exception as e:
            self.logger.error(f"Erro ao executar backup do banco: {e}")
            return {"status": "error", "error": str(e)}
    
    async def check_alerts(self) -> Dict[str, Any]:
        """Verificar alertas do sistema"""
        try:
            return await self.check_stock_alerts()
        except Exception as e:
            self.logger.error(f"Erro ao verificar alertas: {e}")
            return {"status": "error", "error": str(e)}
    
    async def setup_scheduler(self) -> Dict[str, Any]:
        """Configurar e iniciar o agendador de tarefas"""
        try:
            return await self.start_scheduler()
        except Exception as e:
            self.logger.error(f"Erro ao configurar agendador: {e}")
            return {"status": "error", "error": str(e)}