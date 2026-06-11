// Servidor Node.js para Railway con PostgreSQL
require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static('.'));

// --- CONFIGURACIÓN DE BASE DE DATOS PostgreSQL ---
const IS_PROD = process.env.DATABASE_URL ? true : false;

if (!process.env.DATABASE_URL) { 
    console.log('No se encontró DATABASE_URL en las variables de entorno'); 
} 

console.log('DATABASE_URL:', process.env.DATABASE_URL); 

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PROD ? { rejectUnauthorized: false } : false
});

console.log(IS_PROD ? '🚀 Iniciando en modo PRODUCCIÓN con PostgreSQL' : '💻 Iniciando en modo DESARROLLO con PostgreSQL');

// Crear tabla si no existe
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
    
    CREATE TABLE IF NOT EXISTS cuaderno (
        id SERIAL PRIMARY KEY,
        text TEXT,
        lastSaved TEXT,
        serverTimestamp TEXT
    );
    
    CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        date TEXT,
        type TEXT,
        reminder BOOLEAN,
        serverTimestamp TEXT
    );
`;

db.query(initQuery)
    .then(() => console.log('✅ Tabla "entries" lista'))
    .catch(err => console.error('❌ Error creando tabla:', err));

// --- API ENDPOINTS ---

app.post('/api/sync-local-entries', async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ error: 'No data provided' });
        }

        let syncedCount = 0;
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
                entry.id,
                entry.type || 'recuerdos',
                entry.title || '',
                entry.text || '',
                entry.date || new Date().toISOString(),
                photosJson,
                entry.price || null,
                entry.status || null,
                new Date().toISOString()
            ];
            await db.query(query, params);
            syncedCount++;
        }
        
        console.log(`✅ Sincronizadas ${syncedCount} entradas`);
        res.json({ success: true, syncedCount });
    } catch (error) {
        console.error('❌ Error en sync:', error);
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
        console.error('❌ Error obteniendo entradas:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const { entry } = req.body;
        if (!entry || !entry.id) {
            return res.status(400).json({ error: 'Invalid entry data' });
        }
        
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
            entry.id,
            entry.type || 'recuerdos',
            entry.title || '',
            entry.text || '',
            entry.date || new Date().toISOString(),
            photosJson,
            entry.price || null,
            entry.status || null,
            new Date().toISOString()
        ];
        await db.query(query, params);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error guardando entrada:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        const entryId = req.params.id;
        const query = 'DELETE FROM entries WHERE id = $1';
        await db.query(query, [entryId]);
        console.log(`🗑️  Entrada ${entryId} eliminada`);
        res.json({ success: true, message: 'Entrada eliminada' });
    } catch (error) {
        console.error('❌ Error eliminando entrada:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check para Railway
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== ENDPOINTS DEL CUADERNO ==========
// Guardar cuaderno
app.post('/api/cuaderno', async (req, res) => {
    try {
        const { text, lastSaved } = req.body;
        const serverTimestamp = new Date().toISOString();
        
        // Eliminar cualquier entrada anterior (solo guardamos la última versión)
        await db.query('DELETE FROM cuaderno');
        
        // Insertar nueva versión
        const query = 'INSERT INTO cuaderno (text, lastSaved, serverTimestamp) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [text, lastSaved, serverTimestamp]);
        
        console.log('📝 Cuaderno guardado en servidor');
        res.json({ success: true, cuaderno: result.rows[0] });
    } catch (error) {
        console.error('❌ Error guardando cuaderno:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener cuaderno
app.get('/api/cuaderno', async (req, res) => {
    try {
        const query = 'SELECT * FROM cuaderno ORDER BY id DESC LIMIT 1';
        const result = await db.query(query);
        
        if (result.rows.length > 0) {
            console.log('📖 Cuaderno recuperado del servidor');
            res.json({ success: true, cuaderno: result.rows[0] });
        } else {
            res.json({ success: true, cuaderno: null });
        }
    } catch (error) {
        console.error('❌ Error obteniendo cuaderno:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ENDPOINTS DEL CALENDARIO ==========
// Obtener todos los eventos
app.get('/api/calendar-events', async (req, res) => {
    try {
        const query = 'SELECT * FROM calendar_events ORDER BY date ASC';
        const result = await db.query(query);
        console.log(`📅 ${result.rows.length} eventos del calendario recuperados`);
        res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error('❌ Error obteniendo eventos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar un evento
app.post('/api/calendar-events', async (req, res) => {
    try {
        const { event } = req.body;
        const serverTimestamp = new Date().toISOString();
        
        const query = `
            INSERT INTO calendar_events (id, title, description, date, type, reminder, serverTimestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                title = $2,
                description = $3,
                date = $4,
                type = $5,
                reminder = $6,
                serverTimestamp = $7
            RETURNING *
        `;
        
        const result = await db.query(query, [
            event.id,
            event.title,
            event.description || '',
            event.date,
            event.type,
            event.reminder || false,
            serverTimestamp
        ]);
        
        console.log(`📅 Evento guardado: ${event.title}`);
        res.json({ success: true, event: result.rows[0] });
    } catch (error) {
        console.error('❌ Error guardando evento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un evento
app.delete('/api/calendar-events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const query = 'DELETE FROM calendar_events WHERE id = $1';
        await db.query(query, [eventId]);
        console.log(`🗑️ Evento ${eventId} eliminado`);
        res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
        console.error('❌ Error eliminando evento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sincronizar eventos locales con el servidor
app.post('/api/sync-calendar-events', async (req, res) => {
    try {
        const { events } = req.body;
        let syncedCount = 0;
        const serverTimestamp = new Date().toISOString();
        
        for (const event of events) {
            const query = `
                INSERT INTO calendar_events (id, title, description, date, type, reminder, serverTimestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                    title = $2,
                    description = $3,
                    date = $4,
                    type = $5,
                    reminder = $6,
                    serverTimestamp = $7
            `;
            
            await db.query(query, [
                event.id,
                event.title,
                event.description || '',
                event.date,
                event.type,
                event.reminder || false,
                serverTimestamp
            ]);
            syncedCount++;
        }
        
        console.log(`📅 ${syncedCount} eventos sincronizados`);
        res.json({ success: true, syncedCount });
    } catch (error) {
        console.error('❌ Error sincronizando eventos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});

// --- ENDPOINT PARA MENSAJES MOTIVACIONALES CON IA ---
app.post('/api/motivational-message', async (req, res) => {
    try {
        // Usar Groq (gratis) para generar mensajes
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_demo_key'}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'Genera mensajes motivacionales MUY CORTOS (máximo 8 palabras) para una mujer. Deben ser positivos, inspiradores y directos. Habla en segunda persona (tú). Incluye un emoji al inicio.'
                    },
                    {
                        role: 'user',
                        content: 'Dame un mensaje motivacional corto y poderoso.'
                    }
                ],
                temperature: 1.2,
                max_tokens: 30
            })
        });

        if (response.ok) {
            const data = await response.json();
            const message = data.choices[0].message.content;
            res.json({ success: true, message });
        } else {
            // Fallback a mensajes predefinidos
            const messages = [
                "✨ Hoy es tu día para brillar",
                "💪 Eres más fuerte de lo que crees",
                "🌟 Tu luz inspira a otros",
                "💖 Mereces todo lo bueno",
                "🦋 Hoy eliges ser feliz",
                "👑 Eres suficiente tal como eres",
                "🌸 Tu sonrisa cambia el mundo",
                "💫 Confía en tu camino",
                "🌺 Hoy te eliges a ti primero",
                "🔥 Tu energía es imparable",
                "💝 Eres valiosa y única",
                "⭐ Hoy creas tu propia magia",
                "🌈 Todo está mejorando para ti",
                "💕 Eres digna de amor y respeto",
                "🎯 Tus metas están más cerca"
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            res.json({ success: true, message: randomMessage });
        }
    } catch (error) {
        // Fallback si falla todo
        const messages = [
            "✨ Hoy es tu día para brillar",
            "💪 Eres más fuerte de lo que crees",
            "🌟 Tu luz inspira a otros",
            "💖 Mereces todo lo bueno",
            "🦋 Hoy eliges ser feliz",
            "👑 Eres suficiente tal como eres",
            "🌸 Tu sonrisa cambia el mundo",
            "💫 Confía en tu camino",
            "🌺 Hoy te eliges a ti primero",
            "🔥 Tu energía es imparable",
            "💝 Eres valiosa y única",
            "⭐ Hoy creas tu propia magia",
            "🌈 Todo está mejorando para ti",
            "💕 Eres digna de amor y respeto",
            "🎯 Tus metas están más cerca"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        res.json({ success: true, message: randomMessage });
    }
});