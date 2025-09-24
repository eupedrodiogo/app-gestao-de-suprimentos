// WebSocket Manager para atualizações em tempo real
const WebSocket = require('ws');

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Set();
        this.updateInterval = null;
        this.isRunning = false;
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws',
            perMessageDeflate: false
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Nova conexão WebSocket estabelecida');
            this.clients.add(ws);

            // Enviar dados iniciais
            this.sendInitialData(ws);

            // Configurar handlers
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Erro ao processar mensagem WebSocket:', error);
                }
            });

            ws.on('close', () => {
                console.log('🔌 Conexão WebSocket fechada');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('Erro WebSocket:', error);
                this.clients.delete(ws);
            });

            // Ping/Pong para manter conexão viva
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        // Iniciar atualizações em tempo real
        this.startRealTimeUpdates();

        // Heartbeat para detectar conexões mortas
        this.startHeartbeat();

        this.isRunning = true;
        console.log('🚀 WebSocket Manager inicializado');
    }

    sendInitialData(ws) {
        const initialData = {
            type: 'initial',
            timestamp: new Date().toISOString(),
            data: {
                status: 'connected',
                serverTime: new Date().toISOString(),
                features: [
                    'real-time-metrics',
                    'live-predictions',
                    'instant-alerts',
                    'dynamic-charts'
                ]
            }
        };

        this.sendToClient(ws, initialData);
    }

    handleMessage(ws, message) {
        switch (message.type) {
            case 'subscribe':
                this.handleSubscription(ws, message.data);
                break;
            case 'unsubscribe':
                this.handleUnsubscription(ws, message.data);
                break;
            case 'request-update':
                this.sendRealTimeUpdate(ws);
                break;
            case 'ping':
                this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
                break;
            default:
                console.log('Tipo de mensagem desconhecido:', message.type);
        }
    }

    handleSubscription(ws, data) {
        if (!ws.subscriptions) {
            ws.subscriptions = new Set();
        }
        
        if (data.channel) {
            ws.subscriptions.add(data.channel);
            console.log(`Cliente inscrito no canal: ${data.channel}`);
            
            // Enviar dados específicos do canal
            this.sendChannelData(ws, data.channel);
        }
    }

    handleUnsubscription(ws, data) {
        if (ws.subscriptions && data.channel) {
            ws.subscriptions.delete(data.channel);
            console.log(`Cliente desinscrito do canal: ${data.channel}`);
        }
    }

    sendChannelData(ws, channel) {
        let channelData = {};

        switch (channel) {
            case 'metrics':
                channelData = this.generateMetricsData();
                break;
            case 'predictions':
                channelData = this.generatePredictionsData();
                break;
            case 'alerts':
                channelData = this.generateAlertsData();
                break;
            case 'inventory':
                channelData = this.generateInventoryData();
                break;
            default:
                channelData = { message: 'Canal não encontrado' };
        }

        this.sendToClient(ws, {
            type: 'channel-data',
            channel: channel,
            timestamp: new Date().toISOString(),
            data: channelData
        });
    }

    startRealTimeUpdates() {
        // Atualizar a cada 5 segundos
        this.updateInterval = setInterval(() => {
            this.broadcastRealTimeUpdate();
        }, 5000);
    }

    startHeartbeat() {
        // Verificar conexões a cada 30 segundos
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this.clients.delete(ws);
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    broadcastRealTimeUpdate() {
        if (this.clients.size === 0) return;

        const updateData = {
            type: 'real-time-update',
            timestamp: new Date().toISOString(),
            data: {
                metrics: this.generateMetricsData(),
                predictions: this.generatePredictionsData(),
                alerts: this.generateAlertsData(),
                inventory: this.generateInventoryData(),
                performance: this.generatePerformanceData()
            }
        };

        this.broadcast(updateData);
    }

    sendRealTimeUpdate(ws) {
        const updateData = {
            type: 'real-time-update',
            timestamp: new Date().toISOString(),
            data: {
                metrics: this.generateMetricsData(),
                predictions: this.generatePredictionsData(),
                alerts: this.generateAlertsData(),
                inventory: this.generateInventoryData(),
                performance: this.generatePerformanceData()
            }
        };

        this.sendToClient(ws, updateData);
    }

    generateMetricsData() {
        return {
            totalProducts: Math.floor(Math.random() * 50) + 100,
            lowStock: Math.floor(Math.random() * 10) + 5,
            criticalStock: Math.floor(Math.random() * 5) + 1,
            optimalStock: Math.floor(Math.random() * 30) + 70,
            accuracy: Math.random() * 10 + 90,
            processingTime: Math.random() * 50 + 25,
            activeAlerts: Math.floor(Math.random() * 8) + 2
        };
    }

    generatePredictionsData() {
        const predictions = [];
        const products = ['Produto A', 'Produto B', 'Produto C', 'Produto D'];
        
        products.forEach((product, index) => {
            predictions.push({
                product: product,
                currentDemand: Math.floor(Math.random() * 100) + 50,
                predictedDemand: Math.floor(Math.random() * 120) + 60,
                confidence: Math.random() * 30 + 70,
                trend: Math.random() > 0.5 ? 'up' : 'down',
                changePercent: (Math.random() * 20 - 10).toFixed(1)
            });
        });

        return predictions;
    }

    generateAlertsData() {
        const alertTypes = [
            'Estoque Crítico',
            'Oportunidade de Venda',
            'Anomalia Detectada',
            'Reabastecimento Necessário',
            'Excesso de Estoque'
        ];

        const severities = ['alta', 'média', 'baixa'];
        const alerts = [];

        for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
            alerts.push({
                id: Date.now() + i,
                tipo: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                produto: `Produto ${String.fromCharCode(65 + i)}`,
                severidade: severities[Math.floor(Math.random() * severities.length)],
                mensagem: `Alerta gerado automaticamente às ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toISOString(),
                isNew: true
            });
        }

        return alerts;
    }

    generateInventoryData() {
        const inventory = [];
        
        for (let i = 0; i < 10; i++) {
            inventory.push({
                id: i + 1,
                name: `Produto ${String.fromCharCode(65 + i)}`,
                currentStock: Math.floor(Math.random() * 200) + 10,
                minStock: Math.floor(Math.random() * 50) + 10,
                maxStock: Math.floor(Math.random() * 100) + 200,
                velocity: Math.random() * 10 + 1,
                status: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'low' : 'optimal',
                lastUpdate: new Date().toISOString()
            });
        }

        return inventory;
    }

    generatePerformanceData() {
        return {
            cpuUsage: Math.random() * 30 + 20,
            memoryUsage: Math.random() * 40 + 30,
            responseTime: Math.random() * 100 + 50,
            throughput: Math.random() * 1000 + 500,
            errorRate: Math.random() * 2,
            uptime: '99.9%',
            activeConnections: this.clients.size
        };
    }

    broadcast(data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendToClient(client, data);
            }
        });
    }

    broadcastToChannel(channel, data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && 
                client.subscriptions && 
                client.subscriptions.has(channel)) {
                this.sendToClient(client, {
                    type: 'channel-update',
                    channel: channel,
                    timestamp: new Date().toISOString(),
                    data: data
                });
            }
        });
    }

    sendToClient(client, data) {
        try {
            client.send(JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao enviar dados para cliente:', error);
            this.clients.delete(client);
        }
    }

    sendAlert(alert) {
        this.broadcast({
            type: 'alert',
            timestamp: new Date().toISOString(),
            data: alert
        });
    }

    sendNotification(notification) {
        this.broadcast({
            type: 'notification',
            timestamp: new Date().toISOString(),
            data: notification
        });
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            connectedClients: this.clients.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString()
        };
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.wss) {
            this.wss.close();
        }

        this.clients.clear();
        this.isRunning = false;
        console.log('🔌 WebSocket Manager parado');
    }
}

module.exports = WebSocketManager;