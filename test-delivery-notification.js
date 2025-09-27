const Database = require('./backend/database/database.js');
const OrderController = require('./backend/controllers/OrderController.js');

async function testDeliveryNotification() {
    console.log('🧪 Iniciando teste de notificação de entrega...');
    
    try {
        const db = new Database();
        await db.connect();
        
        // Primeiro, vamos criar um novo pedido para teste
        const timestamp = Date.now();
        const testOrder = {
            number: `PED-TEST-${timestamp}`,
            supplier_id: 1,
            quote_id: null,
            order_date: new Date().toISOString().split('T')[0],
            delivery_date: new Date().toISOString().split('T')[0],
            total_value: 1500.00,
            status: 'pendente',
            notes: 'Pedido de teste para notificação de entrega'
        };
        
        console.log('📦 Criando pedido de teste...');
        const orderResult = await db.adicionarPedido(testOrder);
        const orderId = orderResult.lastID;
        console.log(`✅ Pedido criado com ID: ${orderId}`);
        
        // Adicionar itens ao pedido
        const testItems = [
            {
                order_id: orderId,
                product_id: 1,
                quantity: 1,
                unit_price: 1500.00,
                total_price: 1500.00,
                received_quantity: 0,
                notes: 'Item de teste'
            }
        ];
        
        for (const item of testItems) {
            await db.adicionarItemPedido(item);
        }
        console.log('✅ Itens adicionados ao pedido');
        
        // Simular o recebimento do item (isso deve marcar o pedido como entregue)
        console.log('📥 Simulando recebimento do item...');
        
        // Atualizar a quantidade recebida para marcar como entregue
        await OrderController.updateItemReceived(db, orderId, 1, 1);
        console.log('✅ Item marcado como recebido');
        
        // Verificar se o pedido foi marcado como entregue
        const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
        console.log('📊 Status do pedido após recebimento:', updatedOrder);
        
        // Aguardar um pouco para que a notificação seja processada
        console.log('⏳ Aguardando processamento da notificação...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se a notificação foi criada
        const notifications = await db.all(`
            SELECT * FROM notifications 
            WHERE type = 'order_delivered' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log('🔔 Notificações de entrega encontradas:', notifications.length);
        notifications.forEach((notification, index) => {
            console.log(`📢 Notificação ${index + 1}:`, {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                data: JSON.parse(notification.data || '{}'),
                created_at: notification.created_at
            });
        });
        
        await db.disconnect();
        console.log('✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar o teste
testDeliveryNotification();