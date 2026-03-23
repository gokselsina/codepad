import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.join(__dirname, 'db.json');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {}, collections: {} }, null, 2), 'utf8');
}

function getDb() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) {
        return password === storedHash; // Plain text fallback for strictly old accounts
    }
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === key;
}

app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunlu' });

    const db = getDb();
    if (db.users[username]) return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });

    db.users[username] = hashPassword(password);
    db.collections[username] = {
        folders: [{ id: 'f_general_' + Date.now(), name: 'Genel', color: '#58a6ff' }],
        notes: []
    };
    saveDb(db);
    res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    if (db.users[username] && verifyPassword(password, db.users[username])) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }
});

app.get('/api/collection/:username', (req, res) => {
    const db = getDb();
    res.json(db.collections[req.params.username] || { folders: [], notes: [] });
});

app.post('/api/collection/:username', (req, res) => {
    const db = getDb();
    if (!db.users[req.params.username]) return res.status(401).json({ error: 'Unauthorized' });
    db.collections[req.params.username] = req.body;
    saveDb(db);
    res.json({ success: true });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for routing
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Kod Defteri API ve Sunucu port ${PORT} üzerinde başlatıldı.`);
});
