const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const https = require('https');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 10 * 1024 * 1024 });

app.set('trust proxy', true);

// Sirve tu index.html original exactamente como lo diseñaste
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const registeredUsers = {};
const userBalances = {};
const bannedDeviceFingerprints = new Set();
const bannedIPs = new Set();
const activeSockets = {};
const privateMessageHistory = {};

const FOUNDER_BTC_ADDRESS = 'bc1qep3ntxf6lz037ny04706u88jsl364p0ny4776s';

// Limpieza automática por inactividad
setInterval(() => {
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const NINE_DAYS = 9 * 24 * 60 * 60 * 1000;

  for (const [username, data] of Object.entries(registeredUsers)) {
    if (username === 'UX0') continue;
    if (now - (data.lastLogin || data.createdAt) > THREE_DAYS || now - data.createdAt > NINE_DAYS) {
      delete registeredUsers[username];
      delete userBalances[username];
    }
  }
}, 60 * 60 * 1000);

function checkRealBlockchainPayment(expectedBtcAmount, callback) {
  const url = `https://mempool.space/api/address/${FOUNDER_BTC_ADDRESS}/txs`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const txs = JSON.parse(data);
        if (!Array.isArray(txs) || txs.length === 0) {
          return callback(false, 'No transactions found on this address yet.');
        }

        const recentTxs = txs.slice(0, 5);
        let paymentFound = false;

        for (let tx of recentTxs) {
          for (let vout of tx.vout) {
            if (vout.scriptpubkey_address === FOUNDER_BTC_ADDRESS) {
              const receivedBtc = vout.value / 100000000;
              if (receivedBtc >= (expectedBtcAmount * 0.95)) {
                paymentFound = true;
                break;
              }
            }
          }
          if (paymentFound) break;
        }

        if (paymentFound) {
          callback(true, 'Payment successfully confirmed on the real Bitcoin blockchain!');
        } else {
          callback(false, 'Payment not detected on the network yet.');
        }
      } catch (e) {
        callback(false, 'Error parsing blockchain network response.');
      }
    });
  }).on('error', () => {
    callback(false, 'Could not connect to the Bitcoin network API.');
  });
}

io.on('connection', (socket) => {
  const rawIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '';
  const clientIp = rawIp.split(',')[0].trim();

  socket.on('check_security_status', (data) => {
    const { deviceFingerprint } = data || {};
    if ((clientIp && bannedIPs.has(clientIp)) || (deviceFingerprint && bannedDeviceFingerprints.has(deviceFingerprint))) {
      socket.emit('security_lockout', { message: 'CRITICAL SECURITY BLOCK: This network or device has already registered an account.' });
    }
  });

  // REGISTRO SEGURO CON BONO DE 20 UX Y BLOQUEO DURO DE IP/HARDWARE
  socket.on('register_node', (data) => {
    let { customId, password, deviceFingerprint } = data;
    
    if (clientIp && bannedIPs.has(clientIp)) {
      socket.emit('auth_error', { message: 'SECURITY BLOCK: This network (IP) has already registered an account. Zero exceptions.' });
      return;
    }

    if (deviceFingerprint && bannedDeviceFingerprints.has(deviceFingerprint)) {
      socket.emit('auth_error', { message: 'SECURITY BLOCK: This device has already registered an account. Strict 1-device limit.' });
      return;
    }

    if (!customId || password === undefined) {
      socket.emit('auth_error', { message: 'Missing ID or numeric password.' });
      return;
    }

    customId = customId.toString().trim();
    const numericId = parseInt(customId, 10);

    if (isNaN(numericId) || numericId < 0 || numericId > 1000000) {
      socket.emit('auth_error', { message: 'Access Denied: ID out of range (0 to 1,000,000).' });
      return;
    }

    const username = 'UX' + numericId;
    
    if (registeredUsers[username]) {
      socket.emit('auth_error', { message: 'Error: This ID is already registered and active.' });
      return;
    }

    const now = Date.now();
    registeredUsers[username] = {
      password: password,
      createdAt: now,
      lastLogin: now,
      deviceFingerprint: deviceFingerprint || 'unknown',
      ip: clientIp || 'unknown'
    };
    
    userBalances[username] = (numericId === 0) ? 99999.0 : 20.0;
    
    if (clientIp) bannedIPs.add(clientIp);
    if (deviceFingerprint) bannedDeviceFingerprints.add(deviceFingerprint);
    
    socket.emit('register_success', { 
      message: `Node ${username} registered successfully! 20 UX welcome bonus credited.`,
      username: username
    });
  });

  socket.on('auth_node', (data) => {
    let { customId, password } = data;
    if (customId === undefined || password === undefined) {
      socket.emit('auth_error', { message: 'Please enter your ID and numeric password.' });
      return;
    }

    customId = customId.toString().trim();
    const numericId = parseInt(customId, 10);
    const username = 'UX' + numericId;
    
    if (numericId === 0 && (password === '197126' || password === '0' || (registeredUsers[username] && registeredUsers[username].password === password))) {
      registeredUsers['UX0'] = { password: password || '197126', createdAt: Date.now(), lastLogin: Date.now() };
      userBalances['UX0'] = 99999.0;
      activeSockets['UX0'] = socket.id;
      
      socket.emit('auth_success', {
        role: 'FOUNDER_VIP',
        badge: '★ UX 0 [FOUNDER & SUPREME CONTROLLER ✓]',
        balance: userBalances['UX0'],
        isVip: true,
        isAdmin: true,
        username: 'UX0'
      });
      return;
    }

    const userData = registeredUsers[username];

    if (userData && userData.password === password) {
      userData.lastLogin = Date.now();
      if (userBalances[username] === undefined) userBalances[username] = 20.0;
      activeSockets[username] = socket.id;
      const isVip = userBalances[username] >= 500.0; 

      socket.emit('auth_success', {
        role: 'OPERATOR',
        badge: isVip ? `${username} [SECURE VIP OPERATOR ✓]` : `${username} [SECURE OPERATOR]`,
        balance: userBalances[username],
        isVip: isVip,
        isAdmin: false,
        username: username
      });
    } else {
      socket.emit('auth_error', { message: 'Invalid credentials, expired account, or access denied.' });
    }
  });

  // VERIFICACIÓN DE PAGOS BLOCKCHAIN CON LOS NUEVOS PAQUETES
  socket.on('verify_btc_payment', (data) => {
    let { username, packageType } = data;
    if (!username || userBalances[username] === undefined) {
      socket.emit('auth_error', { message: 'Session error during payment check.' });
      return;
    }

    let requiredBtc = 0.000015;
    let creditedUx = 200;
    
    if (packageType.includes('200 UX')) { requiredBtc = 0.000015; creditedUx = 200; }
    else if (packageType.includes('3666 UX')) { requiredBtc = 0.00012; creditedUx = 3666; }
    else if (packageType.includes('6666 UX')) { requiredBtc = 0.00038; creditedUx = 6666; }
    else if (packageType.includes('16666 UX')) { requiredBtc = 0.00058; creditedUx = 16666; }
    else if (packageType.includes('69999 UX')) { requiredBtc = 0.0017; creditedUx = 69999; }
    else if (packageType.includes('150000 UX') || packageType.includes('150,000 UX')) { requiredBtc = 0.0036; creditedUx = 150000; }

    checkRealBlockchainPayment(requiredBtc, (isPaid, message) => {
      if (isPaid) {
        userBalances[username] += creditedUx;
        socket.emit('balance_updated', { 
          newBalance: userBalances[username], 
          message: `Payment verified on blockchain! ${creditedUx} UX credited to your wallet.` 
        });
      } else {
        socket.emit('auth_error', { message: `Verification failed: ${message}` });
      }
    });
  });

  socket.on('penalize_session_exit', (data) => {
    const { username } = data;
    if (username && username !== 'UX0' && userBalances[username] !== undefined) {
      userBalances[username] = Math.max(0, userBalances[username] - 2.0);
      for (const roomId of Object.keys(privateMessageHistory)) {
        if (roomId.includes(username)) delete privateMessageHistory[roomId];
      }
      socket.emit('force_logout_penalty', { 
        newBalance: userBalances[username], 
        message: 'Security Alert: Session expired. -2 UX deducted and chat wiped.' 
      });
    }
  });

  socket.on('open_direct_chat', (data) => {
    let { sender, recipient } = data;
    if (!recipient) return;
    recipient = recipient.trim();
    const targetFull = recipient.toUpperCase().startsWith('UX') ? recipient.toUpperCase() : 'UX' + recipient.replace(/\D/g, '');

    if (targetFull === sender) {
      socket.emit('auth_error', { message: 'You cannot open a direct chat with yourself.' });
      return;
    }

    const usersPair = [sender, targetFull].sort();
    const chatRoomId = `DIRECT-${usersPair[0]}-${usersPair[1]}`;
    socket.join(chatRoomId);

    if (!privateMessageHistory[chatRoomId]) privateMessageHistory[chatRoomId] = [];

    socket.emit('direct_chat_opened', {
      room: chatRoomId,
      recipient: targetFull,
      history: privateMessageHistory[chatRoomId]
    });
  });

  socket.on('send_direct_message', (data) => {
    const { room, sender, recipient, text, image } = data;
    if ((!text && !image) || !room) return;

    const messageData = { sender, text: text || '', image: image || null, timestamp: new Date().toLocaleTimeString() };
    if (!privateMessageHistory[room]) privateMessageHistory[room] = [];
    privateMessageHistory[room].push(messageData);

    io.to(room).emit('receive_direct_message', messageData);
    const recipientSocketId = activeSockets[recipient];
    if (recipientSocketId) io.sockets.sockets.get(recipientSocketId)?.join(room);
  });

  socket.on('disconnect', () => {
    for (const [user, sId] of Object.entries(activeSockets)) {
      if (sId === socket.id) {
        delete activeSockets[user];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Pleniux Secure Node running on port ${PORT}`);
});
