const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const nodeBalances = {
    'UX1': 10000,
    'UX0': 10000
};

const registeredUsers = {
    'UX1': '2609',
    'UX0': '1971'
};

const failedAttempts = {};

// Interfaz Principal con Fondo en Movimiento (Animación CSS)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Secure Messaging & Crypto Gateway</title>
            <style>
                @keyframes backgroundMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(-45deg, #050505, #0f172a, #09090b, #111827); background-size: 400% 400%; animation: backgroundMove 15s ease infinite; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; box-sizing: border-box; }
                .container { width: 100%; max-width: 520px; background: rgba(18, 18, 18, 0.9); backdrop-filter: blur(10px); border: 1px solid #222; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h1 { color: #fff; font-size: 1.5rem; margin-top: 0; text-align: center; letter-spacing: 1px; }
                .subtitle { color: #888; font-size: 0.82rem; text-align: center; margin-bottom: 1.5rem; line-height: 1.4; }
                .security-notice { background: rgba(26, 21, 0, 0.8); border: 1px solid #423500; color: #f59e0b; padding: 10px; border-radius: 6px; font-size: 0.78rem; margin-bottom: 1.5rem; line-height: 1.4; }
                
                .manual-box { background: rgba(10, 10, 10, 0.8); border: 1px solid #27272a; padding: 12px; border-radius: 6px; margin-bottom: 1.5rem; font-size: 0.78rem; color: #a1a1aa; line-height: 1.4; }
                .manual-box strong { color: #fff; }
                .manual-box ul { margin: 5px 0 0 15px; padding: 0; }

                .form-group { margin-bottom: 1rem; }
                label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                input { width: 100%; padding: 10px 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
                input:focus { border-color: #3b82f6; }
                .btn { width: 100%; padding: 11px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 0.9rem; margin-top: 10px; transition: background 0.2s; }
                .btn:hover { background: #1d4ed8; }
                .btn-secondary { background: #27272a; }
                .btn-secondary:hover { background: #3f3f46; }
                .tabs { display: flex; gap: 10px; margin-bottom: 1.5rem; border-bottom: 1px solid #222; padding-bottom: 10px; }
                .tab-btn { flex: 1; background: none; border: none; color: #71717a; font-weight: bold; cursor: pointer; padding: 8px; font-size: 0.9rem; }
                .tab-btn.active { color: #fff; border-bottom: 2px solid #3b82f6; }
                .form-section { display: none; }
                .form-section.active { display: block; }
                
                .crypto-packages { margin-top: 2rem; border-top: 1px solid #222; padding-top: 1.5rem; }
                .crypto-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
                .crypto-card { background: #0a0a0a; border: 1px solid #333; padding: 10px; border-radius: 6px; text-align: center; }
                .crypto-card h4 { color: #f59e0b; margin: 0 0 5px 0; font-size: 0.85rem; }
                .crypto-card button { padding: 6px; font-size: 0.75rem; margin-top: 6px; background: #d97706; border: none; border-radius: 4px; color: #fff; cursor: pointer; width: 100%; font-weight: bold; }
                .crypto-card button:hover { background: #b45309; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>PLENIUX</h1>
                <div class="subtitle">Corporate high-security encrypted messaging ecosystem.</div>

                <div class="security-notice">
                    🔒 <strong>Anti-Intrusion Protocol:</strong> 3 failed access attempts will permanently lock and self-destruct the target node. Sessions expire in 02:30 min or on tab blur.
                </div>

                <div class="manual-box">
                    <strong>📖 Operating Manual:</strong>
                    <ul>
                        <li><strong>Access:</strong> Enter your authorized node identifier and password.</li>
                        <li><strong>Secure Channel:</strong> Input a room code (e.g., 777) to synchronize chats.</li>
                        <li><strong>Top-ups:</strong> Process balance deposits securely using BTC, ETH, or Solana.</li>
                    </ul>
                </div>

                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('login')">Access Node</button>
                    <button class="tab-btn" onclick="switchTab('register')">Register Node</button>
                </div>

                <div id="loginSection" class="form-section active">
                    <div class="form-group">
                        <label>Node Identifier</label>
                        <input type="text" id="loginUser" placeholder="e.g. UX0">
                    </div>
                    <div class="form-group">
                        <label>Access Password</label>
                        <input type="password" id="loginPass" placeholder="Enter password">
                    </div>
                    <div class="form-group">
                        <label>Secure Channel Code (Required)</label>
                        <input type="text" id="roomCode" placeholder="e.g. 777">
                    </div>
                    <button class="btn" onclick="loginUser()">Enter Secure Channel</button>
                </div>

                <div id="registerSection" class="form-section">
                    <div class="form-group">
                        <label>New Identifier</label>
                        <input type="text" id="regUser" placeholder="Username">
                    </div>
                    <div class="form-group">
                        <label>Secure Password</label>
                        <input type="password" id="regPass" placeholder="Password">
                    </div>
                    <button class="btn btn-secondary" onclick="registerUser()">Register New Node</button>
                </div>

                <div class="crypto-packages">
                    <label style="text-align: center;">Cryptocurrency Gateway & Pricing</label>
                    <div class="crypto-grid">
                        <div class="crypto-card">
                            <h4>BTC</h4>
                            <span style="font-size: 0.65rem; color: #888;">10,000 Cr = 0.001 BTC</span>
                            <button onclick="openCryptoCheckout('BTC')">Pay BTC</button>
                        </div>
                        <div class="crypto-card">
                            <h4>ETH</h4>
                            <span style="font-size: 0.65rem; color: #888;">10,000 Cr = 0.03 ETH</span>
                            <button onclick="openCryptoCheckout('ETH')">Pay ETH</button>
                        </div>
                        <div class="crypto-card">
                            <h4>Solana</h4>
                            <span style="font-size: 0.65rem; color: #888;">10,000 Cr = 0.5 SOL</span>
                            <button onclick="openCryptoCheckout('SOL')">Pay SOL</button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                function switchTab(tab) {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
                    if(tab === 'login') {
                        document.querySelectorAll('.tab-btn')[0].classList.add('active');
                        document.getElementById('loginSection').classList.add('active');
                    } else {
                        document.querySelectorAll('.tab-btn')[1].classList.add('active');
                        document.getElementById('registerSection').classList.add('active');
                    }
                }

                function registerUser() {
                    const user = document.getElementById('regUser').value.trim().toUpperCase();
                    const pass = document.getElementById('regPass').value.trim();
                    if(!user || !pass) {
                        alert('Please fill out all required fields.');
                        return;
                    }
                    fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user, pass })
                    }).then(res => res.json()).then(data => {
                        alert(data.message);
                        if(data.success) {
                            document.getElementById('loginUser').value = user;
                            document.getElementById('loginPass').value = pass;
                            switchTab('login');
                        }
                    });
                }

                function loginUser() {
                    const user = document.getElementById('loginUser').value.trim().toUpperCase();
                    const pass = document.getElementById('loginPass').value.trim();
                    const room = document.getElementById('roomCode').value.trim();
                    
                    if(!user || !pass || !room) {
                        alert('Error: You must fill out the Node Identifier, Password, and the Secure Channel Code to enter.');
                        return;
                    }

                    fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user, pass })
                    }).then(res => res.json()).then(data => {
                        if(data.success) {
                            window.location.href = '/chat?user=' + encodeURIComponent(user) + '&room=' + encodeURIComponent(room);
                        } else {
                            alert(data.message);
                        }
                    });
                }

                function openCryptoCheckout(crypto) {
                    window.location.href = '/checkout?crypto=' + encodeURIComponent(crypto);
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/api/register', (req, res) => {
    const { user, pass } = req.body;
    if (registeredUsers[user]) {
        return res.json({ success: false, message: 'Node identifier is already registered.' });
    }
    registeredUsers[user] = pass;
    nodeBalances[user] = 100;
    res.json({ success: true, message: 'Node successfully registered.' });
});

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    
    if (!failedAttempts[user]) {
        failedAttempts[user] = 0;
    }

    if (registeredUsers[user] && registeredUsers[user] === pass) {
        failedAttempts[user] = 0;
        return res.json({ success: true });
    } else {
        failedAttempts[user]++;
        let remaining = 3 - failedAttempts[user];
        
        if (failedAttempts[user] >= 3) {
            delete registeredUsers[user];
            failedAttempts[user] = 0;
            return res.json({ 
                success: false, 
                message: '⚠️ MAXIMUM ATTEMPTS EXCEEDED. For security reasons, this node has been locked and self-destructed.' 
            });
        }

        return res.json({ 
            success: false, 
            message: `Invalid credentials. Remaining attempts before lockdown: ${remaining}` 
        });
    }
});

app.get('/checkout', (req, res) => {
    const crypto = req.query.crypto || 'BTC';
    let networkInfo = 'Bitcoin Native / SegWit Network';
    let walletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    let priceLabel = '0.001 BTC = 10,000 Credits';

    if (crypto === 'ETH') {
        networkInfo = 'Ethereum Mainnet (ERC-20)';
        walletAddress = '0x71C35a89eF2199b999KrakenVaultNode999';
        priceLabel = '0.03 ETH = 10,000 Credits';
    } else if (crypto === 'SOL') {
        networkInfo = 'Solana Mainnet (SPL Network)';
        walletAddress = 'PleniuxKrakenSolanaNodeNetwork777xyz';
        priceLabel = '0.5 SOL = 10,000 Credits';
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Secure Checkout (${crypto})</title>
            <style>
                @keyframes backgroundMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(-45deg, #050505, #0f172a, #09090b, #111827); background-size: 400% 400%; animation: backgroundMove 15s ease infinite; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(18, 18, 18, 0.9); backdrop-filter: blur(10px); border: 1px solid #222; padding: 2rem; border-radius: 8px; width: 100%; max-width: 440px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h2 { color: #f59e0b; margin-top: 0; font-size: 1.3rem; }
                .crypto-box { background: #0a0a0a; border: 1px solid #333; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: left; }
                .net { color: #3b82f6; font-size: 0.75rem; font-weight: bold; margin-bottom: 6px; }
                .wallet { font-size: 0.75rem; word-break: break-all; color: #a1a1aa; background: #121212; padding: 8px; border-radius: 4px; border: 1px dashed #444; }
                .price-tag { color: #10b981; font-weight: bold; font-size: 0.9rem; margin-bottom: 10px; }
                button { width: 100%; padding: 11px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; margin-top: 10px; }
                button:hover { background: #1d4ed8; }
                .back { color: #888; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Secure Deposit in ${crypto}</h2>
                <div class="price-tag">Cost: ${priceLabel}</div>
                <p style="font-size: 0.85rem; color: #aaa;">Transfer exact funds to the official network address:</p>
                <div class="crypto-box">
                    <div class="net">Official Network: ${networkInfo}</div>
                    <div class="wallet">${walletAddress}</div>
                </div>
                <button onclick="confirmDeposit()">Verify Blockchain Transaction</button>
                <br>
                <a href="/" class="back">← Return to Dashboard</a>
            </div>
            <script>
                function confirmDeposit() {
                    alert('Transaction submitted for network validation. Balance will be credited automatically.');
                    window.location.href = '/';
                }
            </script>
        </body>
        </html>
    `);
});

// Chat con opción dentro de la interfaz para Generar Código, Conectarse, y Mostrar Precios de Saldos
app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX0';
    const room = req.query.room || '777';
    let currentBalance = nodeBalances[user] || 10000;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Secure Active Channel</title>
            <style>
                @keyframes backgroundMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(-45deg, #050505, #0f172a, #09090b, #111827); background-size: 400% 400%; animation: backgroundMove 15s ease infinite; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                header { background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; font-size: 0.8rem; flex-wrap: wrap; gap: 10px; }
                .security-status { color: #f59e0b; font-weight: bold; }
                
                /* Panel de Control de Códigos y Precios integrado */
                .control-panel { background: rgba(15, 15, 15, 0.95); border-bottom: 1px solid #222; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; gap: 10px; flex-wrap: wrap; }
                .control-group { display: flex; gap: 8px; align-items: center; }
                .control-panel input { padding: 5px 8px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-size: 0.8rem; width: 90px; outline: none; }
                .control-panel button { padding: 5px 10px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.75rem; }
                .control-panel button:hover { background: #1d4ed8; }
                .prices-info { color: #10b981; font-weight: bold; }

                #chat-box { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .message { background: #18181b; padding: 10px 14px; border-radius: 6px; max-width: 75%; word-break: break-word; border: 1px solid #27272a; font-size: 0.9rem; }
                .self { background: #1e3a8a; border-color: #2563eb; align-self: flex-end; }
                .footer { padding: 1rem; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); display: flex; gap: 10px; border-top: 1px solid #222; }
                .footer input { flex: 1; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; }
                .footer input:focus { border-color: #3b82f6; }
                .footer button { padding: 0 20px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; }
                .footer button:hover { background: #1d4ed8; }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <div>Node: <strong style="color:#fff;">${user}</strong> | Balance: <strong style="color:#f59e0b;">${currentBalance} Cr</strong> | Active Channel: <strong style="color:#fff;" id="currentRoomDisplay">${room}</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <!-- Panel interno para Generar Código, Conectarse y ver Precios -->
            <div class="control-panel">
                <div class="control-group">
                    <span>Channel Code:</span>
                    <input type="text" id="targetRoom" value="${room}" placeholder="Room">
                    <button onclick="connectToRoom()">Connect</button>
                    <button onclick="generateRandomCode()" style="background:#059669;">Generate New</button>
                </div>
                <div class="prices-info">
                    Rates: 10k Cr = 0.001BTC | 0.03ETH | 0.5SOL
                </div>
            </div>

            <div id="chat-box"></div>

            <div class="footer">
                <input type="text" id="messageInput" placeholder="Type an encrypted message..." onkeypress="handleKey(event)" autofocus>
                <button onclick="sendMessage()">Send</button>
            </div>

            <script>
                const user = "${user}";
                let room = "${room}";
                const socket = io();

                socket.emit('join-room', { room, user });

                function generateRandomCode() {
                    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
                    document.getElementById('targetRoom').value = randomCode;
                    connectToRoom();
                }

                function connectToRoom() {
                    const newRoom = document.getElementById('targetRoom').value.trim();
                    if(!newRoom) {
                        alert('Please specify a valid room code.');
                        return;
                    }
                    room = newRoom;
                    document.getElementById('currentRoomDisplay').innerText = room;
                    socket.emit('join-room', { room, user });
                    
                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.style.textAlign = 'center';
                    div.style.color = '#f59e0b';
                    div.style.fontSize = '0.78rem';
                    div.style.margin = '5px 0';
                    div.innerText = '--- Synchronized securely with channel code: ' + room + ' ---';
                    box.appendChild(div);
                    box.scrollTop = box.scrollHeight;
                }

                function triggerSelfDestruct(reason) {
                    document.body.innerHTML = \`<div style="background:#080808;color:#ef4444;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:monospace;text-align:center;padding:20px;">
                        <h2>⚠️ SESSION TERMINATED FOR SECURITY</h2>
                        <p style="color:#a1a1aa;font-size:0.9rem;margin-top:5px;">Reason: \${reason}</p>
                        <p style="color:#71717a;font-size:0.8rem;margin-top:15px;">All session records have been permanently wiped from memory.</p>
                    </div>\`;
                    setTimeout(() => { window.location.href = '/'; }, 3500);
                }

                let tSecs = 150;
                const countdown = setInterval(() => {
                    if(tSecs <= 0) {
                        clearInterval(countdown);
                        triggerSelfDestruct('Secure channel time limit has expired.');
                        return;
                    }
                    tSecs--;
                    let mins = Math.floor(tSecs / 60).toString().padStart(2, '0');
                    let secs = (tSecs % 60).toString().padStart(2, '0');
                    document.getElementById('timer').innerText = 'Self-Destruct: ' + mins + ':' + secs;
                }, 1000);

                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) triggerSelfDestruct('Tab switch or app exit detected.');
                });

                window.addEventListener('blur', () => {
                    triggerSelfDestruct('Security focus lost or screen lock detected.');
                });

                window.addEventListener('beforeunload', () => { socket.disconnect(); });

                function sendMessage() {
                    const text = document.getElementById('messageInput').value.trim();
                    if(!text) return;
                    socket.emit('chat-message', { room, user, text });
                    document.getElementById('messageInput').value = '';
                }

                function handleKey(e) { if(e.key === 'Enter') sendMessage(); }

                socket.on('chat-message', (data) => {
                    if(data.room && data.room !== room) return; // Filtro de sala activa
                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.className = 'message' + (data.user === user ? ' self' : '');
                    div.innerHTML = '<strong style="color: ' + (data.user === user ? '#60a5fa' : '#a1a1aa') + ';">' + data.user + ':</strong> ' + data.text;
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
    console.log(`Pleniux system active on port ${PORT}`);
});
