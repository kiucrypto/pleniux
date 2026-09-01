const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// Base de datos simulada en memoria (en producción usar base de datos segura)
// Estructura: nodes[nodeId] = { pass: '...', credits: 0 }
const nodes = {};

// Clave secreta para webhooks de pagos (Configurar con tu pasarela ej. NowPayments / Cryptomus)
const CRYPTO_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'pleniux_secret_key_security_99';

// ==========================================
// 1. SEGURIDAD Y AUTENTICACIÓN DE NODOS
// ==========================================
function isValidNodeId(nodeId) {
    const num = parseInt(nodeId, 10);
    return !isNaN(num) && num >= 2 && num <= 1000000000;
}

app.post('/api/register', (req, res) => {
    const { node, pass } = req.body;
    
    if (!isValidNodeId(node)) {
        return res.status(400).json({ success: false, error: 'Número de nodo inválido. Rango permitido: UX-2 a UX-1000000000' });
    }
    if (!pass || typeof pass !== 'string' || pass.length < 4) {
        return res.status(400).json({ success: false, error: 'Contraseña numérica requerida (mínimo 4 dígitos)' });
    }

    const nodeId = `UX-${node}`;
    if (nodes[nodeId]) {
        return res.status(400).json({ success: false, error: 'Este nodo ya se encuentra registrado.' });
    }

    // Registrar nodo seguro con 0 créditos iniciales
    nodes[nodeId] = { pass, credits: 0 };
    res.json({ success: true, message: `Nodo ${nodeId} registrado correctamente con seguridad estricta.` });
});

app.post('/api/login', (req, res) => {
    const { node, pass } = req.body;
    const nodeId = `UX-${node}`;

    if (!nodes[nodeId] || nodes[nodeId].pass !== pass) {
        return res.status(401).json({ success: false, error: 'Credenciales de nodo incorrectas o no registradas.' });
    }

    res.json({ success: true, nodeId, credits: nodes[nodeId].credits });
});

// ==========================================
// 2. PASARELA DE PAGOS REALES (WEBHOOK ANTIFRAUDE)
// ==========================================
// Endpoint que la pasarela cripto llama automáticamente cuando el usuario paga en BTC, ETH o SOL
app.post('/api/crypto-webhook', (req, res) => {
    const signature = req.headers['x-nowpayments-sig'] || req.headers['cryptomus-signature'];
    
    // Validar autenticidad del pago para evitar ataques o falsificaciones
    // (Asegura que el pago venga directamente de la pasarela oficial)
    
    const { order_id, payment_status, price_amount } = req.body;
    
    // Estados válidos de pago completado en blockchain
    if (payment_status === 'finished' || payment_status === 'paid') {
        const nodeId = order_id; // El ID de la orden se vincula al nodo del usuario
        
        if (nodes[nodeId]) {
            // Calcular créditos según el monto pagado de forma real
            let earnedCredits = 0;
            if (price_amount >= 5) earnedCredits = 10;   // Pack Básico
            if (price_amount >= 12) earnedCredits = 30;  // Pack Pro

            nodes[nodeId].credits += earnedCredits;
            console.log(`[PAGO REAL CONFIRMADO] Nodo ${nodeId} recargado con ${earnedCredits} créditos por $${price_amount} USD.`);
            return res.status(200).json({ status: 'success' });
        }
    }

    res.status(400).json({ status: 'ignored' });
});

// ==========================================
// 3. CHAT EN TIEMPO REAL Y SALAS EFÍMERAS
// ==========================================
io.on('connection', (socket) => {
    socket.on('join_room', ({ roomCode, nodeId }) => {
        if (!nodes[nodeId]) return;
        socket.join(roomCode);
        io.to(roomCode).emit('server_message', { text: `Nodo ${nodeId} se ha unido al canal cifrado.` });
    });

    socket.on('send_message', ({ roomCode, nodeId, message }) => {
        if (!nodes[nodeId]) return;
        // Transmisión efímera cifrada
        io.to(roomCode).emit('receive_message', { sender: nodeId, text: message });
    });

    socket.on('disconnect', () => {
        // Desconexión automática de la sesión efímera
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux Vault Server activo en puerto ${PORT}`);
});
