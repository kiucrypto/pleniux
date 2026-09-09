const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7 // Límite seguro de 10MB para fotos fluidas
});

app.use(express.json({ limit: '10mb' }));

// Base de datos SQLite persistente
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
        sender TEXT,
        recipient TEXT,
        content TEXT,
        type TEXT DEFAULT 'texto',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Administrador principal (UX 0)
    db.get(`SELECT * FROM users WHERE ux = '0'`, (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (ux, password, nickname, balance, ip) VALUES ('0', '197126', 'Founder (Jhon Gonzales)', 999999, 'admin_system')`);
        }
    });
});

// Interfaz con rediseño visual moderno, tipografía elegante y puntos neón más activos
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Pleniux.com - Next-Gen Ecosystem</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
        
        body { 
            background: #030712;
            color: #f1f5f9; 
            min-height: 100vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            padding: 16px;
            overflow-x: hidden;
            position: relative;
        }

        #neon-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .container { 
            position: relative;
            z-index: 1;
            max-width: 800px; 
            margin: 20px auto; 
            padding: 24px; 
            background: rgba(10, 15, 30, 0.75); 
            backdrop-filter: blur(25px); 
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(56, 189, 248, 0.2); 
            border-radius: 24px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1); 
            width: 100%; 
        }

        h1 { 
            text-align: center; 
            background: linear-gradient(135deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 24px; 
            font-size: 32px; 
            font-weight: 800;
            letter-spacing: 1.5px; 
            text-transform: uppercase; 
        }

        h2 { 
            color: #38bdf8; 
            font-size: 16px; 
            margin-bottom: 12px; 
            font-weight: 700;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .auth-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media(min-width: 600px) { .auth-grid { grid-template-columns: 1fr 1fr; } }

        .auth-box, .dashboard-box { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            background: rgba(15, 23, 42, 0.65); 
            padding: 20px; 
            border-radius: 18px; 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        input, button { 
            padding: 14px 16px; 
            border-radius: 12px; 
            border: 1px solid rgba(51, 65, 85, 0.8); 
            background: rgba(2, 6, 23, 0.9); 
            color: #fff; 
            font-size: 14px; 
            outline: none; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            width: 100%; 
        }

        input {
            font-family: 'Outfit', sans-serif;
        }

        input:focus { 
            border-color: #38bdf8; 
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.2); 
            background: rgba(15, 23, 42, 0.95);
        }

        button { 
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); 
            cursor: pointer; 
            font-weight: 700; 
            border: none; 
            box-shadow: 0 4px 16px rgba(2, 132, 199, 0.4);
            letter-spacing: 0.5px;
        }

        button:hover { 
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
        }

        button:active { transform: translateY(0); }

        .hidden { display: none !important; }

        .wallet-section { 
            margin-top: 20px; 
            padding: 20px; 
            background: rgba(10, 15, 30, 0.85); 
            border-radius: 18px; 
            border: 1px solid rgba(56, 189, 248, 0.3); 
        }

        .crypto-box {
            background: rgba(2, 6, 23, 0.95);
            padding: 12px 14px;
            border-radius: 10px;
            margin-bottom: 10px;
            font-size: 12px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            word-break: break-all;
            font-family: 'JetBrains Mono', monospace;
        }

        footer { 
            position: relative;
            z-index: 1;
            text-align: center; 
            padding: 20px; 
            font-size: 13px; 
            color: #94a3b8; 
            line-height: 1.6; 
        }

        footer .founder { color: #38bdf8; font-weight: 600; }

        .chat-container { 
            height: 220px; 
            background: rgba(2, 6, 23, 0.95); 
            border: 1px solid rgba(51, 65, 85, 0.8); 
            border-radius: 12px; 
            overflow-y: auto; 
            padding: 12px; 
            margin: 8px 0; 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
            font-size: 13px;
        }

        .btn-action {
            padding: 10px 16px;
            font-size: 13px;
            border-radius: 10px;
            width: auto;
        }

        .dashboard-box {
            gap: 16px;
        }
    </style>
</head>
<body>
    <canvas id="neon-canvas"></canvas>

    <div class="container" id="app">
        <h1>Pleniux.com</h1>

        <!-- AUTH SECTION -->
        <div id="auth-section">
            <div class="auth-grid">
                <!-- Sign In -->
                <div class="auth-box">
                    <h2>🔐 Sign In</h2>
                    <input type="tel" id="login-ux" placeholder="UX Number" inputmode="numeric" pattern="[0-9]*">
                    <input type="password" id="login-pass" placeholder="Password">
                    <button onclick="intentarLogin()">Enter System</button>
                </div>
                <!-- Register -->
                <div class="auth-box">
                    <h2>🚀 Register (20 UX Bonus)</h2>
                    <input type="tel" id="reg-ux" placeholder="Desired UX Number" inputmode="numeric" pattern="[0-9]*">
                    <input type="password" id="reg-pass" placeholder="Password">
                    <input type="text" id="reg-nickname" placeholder="Visible Nickname">
                    <button onclick="intentarRegistro()" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 16px rgba(22, 163, 74, 0.4);">Create Account</button>
                </div>
            </div>
            <p id="auth-msg" style="text-align: center; color: #f43f5e; margin-top: 16px; font-size: 13px; font-weight: 600;"></p>
        </div>

        <!-- LIVE DASHBOARD -->
        <div id="dashboard-section" class="hidden dashboard-box">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.7); padding: 12px 18px; border-radius: 12px; font-size: 13px; border: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <span id="user-info-text" style="font-weight: 700; color: #38bdf8;"></span> | 
                    Balance: <span id="user-balance" style="color: #4ade80; font-weight: 700;">0</span> UX
                </div>
                <button onclick="location.reload()" class="btn-action" style="background: #dc2626; box-shadow: none; padding: 6px 12px;">Sign Out</button>
            </div>

            <!-- Admin Panel (UX 0) -->
            <div id="admin-panel" class="hidden" style="background: rgba(202, 138, 4, 0.1); border: 1px solid rgba(202, 138, 4, 0.3); padding: 14px; border-radius: 12px;">
                <h3 style="color: #facc15; margin-bottom: 8px; font-size: 14px; font-weight: 700;">⚡ Admin Panel (UX 0)</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="tel" id="admin-target-ux" placeholder="Target UX" style="flex: 1; font-size: 13px;" inputmode="numeric">
                    <input type="number" id="admin-amount" placeholder="Amount" style="flex: 1; font-size: 13px;">
                    <button onclick="enviarSaldoAdmin()" class="btn-action" style="background: #ca8a04;">Credit</button>
                </div>
                <p id="admin-response" style="font-size: 12px; color: #fde047; margin-top: 8px;"></p>
            </div>

            <!-- Real-Time Live Chat -->
            <div>
                <h2>💬 Live Real-Time Chat</h2>
                <input type="tel" id="chat-destinatario" placeholder="Recipient UX Number" style="margin-bottom: 8px; font-size: 13px;" inputmode="numeric">
                <div id="chat-mensajes" class="chat-container"></div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="chat-texto" placeholder="Type message..." style="flex: 1; font-size: 13px;" onkeydown="if(event.key==='Enter') enviarMensajeText()">
                    <input type="file" id="chat-foto" accept="image/*" style="display: none;" onchange="enviarFoto(this)">
                    <button onclick="document.getElementById('chat-foto').click()" class="btn-action" style="background: #475569;" title="Send Photo">📷</button>
                    <button onclick="enviarMensajeText()" class="btn-action">Send</button>
                </div>
            </div>

            <!-- 24/7 Permanent Mailbox -->
            <div>
                <h2>📥 24/7 Permanent Mailbox</h2>
                <div id="buzon-contenido" style="background: rgba(2, 6, 23, 0.95); padding: 12px; border-radius: 12px; min-height: 60px; font-size: 13px; color: #cbd5e1; max-height: 160px; overflow-y: auto; border: 1px solid rgba(51, 65, 85, 0.8);">No stored messages.</div>
            </div>

            <!-- UX Launch Plans & Clear Wallet Info -->
            <div class="wallet-section">
                <h2>💎 UX Launch Plans & Payment Wallets</h2>
                <p style="font-size: 12px; margin-bottom: 12px; color: #94a3b8; line-height: 1.5;">
                    Send your payment to one of the addresses below, then forward your receipt to <b style="color: #38bdf8;">po80payments@gmail.com</b>
                </p>
                
                <div class="crypto-box">
                    <strong style="color: #f59e0b;">Bitcoin (BTC):</strong><br>
                    <code>bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s</code>
                </div>
                <div class="crypto-box">
                    <strong style="color: #38bdf8;">Solana (SOL):</strong><br>
                    <code>F66a36aKwwvZaaaCSTyfWja4P2dNMmYHK7W2nMBVm6h1</code>
                </div>
                <div class="crypto-box">
                    <strong style="color: #a855f7;">Ethereum (ETH):</strong><br>
                    <code>0x4ABCf532fed9D9CFD0d3C4654cDFB56D02cFF21c</code>
                </div>

                <ul style="font-size: 13px; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; color: #e2e8f0; margin-top: 14px;">
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 1,200 UX - $6.99</li>
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 2,500 UX - $13.99</li>
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 5,000 UX - $25.99</li>
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 10,000 UX - $49.99</li>
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 50,000 UX - $199.99</li>
                    <li style="background: rgba(15,23,42,0.6); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">🔹 100,666 UX - $266.99</li>
                </ul>
            </div>
        </div>
    </div>

    <footer>
        <p><b>Pleniux.com</b> | Secure Ecosystem & Real-Time Communication</p>
        <p>Creator: <span class="founder">Jhon Gonzales</span> (<span class="founder">Lenox JG</span>)</p>
    </footer>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        // Animación de Puntos Neón Ultra-Activos y Dinámicos
        const canvas = document.getElementById('neon-canvas');
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drops = [];
        const numDrops = 130; // Mayor densidad de puntos en movimiento
        const colors = ['#38bdf8', '#818cf8', '#4ade80', '#a855f7', '#ec4899', '#facc15', '#06b6d4'];

        for (let i = 0; i < numDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2.8 + 1,
                speed: Math.random() * 4.5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.85 + 0.15,
                pulse: Math.random() * 0.06 + 0.02
            });
        }

        function animateNeon() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            drops.forEach(drop => {
                ctx.beginPath();
                ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
                ctx.fillStyle = drop.color;
                ctx.globalAlpha = drop.alpha;
                ctx.shadowBlur = 14; // Brillo neón profundo
                ctx.shadowColor = drop.color;
                ctx.fill();
                ctx.closePath();

                drop.y += drop.speed;
                drop.alpha += Math.sin(Date.now() * drop.pulse) * 0.025;

                if (drop.y > canvas.height) {
                    drop.y = -10;
                    drop.x = Math.random() * canvas.width;
                    drop.speed = Math.random() * 4.5 + 2;
                }
            });

            requestAnimationFrame(animateNeon);
        }
        animateNeon();

        // Socket.io Client Logic
        const socket = io();

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
        socket.on('exito_auth', (msg) => { 
            const msgEl = document.getElementById('auth-msg');
            msgEl.style.color = '#4ade80'; 
            msgEl.innerText = msg; 
        });
        
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
            const file = input.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
                    socket.emit('enviar_mensaje', { destinatarioUx: dest, contenido: compressedDataUrl, tipo: 'foto' });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        socket.on('recibir_mensaje', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 140px; border-radius: 8px; margin-top: 4px; display: block;">' : escapeHtml(data.contenido);
            box.innerHTML += '<div style="color: #38bdf8;"><b>[' + data.de + ']:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('mensaje_enviado', (data) => {
            const box = document.getElementById('chat-mensajes');
            let contentHtml = data.tipo === 'foto' ? '<img src="' + data.contenido + '" style="max-width: 140px; border-radius: 8px; margin-top: 4px; display: block;">' : escapeHtml(data.contenido);
            box.innerHTML += '<div style="color: #4ade80;"><b>[You]:</b> ' + contentHtml + '</div>';
            box.scrollTop = box.scrollHeight;
        });

        socket.on('cargar_buzon', (mails) => {
            const box = document.getElementById('buzon-contenido');
            if (mails && mails.length > 0) {
                box.innerHTML = mails.map((m, index) => \`
                    <div style="border-bottom: 1px solid rgba(51,65,85,0.4); padding: 8px 0; display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <div>
                                <b style="color: #38bdf8;">[\${m.sender}]:</b> \${m.type === 'foto' ? '📷 [Photo Received]' : escapeHtml(m.content)} 
                                <span style="font-size: 10px; color: #94a3b8;">(\${m.timestamp})</span>
                            </div>
                            <button onclick="toggleReplyBox(\` + index + \`)" class="btn-action" style="padding: 4px 10px; font-size: 11px;">Reply</button>
                        </div>
                        <div id="reply-box-\${index}" class="hidden" style="display: flex; gap: 6px; margin-top: 4px;">
                            <input type="text" id="reply-text-\${index}" placeholder="Reply..." style="font-size: 12px; padding: 8px;">
                            <button onclick="enviarReply('\${m.sender}', \` + index + \`)" class="btn-action" style="background: #16a34a; padding: 8px 12px; font-size: 12px;">Send</button>
                        </div>
                    </div>
                \`).join('');
            } else {
                box.innerHTML = 'No stored messages.';
            }
        });

        function toggleReplyBox(index) {
            const replyBox = document.getElementById('reply-box-' + index);
            if (replyBox.classList.contains('hidden')) {
                replyBox.classList.remove('hidden');
                document.getElementById('reply-text-' + index).focus();
            } else {
                replyBox.classList.add('hidden');
            }
        }

        function enviarReply(destUx, index) {
            const texto = document.getElementById('reply-text-' + index).value;
            if (!texto) return;
            socket.emit('enviar_mensaje', { destinatarioUx: destUx, contenido: texto, tipo: 'texto' });
            document.getElementById('reply-text-' + index).value = '';
            document.getElementById('reply-box-' + index).classList.add('hidden');
        }

        function escapeHtml(text) {
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

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
        if (!data) return;
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
        if (!data) return;
        const { ux, password } = data;
        db.get(`SELECT * FROM users WHERE ux = ? AND password = ?`, [ux, password], (err, user) => {
            if (!user) return socket.emit('error_auth', 'Incorrect UX or password.');

            activeSessions.set(socket.id, ux);
            socket.ux = ux;

            db.all(`SELECT * FROM mailbox WHERE recipient = ? ORDER BY id DESC`, [ux], (err, mailRows) => {
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
        if (!data) return;
        const { destinatarioUx, contenido, tipo } = data;
        const remitenteUx = socket.ux;
        if (!remitenteUx) return;

        db.get(`SELECT * FROM users WHERE ux = ?`, [destinatarioUx], (err, targetUser) => {
            if (!targetUser) return;

            db.run(`INSERT INTO messages (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [remitenteUx, destinatarioUx, contenido, tipo], function(err) {
                if (err) return;
                const msgData = { id: this.lastID, de: remitenteUx, para: destinatarioUx, contenido, tipo };

                db.run(`INSERT INTO mailbox (sender, recipient, content, type) VALUES (?, ?, ?, ?)`, [remitenteUx, destinatarioUx, contenido, tipo], () => {
                    for (let [sId, sUx] of activeSessions.entries()) {
                        if (sUx === destinatarioUx) {
                            io.to(sId).emit('recibir_mensaje', msgData);
                            db.all(`SELECT * FROM mailbox WHERE recipient = ? ORDER BY id DESC`, [destinatarioUx], (err, mailRows) => {
                                io.to(sId).emit('cargar_buzon', mailRows || []);
                            });
                        }
                    }
                    socket.emit('mensaje_enviado', msgData);
                });
            });
        });
    });

    socket.on('admin_recargar', (data) => {
        if (socket.ux !== '0' || !data) return;
        const { targetUx, cantidad } = data;
        db.run(`UPDATE users SET balance = balance + ? WHERE ux = ?`, [Number(cantidad), targetUx], function(err) {
            if (this.changes > 0) {
                socket.emit('admin_respuesta', `Successfully credited ${cantidad} UX to ${targetUx}`);
                for (let [sId, sUx] of activeSessions.entries()) {
                    if (sUx === targetUx) {
                        db.get(`SELECT balance FROM users WHERE ux = ?`, [targetUx], (err, row) => {
                            if(row) io.to(sId).emit('actualizar_balance', row.balance);
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
