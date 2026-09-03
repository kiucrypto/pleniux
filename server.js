const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Tu dirección real de Trust Wallet para recibir los pagos de Bitcoin
const YOUR_BTC_WALLET = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

// Base de datos: UX0 es el nodo jefe/administrador. Los demás entran en 0 y bloqueados.
const users = {
    'UX0': {
        password: '197126',
        balance: 999999, // Jefe con saldo ilimitado para supervisar
        deviceFingerprint: 'BOSS-MASTER-NODE'
    }
};

const registeredFingerprints = new Set(['BOSS-MASTER-NODE']);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('Secure client connected:', socket.id);

    // Registro anti-fraude: 0 balance para cuentas nuevas (evita que UX9 u otros recarguen gratis)
    socket.on('register_node', (data) => {
        const { customId, password, deviceFingerprint } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        if (username === 'UX0') {
            socket.emit('auth_error', { message: 'Reserved Node ID. Cannot register as UX0.' });
            return;
        }

        if (registeredFingerprints.has(deviceFingerprint)) {
            socket.emit('auth_error', { message: 'Security Block: This device has already registered a node.' });
            return;
        }

        if (users[username]) {
            socket.emit('auth_error', { message: 'Node ID already exists. Choose another.' });
            return;
        }

        registeredFingerprints.add(deviceFingerprint);
        users[username] = {
            password,
            balance: 0, // Cero balance obligatorio
            deviceFingerprint
        };

        socket.emit('register_success', { message: 'Node registered with 0 balance. Top up via BTC required to unlock.' });
    });

    // Autenticación segura
    socket.on('auth_node', (data) => {
        const { customId, password } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        const user = users[username];
        if (!user || user.password !== password) {
            socket.emit('auth_error', { message: 'Authentication failed: Invalid credentials.' });
            return;
        }

        socket.data.username = username;
        socket.emit('auth_success', {
            username: username,
            badge: username === 'UX0' ? 'NODE: UX0 (BOSS / ADMIN)' : `NODE: ${username}`,
            balance: user.balance,
            isAdmin: username === 'UX0'
        });
    });

    // Solicitar pasarela BTC vinculada a tu Trust Wallet
    socket.on('request_btc_invoice', (data) => {
        const { packageType, btcAmount } = data;
        socket.emit('btc_invoice_ready', {
            wallet: YOUR_BTC_WALLET,
            packageType,
            btcAmount,
            message: `Send exactly ${btcAmount} to your Trust Wallet address. Access unlocks upon on-chain confirmation.`
        });
    });

    // Validación estricta de saldo antes de abrir chat (Excepto UX0)
    socket.on('open_direct_chat', (data) => {
        const { sender, recipient } = data;
        const user = users[sender];

        if (sender !== 'UX0' && (!user || user.balance <= 0)) {
            socket.emit('payment_required_alert', { message: '⚠️ Access Denied! Your balance is 0. You must pay via Bitcoin to your Trust Wallet first.' });
            return;
        }

        const room = [sender, recipient].sort().join('_to_');
        socket.join(room);
        socket.emit('direct_chat_opened', {
            room: room,
            recipient: recipient,
            history: []
        });
    });

    socket.on('send_direct_message', (data) => {
        const { room, sender, recipient, text, image } = data;
        const user = users[sender];

        if (sender !== 'UX0' && (!user || user.balance <= 0)) {
            socket.emit('payment_required_alert', { message: '⚠️ Balance depleted. Chat locked until BTC payment is confirmed.' });
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        io.to(room).emit('receive_direct_message', { room, sender, recipient, text, image, timestamp });
    });

    // Penalización por expiración del temporizador de 1:30 min (-2 UX)
    socket.on('penalize_session_exit', (data) => {
        const { username } = data;
        if (username !== 'UX0' && users[username]) {
            users[username].balance = Math.max(0, users[username].balance - 2);
            socket.emit('force_logout_penalty', { message: '⚠️ Self-Destruct Timer Expired (1:30 min). -2 UX penalty applied and session wiped.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux secure production server running on port ${PORT}`);
});
