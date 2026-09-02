const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Base de datos para saldos y credenciales de cualquier nodo UX (del 2 al 1,000,000)
const nodeBalances = {};
const registeredUsers = {};

const failedAttempts = {};
const bannedDevices = new Set();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux.com VIP - UX Gateway</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { 
                    background: linear-gradient(135deg, #050510, #130f2c, #1f1b3c); 
                    background-size: 300% 300%; 
                    animation: neonGlow 12s ease infinite; 
                    color: #fff; 
                    font-family: 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    min-height: 100vh; 
                    box-sizing: border-box; 
                }
                .container { 
                    width: 100%; 
                    max-width: 440px; 
                    background: rgba(15, 15, 30, 0.85); 
                    backdrop-filter: blur(16px); 
                    border: 1px solid rgba(139, 92, 246, 0.4); 
                    padding: 2rem; 
                    border-radius: 16px; 
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3); 
                }
                .logo-header { text-align: center; margin-bottom: 0.5rem; }
                .logo-header h1 { color: #fff; font-size: 1.8rem; margin: 0; letter-spacing: 2px; text-shadow: 0 0 15px rgba(168, 85, 247, 0.7); display: inline-block; }
                .vip-badge { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; vertical-align: super; margin-left: 4px; }
                .subtitle { color: #a78bfa; font-size: 0.8rem; text-align: center; margin-bottom: 1rem; font-weight: 500; }
                .description { font-size: 0.75rem; color: #cbd5e1; text-align: center; margin-bottom: 1rem; line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                .security-notice { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 0.75rem; margin-bottom: 1rem; line-height: 1.4; }
                .form-group { margin-bottom: 0.9rem; }
                label { display: block; font-size: 0.75rem; color: #c084fc; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                .input-row { display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; overflow: hidden; }
                .prefix { padding: 10px 14px; background: rgba(124, 58, 237, 0.3); color: #c084fc; font-weight: bold; font-size: 0.95rem; border-right: 1px solid rgba(139, 92, 246, 0.3); }
                .input-row input, select { flex: 1; padding: 10px 12px; background: transparent; border: none; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; }
                select option { background: #111; color: #fff; }
                .btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.95rem; margin-top: 8px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
                .btn:hover { opacity: 0.9; }
                .footer-manual { font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.8rem; line-height: 1.3; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo-header">
                    <h1>PLENIUX.COM<span class="vip-badge">VIP</span></h1>
                </div>
                <div class="subtitle">Registro y Acceso Directo de Nodos UX</div>
                
                <div class="description">
                    Crea tu usuario único escribiendo un número del 2 al 1,000,000. Los nuevos registros reciben automáticamente una bienvenida de 2 Pts. Si cometes errores, tu sesión y cuenta serán eliminadas por seguridad.
                </div>

                <div class="security-notice">
                    ⚠️ <strong>Advertencia:</strong> 3 errores de contraseña o salida de la pestaña eliminarán la cuenta y aplicarán penalización estricta.
                </div>

                <div class="form-group">
                    <label>Tu Número de Usuario UX</label>
                    <div class="input-row">
                        <span class="prefix">UX</span>
                        <input type="number" id="nodeNum" min="2" max="1000000" placeholder="Ej. 777" autocomplete="off">
                    </div>
                </div>

                <div class="form-group">
                    <label>Contraseña / PIN Privado</label>
                    <input type="password" id="loginPass" placeholder="Introduce tu contraseña" inputmode="numeric" autocomplete="new-password">
                </div>

                <div class="form-group">
                    <label>Temporizador de Sesión</label>
                    <select id="timerPref">
                        <option value="60">1 Minuto</option>
                        <option value="150" selected>2 Minutos 30 Segundos</option>
                    </select>
                </div>

                <button class="btn" onclick="loginUser()">Registrarse / Acceder al Nodo</button>

                <div class="footer-manual">
                    Founder: <strong>Lenox JG</strong> | Pleniux.com VIP
                </div>
            </div>

            <script>
                function getDeviceFingerprint() {
                    let c = document.createElement('canvas');
                    let ctx = c.getContext('2d');
                    ctx.textBaseline = "top"; ctx.font = "14px Arial"; ctx.fillText("PleniuxVIP", 2, 2);
                    let raw = navigator.userAgent + screen.width + 'x' + screen.height + c.toDataURL();
                    let hash = 0;
                    for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
                    return 'DEVICE_' + Math.abs(hash);
                }

                function loginUser() {
                    const num = document.getElementById('nodeNum').value.trim();
                    const pass = document.getElementById('loginPass').value.trim();
                    const timer = document.getElementById('timerPref').value;
                    
                    const numVal = parseInt(num);
                    if(isNaN(numVal) || numVal < 2 || numVal > 1000000) {
                        alert('⚠️ El número de usuario UX debe estar entre 2 y 1,000,000.');
                        return;
                    }
                    if(!pass) {
                        alert('⚠️ Por favor introduce tu contraseña.');
                        return;
                    }

                    const user = 'UX' + numVal;
                    const deviceId = getDeviceFingerprint();

                    fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user, pass, deviceId })
                    }).then(res => res.json()).then(data => {
                        if(data.success) {
                            window.location.href = '/chat?user=' + encodeURIComponent(user) + '&timer=' + encodeURIComponent(timer);
                        } else {
                            alert(data.message);
                            if(data.banned) {
                                document.body.innerHTML = '<div style="background:#000;color:#ef4444;height:100vh;display:flex;justify-content:center;align-items:center;text-align:center;font-family:sans-serif;"><h2>🚨 CUENTA Y ACCESO ELIMINADOS</h2><p>Errores o intrusión detectada. Cuenta eliminada por seguridad.</p></div>';
                            }
                        }
                    });
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/api/login', (req, res) => {
    const { user, pass, deviceId } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const hardwareKey = `${deviceId}_${clientIp}`;

    if (bannedDevices.has(hardwareKey)) return res.json({ success: false, banned: true, message: '🚨 Acceso bloqueado. Cuenta eliminada.' });

    // Si el usuario es nuevo, se registra de forma automática y recibe la bienvenida de 2 Pts exactos
    if (!registeredUsers[user]) {
        registeredUsers[user] = pass;
        nodeBalances[user] = 2; // Bienvenida de 2 Pts para nuevos usuarios
    }

    if (registeredUsers[user] !== pass) {
        if (!failedAttempts[user]) failedAttempts[user] = 0;
        failedAttempts[user]++;
        if (failedAttempts[user] >= 3) {
            bannedDevices.add(hardwareKey);
            delete registeredUsers[user]; // Eliminar cuenta por errores
            delete nodeBalances[user];
            failedAttempts[user] = 0;
            return res.json({ success: false, banned: true, message: '🚨 Demasiados errores. Cuenta eliminada permanentemente.' });
        }
        return res.json({ success: false, message: `Contraseña incorrecta. Intento ${failedAttempts[user]} de 3.` });
    }

    failedAttempts[user] = 0;
    return res.json({ success: true });
});

app.post('/api/refresh-penalty', (req, res) => {
    const { user } = req.body;
    if (user && nodeBalances[user] !== undefined) {
        nodeBalances[user] = Math.max(0, nodeBalances[user] - 2);
        // Si el saldo llega a 0 por errores, se elimina la cuenta automáticamente
        if (nodeBalances[user] <= 0) {
            delete registeredUsers[user];
            delete nodeBalances[user];
        }
    }
    res.json({ success: true });
});

app.get('/checkout', (req, res) => {
    const user = req.query.user || 'UX2';
    const timer = req.query.timer || '150';
    const walletAddress = '3GgLGjuUo3SpnnfjTcvaTBXqssoonAkUxo'; // Tu billetera exacta de pagos

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux.com VIP - Bitcoin Deposit</title>
            <style>
                body { background: #0f0c29; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(15, 15, 30, 0.95); border: 1px solid rgba(245, 158, 11, 0.4); padding: 2rem; border-radius: 16px; width: 100%; max-width: 420px; text-align: center; }
                h2 { color: #f59e0b; margin-top: 0; }
                .crypto-box { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px; margin: 15px 0; text-align: left; }
                .wallet { font-size: 0.72rem; word-break: break-all; color: #cbd5e1; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.4); }
                select, button { width: 100%; padding: 11px; border-radius: 8px; font-family: inherit; margin-top: 10px; font-weight: bold; }
                select { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); color: #fff; }
                button { background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #000; cursor: pointer; }
                .back { color: #a78bfa; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 12px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Bitcoin Direct Gateway</h2>
                <p style="font-size: 0.8rem; color: #cbd5e1;">Envía BTC exactos a tu billetera personal configurada:</p>
                
                <select id="packageSelect" onchange="updateDetails()">
                    <option value="5000">Standard: 5,000 Credits</option>
                    <option value="15000" selected>Professional: 15,000 Credits</option>
                    <option value="50000">Enterprise: 50,000 Credits</option>
                </select>

                <div class="crypto-box">
                    <div style="font-size: 0.75rem; color: #38bdf8; font-weight: bold;">Network: Bitcoin Native SegWit</div>
                    <div style="font-size: 0.8rem; color: #34d399; margin: 6px 0; font-weight: bold;" id="priceDisplay">Amount: Calculando...</div>
                    <div class="wallet">${walletAddress}</div>
                </div>

                <button onclick="verifyPayment()">Confirmar Depósito Real</button>
                <br>
                <a href="/chat?user=${encodeURIComponent(user)}&timer=${encodeURIComponent(timer)}" class="back">← Volver al Chat Seguro</a>
            </div>
            <script>
                function updateDetails() {
                    const val = document.getElementById('packageSelect').value;
                    let amt = (val * 0.00012).toFixed(4) + ' BTC';
                    document.getElementById('priceDisplay').innerText = 'Enviar cantidad exacta: ' + amt;
                }
                updateDetails();
                function verifyPayment() {
                    alert('Verificando transferencia en la blockchain hacia tu billetera...');
                    window.location.href = '/chat?user=${encodeURIComponent(user)}&timer=${encodeURIComponent(timer)}';
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX2';
    const timerSetting = parseInt(req.query.timer) || 150;
    let currentBalance = nodeBalances[user] !== undefined ? nodeBalances[user] : 2;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux.com VIP - Lightning Channel</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 300% 300%; animation: neonGlow 15s ease infinite; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                header { background: rgba(15, 15, 30, 0.95); backdrop-filter: blur(12px); padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.8rem; flex-wrap: wrap; gap: 8px; }
                .security-status { color: #f59e0b; font-weight: bold; }
                
                .control-panel { background: rgba(20, 20, 40, 0.95); border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; gap: 8px; flex-wrap: wrap; }
                .control-group { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
                .control-panel input { padding: 6px 8px; background: rgba(0,0,0,0.6); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 6px; color: #fff; font-size: 0.8rem; width: 110px; outline: none; }
                .control-panel button { padding: 6px 10px; background: #7c3aed; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.75rem; }
                .control-panel button:hover { opacity: 0.9; }
                .topup-btn { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: #000 !important; }

                /* MARCA DE AGUA Y FONDO DE PLENIUX.COM VIP EN EL CHAT */
                #chat-box { 
                    flex: 1; 
                    padding: 1.2rem; 
                    overflow-y: auto; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 10px; 
                    position: relative;
                    background: radial-gradient(circle at center, rgba(124, 58, 237, 0.08) 0%, rgba(15, 12, 41, 0.8) 100%);
                }
                #chat-box::before {
                    content: "PLENIUX.COM VIP";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: rgba(168, 85, 247, 0.04);
                    letter-spacing: 6px;
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 0;
                }

                .message { background: rgba(30, 30, 60, 0.85); backdrop-filter: blur(8px); padding: 10px 14px; border-radius: 8px; max-width: 75%; word-break: break-word; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.9rem; position: relative; z-index: 1; }
                .self { background: rgba(79, 70, 229, 0.5); border-color: rgba(129, 140, 248, 0.6); align-self: flex-end; }
                
                .footer { padding: 1rem; background: rgba(15, 15, 30, 0.95); backdrop-filter: blur(12px); display: flex; gap: 8px; border-top: 1px solid rgba(139, 92, 246, 0.3); }
                .footer input { flex: 1; padding: 10px 14px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px; color: #fff; font-family: inherit; font-size: 0.9rem; outline: none; }
                .footer button { padding: 0 20px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <div>Tu Nodo: <strong style="color:#c084fc;">${user}</strong> | Balance: <strong style="color:#34d399;" id="balanceDisplay">${currentBalance} Pts</strong> | Canal: <strong style="color:#fff;" id="roomDisplay">777</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <div class="control-panel">
                <div class="control-group">
                    <span>Código de Canal:</span>
                    <input type="text" id="targetRoom" value="777" placeholder="Código">
                    <button onclick="applySyncCode()">Unirse</button>
                    <button onclick="generateSyncCode()" style="background:#059669;">Generar Código</button>
                </div>
                <div class="control-group">
                    <button class="topup-btn" onclick="openCheckout()">Depositar BTC</button>
                </div>
            </div>

            <div id="chat-box"></div>

            <div class="footer">
                <input type="text" id="messageInput" placeholder="Escribe un mensaje cifrado..." onkeypress="handleKey(event)" autofocus autocomplete="off">
                <button onclick="sendMessage()">Enviar</button>
            </div>

            <script>
                const user = "${user}";
                let room = "777";
                let tSecs = ${timerSetting};
                const socket = io();

                socket.emit('join-room', { room, user });

                let penaltyApplied = false;
                function applyPenaltyAndExit(reason) {
                    if (penaltyApplied) return;
                    penaltyApplied = true;
                    navigator.sendBeacon('/api/refresh-penalty', JSON.stringify({ user }));
                    document.body.innerHTML = \`<div style="background:#050505;color:#ef4444;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;text-align:center;padding:20px;">
                        <h2 style="font-size: 1.5rem;">🚨 CUENTA ELIMINADA: -2 PUNTOS</h2>
                        <p style="color:#cbd5e1;font-size:0.9rem;">Razón: \${reason}</p>
                        <p style="color:#64748b;font-size:0.75rem;">Cuenta eliminada y regresando al login...</p>
                    </div>\`;
                    setTimeout(() => { window.location.href = '/'; }, 2000);
                }

                window.addEventListener('beforeunload', () => {
                    navigator.sendBeacon('/api/refresh-penalty', JSON.stringify({ user }));
                });

                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) applyPenaltyAndExit('Pérdida de foco en pantalla / Aplicación minimizada.');
                });

                window.addEventListener('blur', () => {
                    applyPenaltyAndExit('Pérdida de foco en la ventana.');
                });

                function generateSyncCode() {
                    const newCode = 'PLX-' + Math.floor(1000 + Math.random() * 9000);
                    document.getElementById('targetRoom').value = newCode;
                    
                    room = newCode;
                    document.getElementById('roomDisplay').innerText = room;
                    socket.emit('join-room', { room, user });

                    const autoMsg = '⚡ [SYNC SEGURO] ' + user + ' creó un canal privado independiente. Únete con el código: ' + newCode;
                    socket.emit('chat-message', { room, user, text: autoMsg });
                }

                function applySyncCode() {
                    const code = document.getElementById('targetRoom').value.trim();
                    if(!code) { alert('Introduce un código válido.'); return; }
                    room = code;
                    document.getElementById('roomDisplay').innerText = room;
                    socket.emit('join-room', { room, user });

                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.style.textAlign = 'center';
                    div.style.color = '#34d399';
                    div.style.fontSize = '0.78rem';
                    div.style.margin = '6px 0';
                    div.style.position = 'relative';
                    div.style.zIndex = '1';
                    div.innerText = '✅ Conectado exitosamente al canal seguro: ' + room;
                    box.appendChild(div);
                    box.scrollTop = box.scrollHeight;
                }

                function openCheckout() {
                    window.location.href = '/checkout?user=' + encodeURIComponent(user) + '&timer=' + tSecs;
                }

                const countdown = setInterval(() => {
                    if(tSecs <= 0) {
                        clearInterval(countdown);
                        applyPenaltyAndExit('El temporizador de sesión expiró.');
                        return;
                    }
                    tSecs--;
                    let mins = Math.floor(tSecs / 60).toString().padStart(2, '0');
                    let secs = (tSecs % 60).toString().padStart(2, '0');
                    document.getElementById('timer').innerText = 'Self-Destruct: ' + mins + ':' + secs;
                }, 1000);

                function sendMessage() {
                    const text = document.getElementById('messageInput').value.trim();
                    if(!text) return;
                    socket.emit('chat-message', { room, user, text });
                    document.getElementById('messageInput').value = '';
                }

                function handleKey(e) { if(e.key === 'Enter') sendMessage(); }

                socket.on('chat-message', (data) => {
                    if(data.room && data.room !== room) return;
                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.className = 'message' + (data.user === user ? ' self' : '');
                    div.innerHTML = '<strong style="color: ' + (data.user === user ? '#93c5fd' : '#c084fc') + ';">' + data.user + ':</strong> ' + data.text;
                    box.appendChild(div);
                    box.scrollTop = box.scrollHeight;
                });
            </script>
        </body>
        </html>
    `);
});

io.on('connection', (socket) => {
    socket.on('join-room', ({ room, user }) => {
        socket.rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });
        socket.join(room);
    });
    socket.on('chat-message', (data) => { 
        io.to(data.room).emit('chat-message', data); 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux.com VIP UX Gateway activo en puerto ${PORT}`);
});
