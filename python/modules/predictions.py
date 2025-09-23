"""
Módulo de predições simplificado para gestão de suprimentos
"""

import httpx
import json
import statistics
import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

class PredictionService:
    """Serviço de predições simplificado"""
    
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
    
    async def predict_demand(self, product_id: Optional[str] = None) -> Dict[str, Any]:
        """Predição de demanda simplificada"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            predictions = []
            
            for product in products:
                if product_id and product.get('id') != product_id:
                    continue
                
                current_stock = int(product.get('quantity', 0))
                avg_price = float(product.get('price', 0))
                
                # Predição simplificada baseada em padrões básicos
                base_demand = max(1, current_stock // 10)  # Demanda base
                seasonal_factor = random.uniform(0.8, 1.2)  # Fator sazonal
                price_factor = 1.1 if avg_price < 50 else 0.9  # Fator preço
                
                predicted_demand = int(base_demand * seasonal_factor * price_factor)
                confidence = random.uniform(0.7, 0.95)
                
                predictions.append({
                    "product_id": product.get('id'),
                    "product_name": product.get('name', 'Produto'),
                    "current_stock": current_stock,
                    "predicted_demand_30d": predicted_demand,
                    "confidence_score": round(confidence, 2),
                    "recommendation": self._get_stock_recommendation(current_stock, predicted_demand),
                    "predicted_stockout_date": self._calculate_stockout_date(current_stock, predicted_demand)
                })
            
            return {
                "predictions": predictions,
                "summary": {
                    "total_products_analyzed": len(predictions),
                    "high_demand_products": len([p for p in predictions if p["predicted_demand_30d"] > p["current_stock"]]),
                    "low_stock_alerts": len([p for p in predictions if p["current_stock"] < p["predicted_demand_30d"]])
                },
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro na predição de demanda: {e}")
            return {"error": str(e)}
    
    def _get_stock_recommendation(self, current_stock: int, predicted_demand: int) -> str:
        """Gerar recomendação de estoque"""
        if current_stock < predicted_demand * 0.5:
            return "URGENTE: Reabastecer imediatamente"
        elif current_stock < predicted_demand:
            return "ATENÇÃO: Reabastecer em breve"
        elif current_stock > predicted_demand * 2:
            return "EXCESSO: Considerar redução de estoque"
        else:
            return "OK: Estoque adequado"
    
    def _calculate_stockout_date(self, current_stock: int, daily_demand: int) -> str:
        """Calcular data estimada de ruptura de estoque"""
        if daily_demand <= 0:
            return "Sem previsão de ruptura"
        
        days_until_stockout = current_stock // daily_demand
        stockout_date = datetime.now() + timedelta(days=days_until_stockout)
        
        if days_until_stockout < 7:
            return f"CRÍTICO: {stockout_date.strftime('%d/%m/%Y')}"
        elif days_until_stockout < 30:
            return f"ATENÇÃO: {stockout_date.strftime('%d/%m/%Y')}"
        else:
            return f"Normal: {stockout_date.strftime('%d/%m/%Y')}"
    
    async def optimize_stock(self) -> Dict[str, Any]:
        """Otimização de estoque simplificada"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            optimizations = []
            total_cost_reduction = 0
            
            for product in products:
                current_stock = int(product.get('quantity', 0))
                price = float(product.get('price', 0))
                
                # Cálculo simplificado de otimização
                optimal_stock = max(10, current_stock // 2 + random.randint(5, 15))
                stock_difference = current_stock - optimal_stock
                cost_impact = stock_difference * price * 0.1  # 10% de custo de manutenção
                
                if abs(stock_difference) > 5:  # Só incluir se a diferença for significativa
                    optimizations.append({
                        "product_id": product.get('id'),
                        "product_name": product.get('name', 'Produto'),
                        "current_stock": current_stock,
                        "optimal_stock": optimal_stock,
                        "adjustment": stock_difference,
                        "cost_impact": round(cost_impact, 2),
                        "action": "Reduzir estoque" if stock_difference > 0 else "Aumentar estoque"
                    })
                    
                    total_cost_reduction += abs(cost_impact)
            
            return {
                "optimizations": optimizations,
                "summary": {
                    "products_to_optimize": len(optimizations),
                    "potential_cost_reduction": round(total_cost_reduction, 2),
                    "products_to_reduce": len([o for o in optimizations if o["adjustment"] > 0]),
                    "products_to_increase": len([o for o in optimizations if o["adjustment"] < 0])
                },
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro na otimização de estoque: {e}")
            return {"error": str(e)}
    
    async def analyze_supplier_performance(self) -> Dict[str, Any]:
        """Análise de performance de fornecedores simplificada"""
        try:
            suppliers_data = await self._get_data_from_api("suppliers")
            products_data = await self._get_data_from_api("products")
            
            suppliers = suppliers_data.get('data', [])
            products = products_data.get('data', [])
            
            if not suppliers:
                return {"error": "Nenhum fornecedor disponível"}
            
            performance_analysis = []
            
            for supplier in suppliers:
                supplier_id = supplier.get('id')
                supplier_products = [p for p in products if p.get('supplier_id') == supplier_id]
                
                # Métricas simuladas de performance
                delivery_score = random.uniform(0.7, 0.98)
                quality_score = random.uniform(0.75, 0.95)
                price_competitiveness = random.uniform(0.6, 0.9)
                reliability_score = random.uniform(0.8, 0.95)
                
                overall_score = (delivery_score + quality_score + price_competitiveness + reliability_score) / 4
                
                performance_analysis.append({
                    "supplier_id": supplier_id,
                    "supplier_name": supplier.get('name', 'Fornecedor'),
                    "products_supplied": len(supplier_products),
                    "performance_metrics": {
                        "delivery_score": round(delivery_score, 2),
                        "quality_score": round(quality_score, 2),
                        "price_competitiveness": round(price_competitiveness, 2),
                        "reliability_score": round(reliability_score, 2),
                        "overall_score": round(overall_score, 2)
                    },
                    "rating": self._get_supplier_rating(overall_score),
                    "recommendations": self._get_supplier_recommendations(overall_score, delivery_score, quality_score)
                })
            
            # Ordenar por performance
            performance_analysis.sort(key=lambda x: x["performance_metrics"]["overall_score"], reverse=True)
            
            return {
                "supplier_analysis": performance_analysis,
                "summary": {
                    "total_suppliers": len(performance_analysis),
                    "excellent_suppliers": len([s for s in performance_analysis if s["performance_metrics"]["overall_score"] > 0.9]),
                    "good_suppliers": len([s for s in performance_analysis if 0.8 <= s["performance_metrics"]["overall_score"] <= 0.9]),
                    "needs_improvement": len([s for s in performance_analysis if s["performance_metrics"]["overall_score"] < 0.8]),
                    "top_supplier": performance_analysis[0]["supplier_name"] if performance_analysis else "N/A"
                },
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro na análise de fornecedores: {e}")
            return {"error": str(e)}
    
    def _get_supplier_rating(self, score: float) -> str:
        """Obter classificação do fornecedor"""
        if score >= 0.9:
            return "Excelente"
        elif score >= 0.8:
            return "Bom"
        elif score >= 0.7:
            return "Regular"
        else:
            return "Precisa melhorar"
    
    def _get_supplier_recommendations(self, overall_score: float, delivery_score: float, quality_score: float) -> List[str]:
        """Gerar recomendações para fornecedores"""
        recommendations = []
        
        if overall_score >= 0.9:
            recommendations.append("Fornecedor de alta performance - manter parceria")
        
        if delivery_score < 0.8:
            recommendations.append("Melhorar pontualidade nas entregas")
        
        if quality_score < 0.8:
            recommendations.append("Implementar controle de qualidade mais rigoroso")
        
        if overall_score < 0.7:
            recommendations.append("Considerar revisão do contrato ou busca de alternativas")
        
        if not recommendations:
            recommendations.append("Performance satisfatória - continuar monitoramento")
        
        return recommendations
    
    async def predict_prices(self, product_id: Optional[str] = None, period: str = "30d") -> Dict[str, Any]:
        """Predição de preços simplificada"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum dado disponível"}
            
            price_predictions = []
            
            for product in products:
                if product_id and product.get('id') != product_id:
                    continue
                
                current_price = float(product.get('price', 0))
                
                # Predição simplificada baseada em tendências simuladas
                market_trend = random.uniform(-0.1, 0.15)  # -10% a +15%
                seasonal_factor = random.uniform(0.95, 1.08)  # Fator sazonal
                supply_demand_factor = random.uniform(0.9, 1.1)  # Oferta/demanda
                
                predicted_price = current_price * (1 + market_trend) * seasonal_factor * supply_demand_factor
                confidence = random.uniform(0.65, 0.9)
                
                price_change = ((predicted_price - current_price) / current_price) * 100
                
                price_predictions.append({
                    "product_id": product.get('id'),
                    "product_name": product.get('name', 'Produto'),
                    "current_price": round(current_price, 2),
                    "predicted_price": round(predicted_price, 2),
                    "price_change_percent": round(price_change, 2),
                    "confidence_score": round(confidence, 2),
                    "trend": "Alta" if price_change > 5 else "Baixa" if price_change < -5 else "Estável",
                    "recommendation": self._get_price_recommendation(price_change),
                    "factors": {
                        "market_trend": round(market_trend * 100, 1),
                        "seasonal_impact": round((seasonal_factor - 1) * 100, 1),
                        "supply_demand": round((supply_demand_factor - 1) * 100, 1)
                    }
                })
            
            return {
                "price_predictions": price_predictions,
                "summary": {
                    "total_products_analyzed": len(price_predictions),
                    "price_increases": len([p for p in price_predictions if p["price_change_percent"] > 0]),
                    "price_decreases": len([p for p in price_predictions if p["price_change_percent"] < 0]),
                    "stable_prices": len([p for p in price_predictions if abs(p["price_change_percent"]) <= 2]),
                    "avg_price_change": round(sum(p["price_change_percent"] for p in price_predictions) / len(price_predictions), 2) if price_predictions else 0
                },
                "period": period,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro na predição de preços: {e}")
            return {"error": str(e)}
    
    def _get_price_recommendation(self, price_change: float) -> str:
        """Gerar recomendação baseada na mudança de preço"""
        if price_change > 10:
            return "ALERTA: Aumento significativo - considerar compra antecipada"
        elif price_change > 5:
            return "ATENÇÃO: Aumento moderado - monitorar mercado"
        elif price_change < -10:
            return "OPORTUNIDADE: Queda significativa - considerar estoque extra"
        elif price_change < -5:
            return "FAVORÁVEL: Queda moderada - bom momento para comprar"
        else:
            return "ESTÁVEL: Preço sem grandes variações"