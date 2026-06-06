// Servidor Node.js Potente: Soporta SQLite (Local) y PostgreSQL (Despliegue)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg'); // Driver para PostgreSQL
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static('.'));

// --- CONFIGURACIÓN DE BASE DE DATOS ---
let db;
const IS_PROD = process.env.DATABASE_URL ? true : false;

if (IS_PROD) {
    // Configuración para PostgreSQL (Railway / Supabase)
    console.log('🚀 Iniciando en modo PRODUCCIÓN con PostgreSQL');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    // Crear tablas en PostgreSQL
    const initQuery = `
        CREATE TABLE IF NOT EXISTS entries (
            id BIGINT PRIMARY KEY,
            type TEXT,
            title TEXT,
            text TEXT,
            date TEXT,
            photos TEXT,
            price TEXT,
            status TEXT,
            serverTimestamp TEXT
        );
    `;
    db.query(initQuery).catch(err => console.error('❌ Error init Postgres:', err));

} else {
    // Configuración para SQLite (Desarrollo Local)
    console.log('💻 Iniciando en modo DESARROLLO con SQLite');
    const sqliteDb = new sqlite3.Database('./diary.db');
    
    // Adaptador para que SQLite use la misma interfaz que el Pool de pg
    db = {
        query: (text, params) => {
            return new Promise((resolve, reject) => {
                // Convertir sintaxis $1, $2 de Postgres a SQLite (?)
                const sql = text.replace(/\$(\d+)/g, '?');
                if (text.trim().toUpperCase().startsWith('SELECT')) {
                    sqliteDb.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve({ rows });
                    });
                } else {
                    sqliteDb.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ rows: [], lastID: this.lastID });
                    });
                }
            });
        }
    };

    // Crear tabla en SQLite
    db.query(`CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY,
        type TEXT,
        title TEXT,
        text TEXT,
        date TEXT,
        photos TEXT,
        price TEXT,
        status TEXT,
        serverTimestamp TEXT
    )`).then(() => {
        // Asegurar columnas para migración local
        ['type', 'price', 'status'].forEach(col => {
            db.query(`ALTER TABLE entries ADD COLUMN ${col} TEXT`).catch(() => {});
        });
    });
}

// --- API ---

app.post('/api/sync-local-entries', async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries)) return res.status(400).json({ error: 'No data' });

        for (const entry of entries) {
            const photosJson = JSON.stringify(entry.photos || []);
            const query = `
                INSERT INTO entries (id, type, title, text, date, photos, price, status, serverTimestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET
                    type = EXCLUDED.type,
                    title = EXCLUDED.title,
                    text = EXCLUDED.text,
                    photos = EXCLUDED.photos,
                    price = EXCLUDED.price,
                    status = EXCLUDED.status,
                    serverTimestamp = EXCLUDED.serverTimestamp;
            `;
            const params = [
                entry.id, entry.type || 'recuerdos', entry.title, entry.text,
                entry.date || new Date().toISOString(), photosJson,
                entry.price || null, entry.status || null, new Date().toISOString()
            ];
            await db.query(query, params);
        }
        res.json({ success: true, count: entries.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/entries', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM entries ORDER BY id DESC');
        const entries = result.rows.map(row => ({
            ...row,
            photos: JSON.parse(row.photos || '[]')
        }));
        res.json({ success: true, entries });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const { entry } = req.body;
        const photosJson = JSON.stringify(entry.photos || []);
        const query = `
            INSERT INTO entries (id, type, title, text, date, photos, price, status, serverTimestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                type = EXCLUDED.type,
                title = EXCLUDED.title,
                text = EXCLUDED.text,
                photos = EXCLUDED.photos,
                price = EXCLUDED.price,
                status = EXCLUDED.status,
                serverTimestamp = EXCLUDED.serverTimestamp;
        `;
        const params = [
            entry.id, entry.type || 'recuerdos', entry.title, entry.text,
            entry.date || new Date().toISOString(), photosJson,
            entry.price || null, entry.status || null, new Date().toISOString()
        ];
        await db.query(query, params);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});