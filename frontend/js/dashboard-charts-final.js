// Dashboard Charts - Análise de Custo Temporal Sofisticada
console.log('🚀 Dashboard Charts - Temporal Cost Analysis carregado!');

// Configurações globais para performance e qualidade aprimoradas
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.animation.duration = 2000;
Chart.defaults.animation.easing = 'easeInOutCubic';
Chart.defaults.color = '#2c3e50';
Chart.defaults.font.family = "'Segoe UI', 'Roboto', 'Arial', sans-serif";

// Registrar animações personalizadas
Chart.register({
    id: 'customAnimations',
    beforeInit: function(chart) {
        chart.options.animation = {
            ...chart.options.animation,
            onProgress: function(animation) {
                const progress = animation.currentStep / animation.numSteps;
                chart.canvas.style.filter = `brightness(${0.8 + (progress * 0.2)})`;
            },
            onComplete: function() {
                chart.canvas.style.filter = 'brightness(1)';
            }
        };
    }
});

// Dados simulados de custo temporal (últimos 12 meses)
const temporalCostData = {
    '7d': {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Custo Operacional',
            data: [42500, 38200, 45800, 41200, 47300, 35600, 28900],
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8
        }, {
            label: 'Custo de Estoque',
            data: [28300, 31500, 29800, 33200, 27600, 30100, 25400],
            borderColor: 'rgba(118, 75, 162, 1)',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(118, 75, 162, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    },
    '30d': {
        labels: Array.from({length: 30}, (_, i) => `${i + 1}`),
        datasets: [{
            label: 'Custo Operacional',
            data: Array.from({length: 30}, () => Math.floor(Math.random() * 20000) + 35000),
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6
        }, {
            label: 'Custo de Estoque',
            data: Array.from({length: 30}, () => Math.floor(Math.random() * 15000) + 25000),
            borderColor: 'rgba(118, 75, 162, 1)',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6
        }]
    },
    '90d': {
        labels: Array.from({length: 12}, (_, i) => {
            const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10', 'Sem 11', 'Sem 12'];
            return weeks[i];
        }),
        datasets: [{
            label: 'Custo Operacional',
            data: [45200, 42800, 48600, 44300, 49100, 46700, 43900, 47800, 45600, 48200, 46400, 49800],
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7
        }, {
            label: 'Custo de Estoque',
            data: [29800, 31200, 28600, 32400, 30100, 29300, 31800, 28900, 30700, 32100, 29600, 31500],
            borderColor: 'rgba(118, 75, 162, 1)',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7
        }]
    },
    '1y': {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Custo Operacional',
            data: [42000, 38500, 45200, 41800, 47600, 44200, 46800, 43500, 48200, 45900, 47300, 49100],
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 8
        }, {
            label: 'Custo de Estoque',
            data: [28500, 31200, 29800, 33100, 27900, 30400, 28700, 31600, 29200, 32300, 30100, 31800],
            borderColor: 'rgba(118, 75, 162, 1)',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(118, 75, 162, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 8
        }]
    }
};

let temporalCostChart = null;
let chartCurrentPeriod = '7d';

// Aguardar carregamento do Chart.js e DOM
function waitForChartJS() {
    return new Promise((resolve) => {
        if (typeof Chart !== 'undefined') {
            resolve();
        } else {
            const checkChart = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    resolve();
                }
            }, 100);
        }
    });
}

// Função para criar o gráfico de custo temporal
async function createTemporalCostChart(period = '7d') {
    try {
        console.log(`🔄 Criando gráfico de custo temporal para período: ${period}`);
        
        const canvas = document.getElementById('temporalCostChart');
        if (!canvas) {
            console.error('❌ Canvas temporalCostChart não encontrado!');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico existente
        if (temporalCostChart) {
            temporalCostChart.destroy();
        }

        const data = temporalCostData[period];
        
        // Configurações avançadas do gráfico com animações aprimoradas
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                    animationDuration: 400
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutCubic',
                    delay: (context) => {
                        let delay = 0;
                        if (context.type === 'data' && context.mode === 'default') {
                            delay = context.dataIndex * 100 + context.datasetIndex * 200;
                        }
                        return delay;
                    },
                    onProgress: function(animation) {
                        const progress = animation.currentStep / animation.numSteps;
                        this.canvas.style.opacity = 0.3 + (progress * 0.7);
                    },
                    onComplete: function() {
                        this.canvas.style.opacity = 1;
                        // Adicionar efeito de pulso sutil
                        this.canvas.style.animation = 'subtle-pulse 3s ease-in-out infinite';
                    }
                },
                transitions: {
                    active: {
                        animation: {
                            duration: 600,
                            easing: 'easeOutQuart'
                        }
                    },
                    resize: {
                        animation: {
                            duration: 800,
                            easing: 'easeInOutCubic'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Análise de Custo Temporal - Evolução Corporativa',
                        color: '#2c3e50',
                        font: {
                            size: 18,
                            weight: 'bold',
                            family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#2c3e50',
                            font: {
                                size: 12,
                                weight: '500',
                                family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2c3e50',
                        bodyColor: '#2c3e50',
                        borderColor: 'rgba(102, 126, 234, 0.3)',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                            family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                        },
                        bodyFont: {
                            size: 12,
                            family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                        },
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].label);
                                const formattedDate = date.toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                                return `📅 ${formattedDate}`;
                            },
                            label: function(context) {
                                const value = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(context.parsed.y);
                                
                                // Calcular variação em relação ao ponto anterior
                                const dataIndex = context.dataIndex;
                                const dataset = context.dataset.data;
                                let variation = '';
                                
                                if (dataIndex > 0) {
                                    const previousValue = dataset[dataIndex - 1];
                                    const currentValue = context.parsed.y;
                                    const percentChange = ((currentValue - previousValue) / previousValue * 100);
                                    const arrow = percentChange >= 0 ? '📈' : '📉';
                                    const color = percentChange >= 0 ? '+' : '';
                                    variation = ` (${arrow} ${color}${percentChange.toFixed(1)}%)`;
                                }
                                
                                return `💰 ${context.dataset.label}: ${value}${variation}`;
                            },
                            afterLabel: function(context) {
                                const dataIndex = context.dataIndex;
                                const dataset = context.dataset.data;
                                const labels = [];
                                
                                // Calcular média móvel (3 períodos)
                                if (dataIndex >= 2) {
                                    const sum = dataset[dataIndex] + dataset[dataIndex - 1] + dataset[dataIndex - 2];
                                    const average = sum / 3;
                                    const avgFormatted = new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(average);
                                    labels.push(`📊 Média Móvel (3): ${avgFormatted}`);
                                }
                                
                                // Posição relativa no dataset
                                const maxValue = Math.max(...dataset);
                                const minValue = Math.min(...dataset);
                                const currentValue = context.parsed.y;
                                
                                if (currentValue === maxValue) {
                                    labels.push('🏆 Maior valor do período');
                                } else if (currentValue === minValue) {
                                    labels.push('📉 Menor valor do período');
                                }
                                
                                // Percentual em relação ao máximo
                                const percentOfMax = (currentValue / maxValue * 100).toFixed(1);
                                labels.push(`📈 ${percentOfMax}% do valor máximo`);
                                
                                return labels;
                            },
                            afterBody: function(context) {
                                const dataset = context[0].dataset.data;
                                const total = dataset.reduce((sum, value) => sum + value, 0);
                                const average = total / dataset.length;
                                const maxValue = Math.max(...dataset);
                                const minValue = Math.min(...dataset);
                                
                                const totalFormatted = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(total);
                                
                                const avgFormatted = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(average);
                                
                                const maxFormatted = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(maxValue);
                                
                                const minFormatted = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(minValue);
                                
                                return [
                                    '',
                                    '📊 ESTATÍSTICAS DO PERÍODO:',
                                    `💎 Total Acumulado: ${totalFormatted}`,
                                    `⚖️ Média Geral: ${avgFormatted}`,
                                    `🔝 Máximo: ${maxFormatted}`,
                                    `🔻 Mínimo: ${minFormatted}`
                                ];
                            },
                            footer: function(context) {
                                const currentValue = context[0].parsed.y;
                                const dataset = context[0].dataset.data;
                                const average = dataset.reduce((sum, value) => sum + value, 0) / dataset.length;
                                
                                let insight = '';
                                if (currentValue > average * 1.2) {
                                    insight = '⚠️ Valor significativamente acima da média';
                                } else if (currentValue < average * 0.8) {
                                    insight = '✅ Valor abaixo da média - economia detectada';
                                } else {
                                    insight = '📊 Valor dentro da faixa normal';
                                }
                                
                                return ['', insight];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Período de Tempo',
                            color: '#2c3e50',
                            font: {
                                size: 14,
                                weight: '600',
                                family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                            }
                        },
                        grid: {
                            color: 'rgba(102, 126, 234, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#2c3e50',
                            font: {
                                size: 11,
                                family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            color: '#2c3e50',
                            font: {
                                size: 14,
                                weight: '600',
                                family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                            }
                        },
                        grid: {
                            color: 'rgba(102, 126, 234, 0.1)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#2c3e50',
                            font: {
                                size: 11,
                                family: "'Segoe UI', 'Roboto', 'Arial', sans-serif"
                            },
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        scaleMode: 'xy',
                        onZoomStart: function(chart, event, point) {
                            chart.canvas.style.cursor = 'zoom-in';
                        },
                        onZoomComplete: function(chart, event) {
                            chart.canvas.style.cursor = 'default';
                            // Adicionar indicador visual de zoom
                            const zoomLevel = chart.getZoomLevel();
                            if (zoomLevel > 1) {
                                chart.canvas.style.filter = 'brightness(1.05) contrast(1.05)';
                            } else {
                                chart.canvas.style.filter = 'brightness(1) contrast(1)';
                            }
                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        modifierKey: 'shift',
                        onPanStart: function(chart, event, point) {
                            chart.canvas.style.cursor = 'grabbing';
                        },
                        onPanComplete: function(chart, event) {
                            chart.canvas.style.cursor = 'grab';
                        }
                    },
                    limits: {
                        x: {min: 'original', max: 'original'},
                        y: {min: 'original', max: 'original'}
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3,
                        fill: true
                    },
                    point: {
                        hoverBorderWidth: 4
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart',
                    onComplete: function() {
                        console.log('✅ Animação do gráfico concluída!');
                    }
                }
            }
        };

        temporalCostChart = new Chart(ctx, config);
        
        console.log('✅ Gráfico de custo temporal criado com sucesso!');
        updateInsights(period);
        
    } catch (error) {
        console.error('❌ Erro ao criar gráfico de custo temporal:', error);
        showErrorMessage();
    }
}

// Função para atualizar insights baseados no período
function updateInsights(period) {
    const data = temporalCostData[period];
    const operationalCosts = data.datasets[0].data;
    const stockCosts = data.datasets[1].data;
    
    // Calcular tendência
    const lastValue = operationalCosts[operationalCosts.length - 1];
    const firstValue = operationalCosts[0];
    const trend = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
    
    // Calcular média mensal
    const totalCosts = operationalCosts.concat(stockCosts);
    const average = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
    
    // Encontrar pico máximo
    const maxCost = Math.max(...totalCosts);
    
    // Calcular eficiência (simulada)
    const efficiency = (85 + Math.random() * 10).toFixed(1);
    
    // Calcular volatilidade (desvio padrão relativo)
    const mean = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
    const variance = totalCosts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totalCosts.length;
    const stdDev = Math.sqrt(variance);
    const volatility = ((stdDev / mean) * 100).toFixed(1);
    
    // Calcular ROI do período (simulado baseado na tendência)
    const roi = (trend * 0.8 + Math.random() * 5).toFixed(1);
    
    // Calcular score geral baseado em múltiplas métricas
    const efficiencyScore = parseFloat(efficiency);
    const volatilityScore = Math.max(0, 100 - parseFloat(volatility));
    const trendScore = Math.max(0, 50 + parseFloat(trend));
    const overallNumericScore = (efficiencyScore + volatilityScore + trendScore) / 3;
    
    let overallScore = 'F';
    if (overallNumericScore >= 90) overallScore = 'A+';
    else if (overallNumericScore >= 85) overallScore = 'A';
    else if (overallNumericScore >= 80) overallScore = 'B+';
    else if (overallNumericScore >= 75) overallScore = 'B';
    else if (overallNumericScore >= 70) overallScore = 'C+';
    else if (overallNumericScore >= 65) overallScore = 'C';
    else if (overallNumericScore >= 60) overallScore = 'D';
    
    // Atualizar elementos na interface
    const trendElement = document.getElementById('cost-trend');
    const avgElement = document.getElementById('monthly-avg');
    const peakElement = document.getElementById('peak-cost');
    const efficiencyElement = document.getElementById('efficiency-score');
    const volatilityElement = document.getElementById('volatility-index');
    const roiElement = document.getElementById('roi-period');
    const overallElement = document.getElementById('overall-score');
    const stdDevElement = document.getElementById('std-deviation');
    
    if (trendElement) {
        trendElement.textContent = `${trend > 0 ? '+' : ''}${trend}%`;
        trendElement.className = trend > 0 ? 'insight-value positive' : 'insight-value negative';
    }
    
    if (avgElement) {
        avgElement.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(average / 1000) + 'K';
    }
    
    if (peakElement) {
        peakElement.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(maxCost / 1000) + 'K';
    }
    
    if (efficiencyElement) {
        efficiencyElement.textContent = `${efficiency}%`;
    }
    
    if (volatilityElement) {
        volatilityElement.textContent = `${volatility}%`;
        volatilityElement.className = parseFloat(volatility) > 30 ? 'insight-value high-volatility' : 'insight-value normal-volatility';
    }
    
    if (roiElement) {
        roiElement.textContent = `${roi > 0 ? '+' : ''}${roi}%`;
        roiElement.className = roi > 0 ? 'insight-value positive' : 'insight-value negative';
    }
    
    if (overallElement) {
        overallElement.textContent = overallScore;
        overallElement.className = `insight-value score-${overallScore.toLowerCase().replace('+', '-plus')}`;
    }
    
    if (stdDevElement) {
        stdDevElement.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(stdDev / 1000) + 'K';
    }
    
    if (peakElement) {
        peakElement.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(maxCost / 1000) + 'K';
    }
    
    if (efficiencyElement) {
        efficiencyElement.textContent = `${efficiency}%`;
    }
}

// Função para mostrar mensagem de erro
function showErrorMessage() {
    const canvas = document.getElementById('temporalCostChart');
    if (canvas && canvas.parentElement) {
        canvas.parentElement.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 400px;
                color: #e74c3c;
                font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
                font-size: 16px;
                font-weight: 500;
                text-align: center;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 8px;
                border: 2px dashed #dee2e6;
            ">
                <div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" fill="#e74c3c"/>
                    </svg>
                    <div>Erro ao carregar gráfico de custo temporal</div>
                    <div style="font-size: 14px; color: #6c757d; margin-top: 8px;">Verifique a conexão e tente novamente</div>
                </div>
            </div>
        `;
    }
}

// Configurar seletores de período
function setupPeriodSelectors() {
    const periodButtons = document.querySelectorAll('.btn-period');
    
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            periodButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Obter período selecionado
            const selectedPeriod = this.getAttribute('data-period');
            chartCurrentPeriod = selectedPeriod;
            
            // Recriar gráfico com novo período
            createTemporalCostChart(selectedPeriod);
        });
    });

    // Configurar controles de zoom
    setupZoomControls();
}

// Função para configurar controles de zoom
function setupZoomControls() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            if (temporalCostChart) {
                temporalCostChart.zoom(1.2);
                // Adicionar feedback visual
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            if (temporalCostChart) {
                temporalCostChart.zoom(0.8);
                // Adicionar feedback visual
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    }

    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', function() {
            if (temporalCostChart) {
                temporalCostChart.resetZoom();
                // Adicionar feedback visual
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                // Reset visual effects
                const canvas = temporalCostChart.canvas;
                if (canvas) {
                    canvas.style.filter = 'brightness(1) contrast(1)';
                    canvas.style.cursor = 'default';
                }
            }
        });
    }
}

// Função principal de inicialização
async function initializeTemporalCostChart() {
    try {
        console.log('🚀 Iniciando inicialização do gráfico de custo temporal...');
        
        // Aguardar Chart.js
        await waitForChartJS();
        console.log('✅ Chart.js carregado!');
        
        // Aguardar um pouco para garantir que o DOM está pronto
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Criar gráfico inicial
        await createTemporalCostChart(chartCurrentPeriod);
        
        // Configurar seletores de período
        setupPeriodSelectors();
        
        console.log('🎉 Gráfico de custo temporal inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização do gráfico de custo temporal:', error);
        showErrorMessage();
    }
}

// Aguardar DOM e inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeTemporalCostChart, 300);
    });
} else {
    setTimeout(initializeTemporalCostChart, 300);
}

// Aguardar também o evento de load da janela
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!temporalCostChart) {
            console.log('🔄 Tentando recriar gráfico de custo temporal...');
            initializeTemporalCostChart();
        }
    }, 500);
});

// Redimensionar gráfico quando a janela for redimensionada
window.addEventListener('resize', () => {
    if (temporalCostChart) {
        temporalCostChart.resize();
    }
});

// Funções globais para acesso externo
window.initializeTemporalCostChart = initializeTemporalCostChart;
window.createTemporalCostChart = createTemporalCostChart;