// Correção para os gráficos ultra-premium
console.log('Dashboard Fix carregado!');

// Interceptar e substituir a função problemática
window.originalInitializeCharts = window.initializeCharts;

// Sobrescrever a função problemática
window.initializeCharts = function() {
    console.log('Executando initializeCharts corrigida!');
    const salesCanvas = document.getElementById('salesChart');
    const stockCanvas = document.getElementById('stockChart');
    
    if (!salesCanvas || !stockCanvas) {
        console.error('Canvas elements not found');
        return;
    }

    // Destruir gráficos existentes se houver
    Chart.getChart('salesChart')?.destroy();
    Chart.getChart('stockChart')?.destroy();

    // Obter contextos 2D corretamente
    const salesCtx = salesCanvas.getContext('2d');
    const stockCtx = stockCanvas.getContext('2d');
    
    // Criar gradientes para o gráfico de vendas
    const salesGradient = salesCtx.createLinearGradient(0, 0, 0, 400);
    salesGradient.addColorStop(0, 'rgba(103, 126, 234, 0.8)');
    salesGradient.addColorStop(1, 'rgba(103, 126, 234, 0.1)');
    
    const productsGradient = salesCtx.createLinearGradient(0, 0, 0, 400);
    productsGradient.addColorStop(0, 'rgba(118, 75, 162, 0.8)');
    productsGradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');

    // Dados de exemplo para teste
    const salesData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
            label: 'Vendas (R$)',
            data: [65000, 59000, 80000, 81000, 56000, 95000],
            backgroundColor: salesGradient,
            borderColor: 'rgba(103, 126, 234, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 255, 255, 1)',
            pointBorderColor: 'rgba(103, 126, 234, 1)',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }, {
            label: 'Produtos Vendidos',
            data: [28, 48, 40, 19, 86, 27],
            backgroundColor: productsGradient,
            borderColor: 'rgba(118, 75, 162, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 255, 255, 1)',
            pointBorderColor: 'rgba(118, 75, 162, 1)',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            yAxisID: 'y1'
        }]
    };

    // Configuração do gráfico de vendas
    const salesChart = new Chart(salesCanvas, {
        type: 'line',
        data: salesData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
                delay: (context) => context.dataIndex * 100
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 12, weight: '500' }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 12, weight: '500' }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 12, weight: '500' }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: { size: 14, weight: '600' },
                        padding: 20,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            }
        }
    });

    // Dados para o gráfico de estoque
    const stockData = {
        labels: ['Eletrônicos', 'Móveis', 'Roupas', 'Livros', 'Esportes'],
        datasets: [{
            data: [300, 150, 100, 80, 70],
            backgroundColor: [
                'rgba(103, 126, 234, 0.8)',
                'rgba(118, 75, 162, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)'
            ],
            borderColor: [
                'rgba(103, 126, 234, 1)',
                'rgba(118, 75, 162, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 3,
            hoverBackgroundColor: [
                'rgba(103, 126, 234, 1)',
                'rgba(118, 75, 162, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
            ],
            hoverBorderColor: 'rgba(255, 255, 255, 1)',
            hoverBorderWidth: 4
        }]
    };

    // Configuração do gráfico de estoque
    const stockChart = new Chart(stockCanvas, {
        type: 'doughnut',
        data: stockData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        padding: 20,
                        pointStyle: 'circle',
                        font: { size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            }
        }
    });

    console.log('Gráficos inicializados com sucesso!');
};

// Executar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando gráficos...');
    // Aguardar um pouco para garantir que todos os elementos estejam prontos
    setTimeout(window.initializeCharts, 500);
});

// Também executar se o DOM já estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeCharts);
} else {
    console.log('DOM já carregado, inicializando gráficos imediatamente...');
    setTimeout(window.initializeCharts, 100);
}