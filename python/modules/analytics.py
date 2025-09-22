"""
Módulo de análise de dados simplificado para gestão de suprimentos
"""

import httpx
import json
import statistics
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

class AnalyticsService:
    """Serviço de análise de dados"""
    
    def __init__(self, node_api_url: str = "http://localhost:3000"):
        self.node_api_url = node_api_url
        self.logger = logging.getLogger(__name__)
    
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
    
    async def get_summary(self) -> Dict[str, Any]:
        """Obter resumo geral das análises"""
        try:
            # Obter dados básicos
            products_data = await self._get_data_from_api("products")
            suppliers_data = await self._get_data_from_api("suppliers")
            orders_data = await self._get_data_from_api("orders")
            
            products = products_data.get('data', [])
            suppliers = suppliers_data.get('data', [])
            orders = orders_data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            # Calcular métricas básicas
            total_products = len(products)
            prices = [float(p.get('price', 0)) for p in products if p.get('price')]
            quantities = [int(p.get('quantity', 0)) for p in products if p.get('quantity')]
            categories = set(p.get('category', '') for p in products if p.get('category'))
            
            summary = {
                "total_products": total_products,
                "total_suppliers": len(suppliers),
                "total_orders": len(orders),
                "total_value": sum(prices),
                "average_price": round(statistics.mean(prices), 2) if prices else 0,
                "low_stock_items": len([q for q in quantities if q < 10]),
                "categories": len(categories),
                "last_updated": datetime.now().isoformat()
            }
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar resumo: {e}")
            return {"error": str(e)}
    
    async def get_trends(self) -> Dict[str, Any]:
        """Análise de tendências simplificada"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            # Agrupar por categoria
            categories = {}
            for product in products:
                cat = product.get('category', 'Sem categoria')
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(product)
            
            trends = {
                "categories_analysis": {
                    cat: {
                        "count": len(items),
                        "avg_price": round(statistics.mean([float(p.get('price', 0)) for p in items if p.get('price')]), 2) if items else 0,
                        "total_stock": sum([int(p.get('quantity', 0)) for p in items if p.get('quantity')])
                    }
                    for cat, items in categories.items()
                },
                "stock_status": {
                    "low_stock": len([p for p in products if int(p.get('quantity', 0)) < 10]),
                    "medium_stock": len([p for p in products if 10 <= int(p.get('quantity', 0)) < 50]),
                    "high_stock": len([p for p in products if int(p.get('quantity', 0)) >= 50])
                },
                "last_updated": datetime.now().isoformat()
            }
            
            return trends
            
        except Exception as e:
            self.logger.error(f"Erro ao analisar tendências: {e}")
            return {"error": str(e)}
    
    async def get_correlations(self) -> Dict[str, Any]:
        """Análise de correlações básica"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            # Análise básica de correlações
            prices = [float(p.get('price', 0)) for p in products if p.get('price')]
            quantities = [int(p.get('quantity', 0)) for p in products if p.get('quantity')]
            
            correlations = {
                "price_stats": {
                    "min": min(prices) if prices else 0,
                    "max": max(prices) if prices else 0,
                    "mean": round(statistics.mean(prices), 2) if prices else 0,
                    "median": round(statistics.median(prices), 2) if prices else 0
                },
                "quantity_stats": {
                    "min": min(quantities) if quantities else 0,
                    "max": max(quantities) if quantities else 0,
                    "mean": round(statistics.mean(quantities), 2) if quantities else 0,
                    "median": statistics.median(quantities) if quantities else 0
                },
                "insights": [
                    f"Produto mais caro: R$ {max(prices):.2f}" if prices else "Sem dados de preço",
                    f"Maior estoque: {max(quantities)} unidades" if quantities else "Sem dados de estoque",
                    f"Total de produtos: {len(products)}"
                ],
                "last_updated": datetime.now().isoformat()
            }
            
            return correlations
            
        except Exception as e:
            self.logger.error(f"Erro ao analisar correlações: {e}")
            return {"error": str(e)}