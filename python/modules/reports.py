"""
Módulo de relatórios simplificado para gestão de suprimentos
"""

import httpx
import json
import statistics
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

class ReportsService:
    """Serviço de relatórios simplificado"""
    
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
    
    async def generate_inventory_report(self) -> Dict[str, Any]:
        """Gerar relatório de inventário"""
        try:
            data = await self._get_data_from_api("products")
            products = data.get('data', [])
            
            if not products:
                return {"error": "Nenhum produto disponível"}
            
            # Calcular estatísticas do inventário
            quantities = [int(p.get('quantity', 0)) for p in products]
            prices = [float(p.get('price', 0)) for p in products]
            
            total_products = len(products)
            total_quantity = sum(quantities)
            total_value = sum(float(p.get('quantity', 0)) * float(p.get('price', 0)) for p in products)
            avg_quantity = statistics.mean(quantities) if quantities else 0
            avg_price = statistics.mean(prices) if prices else 0
            
            # Produtos com baixo estoque (menos de 10 unidades)
            low_stock_products = [p for p in products if int(p.get('quantity', 0)) < 10]
            
            # Produtos mais valiosos
            valuable_products = sorted(products, 
                                     key=lambda x: float(x.get('quantity', 0)) * float(x.get('price', 0)), 
                                     reverse=True)[:10]
            
            # Categorização por faixa de preço
            price_ranges = {
                "baixo": len([p for p in products if float(p.get('price', 0)) < 50]),
                "medio": len([p for p in products if 50 <= float(p.get('price', 0)) < 200]),
                "alto": len([p for p in products if float(p.get('price', 0)) >= 200])
            }
            
            return {
                "report_type": "inventory",
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_products": total_products,
                    "total_quantity": total_quantity,
                    "total_inventory_value": round(total_value, 2),
                    "average_quantity_per_product": round(avg_quantity, 2),
                    "average_price_per_product": round(avg_price, 2),
                    "low_stock_alerts": len(low_stock_products)
                },
                "analysis": {
                    "price_distribution": price_ranges,
                    "stock_status": {
                        "adequate_stock": total_products - len(low_stock_products),
                        "low_stock": len(low_stock_products),
                        "out_of_stock": len([p for p in products if int(p.get('quantity', 0)) == 0])
                    }
                },
                "details": {
                    "low_stock_products": [
                        {
                            "id": p.get('id'),
                            "name": p.get('name', 'Produto'),
                            "quantity": int(p.get('quantity', 0)),
                            "price": float(p.get('price', 0))
                        } for p in low_stock_products
                    ],
                    "most_valuable_products": [
                        {
                            "id": p.get('id'),
                            "name": p.get('name', 'Produto'),
                            "quantity": int(p.get('quantity', 0)),
                            "price": float(p.get('price', 0)),
                            "total_value": round(float(p.get('quantity', 0)) * float(p.get('price', 0)), 2)
                        } for p in valuable_products
                    ]
                }
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório de inventário: {e}")
            return {"error": str(e)}
    
    async def generate_supplier_report(self) -> Dict[str, Any]:
        """Gerar relatório de fornecedores"""
        try:
            suppliers_data = await self._get_data_from_api("suppliers")
            products_data = await self._get_data_from_api("products")
            
            suppliers = suppliers_data.get('data', [])
            products = products_data.get('data', [])
            
            if not suppliers:
                return {"error": "Nenhum fornecedor disponível"}
            
            supplier_analysis = []
            
            for supplier in suppliers:
                supplier_id = supplier.get('id')
                supplier_products = [p for p in products if p.get('supplier_id') == supplier_id]
                
                total_products = len(supplier_products)
                total_value = sum(float(p.get('quantity', 0)) * float(p.get('price', 0)) for p in supplier_products)
                avg_price = statistics.mean([float(p.get('price', 0)) for p in supplier_products]) if supplier_products else 0
                
                supplier_analysis.append({
                    "supplier_id": supplier_id,
                    "supplier_name": supplier.get('name', 'Fornecedor'),
                    "contact": supplier.get('contact', 'N/A'),
                    "email": supplier.get('email', 'N/A'),
                    "products_supplied": total_products,
                    "total_inventory_value": round(total_value, 2),
                    "average_product_price": round(avg_price, 2),
                    "product_list": [
                        {
                            "id": p.get('id'),
                            "name": p.get('name', 'Produto'),
                            "quantity": int(p.get('quantity', 0)),
                            "price": float(p.get('price', 0))
                        } for p in supplier_products
                    ]
                })
            
            # Ordenar por valor total de inventário
            supplier_analysis.sort(key=lambda x: x["total_inventory_value"], reverse=True)
            
            total_suppliers = len(supplier_analysis)
            total_products_all = sum(s["products_supplied"] for s in supplier_analysis)
            total_value_all = sum(s["total_inventory_value"] for s in supplier_analysis)
            
            return {
                "report_type": "suppliers",
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_suppliers": total_suppliers,
                    "total_products_supplied": total_products_all,
                    "total_supply_value": round(total_value_all, 2),
                    "average_products_per_supplier": round(total_products_all / total_suppliers if total_suppliers > 0 else 0, 2),
                    "top_supplier": supplier_analysis[0]["supplier_name"] if supplier_analysis else "N/A"
                },
                "suppliers": supplier_analysis,
                "top_suppliers": supplier_analysis[:5]
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório de fornecedores: {e}")
            return {"error": str(e)}
    
    async def generate_financial_report(self) -> Dict[str, Any]:
        """Gerar relatório financeiro"""
        try:
            products_data = await self._get_data_from_api("products")
            suppliers_data = await self._get_data_from_api("suppliers")
            
            products = products_data.get('data', [])
            suppliers = suppliers_data.get('data', [])
            
            if not products:
                return {"error": "Nenhum produto disponível"}
            
            # Cálculos financeiros
            total_inventory_value = sum(float(p.get('quantity', 0)) * float(p.get('price', 0)) for p in products)
            
            # Simulação de custos e receitas
            estimated_monthly_sales = total_inventory_value * 0.3  # 30% do inventário vendido por mês
            estimated_cost_of_goods = estimated_monthly_sales * 0.7  # 70% de custo
            estimated_gross_profit = estimated_monthly_sales - estimated_cost_of_goods
            estimated_operating_costs = total_inventory_value * 0.05  # 5% de custos operacionais
            estimated_net_profit = estimated_gross_profit - estimated_operating_costs
            
            # Análise por categoria de preço
            price_categories = {
                "produtos_baixo_valor": {"count": 0, "value": 0},
                "produtos_medio_valor": {"count": 0, "value": 0},
                "produtos_alto_valor": {"count": 0, "value": 0}
            }
            
            for product in products:
                price = float(product.get('price', 0))
                quantity = float(product.get('quantity', 0))
                value = price * quantity
                
                if price < 50:
                    price_categories["produtos_baixo_valor"]["count"] += 1
                    price_categories["produtos_baixo_valor"]["value"] += value
                elif price < 200:
                    price_categories["produtos_medio_valor"]["count"] += 1
                    price_categories["produtos_medio_valor"]["value"] += value
                else:
                    price_categories["produtos_alto_valor"]["count"] += 1
                    price_categories["produtos_alto_valor"]["value"] += value
            
            # ROI estimado por fornecedor
            supplier_roi = []
            for supplier in suppliers:
                supplier_products = [p for p in products if p.get('supplier_id') == supplier.get('id')]
                supplier_value = sum(float(p.get('quantity', 0)) * float(p.get('price', 0)) for p in supplier_products)
                estimated_roi = (supplier_value * 0.2) / max(supplier_value, 1) * 100  # ROI estimado de 20%
                
                supplier_roi.append({
                    "supplier_name": supplier.get('name', 'Fornecedor'),
                    "inventory_value": round(supplier_value, 2),
                    "estimated_monthly_roi": round(estimated_roi, 2)
                })
            
            return {
                "report_type": "financial",
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_inventory_value": round(total_inventory_value, 2),
                    "estimated_monthly_sales": round(estimated_monthly_sales, 2),
                    "estimated_gross_profit": round(estimated_gross_profit, 2),
                    "estimated_net_profit": round(estimated_net_profit, 2),
                    "profit_margin": round((estimated_net_profit / estimated_monthly_sales * 100) if estimated_monthly_sales > 0 else 0, 2)
                },
                "cost_analysis": {
                    "cost_of_goods_sold": round(estimated_cost_of_goods, 2),
                    "operating_costs": round(estimated_operating_costs, 2),
                    "inventory_turnover_ratio": round(estimated_monthly_sales / total_inventory_value if total_inventory_value > 0 else 0, 2)
                },
                "category_breakdown": {
                    "low_value_products": {
                        "count": price_categories["produtos_baixo_valor"]["count"],
                        "total_value": round(price_categories["produtos_baixo_valor"]["value"], 2),
                        "percentage": round(price_categories["produtos_baixo_valor"]["value"] / total_inventory_value * 100 if total_inventory_value > 0 else 0, 2)
                    },
                    "medium_value_products": {
                        "count": price_categories["produtos_medio_valor"]["count"],
                        "total_value": round(price_categories["produtos_medio_valor"]["value"], 2),
                        "percentage": round(price_categories["produtos_medio_valor"]["value"] / total_inventory_value * 100 if total_inventory_value > 0 else 0, 2)
                    },
                    "high_value_products": {
                        "count": price_categories["produtos_alto_valor"]["count"],
                        "total_value": round(price_categories["produtos_alto_valor"]["value"], 2),
                        "percentage": round(price_categories["produtos_alto_valor"]["value"] / total_inventory_value * 100 if total_inventory_value > 0 else 0, 2)
                    }
                },
                "supplier_roi_analysis": supplier_roi
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório financeiro: {e}")
            return {"error": str(e)}
    
    async def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Gerar relatório abrangente combinando todos os dados"""
        try:
            # Obter todos os relatórios individuais
            inventory_report = await self.generate_inventory_report()
            supplier_report = await self.generate_supplier_report()
            financial_report = await self.generate_financial_report()
            
            # Verificar se houve erros
            if "error" in inventory_report:
                return inventory_report
            if "error" in supplier_report:
                return supplier_report
            if "error" in financial_report:
                return financial_report
            
            # Combinar insights
            total_products = inventory_report["summary"]["total_products"]
            total_suppliers = supplier_report["summary"]["total_suppliers"]
            total_value = financial_report["summary"]["total_inventory_value"]
            
            # Gerar insights e recomendações
            insights = []
            recommendations = []
            
            # Análise de estoque
            low_stock_count = inventory_report["summary"]["low_stock_alerts"]
            if low_stock_count > 0:
                insights.append(f"{low_stock_count} produtos com estoque baixo identificados")
                recommendations.append("Priorizar reabastecimento dos produtos com estoque baixo")
            
            # Análise financeira
            profit_margin = financial_report["summary"]["profit_margin"]
            if profit_margin < 10:
                insights.append("Margem de lucro abaixo do ideal (< 10%)")
                recommendations.append("Revisar estratégia de preços e custos operacionais")
            elif profit_margin > 25:
                insights.append("Excelente margem de lucro identificada")
                recommendations.append("Manter estratégia atual e considerar expansão")
            
            # Análise de fornecedores
            avg_products_per_supplier = supplier_report["summary"]["average_products_per_supplier"]
            if avg_products_per_supplier < 5:
                insights.append("Baixa diversificação de produtos por fornecedor")
                recommendations.append("Buscar fornecedores com maior variedade de produtos")
            
            return {
                "report_type": "comprehensive",
                "generated_at": datetime.now().isoformat(),
                "executive_summary": {
                    "total_products": total_products,
                    "total_suppliers": total_suppliers,
                    "total_inventory_value": round(total_value, 2),
                    "estimated_monthly_profit": round(financial_report["summary"]["estimated_net_profit"], 2),
                    "profit_margin_percentage": round(profit_margin, 2),
                    "critical_alerts": low_stock_count
                },
                "key_insights": insights,
                "recommendations": recommendations,
                "detailed_reports": {
                    "inventory": inventory_report,
                    "suppliers": supplier_report,
                    "financial": financial_report
                },
                "performance_indicators": {
                    "inventory_turnover": financial_report["cost_analysis"]["inventory_turnover_ratio"],
                    "supplier_efficiency": round(total_products / total_suppliers if total_suppliers > 0 else 0, 2),
                    "stock_adequacy": round((total_products - low_stock_count) / total_products * 100 if total_products > 0 else 0, 2)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório abrangente: {e}")
            return {"error": str(e)}
    
    async def generate_advanced_report(self, report_type: str = "comprehensive") -> Dict[str, Any]:
        """Gerar relatório avançado baseado no tipo especificado"""
        try:
            if report_type == "inventory":
                return await self.generate_inventory_report()
            elif report_type == "suppliers":
                return await self.generate_supplier_report()
            elif report_type == "financial":
                return await self.generate_financial_report()
            elif report_type == "comprehensive":
                return await self.generate_comprehensive_report()
            else:
                return {
                    "error": f"Tipo de relatório '{report_type}' não suportado",
                    "available_types": ["inventory", "suppliers", "financial", "comprehensive"]
                }
        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório avançado: {e}")
            return {"error": str(e)}
    
    async def generate_charts(self, chart_type: str = "all") -> Dict[str, Any]:
        """Gerar gráficos para relatórios"""
        try:
            charts = {}
            
            if chart_type in ["all", "inventory"]:
                inventory_data = await self.generate_inventory_report()
                charts["inventory_chart"] = {
                    "type": "bar",
                    "title": "Distribuição de Estoque",
                    "data": inventory_data.get("analysis", {}).get("price_distribution", {}),
                    "description": "Distribuição de produtos por faixa de preço"
                }
            
            if chart_type in ["all", "suppliers"]:
                supplier_data = await self.generate_supplier_report()
                charts["supplier_chart"] = {
                    "type": "pie",
                    "title": "Valor por Fornecedor",
                    "data": {s["supplier_name"]: s["total_inventory_value"] 
                            for s in supplier_data.get("supplier_analysis", [])[:5]},
                    "description": "Top 5 fornecedores por valor de inventário"
                }
            
            if chart_type in ["all", "financial"]:
                financial_data = await self.generate_financial_report()
                charts["financial_chart"] = {
                    "type": "line",
                    "title": "Análise Financeira",
                    "data": financial_data.get("summary", {}),
                    "description": "Resumo da análise financeira"
                }
            
            return {
                "chart_type": chart_type,
                "generated_at": datetime.now().isoformat(),
                "charts": charts,
                "total_charts": len(charts)
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar gráficos: {e}")
            return {"error": str(e)}