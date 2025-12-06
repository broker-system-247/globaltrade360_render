const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
  EMAIL_USER: 'stevenlogan362@gmail.com',
  EMAIL_PASS: 'ezdftcffuatisxel',
  ADMIN_USER: 'globaltrade360',
  ADMIN_PASS: 'myhandwork2025'
};

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS
  }
});

// Database
const DB_FILE = path.join(__dirname, 'data.json');

function getDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        users: [
          {
            id: 1,
            username: 'testuser',
            password: 'Test123!',
            email: 'test@example.com',
            balance: 1500,
            name: 'Test User'
          }
        ],
        crypto: {
          bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          usdt: 'TNS1V6WVLkQRL2VQGP1C7nKFQZ0Gq9Zq1e'
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [], crypto: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  
  // Admin login
  if (username === CONFIG.ADMIN_USER && password === CONFIG.ADMIN_PASS) {
    return res.json({
      success: true,
      isAdmin: true,
      user: { username: CONFIG.ADMIN_USER, email: CONFIG.EMAIL_USER }
    });
  }
  
  // User login
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({
      success: true,
      isAdmin: false,
      user: { id: user.id, name: user.name, email: user.email, balance: user.balance }
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.post('/api/register', (req, res) => {
  const { name, email, username, password } = req.body;
  const db = getDB();
  
  // Check if exists
  if (db.users.some(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const newUser = {
    id: Date.now(),
    name,
    email,
    username,
    password,
    balance: 50,
    joined: new Date().toISOString()
  };
  
  db.users.push(newUser);
  saveDB(db);
  
  res.json({
    success: true,
    message: 'Registration successful! $50 bonus added.',
    user: { id: newUser.id, name, email, username, balance: 50 }
  });
});

app.get('/api/crypto', (req, res) => {
  const db = getDB();
  res.json({ success: true, addresses: db.crypto });
});

app.post('/api/admin/update-crypto', (req, res) => {
  const { bitcoin, ethereum, usdt, adminKey } = req.body;
  
  if (adminKey !== CONFIG.ADMIN_PASS) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const db = getDB();
  db.crypto = {
    bitcoin: bitcoin || db.crypto.bitcoin,
    ethereum: ethereum || db.crypto.ethereum,
    usdt: usdt || db.crypto.usdt
  };
  
  saveDB(db);
  res.json({ success: true, addresses: db.crypto });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`🔐 Admin: ${CONFIG.ADMIN_USER} / ${CONFIG.ADMIN_PASS}`);
  console.log(`👤 Test: testuser / Test123!`);
});
