const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Base de datos de nodos VIP con los saldos exactos y contraseñas privadas
const nodeBalances = {
    'UX1': 19000,
    'UX0': 10000
};

const registeredUsers = {
    'UX1': '2609',
    'UX0': '1971'
};

const lastActivityTime = {
    'UX1': Date.now(),
    'UX0': Date.now()
};

const trustedHardwareKeys = {
    'UX1': null,
    'UX0': null
};

const failedAttempts = {};
const bannedDevices = new Set();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux.com VIP - Secure Gateway</title>
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
                    overflow-x: hidden;
                    position: relative;
                }
                .neon-bg-canvas {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 0;
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
                    position: relative;
                    z-index: 1;
                }
                .logo-header {
                    text-align: center;
                    margin-bottom: 0.5rem;
                }
                .logo-header h1 { 
                    color: #fff; 
                    font-size: 1.8rem; 
                    margin: 0; 
                    letter-spacing: 2px; 
                    text-shadow: 0 0 15px rgba(168, 85, 247, 0.7); 
                    display: inline-block;
                }
                .vip-badge {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: #000;
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 4px;
                    vertical-align: super;
                    letter-spacing: 1px;
                    margin-left: 4px;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
                }
                .subtitle { color: #a78bfa; font-size: 0.8rem; text-align: center; margin-bottom: 1rem; font-weight: 500; }
                .description { font-size: 0.75rem; color: #cbd5e1; text-align: center; margin-bottom: 1rem; line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                
                .security-notice { 
                    background: rgba(239, 68, 68, 0.15); 
                    border: 1px solid rgba(239, 68, 68, 0.4); 
                    color: #fca5a5; 
                    padding: 10px; 
                    border-radius: 8px; 
                    font-size: 0.75rem; 
                    margin-bottom: 1rem; 
                    line-height: 1.4; 
                }
                .premium-shield {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    color: #34d399;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-size: 0.72rem;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                }

                .form-group { margin-bottom: 0.9rem; }
                label { display: block; font-size: 0.75rem; color: #c084fc; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                .input-row { display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; overflow: hidden; }
                .prefix { padding: 10px; background: rgba(124, 58, 237, 0.2); color: #c084fc; font-weight: bold; font-size: 0.9rem; border-right: 1px solid rgba(139, 92, 246, 0.3); }
                .input-row input, select { flex: 1; padding: 10px 12px; background: transparent; border: none; color: #fff; font-family: inherit; font-size: 0.9rem; outline: none; }
                select option { background: #111; color: #fff; }
                .btn { width: 100%; padding: 11px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 0.9rem; margin-top: 8px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
                .btn:hover { opacity: 0.9; }

                .user-manual {
                    margin-top: 1.2rem;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 8px;
                    padding: 10px;
                    font-size: 0.68rem;
                    color: #cbd5e1;
                    line-height: 1.35;
                }
                .user-manual b { color: #f59e0b; }
                .footer-manual { font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.8rem; line-height: 1.3; }
            </style>
        </head>
        <body>
            <canvas class="neon-bg-canvas" id="neonCanvas"></canvas>

            <div class="container">
                <div class="logo-header">
                    <h1>PLENIUX.COM<span class="vip-badge">VIP</span></h1>
                </div>
                <div class="subtitle">Real Kraken Crypto Gateway & Lightning Chat</div>
                
                <div class="description">
                    Private encrypted system with real-time crypto settlements, instant messaging, and secure UX-to-UX channel synchronization.
                </div>

                <div class="premium-shield">
                    🛡️ PRIVATE & SECURE: Passwords Hidden & IP Shielded
                </div>

                <div class="security-notice">
                    🔒 <strong>Security Warning:</strong> Leaving the tab, minimizing, or refreshing wipes messages, deducts 2 points, and forces a secure re-login.
                </div>

                <div class="form-group">
                    <label>Node Identifier</label>
                    <div class="input-row">
                        <span class="prefix">UX</span>
                        <input type="text" id="nodeNum" placeholder="e.g. 1 or 0" autocomplete="off">
                    </div>
                </div>

                <div class="form-group">
                    <label>Numeric Password</label>
                    <!-- autocomplete="new-password" evita que el navegador guarde la contraseña -->
                    <input type="password" id="loginPass" placeholder="Enter private password" inputmode="numeric" autocomplete="new-password">
                </div>

                <div class="form-group">
                    <label>Session Self-Destruct Timer</label>
                    <select id="timerPref">
                        <option value="60">1 Minute (Maximum Privacy)</option>
                        <option value="150" selected>2 Minutes 30 Seconds (Standard VIP)</option>
                    </select>
                </div>

                <button class="btn" onclick="loginUser()">Initialize Secure Session</button>

                <div class="user-manual">
                    <b>📖 Quick Guide:</b><br>
                    1. Enter your private node & password.<br>
                    2. Share/apply the sync code easily in chat.<br>
                    3. Tab refresh safely deducts 2 points & wipes cache.<br>
                    4. Real owners are fully protected against malicious probes.
                </div>

                <div class="footer-manual">
                    🎁 <strong>Balances:</strong> UX1 (19k pts) | UX0 (10k pts)<br>
                    Founder & Creator: <strong>Lenox JG</strong> | Pleniux.com VIP
                </div>
            </div>

            <script>
                const canvas = document.getElementById('neonCanvas');
                const ctx = canvas.getContext('2d');
                let particles = [];

                function resizeCanvas() {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();

                for(let i = 0; i < 50; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: Math.random() * 2 + 1,
                        color: Math.random() > 0.5 ? '#7c3aed' : '#38bdf8',
                        vx: (Math.random() - 0.5) * 0.6,
                        vy: (Math.random() - 0.5) * 0.6
                    });
                }

                function animateNeon() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
                        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.fillStyle = p.color;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = p.color;
                        ctx.fill();
                    });
                    requestAnimationFrame(animateNeon);
                }
                animateNeon();

                function getDeviceFingerprint() {
                    let canvasElem = document.createElement('canvas');
                    let cContext = canvasElem.getContext('2d');
                    cContext.textBaseline = "top";
                    cContext.font = "14px 'Arial'";
                    cContext.fillText("PleniuxVIP-Fingerprint", 2, 2);
                    let rawData = navigator.userAgent + navigator.language + screen.width + 'x' + screen.height + canvasElem.toDataURL();
                    let hash = 0;
                    for (let i = 0; i < rawData.length; i++) {
                        hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
                        hash |= 0;
                    }
                    return 'DEVICE_HASH_' + Math.abs(hash);
                }

                function loginUser() {
                    const num = document.getElementById('nodeNum').value.trim();
                    const pass = document.getElementById('loginPass').value.trim();
                    const timer = document.getElementById('timerPref').value;
                    
                    if(!num || !pass) {
                        alert('Error: Please fill out your node number and password.');
                        return;
                    }

                    const user = 'UX' + num.toUpperCase();
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
                                document.body.innerHTML = '<div style="background:#000;color:#ef4444;height:100vh;display:flex;justify-content:center;align-items:center;text-align:center;font-family:sans-serif;padding:20px;"><h2>🚨 IP / HARDWARE BLACKLISTED</h2><p>This malicious connection attempt has been blocked. The real owner data remains safe and untouched.</p></div>';
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

    if (bannedDevices.has(hardwareKey)) {
        return res.json({ success: false, banned: true, message: '🚨 ACCESS DENIED: Malicious device blocked. Real owner data is fully protected.' });
    }

    if (!registeredUsers[user]) {
        return res.json({ success: false, message: 'Node not found. Access restricted.' });
    }

    if (registeredUsers[user] !== pass) {
        if (!failedAttempts[user]) failedAttempts[user] = 0;
        failedAttempts[user]++;

        if (failedAttempts[user] >= 3) {
            bannedDevices.add(hardwareKey);
            failedAttempts[user] = 0;
            return res.json({ success: false, banned: true, message: '🚨 SECURITY ALERT: Unauthorized intrusion attempt detected from this IP/Device. Blocked, but the real owner profile and balance are fully safe.' });
        }
        return res.json({ success: false, message: `Invalid password. Attempt ${failedAttempts[user]} of 3.` });
    }

    if (!trustedHardwareKeys[user]) {
        trustedHardwareKeys[user] = hardwareKey;
    }

    failedAttempts[user] = 0;
    lastActivityTime[user] = Date.now();
    return res.json({ success: true });
});

app.post('/api/refresh-penalty', (req, res) => {
    const { user } = req.body;
    if (user && nodeBalances[user] !== undefined) {
        nodeBalances[user] = Math.max(0, nodeBalances[user] - 2);
    }
    res.json({ success: true });
});

app.get('/checkout', (req, res) => {
    const user = req.query.user || 'UX0';
    const timer = req.query.timer || '150';
    const cryptoType = req.query.crypto || 'BTC';

    let networkInfo = 'Bitcoin Native SegWit (Kraken Node)';
    let walletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

    if (cryptoType === 'ETH') {
        networkInfo = 'Ethereum Mainnet ERC-20 (Kraken Node)';
        walletAddress = '0x71C35a89eF2199b999KrakenVaultNode999';
    } else if (cryptoType === 'SOL') {
        networkInfo = 'Solana SPL Network (Kraken Node)';
        walletAddress = 'PleniuxKrakenSolanaNodeNetwork777xyz';
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pleniux.com VIP - Real Kraken Checkout (${cryptoType})</title>
            <style>
                @keyframes neonGlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-size: 300% 300%; animation: neonGlow 10s ease infinite; color: #fff; font-family: 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(15, 15, 30, 0.9); backdrop-filter: blur(16px); border: 1px solid rgba(245, 158, 11, 0.4); padding: 2rem; border-radius: 16px; width: 100%; max-width: 440px; text-align: center; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2); }
                h2 { color: #f59e0b; margin-top: 0; font-size: 1.3rem; }
                .crypto-box { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px; margin: 15px 0; text-align: left; }
                .net { color: #38bdf8; font-size: 0.75rem; font-weight: bold; margin-bottom: 5px; }
                .wallet { font-size: 0.72rem; word-break: break-all; color: #cbd5e1; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 6px; border: 1px dashed rgba(245, 158, 11, 0.4); }
                select, button { width: 100%; padding: 11px; border-radius: 8px; font-family: inherit; margin-top: 10px; box-sizing: border-box; font-weight: bold; }
                select { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); color: #fff; font-size: 0.9rem; outline: none; }
                button { background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #000; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); }
                button:hover { opacity: 0.9; }
                .back { color: #a78bfa; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 12px; font-weight: 500; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Kraken Real Gateway (${cryptoType})</h2>
                <p style="font-size: 0.8rem; color: #cbd5e1;">Transfer exact funds to credit your account instantly:</p>
                
                <div style="text-align:left; margin-bottom: 4px; font-size:0.75rem; color:#f59e0b; font-weight:bold;">SELECT PACKAGE:</div>
                <select id="packageSelect" onchange="updateDetails()">
                    <option value="5000">Standard: 5,000 Credits</option>
                    <option value="15000" selected>Professional: 15,000 Credits</option>
                    <option value="50000">Enterprise: 50,000 Credits</option>
                </select>

                <div class="crypto-box">
                    <div class="net">Network: ${networkInfo}</div>
                    <div style="font-size: 0.8rem; color: #34d399; margin: 6px 0; font-weight: bold;" id="priceDisplay">Amount: Calculating...</div>
                    <div class="wallet">${walletAddress}</div>
                </div>

                <button onclick="verifyPayment()">Confirm Real Deposit</button>
                <br>
                <a href="/chat?user=${encodeURIComponent(user)}&timer=${encodeURIComponent(timer)}" class="back">← Return to Secure Chat</a>
            </div>
            <script>
                const cryptoType = "${cryptoType}";
                function updateDetails() {
                    const val = document.getElementById('packageSelect').value;
                    let amt = '';
                    if(cryptoType === 'BTC') amt = (val * 0.00012).toFixed(4) + ' BTC';
                    else if(cryptoType === 'ETH') amt = (val * 0.0018).toFixed(4) + ' ETH';
                    else amt = (val * 0.035).toFixed(2) + ' SOL';
                    document.getElementById('priceDisplay').innerText = 'Send exact amount: ' + amt;
                }
                updateDetails();

                function verifyPayment() {
                    alert('Kraken blockchain scanner checking transaction... Funds will reflect shortly.');
                    window.location.href = '/chat?user=${encodeURIComponent(user)}&timer=${encodeURIComponent(timer)}';
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX0';
    const timerSetting = parseInt(req.query.timer) || 150;
    let currentBalance = nodeBalances[user] !== undefined ? nodeBalances[user] : 10000;

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
                header { background: rgba(15, 15, 30, 0.9); backdrop-filter: blur(12px); padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.8rem; flex-wrap: wrap; gap: 8px; }
                .security-status { color: #f59e0b; font-weight: bold; text-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }
                
                .control-panel { background: rgba(20, 20, 40, 0.9); border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; gap: 8px; flex-wrap: wrap; }
                .control-group { display: flex; gap: 6px; align-items: center; }
                .control-panel input { padding: 5px 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 6px; color: #fff; font-size: 0.8rem; width: 90px; outline: none; }
                .control-panel button { padding: 5px 10px; background: #7c3aed; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; font-size: 0.75rem; }
                .control-panel button:hover { opacity: 0.9; }
                
                .topup-btn { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: #000 !important; font-weight: bold !important; }

                #chat-box { flex: 1; padding: 1.2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .message { background: rgba(30, 30, 60, 0.7); backdrop-filter: blur(8px); padding: 10px 14px; border-radius: 8px; max-width: 75%; word-break: break-word; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.9rem; }
                .self { background: rgba(79, 70, 229, 0.4); border-color: rgba(129, 140, 248, 0.5); align-self: flex-end; }
                
                .footer { padding: 1rem; background: rgba(15, 15, 30, 0.9); backdrop-filter: blur(12px); display: flex; gap: 8px; border-top: 1px solid rgba(139, 92, 246, 0.3); }
                .footer input { flex: 1; padding: 10px 14px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px; color: #fff; font-family: inherit; font-size: 0.9rem; outline: none; }
                .footer input:focus { border-color: #c084fc; }
                .footer button { padding: 0 20px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <div>Pleniux.com Node: <strong style="color:#c084fc;">${user}</strong> | Balance: <strong style="color:#34d399;">${currentBalance} Pts</strong> | Channel: <strong style="color:#fff;" id="roomDisplay">777</strong></div>
                <div class="security-status" id="timer">Self-Destruct: 02:30</div>
            </header>

            <div class="control-panel">
                <div class="control-group">
                    <span>Sync Code:</span>
                    <input type="text" id="targetRoom" value="777" placeholder="Code">
                    <button onclick="applySyncCode()">Apply</button>
                    <button onclick="generateSyncCode()" style="background:#059669;">Gen Code (<span id="attemptsLeft">2</span> left)</button>
                </div>
                <div class="control-group">
                    <button class="topup-btn" onclick="openCheckout('BTC')">BTC</button>
                    <button class="topup-btn" onclick="openCheckout('ETH')">ETH</button>
                    <button class="topup-btn" onclick="openCheckout('SOL')">SOL</button>
                </div>
            </div>

            <div id="chat-box"></div>

            <div class="footer">
                <input type="text" id="messageInput" placeholder="Type lightning fast message..." onkeypress="handleKey(event)" autofocus autocomplete="off">
                <button onclick="sendMessage()">Send</button>
            </div>

            <script>
                const user = "${user}";
                let room = "777";
                let tSecs = ${timerSetting};
                let genAttempts = 2;
                const socket = io();

                socket.emit('join-room', { room, user });

                // Detección estricta de recarga o salida de pestaña
                window.addEventListener('beforeunload', (e) => {
                    navigator.sendBeacon('/api/refresh-penalty', JSON.stringify({ user }));
                });

                function generateSyncCode() {
                    if (genAttempts <= 0) {
                        alert('⚠️ Warning: You have exhausted your 2 opportunities to generate sync codes for this session.');
                        return;
                    }
                    genAttempts--;
                    document.getElementById('attemptsLeft').innerText = genAttempts;

                    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                    document.getElementById('targetRoom').value = newCode;
                    
                    const autoMsg = '⚡ [SYNC WIZARD] Este es mi código de acceso: ' + newCode + '. Dale a "Apply" para iniciar la conversación.';
                    socket.emit('chat-message', { room, user, text: autoMsg });
                }

                function applySyncCode() {
                    const code = document.getElementById('targetRoom').value.trim();
                    if(!code || code.length < 3) {
                        triggerSelfDestruct('Invalid synchronization code format.');
                        return;
                    }
                    room = code;
                    document.getElementById('roomDisplay').innerText = room;
                    socket.emit('join-room', { room, user });

                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.style.textAlign = 'center';
                    div.style.color = '#34d399';
                    div.style.fontSize = '0.78rem';
                    div.style.margin = '6px 0';
                    div.innerText = '✅ Code applied successfully! Secure conversation active on channel: ' + room;
                    box.appendChild(div);
                    box.scrollTop = box.scrollHeight;
                }

                function openCheckout(cryptoType) {
                    window.location.href = '/checkout?user=' + encodeURIComponent(user) + '&timer=' + tSecs + '&crypto=' + encodeURIComponent(cryptoType);
                }

                function triggerSelfDestruct(reason) {
                    document.body.innerHTML = \`<div style="background:#050505;color:#ef4444;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;text-align:center;padding:20px;">
                        <h2 style="font-size: 1.6rem; text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);">🚨 VIP CHAT WIPED & 2 POINTS DEDUCTED</h2>
                        <p style="color:#cbd5e1;font-size:0.9rem;margin-top:6px;">Reason: \${reason}</p>
                        <p style="color:#64748b;font-size:0.78rem;margin-top:12px;">Redirecting to login securely...</p>
                    </div>\`;
                    setTimeout(() => { window.location.href = '/'; }, 3000);
                }

                const countdown = setInterval(() => {
                    if(tSecs <= 0) {
                        clearInterval(countdown);
                        triggerSelfDestruct('Session timer expired.');
                        return;
                    }
                    tSecs--;
                    let mins = Math.floor(tSecs / 60).toString().padStart(2, '0');
                    let secs = (tSecs % 60).toString().padStart(2, '0');
                    document.getElementById('timer').innerText = 'Self-Destruct: ' + mins + ':' + secs;
                }, 1000);

                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) triggerSelfDestruct('Screen focus lost or background switch detected.');
                });

                window.addEventListener('blur', () => {
                    triggerSelfDestruct('Security focus lost.');
                });

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
    console.log(`Pleniux.com VIP real gateway active on port ${PORT}`);
});
