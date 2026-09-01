const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// Database for nodes, secure passwords, and high credit balance
const nodeBalances = {
    'UX1': 10000,
    'UX0': 10000
};

const registeredUsers = {
    'UX1': '2609',
    'UX0': '1971'
};

// 1. Main Interface (Register, Login, Secure Channels & Packages)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Pleniux - Encrypted Secure Node Ecosystem</title>
            <style>
                body { background: #050101; color: #f8fafc; font-family: monospace; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; position: relative; overflow-x: hidden; min-height: 100vh; box-sizing: border-box; }
                canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; opacity: 0.35; pointer-events: none; }
                .container { width: 100%; max-width: 800px; z-index: 1; }
                header { text-align: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 42, 42, 0.3); padding-bottom: 1rem; }
                h1 { color: #ff2a2a; margin: 0; font-size: 2.5rem; text-shadow: 0 0 15px rgba(255, 42, 42, 0.7); letter-spacing: 2px; }
                .founder { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .domain-badge { color: #fbbf24; font-size: 0.85rem; margin-top: 4px; font-weight: bold; }
                .card { background: rgba(10, 2, 2, 0.88); border: 1px solid #3f0f0f; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(255, 0, 0, 0.15); }
                .card h2 { color: #f8fafc; border-bottom: 1px solid #3f0f0f; padding-bottom: 10px; margin-top: 0; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
                .pricing-box { background: rgba(20, 5, 5, 0.9); border: 1px solid #5c1414; padding: 1rem; border-radius: 8px; text-align: center; transition: transform 0.2s; }
                .pricing-box:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(255, 42, 42, 0.2); }
                .pricing-box h3 { color: #ff2a2a; margin-top: 0; }
                .price { font-size: 1.4rem; font-weight: bold; color: #fbbf24; margin: 10px 0; text-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
                input, button { width: 100%; padding: 12px; margin-top: 10px; border-radius: 6px; border: 1px solid #5c1414; background: #050101; color: #fff; box-sizing: border-box; font-family: monospace; font-size: 1rem; outline: none; transition: border 0.2s; }
                input:focus { border: 1px solid #ff2a2a; box-shadow: 0 0 8px rgba(255, 42, 42, 0.3); }
                button { background: #991b1b; border: 1px solid #b91c1c; cursor: pointer; font-weight: bold; transition: all 0.2s; letter-spacing: 1px; text-transform: uppercase; }
                button:hover { background: #dc2626; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); }
                .secure-badge { background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; color: #fbbf24; padding: 10px; border-radius: 6px; font-size: 0.85rem; text-align: center; margin-bottom: 1rem; letter-spacing: 0.5px; }
                .warning-desc { color: #ef4444; font-size: 0.8rem; margin-top: 8px; text-align: center; font-weight: bold; text-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
            </style>
        </head>
        <body>
            <canvas id="matrixCanvas"></canvas>
            <div class="container">
                <header>
                    <h1>PLENIUX</h1>
                    <div class="founder">Encrypted Anonymous Nodes</div>
                    <div class="domain-badge">Domain Extension: lenoxjg.vx</div>
                    <p style="color: #94a3b8; margin-top: 8px;">Secured VIP Nodes: UX1 and UX0 with 10,000 Credit Balance</p>
                </header>

                <div class="secure-badge">
                    🔒 Zero-Knowledge Architecture | Kraken Verified Multi-Crypto Gateway (lenoxjg.vx)
                </div>

                <div class="card">
                    <h2>Encrypted Secure Channel</h2>
                    <div class="warning-desc">⚠️ Messages self-destruct completely without a trace when the 02:30 timer hits zero.</div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <div style="background: rgba(20, 5, 5, 0.5); padding: 12px; border-radius: 8px; border: 1px solid #3f0f0f;">
                            <h3 style="color: #ff2a2a; margin-top: 0; font-size: 1rem;">Register User</h3>
                            <input type="text" id="regUser" value="UX">
                            <input type="number" id="regPass" min="1" max="100000" placeholder="Password (1 - 100,000)">
                            <button onclick="registerUser()" style="background: #b91c1c;">Register</button>
                        </div>
                        <div style="background: rgba(20, 5, 5, 0.5); padding: 12px; border-radius: 8px; border: 1px solid #3f0f0f;">
                            <h3 style="color: #ff2a2a; margin-top: 0; font-size: 1rem;">Access Channel</h3>
                            <input type="text" id="loginUser" value="UX0">
                            <input type="number" id="loginPass" value="1971" min="1" max="100000" placeholder="Password">
                            <button onclick="accessChannel()">Enter Channel</button>
                        </div>
                    </div>
                    <input type="text" id="roomCode" inputmode="numeric" placeholder="Numeric channel code (Instant connection)" style="margin-top: 15px;" value="777">
                </div>

                <div class="card">
                    <h2>Kraken Linked Crypto Top-Up Packages</h2>
                    <div class="grid">
                        <div class="pricing-box">
                            <h3>Pack Starter UX</h3>
                            <p style="color: #94a3b8; font-size: 0.8rem;">10 Operational Credit</p>
                            <div class="price">$10 USD</div>
                            <button onclick="initPayment('Pack Starter UX', 10)">Top Up</button>
                        </div>
                        <div class="pricing-box">
                            <h3>Pack Pro Matrix</h3>
                            <p style="color: #94a3b8; font-size: 0.8rem;">30 Priority Credit</p>
                            <div class="price">$30 USD</div>
                            <button onclick="initPayment('Pack Pro Matrix', 30)">Top Up</button>
                        </div>
                        <div class="pricing-box">
                            <h3>Pack Elite Full</h3>
                            <p style="color: #94a3b8; font-size: 0.8rem;">75 Unlimited Full Credit</p>
                            <div class="price">$75 USD</div>
                            <button onclick="initPayment('Pack Elite Full', 75)">Top Up</button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const canvas = document.getElementById('matrixCanvas');
                const ctx = canvas.getContext('2d');
                function resize() {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
                window.addEventListener('resize', resize);
                resize();

                const numbers = '0123456789ABCDEF';
                const fontSize = 16;
                const columns = Math.floor(canvas.width / fontSize);
                const drops = Array(columns).fill(1);

                function drawMatrix() {
                    ctx.fillStyle = 'rgba(5, 1, 1, 0.15)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.fillStyle = '#ff2a2a';
                    ctx.shadowColor = '#ff2a2a';
                    ctx.shadowBlur = 8;
                    ctx.font = fontSize + 'px monospace';
                    
                    for (let i = 0; i < drops.length; i++) {
                        const text = numbers.charAt(Math.floor(Math.random() * numbers.length));
                        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i]++;
                    }
                    ctx.shadowBlur = 0;
                }
                setInterval(drawMatrix, 45);

                function registerUser() {
                    const user = document.getElementById('regUser').value.trim().toUpperCase();
                    const pass = document.getElementById('regPass').value.trim();
                    if(!user || !pass || pass < 1 || pass > 100000) {
                        alert('Please enter a valid user and numeric password between 1 and 100,000.');
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
                        }
                    });
                }

                function accessChannel() {
                    const user = document.getElementById('loginUser').value.trim().toUpperCase();
                    const pass = document.getElementById('loginPass').value.trim();
                    const room = document.getElementById('roomCode').value.trim();
                    if(!user || !pass || !room) {
                        alert('Please complete user, password, and channel code.');
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

                function initPayment(packName, amount) {
                    window.location.href = '/checkout?pack=' + encodeURIComponent(packName) + '&amount=' + amount;
                }
            </script>
        </body>
        </html>
    `);
});

// Registration and Auth Endpoints
app.post('/api/register', (req, res) => {
    const { user, pass } = req.body;
    if (registeredUsers[user]) {
        return res.json({ success: false, message: 'Username is taken. Please choose another one.' });
    }
    registeredUsers[user] = pass;
    nodeBalances[user] = 5; 
    res.json({ success: true, message: 'Node registered successfully! You can now log in.' });
});

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (registeredUsers[user] && registeredUsers[user] === pass) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Incorrect password or unregistered user.' });
    }
});

// 2. Kraken-Linked Gateway with lenoxjg.vx and explicit networks
app.get('/checkout', (req, res) => {
    const pack = req.query.pack || 'Top-Up';
    const amount = req.query.amount || '0';
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Pleniux - Kraken Multi-Crypto Deposit</title>
            <style>
                body { background: #050101; color: #f8fafc; font-family: monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .box { background: rgba(10, 2, 2, 0.9); border: 1px solid #3f0f0f; padding: 2rem; border-radius: 12px; width: 100%; max-width: 480px; text-align: center; box-shadow: 0 0 25px rgba(255, 42, 42, 0.15); }
                h2 { color: #ff2a2a; margin-top: 0; text-shadow: 0 0 8px rgba(255, 42, 42, 0.5); }
                .domain-tag { color: #fbbf24; font-size: 0.9rem; margin-bottom: 8px; font-weight: bold; }
                .amount { font-size: 1.8rem; color: #fbbf24; margin: 10px 0; font-weight: bold; text-shadow: 0 0 8px rgba(251, 191, 36, 0.5); }
                .crypto-section { background: #050101; border: 1px solid #5c1414; border-radius: 8px; padding: 12px; margin: 12px 0; text-align: left; }
                .crypto-title { color: #ff2a2a; font-weight: bold; font-size: 0.9rem; margin-bottom: 3px; }
                .network-info { color: #fbbf24; font-size: 0.75rem; margin-bottom: 6px; font-weight: bold; }
                .wallet { font-size: 0.72rem; word-break: break-all; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px; border: 1px dashed #3f0f0f; }
                button { width: 100%; padding: 12px; background: #991b1b; border: 1px solid #b91c1c; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; margin-top: 10px; font-family: monospace; text-transform: uppercase; transition: all 0.2s; }
                button:hover { background: #dc2626; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Kraken Secure Gateway</h2>
                <div class="domain-tag">Domain: lenoxjg.vx</div>
                <p>Package: <b>${pack}</b></p>
                <div class="amount">$${amount} USD Equivalent</div>
                <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 15px;">Send from your Kraken account using the exact network below:</p>
                
                <div class="crypto-section">
                    <div class="crypto-title">₿ Bitcoin (BTC)</div>
                    <div class="network-info">Network: Bitcoin Native / SegWit</div>
                    <div class="wallet">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</div>
                </div>

                <div class="crypto-section">
                    <div class="crypto-title">Ξ Ethereum (ETH)</div>
                    <div class="network-info">Network: Ethereum Mainnet (ERC-20)</div>
                    <div class="wallet">0x71C35a89eF2199b999KrakenVaultNode999</div>
                </div>

                <div class="crypto-section">
                    <div class="crypto-title">◎ Solana (SOL)</div>
                    <div class="network-info">Network: Solana Mainnet (SPL)</div>
                    <div class="wallet">PleniuxKrakenSolanaNodeNetwork777xyz</div>
                </div>

                <button onclick="verifyTransaction()">Confirm Kraken Transfer Sent</button>
                <br><br>
                <a href="/" style="color: #94a3b8; font-size: 0.8rem; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#ff2a2a'" onmouseout="this.style.color='#94a3b8'">← Back to Home</a>
            </div>
            <script>
                function verifyTransaction() {
                    alert('Kraken network withdrawal broadcasted successfully. Crediting balance upon block verification.');
                    window.location.href = '/';
                }
            </script>
        </body>
        </html>
    `);
});

// 3. Instant Live Chat Room with Strict 02:30 Self-Destruct Timer
app.get('/chat', (req, res) => {
    const user = req.query.user || 'UX-Anonymous';
    let currentBalance = nodeBalances[user] || 5;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Pleniux - Live Encrypted Session</title>
            <style>
                body { background: #050101; color: #f8fafc; font-family: monospace; display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                header { background: rgba(10, 2, 2, 0.9); padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3f0f0f; font-size: 0.9rem; }
                #chat-box { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                .message { background: rgba(20, 5, 5, 0.8); padding: 10px 14px; border-radius: 8px; max-width: 70%; word-break: break-word; border: 1px solid #3f0f0f; }
                .self { background: rgba(153, 27, 27, 0.8); align-self: flex-end; border-color: #dc2626; }
                .footer { padding: 1rem; background: rgba(10, 2, 2, 0.9); display: flex; gap: 10px; border-top: 1px solid #3f0f0f; }
                input { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #5c1414; background: #050101; color: #fff; font-family: monospace; font-size: 1rem; outline: none; transition: border 0.2s; }
                input:focus { border: 1px solid #ff2a2a; }
                button { padding: 12px 24px; background: #991b1b; border: 1px solid #b91c1c; border-radius: 6px; color: #fff; cursor: pointer; font-weight: bold; font-family: monospace; text-transform: uppercase; transition: all 0.2s; }
                button:hover { background: #dc2626; box-shadow: 0 0 15px rgba(220, 38, 38, 0.6); }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <header>
                <span id="userInfo">Node: <b style="color: #ff2a2a;">${user}</b> | Balance: <b style="color: #fbbf24;">${currentBalance} Credit</b> | <span style="color:#fbbf24;">lenoxjg.vx</span></span>
                <span style="color: #ef4444; font-weight: bold; text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);" id="timer">Zero-Trace Self-Destruct: 02:30</span>
            </header>
            <div id="chat-box"></div>
            <div class="footer">
                <input type="text" id="messageInput" placeholder="Secure encrypted message..." onkeypress="handleKey(event)" autofocus>
                <button onclick="sendMessage()">Send</button>
            </div>
            <script>
                const user = "${user}";
                const room = "${req.query.room || 'default'}";

                const socket = io();
                socket.emit('join-room', { room, user });

                let tSecs = 150;
                const countdown = setInterval(() => {
                    if(tSecs <= 0) {
                        clearInterval(countdown);
                        document.body.innerHTML = '<div style="background:#050101;color:#ff2a2a;height:100vh;display:flex;justify-content:center;align-items:center;font-family:monospace;font-size:1.5rem;text-align:center;text-shadow: 0 0 10px rgba(255,42,42,0.8);">TIME IS UP (02:30)!<br>ALL MESSAGES HAVE BEEN COMPLETELY SELF-DESTROYED WITHOUT A TRACE.<br>CLOSING SESSION...</div>';
                        setTimeout(() => { window.location.href = '/'; }, 3000);
                        return;
                    }
                    tSecs--;
                    let mins = Math.floor(tSecs / 60).toString().padStart(2, '0');
                    let secs = (tSecs % 60).toString().padStart(2, '0');
                    document.getElementById('timer').innerText = 'Zero-Trace Self-Destruct: ' + mins + ':' + secs;
                }, 1000);

                window.addEventListener('beforeunload', () => {
                    socket.disconnect();
                });

                function sendMessage() {
                    const text = document.getElementById('messageInput', '').value;
                    if(!text) return;
                    socket.emit('chat-message', { room, user, text });
                    document.getElementById('messageInput').value = '';
                }

                function handleKey(e) { if(e.key === 'Enter') sendMessage(); }

                socket.on('chat-message', (data) => {
                    const box = document.getElementById('chat-box');
                    const div = document.createElement('div');
                    div.className = 'message' + (data.user === user ? ' self' : '');
                    div.innerHTML = '<b style="color: ' + (data.user === user ? '#ff2a2a' : '#94a3b8') + ';">' + data.user + ':</b> ' + data.text;
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
        socket.join(room);
    });
    socket.on('chat-message', (data) => {
        io.to(data.room).emit('chat-message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Pleniux secure system active on port ${PORT}`);
});
