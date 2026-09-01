const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

const nodeDatabase = {};

app.post('/api/register', (req, res) => {
    const { node, pass } = req.body;
    const num = parseInt(node);

    if (isNaN(num) || num < 2 || num > 1000000000) {
        return res.status(400).json({ error: "El nodo debe estar estrictamente entre 2 y 1,000,000,000." });
    }
    if (!pass || isNaN(pass)) {
        return res.status(400).json({ error: "La contraseña debe ser exclusivamente numérica." });
    }
    if (nodeDatabase[num]) {
        return res.status(400).json({ error: "Este número de nodo ya está registrado." });
    }

    nodeDatabase[num] = { pass: String(pass), credits: 0 };
    return res.json({ success: true, message: `Nodo UX${num} registrado correctamente.` });
});

app.post('/api/login', (req, res) => {
    const { node, pass } = req.body;
    const num = parseInt(node);

    if (!nodeDatabase[num] || nodeDatabase[num].pass !== String(pass)) {
        return res.status(401).json({ error: "Nodo o contraseña numérica incorrectos." });
    }

    return res.json({ 
        success: true, 
        nodeId: `UX${num}`, 
        credits: nodeDatabase[num].credits 
    });
});

app.post('/api/webhook/payment', (req, res) => {
    const { secretApiKey, nodeNumber, amountPaid, creditsToAdd } = req.body;
    
    if (secretApiKey !== "TUPASARELA_API_SECRET_KEY_SEGURO") {
        return res.status(403).json({ error: "Acceso no autorizado." });
    }

    const num = parseInt(nodeNumber);
    if (!nodeDatabase[num]) {
        return res.status(404).json({ error: "Nodo no encontrado." });
    }

    nodeDatabase[num].credits += parseInt(creditsToAdd);
    return res.json({ success: true, newBalance: nodeDatabase[num].credits });
});

io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        const { roomCode, nodeId } = data;
        socket.join(roomCode);
        io.to(roomCode).emit('server_message', { text: `Nodo ${nodeId} conectado de forma cifrada a la sala.` });
    });

    socket.on('send_message', (data) => {
        const { roomCode, nodeId, message } = data;
        io.to(roomCode).emit('receive_message', { sender: nodeId, text: message });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Pleniux Core] Servidor seguro activo en el puerto ${PORT}`);
});
