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
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

    socket.on('register_node', (data) => {
        const { customId, password, deviceFingerprint } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        if (username === 'UX0') {
            socket.emit('auth_error', { message: 'Access Denied: Reserved Master Node ID.' });
            return;
        }

        // Bloqueo estricto por IP y huella de emulador / navegador duplicado
        if (registeredIPs.has(clientIp)) {
            socket.emit('auth_error', { message: 'SECURITY BLOCK: This IP address has already registered a node. Multi-accounts are completely banned.' });
            return;
        }

        if (registeredFingerprints.has(deviceFingerprint)) {
            socket.emit('auth_error', { message: 'SECURITY BLOCK: Emulator or device fingerprint already linked to an existing node.' });
            return;
        }

        if (users[username]) {
            socket.emit('auth_error', { message: 'Node ID already exists. Choose another.' });
            return;
        }

        registeredIPs.add(clientIp);
        registeredFingerprints.add(deviceFingerprint);

        users[username] = {
            password,
            balance: 20, // Único bono permitido: 20 UX iniciales para nuevos usuarios
            deviceFingerprint,
            ipAddress: clientIp
        };

        socket.emit('register_success', { message: 'Node registered successfully with 20 UX initial bonus!' });
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

    // SISTEMA DE PAGOS CORREGIDO: Cero simulaciones automáticas. Exige verificación manual de la tx real en la blockchain.
    socket.on('request_btc_invoice', (data) => {
        const { username, packageType, btcAmount } = data;
        // Se genera la orden de pago real ligada estrictamente a tu Trust Wallet
        socket.emit('btc_invoice_ready', {
            wallet: YOUR_TRUST_WALLET_BTC,
            packageType,
            btcAmount,
            message: `STRICT PAYMENT POLICY: Send exactly ${btcAmount} to Trust Wallet (${YOUR_TRUST_WALLET_BTC}). Balance will ONLY credit after blockchain confirmation. Free reloads are blocked.`
        });
    });

    // Endpoint exclusivo para que el Admin (UX0) confirme los pagos reales recibidos en su Trust Wallet
    socket.on('admin_verify_and_credit', (data) => {
        const { adminPassword, targetUser, packageType, amountToAdd } = data;
        if (adminPassword !== '197126' || users['UX0'].password !== '197126') {
            socket.emit('admin_action_error', { message: 'Unauthorized action.' });
            return;
        }

        if (users[targetUser]) {
            users[targetUser].balance += parseInt(amountToAdd);
            io.emit('balance_updated', { username: targetUser, newBalance: users[targetUser].balance });
            socket.emit('admin_action_success', { message: `Successfully credited ${amountToAdd} UX to ${targetUser} after real payment verification.` });
        } else {
            socket.emit('admin_action_error', { message: 'Target user not found.' });
        }
    });

    socket.on('open_direct_chat', (data) => {
        const { sender, recipient } = data;
        const user = users[sender];

        if (sender !== 'UX0' && (!user || user.balance <= 0)) {
            socket.emit('payment_required_alert', { message: '⚠️ ACCESS DENIED! Zero balance. Real Bitcoin payment required to chat.' });
            return;
        }

        const room = [sender, recipient].sort().join('_to_');
        socket.join(room);
        socket.emit('direct_chat_opened', { room: room, recipient: recipient, history: [] });
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
    console.log(`Pleniux secure payments server running on port ${PORT}`);
});
