const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware para JSON y archivos estáticos
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos SQLite persistente en vivo
const dbPath = path.resolve(__dirname, 'pleniux.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to live SQLite database successfully.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        ux TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        nickname TEXT NOT NULL,
        balance INTEGER DEFAULT 20,
        ip TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        recipient TEXT,
        content TEXT,
        type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mailbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Cuenta del Administrador Principal (UX 0)
    db.get(`SELECT * FROM users WHERE ux = '0'`, (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (ux, password, nickname, balance, ip) VALUES ('0', '197126', 'Founder (Jhon Gonzales)', 999999, 'admin_system')`, (err) => {
                if (!err) console.log('Admin UX 0 initialized.');
            });
        }
    });
});

const activeSessions = new Map(); // socket.id -> ux

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

    // Registro de cuentas en vivo
    socket.on('registrar', (data) => {
        const { ux, password, nickname } = data;
        if (!ux || !password || !nickname) return socket.emit('error_auth', 'All fields are required.');
        if (ux.length < 1 || ux.length > 10) return socket.emit('error_auth', 'UX number must be between 1 and 10 digits.');

        db.get(`SELECT * FROM users WHERE ux = ?`, [ux], (err, row) => {
            if (row) return socket.emit('error_auth', 'This UX number is already registered.');

            db.run(`INSERT INTO users (ux, password, nickname, balance, ip) VALUES (?, ?, ?, 20, ?)`, [ux, password, nickname, clientIp], (err) => {
                if (err) return socket.emit('error_auth', 'Database error during registration.');
                socket.emit('exito_auth', 'Registration successful! 20 UX bonus credited.');
            });
        });
    });

    // Inicio de sesión y control de seguridad de 5 minutos
    socket.on('login', (data) => {
        const { ux, password } = data;
        db.get(`SELECT * FROM users WHERE ux = ? AND password = ?`, [ux, password], (err, user) => {
            if (!user) return socket.emit('error_auth', 'Incorrect UX or password.');

            activeSessions.set(socket.id, ux);
            socket.ux = ux;

            // Cargar buzón 24/7 persistente
            db.all(`SELECT * FROM mailbox WHERE recipient = ?`, [ux], (err, mailRows) => {
                socket.emit('cargar_buzon', mailRows || []);
            });

            // Temporizador de seguridad (-1 UX tras 5 minutos)
            const sessionTimer = setTimeout(() => {
                db.run(`UPDATE users SET balance = MAX(0, balance - 1) WHERE ux = ?`, [ux], () => {
                    socket.emit('sesion_expirada', 'Your security comes first: Session closed due to time limit (-1 UX).');
                    socket.disconnect();
                });
            }, 5 * 60 * 1000);

            socket.on('disconnect', () => {
                clearTimeout(sessionTimer);
                activeSessions.delete(socket.id);
            });

            socket.emit('login_exitoso', {
                ux: user.ux,
                nickname: user.nickname,
                balance: user.balance,
                isAdmin: (user.ux === '0' && password === '197126')
            });
        });
    });

    // Mensajería instantánea en vivo (Texto o Foto)
    socket.on('enviar_mensaje', (data) => {
        const { destinatarioUx, contenido, tipo } = data;
        const remitenteUx = socket.ux;
        if (!remitenteUx) return;

        db.get(`SELECT * FROM users WHERE ux = ?`, [destinatarioUx], (err, targetUser) => {
            if (!targetUser) return socket.emit('error_chat', 'Recipient UX does not exist.');

            db.run(`INSERT INTO messages (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [remitenteUx, destinatarioUx, contenido, tipo], function(err) {
                if (err) return;
                const msgData = { id: this.lastID, de: remitenteUx, para: destinatarioUx, contenido, tipo };

                for (let [sId, sUx] of activeSessions.entries()) {
                    if (sUx === destinatarioUx) {
                        io.to(sId).emit('recibir_mensaje', msgData);
                    }
                }
                socket.emit('mensaje_enviado', msgData);
            });
        });
    });

    // Panel de administración exclusivo para UX 0
    socket.on('admin_recargar', (data) => {
        if (socket.ux !== '0') return;
        const { targetUx, cantidad } = data;
        db.run(`UPDATE users SET balance = balance + ? WHERE ux = ?`, [Number(cantidad), targetUx], function(err) {
            if (this.changes > 0) {
                socket.emit('admin_respuesta', `Successfully credited ${cantidad} UX to ${targetUx}`);
                for (let [sId, sUx] of activeSessions.entries()) {
                    if (sUx === targetUx) {
                        db.get(`SELECT balance FROM users WHERE ux = ?`, [targetUx], (err, row) => {
                            io.to(sId).emit('actualizar_balance', row.balance);
                        });
                    }
                }
            } else {
                socket.emit('admin_respuesta', 'Target UX does not exist.');
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux.com running live on port ${PORT}`);
});
