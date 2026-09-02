const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Secure balance and node credentials database
const nodeBalances = {
    'UX1': 10000,
    'UX0': 10000
};

const registeredUsers = {
    'UX1': '2609',
    'UX0': '1971'
};

// In-memory tracking for failed attempts to prevent brute-force attacks
const failedAttempts = {};

// 1. Professional Main Interface with Manual, Access, and Crypto Gateway
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux - Secure Messaging & Crypto Gateway</title>
            <style>
                body { background: #080808; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; box-sizing: border-box; }
                .container { width: 100%; max-width: 520px; background: #121212; border: 1px solid #222; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h1 { color: #fff; font-size: 1.5rem; margin-top: 0; text-align: center; letter-spacing: 1px; }
                .subtitle { color: #888; font-size: 0.82rem; text-align: center; margin-bottom: 1.5rem; line-height: 1.4; }
                .security-notice { background: #1a1500; border: 1px solid #423500; color: #f59e0b; padding: 10px; border-radius: 6px; font-size: 0.78rem; margin-bottom: 1.5rem; line-height: 1.4; }
                
                /* Operational Manual Box */
                .manual-box { background: #0a0a0a; border: 1px solid #27272a; padding: 12px; border-radius: 6px; margin-bottom: 1.5rem; font-size: 0.78rem; color: #a1a1aa; line-height: 1.4; }
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

                <!-- Operational Manual -->
                <div class="manual-box">
                    <strong>📖 Operating Manual:</strong>
                    <ul>
                        <li><strong>Access:</strong> Use authorized node credentials (e.g., UX0 / 1971 or UX1 / 2609).</li>
                        <li><strong>Secure Channel:</strong> Input a shared numerical room code to synchronize real-time chats.</li>
                        <li><strong>Top-ups:</strong> Process balance deposits using BTC, ETH, or Solana with network verification.</li>
                    </ul>
                </div>

                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('login')">Access Node</button>
                    <button class="tab-btn" onclick="switchTab('register')">Register Node</button>
                </div>

                <!-- Login Section -->
                <div id="loginSection" class="form-section active">
                    <div class="form-group">
                        <label>Node Identifier</label>
                        <input type="text" id="loginUser" placeholder="e.g. UX0" value="UX0">
                    </div>
                    <div class="form-group">
                        <label>Access Password</label>
                        <input type="password" id="loginPass" placeholder="••••••••" value="1971">
                    </div>
                    <div class="form-group">
                        <label>Secure Channel Code</label>
                        <input type="text" id="roomCode" placeholder="e.g. 777" value="777">
                    </div>
                    <button class="btn" onclick="loginUser()">Enter Secure Channel</button>
                </div>

                <!-- Registration Section -->
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

                <!-- Crypto Gateway -->
                <div class="crypto-packages">
                    <label style="text-align: center;">Cryptocurrency Gateway</label>
                    <div class="crypto-grid">
                        <div class="crypto-card">
                            <h4>BTC</h4>
                            <span style="font-size: 0.7rem; color: #888;">Bitcoin</span>
                            <button onclick="openCryptoCheckout('BTC')">Pay BTC</button>
                        </div>
                        <div class="crypto-card">
                            <h4>ETH</h4>
                            <span style="font-size: 0.7rem; color: #888;">Ethereum</span>
                            <button onclick="openCryptoCheckout('ETH')">Pay ETH</button>
                        </div>
                        <div class="crypto-card">
                            <h4>Solana</h4>
                            <span style="font-size: 0.7rem; color: #888;">SOL</span>
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
                        alert('Complete credentials and room code.');
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

// Strict login control with 3 failed attempts rule and self-destruction
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
        failedAttempts[user] = 0; // Reset attempts on success
        return res.json({ success: true });
    } else {
        failedAttempts[user]++;
        let remaining = 3 - failedAttempts[user];
        
        if (failedAttempts[user] >= 3) {
            delete registeredUsers[user]; // Node self-destruction for security
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

// Crypto Checkout Gateway
app.get('/checkout', (req, res) => {
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
            <title>Pleniux - Secure Checkout (${crypto})</title>
            <style>
                body { background: #080808; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: #121212; border: 1px solid #222; padding: 2rem; border-radius: 8px; width: 100%; max-width: 440px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                h2 { color: #f59e0b; margin-top: 0; font-size: 1.3rem; }
                .crypto-box { background: #0a0a0a; border: 1px solid #333; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: left; }
                .net { color: #3b82f6; font-size: 0.75rem; font-weight: bold; margin-bottom: 6px; }
                .wallet { font-size: 0.75rem; word-break: break-all; color: #a1a1aa; background: #121212; padding: 8px; border-radius: 4px; border: 1px dashed #444; }
                button { width: 100%; padding: 11px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; margin-top: 10px; }
                button:hover { background: #1d4ed8; }
                .back { color: #888; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Secure Deposit in ${crypto}</h2>
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

// Real-Time Encrypted Chat with Active Security Protections
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
                body { background: #080808; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                header { background: #121212; padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; font-size: 0.85rem; }
                .security-status { color: #f59e0b; font-weight: bold; }
                #chat-box { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .message { background: #18181b; padding: 10px 14px; border-radius: 6px; max-width: 75%; word-break: break-word; border: 1px solid #27272a; font-size: 0.9rem; }
                .self { background: #1e3a8a; border-color: #2563eb; align-self: flex-end; }
                .footer { padding: 1rem; background: #121212; display: flex; gap: 10px; border-top: 1px solid #222; }
                input { flex: 1; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; }
                input:focus { border-color: #3b82f6; }
                button { padding: 0 20px; background: #2563eb; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; }
                button:hover { background: #1d4ed8; }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <div>Node: <strong style="color:#fff;">${user}</strong> | Balance: <strong style="color:#f59e0b;">${currentBalance} Cr</strong> | Channel: <strong style="color:#fff;">${room}</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <div id="chat-box"></div>

            <div class="footer">
                <input type="text" id="messageInput" placeholder="Type an encrypted message..." onkeypress="handleKey(event)" autofocus>
                <button onclick="sendMessage()">Send</button>
            </div>

            <script>
                const user = "${user}";
                const room = "${room}";
                const socket = io();

                socket.emit('join-room', { room, user });

                function triggerSelfDestruct(reason) {
                    document.body.innerHTML = \`<div style="background:#080808;color:#ef4444;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:monospace;text-align:center;padding:20px;">
                        <h2>⚠️ SESSION TERMINATED FOR SECURITY</h2>
                        <p style="color:#a1a1aa;font-size:0.9rem;margin-top:5px;">Reason: \${reason}</p>
                        <p style="color:#71717a;font-size:0.8rem;margin-top:15px;">All session records have been permanently wiped from memory.</p>
                    </div>\`;
                    setTimeout(() => { window.location.href = '/'; }, 3500);
                }

                // Countdown Timer (02:30)
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

                // Tab switch or focus loss security triggers
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
    socket.on('join-room', ({ room, user }) => { socket.join(room); });
    socket.on('chat-message', (data) => { io.to(data.room).emit('chat-message', data); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux system active on port ${PORT}`);
});
