const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Tu dirección real de Trust Wallet para pagos reales
const YOUR_TRUST_WALLET_BTC = 'bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s';

// UX0 es el administrador maestro.
const users = {
    'UX0': {
        password: '197126',
        balance: 999999,
        deviceFingerprint: 'BOSS-MASTER-NODE',
        ipAddress: '127.0.0.1'
    }
};

const registeredIPs = new Set(['127.0.0.1']);
const registeredFingerprints = new Set(['BOSS-MASTER-NODE']);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    // Captura estricta de la IP real del cliente para bloqueo anti-multicuenta
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    console.log(`Secure client connected from IP: ${clientIp}`);

    socket.on('register_node', (data) => {
        const { customId, password, deviceFingerprint } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        if (username === 'UX0') {
            socket.emit('auth_error', { message: 'Access Denied: Reserved Master Node ID.' });
            return;
        }

        // Bloqueo estricto por IP y huella de navegador
        if (registeredIPs.has(clientIp)) {
            socket.emit('auth_error', { message: 'Security Block: This IP address has already registered an account. Multi-accounts are forbidden.' });
            return;
        }

        if (registeredFingerprints.has(deviceFingerprint)) {
            socket.emit('auth_error', { message: 'Security Block: This device fingerprint is already linked to an existing account.' });
            return;
        }

        if (users[username]) {
            socket.emit('auth_error', { message: 'Node ID already exists. Choose another.' });
            return;
        }

        // Registrar IP, huella y asignar el bono inicial de 20 UX para nuevos usuarios
        registeredIPs.add(clientIp);
        registeredFingerprints.add(deviceFingerprint);

        users[username] = {
            password,
            balance: 20, // Bono inicial de 20 UX para nuevos usuarios
            deviceFingerprint,
            ipAddress: clientIp
        };

        socket.emit('register_success', { message: 'Node registered successfully with a 20 UX initial bonus!' });
    });

    socket.on('auth_node', (data) => {
        const { customId, password } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        const user = users[username];
        if (!user || user.password !== password) {
            socket.emit('auth_error', { message: 'Authentication failed: Invalid Node ID or PIN.' });
            return;
        }

        socket.data.username = username;
        socket.emit('auth_success', {
            username: username,
            badge: username === 'UX0' ? 'NODE: UX0 (ADMIN / BOSS)' : `NODE: ${username}`,
            balance: user.balance,
            isAdmin: username === 'UX0'
        });
    });

    // Factura de pago real con tu Trust Wallet
    socket.on('request_btc_invoice', (data) => {
        const { packageType, btcAmount } = data;
        socket.emit('btc_invoice_ready', {
            wallet: YOUR_TRUST_WALLET_BTC,
            packageType,
            btcAmount,
            message: `Send exactly ${btcAmount} to your Trust Wallet (${YOUR_TRUST_WALLET_BTC}). Real funds only.`
        });
    });

    socket.on('open_direct_chat', (data) => {
        const { sender, recipient } = data;
        const user = users[sender];

        if (sender !== 'UX0' && (!user || user.balance <= 0)) {
            socket.emit('payment_required_alert', { message: '⚠️ Access Denied! Zero balance. Real Bitcoin payment required to chat.' });
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
        const { room, sender, recipient, text } = data;
        const user = users[sender];

        if (sender !== 'UX0' && (!user || user.balance <= 0)) {
            socket.emit('payment_required_alert', { message: '⚠️ Balance depleted. Chat locked until real BTC payment is verified.' });
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        io.to(room).emit('receive_direct_message', { room, sender, recipient, text, timestamp });
    });

    socket.on('penalize_session_exit', (data) => {
        const { username } = data;
        if (username !== 'UX0' && users[username]) {
            users[username].balance = Math.max(0, users[username].balance - 2);
            socket.emit('force_logout_penalty', { message: '⚠️ Self-Destruct Timer Expired (1:30 min). -2 UX penalty applied and session wiped.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected from IP: ${clientIp}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux secure server running on port ${PORT}`);
});
