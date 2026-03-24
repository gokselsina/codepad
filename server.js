import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.join(__dirname, 'codepad.sqlite');
let db;

async function setupDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT
        );
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT,
            owner TEXT
        );
        CREATE TABLE IF NOT EXISTS team_members (
            team_id TEXT,
            username TEXT,
            PRIMARY KEY (team_id, username)
        );
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT,
            color TEXT,
            user_id TEXT,
            team_id TEXT,
            sort_order INTEGER
        );
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            folder_id TEXT,
            user_id TEXT,
            team_id TEXT,
            title TEXT,
            blocks TEXT,
            shared_with TEXT,
            sort_order INTEGER
        );
    `);

    // Migration Script
    const jsonPath = path.join(__dirname, 'db.json');
    if (fs.existsSync(jsonPath)) {
        try {
            console.log("Migrating db.json to SQLite...");
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            await db.run('BEGIN TRANSACTION');

            // Migrate users
            if (data.users) {
                for (const [username, hash] of Object.entries(data.users)) {
                    await db.run('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
                }
            }

            // Migrate collections
            if (data.collections) {
                for (const [username, coll] of Object.entries(data.collections)) {
                    let fOrder = 0;
                    for (const f of coll.folders || []) {
                        await db.run('INSERT OR REPLACE INTO folders (id, name, color, user_id, sort_order) VALUES (?, ?, ?, ?, ?)', [f.id, f.name, f.color, username, fOrder++]);
                    }
                    let nOrder = 0;
                    for (const n of coll.notes || []) {
                        await db.run('INSERT OR REPLACE INTO notes (id, folder_id, user_id, title, blocks, shared_with, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [n.id, n.folderId, username, n.title, JSON.stringify(n.blocks || []), JSON.stringify(n.sharedWith || []), nOrder++]);
                    }
                }
            }

            // Migrate teams
            if (data.teams) {
                for (const [teamId, t] of Object.entries(data.teams)) {
                    await db.run('INSERT OR IGNORE INTO teams (id, name, owner) VALUES (?, ?, ?)', [teamId, t.name, t.owner]);
                    for (const member of t.members || []) {
                        await db.run('INSERT OR IGNORE INTO team_members (team_id, username) VALUES (?, ?)', [teamId, member]);
                    }
                }
            }

            // Migrate team collections
            if (data.teamCollections) {
                for (const [teamId, coll] of Object.entries(data.teamCollections)) {
                    let fOrder = 0;
                    for (const f of coll.folders || []) {
                        await db.run('INSERT OR REPLACE INTO folders (id, name, color, team_id, sort_order) VALUES (?, ?, ?, ?, ?)', [f.id, f.name, f.color, teamId, fOrder++]);
                    }
                    let nOrder = 0;
                    for (const n of coll.notes || []) {
                        await db.run('INSERT OR REPLACE INTO notes (id, folder_id, team_id, title, blocks, shared_with, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [n.id, n.folderId, teamId, n.title, JSON.stringify(n.blocks || []), JSON.stringify(n.sharedWith || []), nOrder++]);
                    }
                }
            }

            await db.run('COMMIT');

            fs.renameSync(jsonPath, path.join(__dirname, 'db.json.backup'));
            console.log("Migration successful!");
        } catch (e) {
            await db.run('ROLLBACK');
            console.error("Migration failed:", e);
        }
    }
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) {
        return password === storedHash;
    }
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === key;
}

app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunlu' });

    const existing = await db.get('SELECT username FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });

    const hash = hashPassword(password);
    await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);

    await db.run('INSERT INTO folders (id, name, color, user_id, sort_order) VALUES (?, ?, ?, ?, ?)',
        ['f_general_' + Date.now(), 'Genel', '#58a6ff', username, 0]);

    res.json({ success: true });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT password_hash FROM users WHERE username = ?', [username]);

    if (user && verifyPassword(password, user.password_hash)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }
});

app.get('/api/users/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const rows = await db.all('SELECT username FROM users WHERE LOWER(username) LIKE ? LIMIT 10', [`%${q}%`]);
    res.json({ users: rows.map(r => r.username) });
});

app.get('/api/collection/:username', async (req, res) => {
    const reqUser = req.params.username;

    const folders = await db.all('SELECT id, name, color FROM folders WHERE user_id = ? ORDER BY sort_order', [reqUser]);
    const notesRaw = await db.all('SELECT id, folder_id as folderId, title, blocks, shared_with as sharedWith FROM notes WHERE user_id = ? ORDER BY sort_order', [reqUser]);

    const notes = notesRaw.map(n => ({
        ...n,
        blocks: JSON.parse(n.blocks || '[]'),
        sharedWith: JSON.parse(n.sharedWith || '[]')
    }));

    const sharedNotesRaw = await db.all('SELECT id, title, blocks, shared_with as sharedWith, user_id as owner FROM notes WHERE shared_with LIKE ?', [`%"${reqUser}"%`]);

    if (sharedNotesRaw.length > 0) {
        sharedNotesRaw.forEach(n => {
            notes.push({
                ...n,
                isShared: true,
                folderId: 'f_shared',
                title: `${n.title} (Gönderen: ${n.owner})`,
                blocks: JSON.parse(n.blocks || '[]'),
                sharedWith: JSON.parse(n.sharedWith || '[]')
            });
        });

        if (!folders.find(f => f.id === 'f_shared')) {
            folders.push({ id: 'f_shared', name: 'Paylaşılan Notlar 🤝', color: '#ffb058' });
        }
    }

    res.json({ folders, notes });
});

app.post('/api/collection/:username', async (req, res) => {
    const reqUser = req.params.username;

    const user = await db.get('SELECT username FROM users WHERE username = ?', [reqUser]);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let { folders, notes } = req.body;
    folders = folders.filter(f => f.id !== 'f_shared');
    notes = notes.filter(n => !n.isShared);

    await db.run('BEGIN TRANSACTION');
    try {
        await db.run('DELETE FROM folders WHERE user_id = ?', [reqUser]);
        await db.run('DELETE FROM notes WHERE user_id = ?', [reqUser]);

        let fOrder = 0;
        for (const f of folders) {
            await db.run('INSERT INTO folders (id, name, color, user_id, sort_order) VALUES (?, ?, ?, ?, ?)',
                [f.id, f.name, f.color, reqUser, fOrder++]);
        }

        let nOrder = 0;
        for (const n of notes) {
            await db.run('INSERT INTO notes (id, folder_id, user_id, title, blocks, shared_with, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [n.id, n.folderId || null, reqUser, n.title, JSON.stringify(n.blocks || []), JSON.stringify(n.sharedWith || []), nOrder++]);
        }
        await db.run('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

// --- TEAMS API ---
app.get('/api/teams/:username', async (req, res) => {
    const username = req.params.username;
    const rows = await db.all(`
        SELECT t.id, t.name, t.owner
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.username = ?
    `, [username]);

    const teams = [];
    for (const r of rows) {
        const members = await db.all('SELECT username FROM team_members WHERE team_id = ?', [r.id]);
        teams.push({
            ...r,
            members: members.map(m => m.username)
        });
    }

    res.json(teams);
});

app.post('/api/teams', async (req, res) => {
    const { name, owner } = req.body;
    const teamId = 't_' + Date.now();

    await db.run('BEGIN TRANSACTION');
    try {
        await db.run('INSERT INTO teams (id, name, owner) VALUES (?, ?, ?)', [teamId, name, owner]);
        await db.run('INSERT INTO team_members (team_id, username) VALUES (?, ?)', [teamId, owner]);
        await db.run('INSERT INTO folders (id, name, color, team_id, sort_order) VALUES (?, ?, ?, ?, ?)',
            ['tf_gen_' + Date.now(), 'Ekip Genel', '#10B981', teamId, 0]);
        await db.run('COMMIT');
        const newTeam = { id: teamId, name, owner, members: [owner] };
        res.json(newTeam);
    } catch (e) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/teams/:teamId/members', async (req, res) => {
    const { memberUsername } = req.body;
    const teamId = req.params.teamId;

    try {
        await db.run('INSERT OR IGNORE INTO team_members (team_id, username) VALUES (?, ?)', [teamId, memberUsername]);
        const team = await db.get('SELECT id, name, owner FROM teams WHERE id = ?', [teamId]);
        if (team) {
            const members = await db.all('SELECT username FROM team_members WHERE team_id = ?', [teamId]);
            res.json({ success: true, team: { ...team, members: members.map(m => m.username) } });
        } else {
            res.status(404).json({ error: 'Ekip bulunamadı' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/teams/:teamId/members/:username', async (req, res) => {
    const { teamId, username } = req.params;
    const { actor } = req.body;

    try {
        const team = await db.get('SELECT owner FROM teams WHERE id = ?', [teamId]);
        if (!team) return res.status(404).json({ error: 'Ekip bulunamadı' });
        if (team.owner !== actor) return res.status(403).json({ error: 'Sadece ekip sahibi üye çıkarabilir' });
        if (team.owner === username) return res.status(400).json({ error: 'Ekip sahibi kendini çıkaramaz' });

        await db.run('DELETE FROM team_members WHERE team_id = ? AND username = ?', [teamId, username]);
        const members = await db.all('SELECT username FROM team_members WHERE team_id = ?', [teamId]);
        res.json({ success: true, team: { ...team, members: members.map(m => m.username) } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/teams/collection/:teamId', async (req, res) => {
    const teamId = req.params.teamId;

    const folders = await db.all('SELECT id, name, color FROM folders WHERE team_id = ? ORDER BY sort_order', [teamId]);
    const notesRaw = await db.all('SELECT id, folder_id as folderId, title, blocks, shared_with as sharedWith FROM notes WHERE team_id = ? ORDER BY sort_order', [teamId]);

    const notes = notesRaw.map(n => ({
        ...n,
        blocks: JSON.parse(n.blocks || '[]'),
        sharedWith: JSON.parse(n.sharedWith || '[]')
    }));

    res.json({ folders, notes });
});

app.post('/api/teams/collection/:teamId', async (req, res) => {
    const teamId = req.params.teamId;
    let { folders, notes } = req.body;

    await db.run('BEGIN TRANSACTION');
    try {
        await db.run('DELETE FROM folders WHERE team_id = ?', [teamId]);
        await db.run('DELETE FROM notes WHERE team_id = ?', [teamId]);

        let fOrder = 0;
        for (const f of folders) {
            await db.run('INSERT INTO folders (id, name, color, team_id, sort_order) VALUES (?, ?, ?, ?, ?)',
                [f.id, f.name, f.color, teamId, fOrder++]);
        }

        let nOrder = 0;
        for (const n of notes) {
            await db.run('INSERT INTO notes (id, folder_id, team_id, title, blocks, shared_with, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [n.id, n.folderId || null, teamId, n.title, JSON.stringify(n.blocks || []), JSON.stringify(n.sharedWith || []), nOrder++]);
        }
        await db.run('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for routing
app.use((req, res) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint bulunamadı' });
    }
});

const PORT = process.env.PORT || 3001;

setupDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Kod Defteri API ve (SQLite) Sunucu port ${PORT} üzerinde başlatıldı.`);
    });
}).catch(console.error);
