const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Base de datos en memoria para el demo (puedes cambiarla por MongoDB o SQLite)
const users = {}; // { username: { password, balance, deviceFingerprint } }

// Servir archivos estáticos desde la carpeta actual
app.use(express.json());
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Registro de nodo con bono de +20 UX
    socket.on('register_node', (data) => {
        const { customId, password, deviceFingerprint } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        if (users[username]) {
            socket.emit('auth_error', { message: 'Node ID already exists. Choose another or log in.' });
            return;
        }

        // Registrar usuario con 20 UX de bienvenida
        users[username] = {
            password,
            balance: 20,
            deviceFingerprint
        };

        socket.emit('register_success', { message: 'Node registered successfully!' });
    });

    // Inicio de sesión
    socket.on('auth_node', (data) => {
        const { customId, password } = data;
        const username = 'UX' + customId.replace(/^UX/i, '');

        const user = users[username];
        if (!user || user.password !== password) {
            socket.emit('auth_error', { message: 'Invalid Node ID or Password.' });
            return;
        }

        socket.data.username = username;
        socket.emit('auth_success', {
            username: username,
            badge: `NODE: ${username}`,
            balance: user.balance
        });
    });

    // Abrir chat directo entre usuarios
    socket.on('open_direct_chat', (data) => {
        const { sender, recipient } = data;
        // Crear un identificador de sala único ordenado alfabéticamente
        const room = [sender, recipient].sort().join('_to_');
        
        socket.join(room);
        socket.emit('direct_chat_opened', {
            room: room,
            recipient: recipient,
            history: []
        });
    });

    // Enviar mensajes o fotos cifradas
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

        // Enviar a todos en la sala (incluyendo al remitente)
        io.to(room).emit('receive_direct_message', messagePacket);
    });

    // Simular procesamiento de pago y recarga de UX
    socket.on('verify_payment', (data) => {
        const { username, packageType } = data;
        if (users[username]) {
            // Extraer créditos UX del string del paquete (ej: "200 UX ($10)" -> 200)
            const creditsMatch = packageType.match(/^([\d,]+)\s*UX/);
            if (creditsMatch) {
                const addedCredits = parseInt(creditsMatch[1].replace(/,/g, ''), 10);
                users[username].balance += addedCredits;

                socket.emit('balance_updated', {
                    newBalance: users[username].balance,
                    message: `Payment successful! Added +${addedCredits} UX credits.`
                });
            }
        }
    });

    // Penalización por salir de la zona de chat o cerrar sesión (-2 UX)
    socket.on('penalize_session_exit', (data) => {
        const { username } = data;
        if (users[username]) {
            users[username].balance = Math.main ? Math.max(0, users[username].balance - 2) : Math.max(0, users[username].balance - 2);
            socket.emit('force_logout_penalty', { message: '⚠️ Session ended or refreshed. -2 UX penalty applied.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Endpoint por si usa sendBeacon al cerrar pestaña
app.post('/penalize', express.json(), (req, res) => {
    const { username } = req.body;
    if (users[username]) {
        users[username].balance = Math.max(0, users[username].balance - 2);
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux server running on http://localhost:${PORT}`);
});
