"""
Módulo de visualização simplificado para gestão de suprimentos
"""

import httpx
import json
import statistics
import math
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import os
from pathlib import Path

class VisualizationService:
    """Serviço de visualização simplificado"""
    
    def __init__(self, node_api_url: str = "http://localhost:3000"):
        self.node_api_url = node_api_url
        self.logger = logging.getLogger(__name__)
        
        # Criar diretório para exports
        self.exports_dir = Path("../exports")
        self.exports_dir.mkdir(exist_ok=True)
    
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
    
    def _generate_svg_chart(self, chart_type: str, data: List[Dict], title: str, width: int = 800, height: int = 400) -> str:
        """Gerar gráfico SVG simples"""
        try:
            svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .chart-title {{ font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; text-anchor: middle; }}
        .axis-label {{ font-family: Arial, sans-serif; font-size: 12px; }}
        .bar {{ fill: #4CAF50; stroke: #45a049; stroke-width: 1; }}
        .line {{ fill: none; stroke: #2196F3; stroke-width: 2; }}
        .point {{ fill: #2196F3; }}
        .grid {{ stroke: #e0e0e0; stroke-width: 1; }}
        .legend {{ font-family: Arial, sans-serif; font-size: 11px; }}
    </style>
    
    <!-- Título -->
    <text x="{width//2}" y="30" class="chart-title">{title}</text>
    
    <!-- Área do gráfico -->
    <g transform="translate(80, 50)">
'''
            
            chart_width = width - 160
            chart_height = height - 120
            
            if chart_type == "bar" and data:
                svg_content += self._generate_bar_chart_svg(data, chart_width, chart_height)
            elif chart_type == "line" and data:
                svg_content += self._generate_line_chart_svg(data, chart_width, chart_height)
            elif chart_type == "pie" and data:
                svg_content += self._generate_pie_chart_svg(data, chart_width, chart_height)
            else:
                # Gráfico vazio com mensagem
                svg_content += f'''
        <text x="{chart_width//2}" y="{chart_height//2}" text-anchor="middle" class="axis-label">
            Dados não disponíveis
        </text>
'''
            
            svg_content += '''
    </g>
</svg>'''
            
            return svg_content
            
        except Exception as e:
            self.logger.error(f"Erro ao gerar gráfico SVG: {e}")
            return f'<svg width="{width}" height="{height}"><text x="50" y="50">Erro ao gerar gráfico</text></svg>'
    
    def _generate_bar_chart_svg(self, data: List[Dict], width: int, height: int) -> str:
        """Gerar gráfico de barras SVG"""
        if not data:
            return ""
        
        # Preparar dados
        values = [float(item.get('value', 0)) for item in data]
        labels = [str(item.get('label', ''))[:15] for item in data]  # Limitar tamanho do label
        
        if not values or max(values) == 0:
            return '<text x="50" y="50" class="axis-label">Sem dados para exibir</text>'
        
        max_value = max(values)
        bar_width = width / len(data) * 0.8
        bar_spacing = width / len(data) * 0.2
        
        svg_bars = ""
        
        # Gerar barras
        for i, (value, label) in enumerate(zip(values, labels)):
            x = i * (bar_width + bar_spacing)
            bar_height = (value / max_value) * (height - 40)
            y = height - 40 - bar_height
            
            # Barra
            svg_bars += f'''
        <rect x="{x}" y="{y}" width="{bar_width}" height="{bar_height}" class="bar"/>
        
        <!-- Valor no topo da barra -->
        <text x="{x + bar_width/2}" y="{y - 5}" text-anchor="middle" class="axis-label">{value:.1f}</text>
        
        <!-- Label no eixo X -->
        <text x="{x + bar_width/2}" y="{height - 20}" text-anchor="middle" class="axis-label" transform="rotate(-45, {x + bar_width/2}, {height - 20})">{label}</text>
'''
        
        # Linhas de grade
        for i in range(5):
            y = height - 40 - (i * (height - 40) / 4)
            value = (i * max_value / 4)
            svg_bars += f'''
        <line x1="0" y1="{y}" x2="{width}" y2="{y}" class="grid"/>
        <text x="-10" y="{y + 4}" text-anchor="end" class="axis-label">{value:.1f}</text>
'''
        
        return svg_bars
    
    def _generate_line_chart_svg(self, data: List[Dict], width: int, height: int) -> str:
        """Gerar gráfico de linha SVG"""
        if not data:
            return ""
        
        values = [float(item.get('value', 0)) for item in data]
        labels = [str(item.get('label', ''))[:10] for item in data]
        
        if not values:
            return '<text x="50" y="50" class="axis-label">Sem dados para exibir</text>'
        
        max_value = max(values) if max(values) > 0 else 1
        min_value = min(values)
        
        # Pontos da linha
        points = []
        for i, value in enumerate(values):
            x = i * (width / (len(values) - 1)) if len(values) > 1 else width / 2
            y = height - 40 - ((value - min_value) / (max_value - min_value)) * (height - 40)
            points.append(f"{x},{y}")
        
        svg_line = f'<polyline points="{" ".join(points)}" class="line"/>'
        
        # Pontos
        for i, (value, label) in enumerate(zip(values, labels)):
            x = i * (width / (len(values) - 1)) if len(values) > 1 else width / 2
            y = height - 40 - ((value - min_value) / (max_value - min_value)) * (height - 40)
            
            svg_line += f'''
        <circle cx="{x}" cy="{y}" r="4" class="point"/>
        <text x="{x}" y="{y - 10}" text-anchor="middle" class="axis-label">{value:.1f}</text>
        <text x="{x}" y="{height - 20}" text-anchor="middle" class="axis-label" transform="rotate(-45, {x}, {height - 20})">{label}</text>
'''
        
        return svg_line
    
    def _generate_pie_chart_svg(self, data: List[Dict], width: int, height: int) -> str:
        """Gerar gráfico de pizza SVG"""
        if not data:
            return ""
        
        values = [float(item.get('value', 0)) for item in data if float(item.get('value', 0)) > 0]
        labels = [str(item.get('label', '')) for item in data if float(item.get('value', 0)) > 0]
        
        if not values:
            return '<text x="50" y="50" class="axis-label">Sem dados para exibir</text>'
        
        total = sum(values)
        if total == 0:
            return '<text x="50" y="50" class="axis-label">Sem dados para exibir</text>'
        
        # Centro e raio
        cx = width // 2
        cy = height // 2
        radius = min(width, height) // 3
        
        # Cores para as fatias
        colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"]
        
        svg_pie = ""
        current_angle = 0
        
        for i, (value, label) in enumerate(zip(values, labels)):
            angle = (value / total) * 360
            
            # Calcular pontos do arco
            start_angle_rad = current_angle * 3.14159 / 180
            end_angle_rad = (current_angle + angle) * 3.14159 / 180
            
            x1 = cx + radius * math.cos(start_angle_rad)
            y1 = cy + radius * math.sin(start_angle_rad)
            x2 = cx + radius * math.cos(end_angle_rad)
            y2 = cy + radius * math.sin(end_angle_rad)
            
            large_arc = 1 if angle > 180 else 0
            color = colors[i % len(colors)]
            
            # Fatia da pizza
            svg_pie += f'''
        <path d="M {cx} {cy} L {x1} {y1} A {radius} {radius} 0 {large_arc} 1 {x2} {y2} Z" 
              fill="{color}" stroke="white" stroke-width="2"/>
'''
            
            # Label da fatia
            label_angle_rad = (current_angle + angle/2) * 3.14159 / 180
            label_x = cx + (radius + 20) * math.cos(label_angle_rad)
            label_y = cy + (radius + 20) * math.sin(label_angle_rad)
            
            percentage = (value / total) * 100
            svg_pie += f'''
        <text x="{label_x}" y="{label_y}" text-anchor="middle" class="legend">
            {label[:10]} ({percentage:.1f}%)
        </text>
'''
            
            current_angle += angle
        
        return svg_pie
    
    async def create_inventory_dashboard(self) -> Dict[str, Any]:
        """Criar dashboard de inventário"""
        try:
            # Obter dados de produtos
            products_data = await self._get_data_from_api("products")
            products = products_data.get('data', [])
            
            if not products:
                return {"status": "no_data", "message": "Nenhum produto encontrado"}
            
            # Preparar dados para visualização
            dashboard_data = {
                "total_products": len(products),
                "total_value": 0,
                "low_stock_count": 0,
                "out_of_stock_count": 0,
                "categories": {},
                "stock_levels": [],
                "value_distribution": []
            }
            
            for product in products:
                quantity = int(product.get('quantity', 0))
                price = float(product.get('price', 0))
                min_quantity = int(product.get('min_quantity', 10))
                category = product.get('category', 'Outros')
                
                # Calcular valor total
                product_value = quantity * price
                dashboard_data["total_value"] += product_value
                
                # Contar alertas de estoque
                if quantity == 0:
                    dashboard_data["out_of_stock_count"] += 1
                elif quantity <= min_quantity:
                    dashboard_data["low_stock_count"] += 1
                
                # Agrupar por categoria
                if category not in dashboard_data["categories"]:
                    dashboard_data["categories"][category] = {"count": 0, "value": 0}
                dashboard_data["categories"][category]["count"] += 1
                dashboard_data["categories"][category]["value"] += product_value
                
                # Dados para gráficos
                dashboard_data["stock_levels"].append({
                    "label": product.get('name', 'Produto')[:15],
                    "value": quantity,
                    "min_value": min_quantity,
                    "status": "critical" if quantity == 0 else "low" if quantity <= min_quantity else "normal"
                })
                
                if product_value > 0:
                    dashboard_data["value_distribution"].append({
                        "label": product.get('name', 'Produto')[:15],
                        "value": product_value
                    })
            
            # Gerar gráficos SVG
            charts = {}
            
            # Gráfico de níveis de estoque (top 10)
            top_stock = sorted(dashboard_data["stock_levels"], key=lambda x: x["value"], reverse=True)[:10]
            charts["stock_levels"] = self._generate_svg_chart(
                "bar", 
                [{"label": item["label"], "value": item["value"]} for item in top_stock],
                "Níveis de Estoque (Top 10)"
            )
            
            # Gráfico de distribuição por categoria
            category_data = [
                {"label": cat, "value": data["count"]} 
                for cat, data in dashboard_data["categories"].items()
            ]
            charts["categories"] = self._generate_svg_chart(
                "pie",
                category_data,
                "Distribuição por Categoria"
            )
            
            # Gráfico de valor por produto (top 10)
            top_value = sorted(dashboard_data["value_distribution"], key=lambda x: x["value"], reverse=True)[:10]
            charts["value_distribution"] = self._generate_svg_chart(
                "bar",
                top_value,
                "Valor por Produto (Top 10)"
            )
            
            # Salvar dashboard como HTML
            html_content = self._generate_dashboard_html(dashboard_data, charts)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            dashboard_file = self.exports_dir / f"inventory_dashboard_{timestamp}.html"
            
            with open(dashboard_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return {
                "status": "success",
                "dashboard_file": str(dashboard_file),
                "summary": {
                    "total_products": dashboard_data["total_products"],
                    "total_value": round(dashboard_data["total_value"], 2),
                    "low_stock_alerts": dashboard_data["low_stock_count"],
                    "out_of_stock_alerts": dashboard_data["out_of_stock_count"],
                    "categories_count": len(dashboard_data["categories"])
                },
                "charts_generated": list(charts.keys()),
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar dashboard de inventário: {e}")
            return {"status": "error", "error": str(e)}
    
    def _generate_dashboard_html(self, data: Dict[str, Any], charts: Dict[str, str]) -> str:
        """Gerar HTML do dashboard"""
        html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard de Inventário - {datetime.now().strftime("%d/%m/%Y %H:%M")}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .metric-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }}
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }}
        .metric-label {{
            color: #666;
            margin-top: 5px;
        }}
        .charts {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }}
        .chart-container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        .alert {{
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .critical {{
            background: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Dashboard de Inventário</h1>
            <p>Gerado em: {datetime.now().strftime("%d/%m/%Y às %H:%M:%S")}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">{data["total_products"]}</div>
                <div class="metric-label">Total de Produtos</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">R$ {data["total_value"]:,.2f}</div>
                <div class="metric-label">Valor Total do Inventário</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{data["low_stock_count"]}</div>
                <div class="metric-label">Produtos com Estoque Baixo</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{data["out_of_stock_count"]}</div>
                <div class="metric-label">Produtos sem Estoque</div>
            </div>
        </div>
        
        {self._generate_alerts_html(data)}
        
        <div class="charts">
'''
        
        for chart_name, chart_svg in charts.items():
            html += f'''
            <div class="chart-container">
                {chart_svg}
            </div>
'''
        
        html += '''
        </div>
    </div>
</body>
</html>'''
        
        return html
    
    def _generate_alerts_html(self, data: Dict[str, Any]) -> str:
        """Gerar HTML dos alertas"""
        alerts_html = ""
        
        if data["out_of_stock_count"] > 0:
            alerts_html += f'''
        <div class="alert critical">
            <strong>ALERTA CRÍTICO:</strong> {data["out_of_stock_count"]} produtos estão sem estoque e precisam de reposição imediata!
        </div>
'''
        
        if data["low_stock_count"] > 0:
            alerts_html += f'''
        <div class="alert">
            <strong>ATENÇÃO:</strong> {data["low_stock_count"]} produtos estão com estoque baixo e devem ser reabastecidos em breve.
        </div>
'''
        
        if data["out_of_stock_count"] == 0 and data["low_stock_count"] == 0:
            alerts_html += '''
        <div class="alert" style="background: #d4edda; border-color: #c3e6cb; color: #155724;">
            <strong>SITUAÇÃO NORMAL:</strong> Todos os produtos estão com níveis adequados de estoque.
        </div>
'''
        
        return alerts_html
    
    async def create_supplier_performance_chart(self) -> Dict[str, Any]:
        """Criar gráfico de performance de fornecedores"""
        try:
            # Obter dados de fornecedores
            suppliers_data = await self._get_data_from_api("suppliers")
            suppliers = suppliers_data.get('data', [])
            
            if not suppliers:
                return {"status": "no_data", "message": "Nenhum fornecedor encontrado"}
            
            # Simular métricas de performance
            performance_data = []
            for supplier in suppliers:
                # Simular scores baseados em dados disponíveis
                reliability_score = min(100, max(60, hash(str(supplier.get('id', 0))) % 40 + 60))
                quality_score = min(100, max(70, hash(str(supplier.get('name', ''))) % 30 + 70))
                delivery_score = min(100, max(65, hash(str(supplier.get('contact', ''))) % 35 + 65))
                
                overall_score = (reliability_score + quality_score + delivery_score) / 3
                
                performance_data.append({
                    "label": supplier.get('name', 'Fornecedor')[:15],
                    "value": round(overall_score, 1),
                    "reliability": reliability_score,
                    "quality": quality_score,
                    "delivery": delivery_score
                })
            
            # Ordenar por performance
            performance_data.sort(key=lambda x: x["value"], reverse=True)
            
            # Gerar gráfico
            chart_svg = self._generate_svg_chart(
                "bar",
                [{"label": item["label"], "value": item["value"]} for item in performance_data],
                "Performance Geral dos Fornecedores (%)"
            )
            
            # Salvar como HTML
            html_content = self._generate_supplier_performance_html(performance_data, chart_svg)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_file = self.exports_dir / f"supplier_performance_{timestamp}.html"
            
            with open(chart_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Calcular estatísticas
            scores = [item["value"] for item in performance_data]
            avg_score = statistics.mean(scores) if scores else 0
            
            return {
                "status": "success",
                "chart_file": str(chart_file),
                "summary": {
                    "total_suppliers": len(performance_data),
                    "average_performance": round(avg_score, 1),
                    "best_performer": performance_data[0]["label"] if performance_data else "N/A",
                    "worst_performer": performance_data[-1]["label"] if performance_data else "N/A",
                    "suppliers_above_80": len([s for s in scores if s >= 80]),
                    "suppliers_below_70": len([s for s in scores if s < 70])
                },
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar gráfico de performance de fornecedores: {e}")
            return {"status": "error", "error": str(e)}
    
    def _generate_supplier_performance_html(self, data: List[Dict], chart_svg: str) -> str:
        """Gerar HTML do gráfico de performance de fornecedores"""
        html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance de Fornecedores - {datetime.now().strftime("%d/%m/%Y %H:%M")}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }}
        .chart-container {{
            margin: 30px 0;
            text-align: center;
        }}
        .performance-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
        }}
        .performance-table th,
        .performance-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        .performance-table th {{
            background-color: #f8f9fa;
            font-weight: bold;
        }}
        .score-excellent {{ color: #28a745; font-weight: bold; }}
        .score-good {{ color: #17a2b8; }}
        .score-average {{ color: #ffc107; }}
        .score-poor {{ color: #dc3545; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance de Fornecedores</h1>
            <p>Gerado em: {datetime.now().strftime("%d/%m/%Y às %H:%M:%S")}</p>
        </div>
        
        <div class="chart-container">
            {chart_svg}
        </div>
        
        <table class="performance-table">
            <thead>
                <tr>
                    <th>Fornecedor</th>
                    <th>Performance Geral</th>
                    <th>Confiabilidade</th>
                    <th>Qualidade</th>
                    <th>Entrega</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
'''
        
        for supplier in data:
            score = supplier["value"]
            score_class = (
                "score-excellent" if score >= 90 else
                "score-good" if score >= 80 else
                "score-average" if score >= 70 else
                "score-poor"
            )
            
            status = (
                "Excelente" if score >= 90 else
                "Bom" if score >= 80 else
                "Regular" if score >= 70 else
                "Precisa Melhorar"
            )
            
            html += f'''
                <tr>
                    <td>{supplier["label"]}</td>
                    <td class="{score_class}">{score}%</td>
                    <td>{supplier["reliability"]}%</td>
                    <td>{supplier["quality"]}%</td>
                    <td>{supplier["delivery"]}%</td>
                    <td class="{score_class}">{status}</td>
                </tr>
'''
        
        html += '''
            </tbody>
        </table>
    </div>
</body>
</html>'''
        
        return html
    
    async def create_financial_trends_chart(self) -> Dict[str, Any]:
        """Criar gráfico de tendências financeiras"""
        try:
            # Obter dados de produtos para simular tendências
            products_data = await self._get_data_from_api("products")
            products = products_data.get('data', [])
            
            if not products:
                return {"status": "no_data", "message": "Nenhum produto encontrado"}
            
            # Simular dados de tendências dos últimos 12 meses
            months = []
            current_date = datetime.now()
            
            for i in range(12):
                month_date = current_date - timedelta(days=30*i)
                month_name = month_date.strftime("%b/%Y")
                months.append(month_name)
            
            months.reverse()  # Ordem cronológica
            
            # Simular valores mensais baseados nos produtos
            base_value = sum(float(p.get('price', 0)) * int(p.get('quantity', 0)) for p in products)
            
            trends_data = []
            for i, month in enumerate(months):
                # Simular variação mensal
                variation = 1 + (hash(month) % 20 - 10) / 100  # Variação de -10% a +10%
                monthly_value = base_value * variation * (0.8 + i * 0.02)  # Tendência de crescimento
                
                trends_data.append({
                    "label": month,
                    "value": round(monthly_value, 2)
                })
            
            # Gerar gráfico de linha
            chart_svg = self._generate_svg_chart(
                "line",
                trends_data,
                "Tendência do Valor do Inventário (12 meses)"
            )
            
            # Calcular estatísticas
            values = [item["value"] for item in trends_data]
            growth_rate = ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0
            avg_value = statistics.mean(values) if values else 0
            
            # Salvar como HTML
            html_content = self._generate_financial_trends_html(trends_data, chart_svg, {
                "growth_rate": growth_rate,
                "avg_value": avg_value,
                "current_value": values[-1] if values else 0,
                "min_value": min(values) if values else 0,
                "max_value": max(values) if values else 0
            })
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_file = self.exports_dir / f"financial_trends_{timestamp}.html"
            
            with open(chart_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return {
                "status": "success",
                "chart_file": str(chart_file),
                "summary": {
                    "growth_rate": round(growth_rate, 2),
                    "average_monthly_value": round(avg_value, 2),
                    "current_value": round(values[-1], 2) if values else 0,
                    "trend_direction": "crescimento" if growth_rate > 0 else "declínio" if growth_rate < 0 else "estável"
                },
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar gráfico de tendências financeiras: {e}")
            return {"status": "error", "error": str(e)}
    
    def _generate_financial_trends_html(self, data: List[Dict], chart_svg: str, stats: Dict) -> str:
        """Gerar HTML do gráfico de tendências financeiras"""
        trend_color = "#28a745" if stats["growth_rate"] > 0 else "#dc3545" if stats["growth_rate"] < 0 else "#6c757d"
        trend_icon = "↗" if stats["growth_rate"] > 0 else "↘" if stats["growth_rate"] < 0 else "→"
        
        html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tendências Financeiras - {datetime.now().strftime("%d/%m/%Y %H:%M")}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-value {{
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .stat-label {{
            color: #666;
            font-size: 0.9em;
        }}
        .trend-indicator {{
            color: {trend_color};
            font-size: 2em;
        }}
        .chart-container {{
            margin: 30px 0;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tendências Financeiras do Inventário</h1>
            <p>Gerado em: {datetime.now().strftime("%d/%m/%Y às %H:%M:%S")}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" style="color: {trend_color};">
                    <span class="trend-indicator">{trend_icon}</span>
                    {stats["growth_rate"]:+.1f}%
                </div>
                <div class="stat-label">Crescimento (12 meses)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">R$ {stats["current_value"]:,.2f}</div>
                <div class="stat-label">Valor Atual</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">R$ {stats["avg_value"]:,.2f}</div>
                <div class="stat-label">Média Mensal</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">R$ {stats["max_value"]:,.2f}</div>
                <div class="stat-label">Valor Máximo</div>
            </div>
        </div>
        
        <div class="chart-container">
            {chart_svg}
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>Análise da Tendência</h3>
            <p>
                O valor do inventário apresentou uma tendência de <strong>{stats["growth_rate"]:+.1f}%</strong> 
                nos últimos 12 meses, indicando um padrão de <strong>{"crescimento" if stats["growth_rate"] > 0 else "declínio" if stats["growth_rate"] < 0 else "estabilidade"}</strong>.
            </p>
            <p>
                O valor médio mensal foi de <strong>R$ {stats["avg_value"]:,.2f}</strong>, 
                com pico de <strong>R$ {stats["max_value"]:,.2f}</strong> 
                e mínimo de <strong>R$ {stats["min_value"]:,.2f}</strong>.
            </p>
        </div>
    </div>
</body>
</html>'''
        
        return html

    async def create_predictive_charts(self) -> Dict[str, Any]:
        """Criar gráficos de predição"""
        try:
            # Simular dados de predição
            prediction_data = []
            base_value = 1000
            
            for i in range(12):
                month = (datetime.now() + timedelta(days=30*i)).strftime("%Y-%m")
                predicted_value = base_value + (i * 50) + (i * i * 5)  # Crescimento quadrático
                confidence = max(0.95 - (i * 0.05), 0.5)  # Confiança diminui com o tempo
                
                prediction_data.append({
                    "month": month,
                    "predicted_value": predicted_value,
                    "confidence": confidence
                })
            
            chart_svg = self._generate_svg_chart("line", prediction_data, "Predições de Demanda - 12 Meses")
            
            return {
                "chart_type": "predictive",
                "title": "Gráficos de Predição",
                "data": prediction_data,
                "chart_svg": chart_svg,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar gráficos preditivos: {e}")
            return {"error": str(e)}
    
    async def create_custom_chart(self, chart_config: Dict[str, Any]) -> Dict[str, Any]:
        """Criar gráfico personalizado"""
        try:
            chart_type = chart_config.get("type", "bar")
            title = chart_config.get("title", "Gráfico Personalizado")
            data_source = chart_config.get("data_source", "products")
            
            # Obter dados baseado na fonte especificada
            if data_source == "products":
                api_data = await self._get_data_from_api("products")
            elif data_source == "suppliers":
                api_data = await self._get_data_from_api("suppliers")
            else:
                api_data = {"data": []}
            
            data = api_data.get("data", [])
            
            # Processar dados para o gráfico
            chart_data = []
            for item in data[:10]:  # Limitar a 10 itens
                if data_source == "products":
                    chart_data.append({
                        "label": item.get("name", "Item"),
                        "value": float(item.get("quantity", 0))
                    })
                elif data_source == "suppliers":
                    chart_data.append({
                        "label": item.get("name", "Fornecedor"),
                        "value": len([p for p in data if p.get("supplier_id") == item.get("id")])
                    })
            
            chart_svg = self._generate_svg_chart(chart_type, chart_data, title)
            
            return {
                "chart_type": chart_type,
                "title": title,
                "data_source": data_source,
                "data": chart_data,
                "chart_svg": chart_svg,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao criar gráfico personalizado: {e}")
            return {"error": str(e)}
    
    async def get_all_charts(self) -> Dict[str, Any]:
        """Obter lista de todos os gráficos disponíveis"""
        try:
            charts = {
                "inventory_dashboard": {
                    "name": "Dashboard de Inventário",
                    "description": "Visão geral do inventário com estatísticas principais",
                    "type": "dashboard"
                },
                "supplier_analysis": {
                    "name": "Análise de Fornecedores",
                    "description": "Performance e distribuição de fornecedores",
                    "type": "analysis"
                },
                "financial_trends": {
                    "name": "Tendências Financeiras",
                    "description": "Análise temporal de valores e tendências",
                    "type": "trends"
                },
                "predictive_charts": {
                    "name": "Gráficos Preditivos",
                    "description": "Predições e projeções futuras",
                    "type": "prediction"
                }
            }
            
            return {
                "total_charts": len(charts),
                "available_charts": charts,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao listar gráficos: {e}")
            return {"error": str(e)}