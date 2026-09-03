const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Base de datos en memoria con control estricto de huellas de dispositivo (Anti-Multi-Cuentas)
const users = {
    'UX0': {
        password: '197126',
        balance: 20,
        deviceFingerprint: 'DEFAULT-SYSTEM-NODE'
    }
};

const registeredFingerprints = new Set(['DEFAULT-SYSTEM-NODE']);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('Secure client connected:', socket.id);

    // Registro de nodo con validación estricta Anti-Multi-Cuentas por hardware/dispositivo
    socket.on('register_node', (data) => {
        const { customId, password, deviceFingerprint } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        if (registeredFingerprints.has(deviceFingerprint)) {
            socket.emit('auth_error', { message: 'Security Block: This physical device or browser node has already registered an account.' });
            return;
        }

        if (users[username]) {
            socket.emit('auth_error', { message: 'Node ID already exists. Choose another or log in.' });
            return;
        }

        registeredFingerprints.add(deviceFingerprint);
        users[username] = {
            password,
            balance: 20,
            deviceFingerprint
        };

        socket.emit('register_success', { message: 'Node successfully registered with hardware binding.' });
    });

    // Inicio de sesión seguro (Soporta UX0 / 197126)
    socket.on('auth_node', (data) => {
        const { customId, password } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        const user = users[username];
        if (!user || user.password !== password) {
            socket.emit('auth_error', { message: 'Authentication failed: Invalid Node ID or Password.' });
            return;
        }

        socket.data.username = username;
        socket.emit('auth_success', {
            username: username,
            badge: `NODE: ${username}`,
            balance: user.balance
        });
    });

    // Abrir canal de comunicación directo y paralelo con otro usuario
    socket.on('open_direct_chat', (data) => {
        const { sender, recipient } = data;
        const room = [sender, recipient].sort().join('_to_');
        
        socket.join(room);
        socket.emit('direct_chat_opened', {
            room: room,
            recipient: recipient,
            history: []
        });
    });

    // Transmisión cifrada de mensajes de texto y fotos
    socket.on('send_direct_message', (data) => {
        const { room, sender, recipient, text, image } = data;
        const timestamp = new Date().toLocaleTimeString();

        const messagePacket = {
            room,
            sender,
            recipient,
            text,
            image,
            timestamp
        };

        io.to(room).emit('receive_direct_message', messagePacket);
    });

    // Procesamiento de pagos reales vía Bitcoin (Trust Wallet)
    socket.on('process_btc_payment', (data) => {
        const { username, packageType, btcAmount } = data;
        
        if (!users[username]) {
            socket.emit('payment_error', { message: 'Active session node not found for payment processing.' });
            return;
        }

        const creditsMatch = packageType.match(/^([\d,]+)\s*UX/);
        if (creditsMatch) {
            const addedCredits = parseInt(creditsMatch[1].replace(/,/g, ''), 10);
            users[username].balance += addedCredits;

            socket.emit('balance_updated', {
                newBalance: users[username].balance,
                message: `Trust Wallet BTC payment of ${btcAmount} verified on-chain. Added +${addedCredits} UX credits.`
            });
        }
    });

    // Penalización por salida de sesión o expiración de temporizador (-2 UX)
    socket.on('penalize_session_exit', (data) => {
        const { username } = data;
        if (users[username]) {
            users[username].balance = Math.max(0, users[username].balance - 2);
            socket.emit('force_logout_penalty', { message: '⚠️ Session terminated or expired. -2 UX penalty applied.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.post('/penalize', express.json(), (req, res) => {
    const { username } = req.body;
    if (users[username]) {
        users[username].balance = Math.max(0, users[username].balance - 2);
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux secure production server running on port ${PORT}`);
});
