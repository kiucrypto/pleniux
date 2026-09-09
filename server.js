const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json({ limit: '10mb' }));

// Base de datos SQLite persistente en vivo
const dbPath = path.resolve(__dirname, 'pleniux.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database error:', err.message);
    else console.log('Connected to SQLite database.');
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

    // Administrador principal por defecto (UX 0)
    db.get(`SELECT * FROM users WHERE ux = '0'`, (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (ux, password, nickname, balance, ip) VALUES ('0', '197126', 'Founder (Jhon Gonzales)', 999999, 'admin_system')`);
        }
    });
});

// Servir la interfaz completa directamente desde la raíz
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pleniux.com - High Security & Live Real-Time System</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: linear-gradient(-45deg, #0b0f19, #1a1c29, #0f172a, #020617); background-size: 400% 400%; animation: gradientBG 12s ease infinite; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .container { max-width: 900px; margin: 40px auto; padding: 20px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.6); }
        h1, h2 { text-align: center; color: #38bdf8; margin-bottom: 20px; }
        .auth-box, .dashboard-box { display: flex; flex-direction: column; gap: 15px; }
        input, button { padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 16px; }
        button { background: #0284c7; cursor: pointer; font-weight: bold; transition: background 0.3s; }
        button:hover { background: #0ea5e9; }
        .virtual-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 5px; }
        .key-btn { background: #334155; border: none; padding: 10px; font-size: 18px; font-weight: bold; border-radius: 6px; color: #fff; cursor: pointer; }
        .key-btn:active { background: #0284c7; }
        .hidden { display: none !important; }
        .wallet-section { margin-top: 25px; padding: 15px; background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        footer { text-align: center; padding: 30px 20px; background: rgba(2, 6, 23, 0.9); border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #94a3b8; line-height: 1.6; }
        footer .founder { color: #38bdf8; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container" id="app">
        <h1>Pleniux.com</h1>

        <!-- AUTH SECTION -->
        <div id="auth-section">
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 280px;" class="auth-box">
                    <h2>Sign In</h2>
                    <input type="text" id="login-ux" placeholder="UX Number (1-10 digits)" readonly>
                    <input type="password" id="login-pass" placeholder="Password (Numeric keypad)" readonly>
                    <button onclick="intentarLogin()">Enter</button>
                </div>
                <div style="flex: 1; min-width: 280px;" class="auth-box">
                    <h2>Register (20 UX Bonus)</h2>
                    <input type="text" id="reg-ux" placeholder="Desired UX Number" readonly>
                    <input type="password" id="reg-pass" placeholder="Unique Password" readonly>
                    <input type="text" id="reg-nickname" placeholder="Visible Nickname">
                    <button onclick="intentarRegistro()">Create Account</button>
                </div>
            </div>

            <!-- Secure Numeric Keypad -->
            <div style="margin-top: 20px; max-width: 300px; margin-left: auto; margin-right: auto;">
                <p style="text-align:center; font-size: 13px; margin-bottom: 5px; color:#cbd5e1;">Secure Numeric Keypad:</p>
                <div class="virtual-keypad">
                    <button class="key-btn" onclick="addNum('1')">1</button>
                    <button class="key-btn" onclick="addNum('2')">2</button>
                    <button class="key-btn" onclick="addNum('3')">3</button>
                    <button class="key-btn" onclick="addNum('4')">4</button>
                    <button class="key-btn" onclick="addNum('5')">5</button>
                    <button class="key-btn" onclick="addNum('6')">6</button>
                    <button class="key-btn" onclick="addNum('7')">7</button>
                    <button class="key-btn" onclick="addNum('8')">8</button>
                    <button class="key-btn" onclick="addNum('9')">9</button>
                    <button class="key-btn" onclick="addNum('0')">0</button>
                    <button class="key-btn" onclick="clearNum()" style="background:#b91c1c;">C</button>
                    <button class="key-btn" onclick="backNum()" style="background:#b45309;">⌫</button>
                </div>
            </div>
            <p id="auth-msg" style="text-align: center; color: #f43f5e; margin-top: 10px;"></p>
        </div>

        <!-- LIVE DASHBOARD -->
        <div id="dashboard-section" class="hidden dashboard-box">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 12px; border-radius: 8px;">
                <div>
                    <span id="user-info-text" style="font-weight: bold; color: #38bdf8;"></span> | 
                    UX Balance: <span id="user-balance" style="color: #4ade80; font-weight: bold;">0</span>
                </div>
                <button onclick="location.reload()" style="background: #dc2626; padding: 6px 12px; font-size: 14px;">Sign Out</button>
            </div>

            <!-- Admin Panel (UX 0) -->
            <div id="admin-panel" class="hidden" style="background: #334155; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <h3 style="color: #facc15;">Exclusive Admin Panel (UX 0)</h3>
                <input type="text" id="admin-target-ux" placeholder="Target UX">
                <input type="number" id="admin-amount" placeholder="Amount of UX to credit">
                <button onclick="enviarSaldoAdmin()" style="margin-top: 5px; background: #ca8a04;">Verify Payment & Credit Balance</button>
                <p id="admin-response" style="font-size: 13px; color: #fde047; margin-top: 5px;"></p>
            </div>

            <!-- Real-Time Live Chat -->
            <div style="margin-top: 15px;">
                <h3>Live Real-Time Chat (Instantaneous Transmission)</h3>
                <input type="text" id="chat-destinatario" placeholder="Recipient UX">
                <div id="chat-mensajes" style="height: 180px; background: #020617; border: 1px solid #334155; border-radius: 8px; overflow-y: auto; padding: 10px; margin: 10px 0;"></div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="chat-texto" placeholder="Type your live message..." style="flex: 1; min-width: 200px;">
                    <input type="file" id="chat-foto" accept="image/*" style="display: none;" onchange="enviarFoto(this)">
                    <button onclick="document.getElementById('chat-foto').click()" style="background: #475569;">📷 Photo</button>
                    <button onclick="enviarMensajeText()">Send Live</button>
                </div>
            </div>

            <!-- 24/7 Permanent Mailbox -->
            <div style="margin-top: 15px;">
                <h3>24/7 Permanent Mailbox</h3>
                <div id="buzon-contenido" style="background: #020617; padding: 10px; border-radius: 8px; min-height: 60px; font-size: 14px; color: #cbd5e1; max-height: 100px; overflow-y: auto;">No stored messages.</div>
            </div>

            <!-- UX Launch Plans -->
            <div class="wallet-section">
                <h3>UX Launch Plans</h3>
                <p style="font-size: 13px; margin-bottom: 10px; color: #94a3b8;">
                    Official BTC Wallet: <code style="color: #f59e0b; word-break: break-all;">bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s</code><br>
                    SOL: <code style="word-break: break-all;">F66a36aKwwvZaaaCSTyfWja4P2dNMmYHK7W2nMBVm6h1</code> | ETH: <code style="word-break: break-all;">0x4ABCf532fed9D9CFD0d3C4654cDFB56D02cFF21c</code><br>
                    Send receipt & UX to: <b style="color: #38bdf8;">po80payments@gmail.com</b>
                </p>
                <ul style="font-size: 14px; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <li>🔹 1,200 UX - 6.99 USD</li>
                    <li>🔹 2,500 UX - 13.99 USD</li>
                    <li>🔹 5,000 UX - 25.99 USD</li>
                    <li>🔹 10,000 UX - 49.99 USD</li>
                    <li>🔹 50,000 UX - 199.99 USD</li>
                    <li>🔹 100,666 UX - 266.99 USD</li>
                </ul>
            </div>
        </div>
    </div>

    <footer>
        <p><b>Pleniux.com</b> is fully built live with high security systems, zero mockups, and true real-time communication.</p>
        <p>Creator: <span class="founder">Jhon Gonzales</span> (known as <span class="founder">Lenox JG</span>).</p>
        <p style="margin-top: 5px; color: #64748b;">© 2026 Pleniux.com - Your security comes first.</p>
    </footer>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let activeInput = 'login-ux';

        ['login-ux', 'login-pass', 'reg-ux', 'reg-pass'].forEach(id => {
            document.getElementById(id).addEventListener('focus', () => { activeInput = id; });
        });

        function addNum(num) { const el = document.getElementById(activeInput); if (el) el.value += num; }
        function clearNum() { const el = document.getElementById(activeInput); if (el) el.value = ''; }
        function backNum() { const el = document.getElementById(activeInput); if (el) el.value = el.value.slice(0, -1); }

        function intentarRegistro() {
            socket.emit('registrar', {
                ux: document.getElementById('reg-ux').value,
                password: document.getElementById('reg-pass').value,
                nickname: document.getElementById('reg-nickname').value
            });
        }

        function intentarLogin() {
            socket.emit('login', {
                ux: document.getElementById('login-ux').value,
                password: document.getElementById('login-pass').value
            });
        }

        socket.on('error_auth', (msg) => { document.getElementById('auth-msg').innerText = msg; });
        socket.on('exito_auth', (msg) => { document.getElementById('auth-msg').style.color = '#4ade80'; document.getElementById('auth-msg').innerText = msg; });
        
        socket.on('login_exitoso', (data) => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-info-text').innerText = data.nickname + " (UX: " + data.ux + ")";
            document.getElementById('user-balance').innerText = data.balance;
            if (data.isAdmin) document.getElementById('admin-panel').classList.remove('hidden');
        });

        socket.on('actualizar_balance', (newBalance) => {
            document.getElementById('user-balance').innerText = newBalance;
        });

        socket.on('sesion_expirada', (msg) => {
            alert(msg);
            location.reload();
        });

        function enviarMensajeText() {
            const dest = document.getElementById('chat-destinatario').value;
            const texto = document.getElementById('chat-texto').value;
            if (!dest || !texto) return;
            socket.emit('enviar_mensaje', { destinatarioUx: dest, contenido: texto, tipo: 'texto' });
            document.getElementById('chat-texto').value = '';
        }

        function enviarFoto(input) {
            const dest = document.getElementById('chat-destinatario').value;
            if (!dest || !input.files[0]) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                socket.emit('enviar_mensaje', { destinatarioUx: dest, contenido: e.target.result, tipo: 'foto' });
            };
            reader.readAsDataURL(input.files[0]);
        }

        socket.on('recibir_mensaje', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 120px; border-radius: 6px;">' : data.contenido;
            box.innerHTML += '<div style="margin-bottom: 6px; color: #38bdf8;"><b>[' + data.de + ']:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('mensaje_enviado', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 120px; border-radius: 6px;">' : data.contenido;
            box.innerHTML += '<div style="margin-bottom: 6px; color: #4ade80;"><b>[You]:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('cargar_buzon', (mails) => {
            const box = document.getElementById('buzon-contenido');
            if (mails.length > 0) {
                box.innerHTML = mails.map(m => '<div style="border-bottom:1px solid #334155; padding:4px 0;">• ' + m.content + ' <span style="font-size:10px; color:#94a3b8;">(' + m.timestamp + ')</span></div>').join('');
            }
        });

        function enviarSaldoAdmin() {
            socket.emit('admin_recargar', {
                targetUx: document.getElementById('admin-target-ux').value,
                cantidad: document.getElementById('admin-amount').value
            });
        }
        socket.on('admin_respuesta', (res) => {
            document.getElementById('admin-response').innerText = res;
        });
    </script>
</body>
</html>`);
});

const activeSessions = new Map();

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;

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

    socket.on('login', (data) => {
        const { ux, password } = data;
        db.get(`SELECT * FROM users WHERE ux = ? AND password = ?`, [ux, password], (err, user) => {
            if (!user) return socket.emit('error_auth', 'Incorrect UX or password.');

            activeSessions.set(socket.id, ux);
            socket.ux = ux;

            db.all(`SELECT * FROM mailbox WHERE recipient = ?`, [ux], (err, mailRows) => {
                socket.emit('cargar_buzon', mailRows || []);
            });

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
