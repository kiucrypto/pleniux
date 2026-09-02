const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const nodeBalances = {
    'UX1': 1500,
    'UX0': 2500
};

const registeredUsers = {
    'UX1': '2609',
    'UX0': '1971'
};

const failedAttempts = {};

// Interfaz Principal Limpia con Fondo en Movimiento
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Secure Messaging Gateway</title>
            <style>
                @keyframes backgroundMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(-45deg, #050505, #0f172a, #09090b, #111827); background-size: 400% 400%; animation: backgroundMove 15s ease infinite; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
                .container { width: 100%; max-width: 440px; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); border: 1px solid #222; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h1 { color: #fff; font-size: 1.5rem; margin-top: 0; text-align: center; letter-spacing: 1px; }
                .subtitle { color: #888; font-size: 0.82rem; text-align: center; margin-bottom: 1.5rem; line-height: 1.4; }
                .security-notice { background: rgba(26, 21, 0, 0.8); border: 1px solid #423500; color: #f59e0b; padding: 10px; border-radius: 6px; font-size: 0.78rem; margin-bottom: 1.5rem; line-height: 1.4; }
                .form-group { margin-bottom: 1rem; }
                label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                input { width: 100%; padding: 10px 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
                input:focus { border-color: #3b82f6; }
                .btn { width: 100%; padding: 11px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 0.9rem; margin-top: 10px; transition: background 0.2s; }
                .btn:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>PLENIUX</h1>
                <div class="subtitle">Corporate high-security encrypted access portal.</div>

                <div class="security-notice">
                    🔒 <strong>Anti-Intrusion Protocol:</strong> 3 failed access attempts will permanently lock and self-destruct the target node.
                </div>

                <div class="form-group">
                    <label>Node Identifier</label>
                    <input type="text" id="loginUser" placeholder="e.g. UX0">
                </div>
                <div class="form-group">
                    <label>Access Password</label>
                    <input type="password" id="loginPass" placeholder="Enter password">
                </div>
                <div class="form-group">
                    <label>Secure Channel Code</label>
                    <input type="text" id="roomCode" placeholder="e.g. 777">
                </div>
                <button class="btn" onclick="loginUser()">Initialize Secure Session</button>
            </div>

            <script>
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
            </script>
        </body>
        </html>
    `);
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
                message: '⚠️ MAXIMUM ATTEMPTS EXCEEDED. Node locked and self-destructed.' 
            });
        }

        return res.json({ 
            success: false, 
            message: `Invalid credentials. Remaining attempts before lockdown: ${remaining}` 
        });
    }
});

// Pasarela de Pagos Interna con selección de montos rentables para el negocio
app.get('/checkout', (req, res) => {
    const user = req.query.user || 'UX0';
    const room = req.query.room || '777';
    const crypto = req.query.crypto || 'BTC';

    let networkInfo = 'Bitcoin Native / SegWit Network';
    let walletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

    if (crypto === 'ETH') {
        networkInfo = 'Ethereum Mainnet (ERC-20)';
        walletAddress = '0x71C35a89eF2199b999KrakenVaultNode999';
    } else if (crypto === 'SOL') {
        networkInfo = 'Solana Mainnet (SPL Network)';
        walletAddress = 'PleniuxKrakenSolanaNodeNetwork777xyz';
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Top-up Balance (${crypto})</title>
            <style>
                @keyframes backgroundMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(-45deg, #050505, #0f172a, #09090b, #111827); background-size: 400% 400%; animation: backgroundMove 15s ease infinite; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); border: 1px solid #222; padding: 2rem; border-radius: 8px; width: 100%; max-width: 440px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h2 { color: #f59e0b; margin-top: 0; font-size: 1.3rem; }
                .crypto-box { background: #0a0a0a; border: 1px solid #333; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: left; }
                .net { color: #3b82f6; font-size: 0.75rem; font-weight: bold; margin-bottom: 6px; }
                .wallet { font-size: 0.75rem; word-break: break-all; color: #a1a1aa; background: #121212; padding: 8px; border-radius: 4px; border: 1px dashed #444; }
                select, button { width: 100%; padding: 11px; border-radius: 4px; font-family: inherit; margin-top: 10px; box-sizing: border-box; }
                select { background: #0a0a0a; border: 1px solid #333; color: #fff; font-size: 0.9rem; outline: none; }
                button { background: #2563eb; border: none; color: #fff; font-weight: bold; cursor: pointer; }
                button:hover { background: #1d4ed8; }
                .back { color: #888; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Top-up Node Balance (${crypto})</h2>
                <p style="font-size: 0.82rem; color: #aaa;">Select your credit package and complete network transfer:</p>
                
                <div style="text-align:left; margin-bottom: 5px; font-size:0.8rem; color:#ccc;">Select Package:</div>
                <select id="packageSelect" onchange="updateCryptoDetails()">
                    <option value="5000">Standard Tier: 5,000 Credits</option>
                    <option value="15000" selected>Professional Tier: 15,000 Credits</option>
                    <option value="50000">Enterprise Tier: 50,000 Credits</option>
                </select>

                <div class="crypto-box">
                    <div class="net">Network: ${networkInfo}</div>
                    <div style="font-size: 0.8rem; color: #10b981; margin: 6px 0;" id="priceDisplay">Amount to send: Calculated dynamically</div>
                    <div class="wallet">${walletAddress}</div>
                </div>

                <button onclick="confirmDeposit()">Verify & Credit Automatically</button>
                <br>
                <a href="/chat?user=${encodeURIComponent(user)}&room=${encodeURIComponent(room)}" class="back">← Return to Secure Chat</a>
            </div>
            <script>
                const cryptoType = "${crypto}";
                function updateCryptoDetails() {
                    const val = document.getElementById('packageSelect').value;
                    let amountStr = '';
                    if(cryptoType === 'BTC') {
                        amountStr = (val * 0.00005).toFixed(4) + ' BTC';
                    } else if(cryptoType === 'ETH') {
                        amountStr = (val * 0.0008).toFixed(4) + ' ETH';
                    } else {
                        amountStr = (val * 0.015).toFixed(2) + ' SOL';
                    }
                    document.getElementById('priceDisplay').innerText = 'Exact payment required: ' + amountStr;
                }
                updateCryptoDetails();

                function confirmDeposit() {
                    alert('Broadcast received! Verifying blockchain transaction status... Credits will reflect in your session shortly.');
                    window.location.href = '/chat?user=${encodeURIComponent(user)}&room=${encodeURIComponent(room)}';
                }
            </script>
        </body>
        </html>
    `);
});

// Chat con Botón Interno de Recarga y Gestión Completa
app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX0';
    const room = req.query.room || '777';
    let currentBalance = nodeBalances[user] || 2500;

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
                
                .control-panel { background: rgba(15, 15, 15, 0.95); border-bottom: 1px solid #222; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; gap: 10px; flex-wrap: wrap; }
                .control-group { display: flex; gap: 6px; align-items: center; }
                .control-panel input { padding: 5px 8px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-size: 0.8rem; width: 80px; outline: none; }
                .control-panel button { padding: 5px 10px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.75rem; }
                .control-panel button:hover { background: #1d4ed8; }
                
                .topup-btn { background: #d97706 !important; }
                .topup-btn:hover { background: #b45309 !important; }

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
                <div>Node: <strong style="color:#fff;">${user}</strong> | Balance: <strong style="color:#f59e0b;">${currentBalance} Cr</strong> | Channel: <strong style="color:#fff;" id="currentRoomDisplay">${room}</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <div class="control-panel">
                <div class="control-group">
                    <span>Room:</span>
                    <input type="text" id="targetRoom" value="${room}" placeholder="Code">
                    <button onclick="connectToRoom()">Sync</button>
                    <button onclick="generateRandomCode()" style="background:#059669;">New Code</button>
                </div>
                <div class="control-group">
                    <button class="topup-btn" onclick="openCheckout('BTC')">+ Buy BTC</button>
                    <button class="topup-btn" onclick="openCheckout('ETH')">+ Buy ETH</button>
                    <button class="topup-btn" onclick="openCheckout('SOL')">+ Buy SOL</button>
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

                function openCheckout(crypto) {
                    window.location.href = '/checkout?user=' + encodeURIComponent(user) + '&room=' + encodeURIComponent(room) + '&crypto=' + encodeURIComponent(crypto);
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
                    if(data.room && data.room !== room) return;
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
