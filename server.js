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

// Interfaz Principal: Estilo Cyberpunk / Neón Llamativo
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Cyber Gateway</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 300% 300%; animation: neonGlow 10s ease infinite; color: #fff; font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
                .container { width: 100%; max-width: 440px; background: rgba(15, 15, 30, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(139, 92, 246, 0.4); padding: 2.5rem 2rem; border-radius: 16px; box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3); }
                h1 { color: #fff; font-size: 2rem; margin-top: 0; text-align: center; letter-spacing: 2px; text-shadow: 0 0 15px rgba(168, 85, 247, 0.7); }
                .subtitle { color: #a78bfa; font-size: 0.85rem; text-align: center; margin-bottom: 1.8rem; font-weight: 500; }
                .security-notice { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 12px; border-radius: 8px; font-size: 0.78rem; margin-bottom: 1.5rem; line-height: 1.4; }
                .form-group { margin-bottom: 1.2rem; }
                label { display: block; font-size: 0.8rem; color: #c084fc; margin-bottom: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                input { width: 100%; padding: 12px 14px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; color: #fff; font-family: inherit; font-size: 1rem; box-sizing: border-box; outline: none; transition: all 0.3s ease; }
                input:focus { border-color: #c084fc; box-shadow: 0 0 10px rgba(192, 132, 252, 0.5); }
                .btn { width: 100%; padding: 13px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 1rem; margin-top: 10px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>PLENIUX</h1>
                <div class="subtitle">Next-Gen Encrypted Node Interface</div>

                <div class="security-notice">
                    ⚡ <strong>Security Warning:</strong> 3 failed authentication attempts will instantly wipe and lock out the node.
                </div>

                <div class="form-group">
                    <label>Node Identifier</label>
                    <input type="text" id="loginUser" placeholder="e.g. UX0">
                </div>
                <div class="form-group">
                    <label>Access Password</label>
                    <input type="password" id="loginPass" placeholder="Enter password">
                </div>
                <button class="btn" onclick="loginUser()">Access Node Network</button>
            </div>

            <script>
                function loginUser() {
                    const user = document.getElementById('loginUser').value.trim().toUpperCase();
                    const pass = document.getElementById('loginPass').value.trim();
                    
                    if(!user || !pass) {
                        alert('Error: Please enter both Node Identifier and Password.');
                        return;
                    }

                    fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user, pass })
                    }).then(res => res.json()).then(data => {
                        if(data.success) {
                            window.location.href = '/chat?user=' + encodeURIComponent(user);
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
                message: '🚨 CRITICAL: Node locked permanently due to security violations.' 
            });
        }

        return res.json({ 
            success: false, 
            message: `Invalid access details. Remaining attempts: ${remaining}` 
        });
    }
});

// Checkout con diseño llamativo, selección de criptos y precios de alta ganancia
app.get('/checkout', (req, res) => {
    const user = req.query.user || 'UX0';
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
            <title>Pleniux - Top Up Balance (${crypto})</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 300% 300%; animation: neonGlow 10s ease infinite; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(15, 15, 30, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(245, 158, 11, 0.4); padding: 2.5rem 2rem; border-radius: 16px; width: 100%; max-width: 440px; text-align: center; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2); }
                h2 { color: #f59e0b; margin-top: 0; font-size: 1.5rem; text-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
                .crypto-box { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0; text-align: left; }
                .net { color: #38bdf8; font-size: 0.8rem; font-weight: bold; margin-bottom: 8px; }
                .wallet { font-size: 0.78rem; word-break: break-all; color: #cbd5e1; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.4); }
                select, button { width: 100%; padding: 12px; border-radius: 8px; font-family: inherit; margin-top: 12px; box-sizing: border-box; font-weight: bold; }
                select { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); color: #fff; font-size: 0.95rem; outline: none; }
                button { background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #000; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); transition: transform 0.2s; }
                button:hover { transform: translateY(-2px); }
                .back { color: #a78bfa; font-size: 0.85rem; text-decoration: none; display: inline-block; margin-top: 18px; font-weight: 500; }
                .back:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Recharge with ${crypto}</h2>
                <p style="font-size: 0.85rem; color: #cbd5e1;">Select a high-yield package to fund your secure node:</p>
                
                <div style="text-align:left; margin-bottom: 6px; font-size:0.8rem; color:#f59e0b; font-weight:bold;">SELECT TIER PACKAGE:</div>
                <select id="packageSelect" onchange="updateCryptoDetails()">
                    <option value="5000">Standard Tier: 5,000 Credits</option>
                    <option value="15000" selected>Professional Tier: 15,000 Credits (Best Value)</option>
                    <option value="50000">Enterprise Elite: 50,000 Credits</option>
                </select>

                <div class="crypto-box">
                    <div class="net">Network Protocol: ${networkInfo}</div>
                    <div style="font-size: 0.85rem; color: #34d399; margin: 8px 0; font-weight: bold;" id="priceDisplay">Exact Amount: Calculating...</div>
                    <div class="wallet">${walletAddress}</div>
                </div>

                <button onclick="confirmDeposit()">Verify & Credit Instantly</button>
                <br>
                <a href="/chat?user=${encodeURIComponent(user)}" class="back">← Return to Secure Chat</a>
            </div>
            <script>
                const cryptoType = "${crypto}";
                function updateCryptoDetails() {
                    const val = document.getElementById('packageSelect').value;
                    let amountStr = '';
                    if(cryptoType === 'BTC') {
                        amountStr = (val * 0.00012).toFixed(4) + ' BTC';
                    } else if(cryptoType === 'ETH') {
                        amountStr = (val * 0.0018).toFixed(4) + ' ETH';
                    } else {
                        amountStr = (val * 0.035).toFixed(2) + ' SOL';
                    }
                    document.getElementById('priceDisplay').innerText = 'Send exact amount: ' + amountStr;
                }
                updateCryptoDetails();

                function confirmDeposit() {
                    alert('Payment broadcast signal detected! Verifying hash on the blockchain... Credits will update automatically.');
                    window.location.href = '/chat?user=${encodeURIComponent(user)}';
                }
            </script>
        </body>
        </html>
    `);
});

// Chat principal vibrante y profesional con botones de recarga rápida
app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX0';
    let currentBalance = nodeBalances[user] || 2500;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Active Encrypted Channel</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 300% 300%; animation: neonGlow 15s ease infinite; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                header { background: rgba(15, 15, 30, 0.9); backdrop-filter: blur(12px); padding: 0.9rem 1.2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.85rem; flex-wrap: wrap; gap: 10px; }
                .security-status { color: #f59e0b; font-weight: bold; text-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
                
                .control-panel { background: rgba(20, 20, 40, 0.9); border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; gap: 10px; flex-wrap: wrap; }
                .control-group { display: flex; gap: 8px; align-items: center; }
                .control-panel input { padding: 6px 10px; background: rgba(0,0,0,0.5); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 6px; color: #fff; font-size: 0.85rem; width: 85px; outline: none; }
                .control-panel button { padding: 6px 12px; background: #7c3aed; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.8rem; transition: background 0.2s; }
                .control-panel button:hover { background: #6d28d9; }
                
                .topup-btn { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: #000 !important; font-weight: bold !important; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3); }
                .topup-btn:hover { opacity: 0.9; }

                #chat-box { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
                .message { background: rgba(30, 30, 60, 0.7); backdrop-filter: blur(8px); padding: 12px 16px; border-radius: 10px; max-width: 75%; word-break: break-word; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.95rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
                .self { background: rgba(79, 70, 229, 0.4); border-color: rgba(129, 140, 248, 0.5); align-self: flex-end; }
                
                .footer { padding: 1.2rem; background: rgba(15, 15, 30, 0.9); backdrop-filter: blur(12px); display: flex; gap: 10px; border-top: 1px solid rgba(139, 92, 246, 0.3); }
                .footer input { flex: 1; padding: 12px 16px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px; color: #fff; font-family: inherit; font-size: 1rem; outline: none; }
                .footer input:focus { border-color: #c084fc; box-shadow: 0 0 10px rgba(192, 132, 252, 0.4); }
                .footer button { padding: 0 24px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 1rem; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
                .footer button:hover { opacity: 0.9; }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <div>Node: <strong style="color:#c084fc;">${user}</strong> | Balance: <strong style="color:#34d399;">${currentBalance} Cr</strong> | Channel: <strong style="color:#fff;" id="currentRoomDisplay">777</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <div class="control-panel">
                <div class="control-group">
                    <span>Room:</span>
                    <input type="text" id="targetRoom" value="777" placeholder="Code">
                    <button onclick="connectToRoom()">Sync</button>
                    <button onclick="generateRandomCode()" style="background:#059669;">New Code</button>
                </div>
                <div class="control-group">
                    <button class="topup-btn" onclick="openCheckout('BTC')">⚡ Buy BTC</button>
                    <button class="topup-btn" onclick="openCheckout('ETH')">⚡ Buy ETH</button>
                    <button class="topup-btn" onclick="openCheckout('SOL')">⚡ Buy SOL</button>
                </div>
            </div>

            <div id="chat-box"></div>

            <div class="footer">
                <input type="text" id="messageInput" placeholder="Type a secure message..." onkeypress="handleKey(event)" autofocus>
                <button onclick="sendMessage()">Send</button>
            </div>

            <script>
                const user = "${user}";
                let room = "777";
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
                    div.style.fontSize = '0.8rem';
                    div.style.margin = '8px 0';
                    div.innerText = '⚡ Channel secured and synchronized with code: ' + room;
                    box.appendChild(div);
                    box.scrollTop = box.scrollHeight;
                }

                function openCheckout(crypto) {
                    window.location.href = '/checkout?user=' + encodeURIComponent(user) + '&crypto=' + encodeURIComponent(crypto);
                }

                function triggerSelfDestruct(reason) {
                    document.body.innerHTML = \`<div style="background:#050505;color:#ef4444;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;text-align:center;padding:20px;">
                        <h2 style="font-size: 1.8rem; text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);">🚨 NODE SECURELY WIPED</h2>
                        <p style="color:#cbd5e1;font-size:1rem;margin-top:8px;">Reason: \${reason}</p>
                        <p style="color:#64748b;font-size:0.85rem;margin-top:15px;">All session logs and keys have been permanently destroyed.</p>
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
                    if (document.hidden) triggerSelfDestruct('Tab switch or background mode detected.');
                });

                window.addEventListener('blur', () => {
                    triggerSelfDestruct('Screen blur or focus loss detected.');
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
    console.log(`Pleniux system active on port ${PORT}`);
});
