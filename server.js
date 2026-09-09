const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const users = new Map(); 
const sessions = new Map(); 

// Usuario Administrador por defecto (UX 0)
users.set('0', { password: '197126', nickname: 'Founder (Jhon Gonzales)', balance: 999999, ip: 'admin_system' });

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    socket.on('registrar', (data) => {
        const { ux, password, nickname } = data;
        if (!ux || !password || !nickname) return socket.emit('error_auth', 'All fields are required.');
        if (ux.length < 1 || ux.length > 10) return socket.emit('error_auth', 'UX number must be between 1 and 10 digits.');
        if (users.has(ux)) return socket.emit('error_auth', 'This UX number is already registered.');
        
        if (clientIp !== 'admin_system' && Array.from(users.values()).some(u => u.ip === clientIp)) {
            return socket.emit('error_auth', 'Security Block: Multi-account detected from this network.');
        }

        users.set(ux, { password, nickname, balance: 20, ip: clientIp });
        socket.emit('exito_auth', 'Registration successful! 20 UX bonus credited.');
    });

    socket.on('login', (data) => {
        const { ux, password } = data;
        const user = users.get(ux);
        if (!user || user.password !== password) return socket.emit('error_auth', 'Incorrect UX or password.');

        sessions.set(socket.id, { ux });
        socket.ux = ux;

        const sessionTimer = setTimeout(() => {
            if (users.has(ux)) users.get(ux).balance = Math.max(0, users.get(ux).balance - 1);
            socket.emit('sesion_expirada', 'Your security comes first: Session closed due to time limit (-1 UX).');
            socket.disconnect();
        }, 5 * 60 * 1000);

        sessions.get(socket.id).timer = sessionTimer;

        socket.emit('login_exitoso', {
            ux,
            nickname: user.nickname,
            balance: user.balance,
            isAdmin: (ux === '0' && password === '197126')
        });
    });

    socket.on('enviar_mensaje', (data) => {
        const { destinatarioUx, contenido, tipo } = data;
        const remitenteUx = socket.ux;
        if (!remitenteUx || !users.has(destinatarioUx)) return;

        const mensajeData = { de: remitenteUx, para: destinatarioUx, contenido, tipo };
        for (let [sId, sData] of sessions.entries()) {
            if (sData.ux === destinatarioUx) io.to(sId).emit('recibir_mensaje', mensajeData);
        }
        socket.emit('mensaje_enviado', mensajeData);
    });

    socket.on('admin_recargar', (data) => {
        if (socket.ux !== '0') return;
        const { targetUx, cantidad } = data;
        const targetUser = users.get(targetUx);
        if (targetUser) {
            targetUser.balance += Number(cantidad);
            socket.emit('admin_respuesta', `Balance successfully sent to ${targetUx}`);
        } else {
            socket.emit('admin_respuesta', 'Target UX does not exist.');
        }
    });

    socket.on('disconnect', () => {
        if (sessions.has(socket.id)) {
            clearTimeout(sessions.get(socket.id).timer);
            sessions.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux.com running on port ${PORT}`);
});
