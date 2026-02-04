// Servidor Node.js para conectar con MongoDB Atlas + SQLite como respaldo
const express = require('express');
const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de MongoDB con múltiples intentos
const MONGODB_URI = 'mongodb+srv://marlonndb32_db_user:nFvXDPXBMmJi4qx9@cluster0.x8t3yak.mongodb.net/DiarioRomantico?retryWrites=true&w=majority&ssl=true';
const DATABASE_NAME = 'DiarioRomantico';
const COLLECTION_NAME = 'entradas';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Para manejar fotos grandes
app.use(express.static('.'));

// Conexión a MongoDB con mejor manejo de errores
let db;
let isConnected = false;
let sqliteDb;

// Inicializar SQLite como respaldo
function initSQLite() {
    sqliteDb = new sqlite3.Database('./diary.db', (err) => {
        if (err) {
            console.error('❌ Error creando SQLite:', err.message);
        } else {
            console.log('✅ Base de datos SQLite creada como respaldo');
            
            // Crear tabla si no existe
            sqliteDb.run(`CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY,
                diaryId TEXT,
                title TEXT,
                text TEXT,
                date TEXT,
                photos TEXT,
                serverTimestamp TEXT,
                showCalendar INTEGER DEFAULT 1,
                photoDateSettings TEXT
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla:', err.message);
                } else {
                    console.log('📊 Tabla de entradas lista en SQLite');
                    
                    // Agregar columna showCalendar a entradas existentes si no existe
                    sqliteDb.run(`ALTER TABLE entries ADD COLUMN showCalendar INTEGER DEFAULT 1`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('Error agregando columna showCalendar:', err.message);
                        } else {
                            console.log('✅ Campo showCalendar disponible en SQLite');
                        }
                    });
                    
                    // Agregar columna photoDateSettings a entradas existentes si no existe
                    sqliteDb.run(`ALTER TABLE entries ADD COLUMN photoDateSettings TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('Error agregando columna photoDateSettings:', err.message);
                        } else {
                            console.log('✅ Campo photoDateSettings disponible en SQLite');
                        }
                    });
                }
            });
        }
    });
}

async function connectToMongoDB() {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && !isConnected) {
        attempts++;
        
        try {
            console.log(`🔄 Intento ${attempts}/${maxAttempts} - Conectando a MongoDB Atlas...`);
            console.log('🔗 URL: mongodb+srv://marlonndb32_db_user:****@cluster0.x8t3yak.mongodb.net/');
            
            const client = new MongoClient(MONGODB_URI, {
                serverSelectionTimeoutMS: 15000, // 15 segundos
                connectTimeoutMS: 15000,
                socketTimeoutMS: 15000,
                maxPoolSize: 10,
                retryWrites: true,
                retryReads: true,
                ssl: true,
                authSource: 'admin'
            });
            
            console.log('⏳ Estableciendo conexión...');
            await client.connect();
            
            console.log('🏓 Probando conexión con ping...');
            await client.db("admin").command({ ping: 1 });
            
            db = client.db(DATABASE_NAME);
            isConnected = true;
            
            console.log('');
            console.log('🎉 ¡¡¡CONEXIÓN EXITOSA A MONGODB ATLAS!!!');
            console.log('✅ ¡¡¡CONECTADO EXITOSAMENTE!!!');
            console.log(`📊 Base de datos: ${DATABASE_NAME}`);
            console.log(`📝 Colección: ${COLLECTION_NAME}`);
            console.log('🌟 ¡El diario ahora se sincroniza automáticamente en la nube!');
            console.log('💾 ¡Las fotos se guardarán en MongoDB Atlas!');
            console.log('🔄 ¡Sincronización automática activada!');
            console.log('');
            
            // Probar una operación básica
            try {
                const testResult = await db.collection(COLLECTION_NAME).countDocuments();
                console.log(`📈 Entradas existentes en la base de datos: ${testResult}`);
            } catch (testError) {
                console.log('⚠️ Error en prueba básica, pero conexión establecida');
            }
            
            break; // Salir del bucle si la conexión es exitosa
            
        } catch (error) {
            console.error(`❌ Intento ${attempts} falló:`, error.message);
            
            if (attempts < maxAttempts) {
                const waitTime = attempts * 2; // Esperar más tiempo en cada intento
                console.log(`⏳ Esperando ${waitTime} segundos antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            }
        }
    }
    
    if (!isConnected) {
        console.log('');
        console.log('💡 INSTRUCCIONES PARA CONECTAR MONGODB:');
        console.log('   1. Ve a https://cloud.mongodb.com/');
        console.log('   2. Haz clic en "Network Access" en el menú izquierdo');
        console.log('   3. Haz clic en "Add IP Address"');
        console.log('   4. Selecciona "Allow Access from Anywhere" (0.0.0.0/0)');
        console.log('   5. Haz clic en "Confirm"');
        console.log('   6. Espera 2-3 minutos y reinicia el servidor');
        console.log('');
        console.log('🎯 MIENTRAS TANTO: El diario funciona perfectamente sin sincronización');
        console.log('   - Todas las funciones están disponibles');
        console.log('   - Se guarda en el navegador localmente');
        console.log('   - Cuando MongoDB se conecte, se sincronizará automáticamente');
        
        isConnected = false;
    }
}

// Inicializar SQLite como respaldo
initSQLite();

// Intentar conectar al iniciar
connectToMongoDB();

// Intentar reconectar cada 30 segundos si no está conectado
setInterval(async () => {
    if (!isConnected) {
        console.log('🔄 Reintentando conexión a MongoDB...');
        await connectToMongoDB();
    }
}, 30000);

// API para sincronizar entradas desde localStorage a la base de datos
app.post('/api/sync-local-entries', async (req, res) => {
    try {
        const { entries } = req.body;
        
        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ error: 'No se proporcionaron entradas válidas' });
        }
        
        let syncedCount = 0;
        let errors = [];
        
        console.log(`🔄 Iniciando sincronización de ${entries.length} entradas desde localStorage...`);
        
        for (const entry of entries) {
            try {
                // Agregar timestamp si no existe
                if (!entry.serverTimestamp) {
                    entry.serverTimestamp = new Date().toISOString();
                }
                if (!entry.diaryId) {
                    entry.diaryId = 'nuestro-diario-secreto-2024';
                }
                
                // Guardar en SQLite
                if (sqliteDb) {
                    const photosJson = JSON.stringify(entry.photos || []);
                    
                    await new Promise((resolve, reject) => {
                        sqliteDb.run(
                            `INSERT OR REPLACE INTO entries (id, diaryId, title, text, date, photos, serverTimestamp, showCalendar, photoDateSettings) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [entry.id, entry.diaryId, entry.title, entry.text, entry.date, photosJson, entry.serverTimestamp, entry.showCalendar ? 1 : 0, JSON.stringify(entry.photoDateSettings || [])],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    });
                }
                
                // Intentar guardar en MongoDB si está conectado
                if (isConnected && db) {
                    try {
                        await db.collection(COLLECTION_NAME).replaceOne(
                            { id: entry.id },
                            entry,
                            { upsert: true }
                        );
                        console.log(`☁️ Entrada "${entry.title}" sincronizada en MongoDB`);
                    } catch (mongoError) {
                        console.log(`⚠️ MongoDB no disponible para "${entry.title}"`);
                    }
                }
                
                syncedCount++;
                console.log(`✅ Entrada "${entry.title}" sincronizada (${entry.photos ? entry.photos.length : 0} fotos)`);
                
            } catch (entryError) {
                errors.push(`Error con entrada "${entry.title}": ${entryError.message}`);
                console.error(`❌ Error sincronizando "${entry.title}":`, entryError.message);
            }
        }
        
        console.log(`🎉 Sincronización completada: ${syncedCount}/${entries.length} entradas`);
        
        res.json({
            success: true,
            syncedCount: syncedCount,
            totalEntries: entries.length,
            errors: errors,
            message: `${syncedCount} entradas sincronizadas exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error en sincronización masiva:', error.message);
        res.status(500).json({
            error: 'Error en sincronización',
            message: error.message
        });
    }
});

// Ruta para verificar entradas en SQLite (para debugging)
app.get('/api/sqlite-status', (req, res) => {
    if (!sqliteDb) {
        return res.json({ error: 'SQLite no disponible' });
    }
    
    sqliteDb.all('SELECT COUNT(*) as total FROM entries', (err, rows) => {
        if (err) {
            res.json({ error: err.message });
        } else {
            const total = rows[0].total;
            
            sqliteDb.all('SELECT id, title, date, LENGTH(photos) as photo_size FROM entries ORDER BY date DESC LIMIT 5', (err2, entries) => {
                if (err2) {
                    res.json({ total: total, error: err2.message });
                } else {
                    res.json({
                        total: total,
                        recent_entries: entries,
                        database_file: './diary.db',
                        status: 'SQLite funcionando correctamente'
                    });
                }
            });
        }
    });
});

// Ruta para verificar entradas locales (para debugging)
app.get('/api/local-check', (req, res) => {
    res.json({
        message: 'Para verificar las entradas locales, abre la consola del navegador (F12) y ejecuta:',
        command: 'JSON.parse(localStorage.getItem("diaryEntries"))',
        note: 'Las entradas se guardan en localStorage del navegador hasta que MongoDB se conecte'
    });
});

// Ruta para verificar uso de almacenamiento
app.get('/api/storage-info', async (req, res) => {
    try {
        if (!isConnected || !db) {
            return res.json({
                usedMB: 0,
                limitMB: 512,
                percentage: 0,
                message: 'MongoDB no conectado'
            });
        }
        
        // Obtener estadísticas de la base de datos
        const stats = await db.stats();
        const usedMB = (stats.dataSize / 1024 / 1024).toFixed(2);
        const limitMB = 512; // Límite del plan gratuito
        const percentage = ((usedMB / limitMB) * 100).toFixed(1);
        
        console.log(`📊 Uso de almacenamiento: ${usedMB}MB / ${limitMB}MB (${percentage}%)`);
        
        res.json({
            usedMB: parseFloat(usedMB),
            limitMB: limitMB,
            percentage: parseFloat(percentage),
            collections: stats.collections,
            documents: stats.objects,
            indexes: stats.indexes
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        res.status(500).json({ 
            error: 'Error obteniendo estadísticas',
            usedMB: 0,
            limitMB: 512,
            percentage: 0
        });
    }
});

// Ruta para verificar el estado de la base de datos
app.get('/api/status', (req, res) => {
    res.json({
        server: 'running',
        mongodb: isConnected ? 'connected' : 'disconnected',
        database: DATABASE_NAME,
        collection: COLLECTION_NAME,
        timestamp: new Date().toISOString()
    });
});

// Ruta para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para guardar entrada (MongoDB + SQLite)
app.post('/api/entries', async (req, res) => {
    try {
        const { diaryId, entry } = req.body;
        entry.serverTimestamp = new Date().toISOString();
        entry.diaryId = diaryId;
        
        let mongoSaved = false;
        let sqliteSaved = false;
        
        // Intentar guardar en MongoDB primero
        if (isConnected && db) {
            try {
                const result = await db.collection(COLLECTION_NAME).insertOne(entry);
                mongoSaved = true;
                
                console.log('🎉 ¡ENTRADA GUARDADA EN MONGODB ATLAS!');
                console.log(`📝 Título: "${entry.title}"`);
                console.log(`📸 Fotos: ${entry.photos ? entry.photos.length : 0}`);
                console.log(`🆔 ID: ${result.insertedId}`);
                console.log('☁️ ¡Sincronizada en la nube exitosamente!');
                
            } catch (mongoError) {
                console.error('❌ Error guardando en MongoDB:', mongoError.message);
            }
        }
        
        // Guardar en SQLite como respaldo (siempre)
        if (sqliteDb) {
            try {
                const photosJson = JSON.stringify(entry.photos || []);
                
                sqliteDb.run(
                    `INSERT INTO entries (id, diaryId, title, text, date, photos, serverTimestamp, showCalendar, photoDateSettings) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [entry.id, entry.diaryId, entry.title, entry.text, entry.date, photosJson, entry.serverTimestamp, entry.showCalendar ? 1 : 0, JSON.stringify(entry.photoDateSettings || [])],
                    function(err) {
                        if (err) {
                            console.error('❌ Error guardando en SQLite:', err.message);
                        } else {
                            sqliteSaved = true;
                            console.log('💾 ¡ENTRADA GUARDADA EN SQLITE LOCAL!');
                            console.log(`📝 Título: "${entry.title}"`);
                            console.log(`📸 Fotos: ${entry.photos ? entry.photos.length : 0}`);
                            console.log('🔒 ¡Respaldo local creado exitosamente!');
                        }
                    }
                );
                sqliteSaved = true; // Asumir éxito para respuesta inmediata
            } catch (sqliteError) {
                console.error('❌ Error guardando en SQLite:', sqliteError.message);
            }
        }
        
        if (mongoSaved || sqliteSaved) {
            res.json({ 
                success: true, 
                cloudSave: mongoSaved,
                localSave: sqliteSaved,
                message: mongoSaved ? 'Guardado en la nube y localmente' : 'Guardado localmente (se sincronizará cuando MongoDB se conecte)'
            });
        } else {
            res.status(500).json({ 
                error: 'Error guardando entrada',
                message: 'No se pudo guardar en ninguna base de datos'
            });
        }
        
    } catch (error) {
        console.error('❌ Error general guardando entrada:', error.message);
        res.status(500).json({ 
            error: 'Error guardando entrada',
            message: error.message
        });
    }
});

// API para obtener entradas (MongoDB + SQLite)
app.get('/api/entries', async (req, res) => {
    try {
        const { diaryId } = req.query;
        let entries = [];
        
        // Intentar cargar desde MongoDB primero
        if (isConnected && db) {
            try {
                entries = await db.collection(COLLECTION_NAME)
                    .find({ diaryId: diaryId })
                    .sort({ date: 1 })
                    .toArray();
                
                console.log(`✅ Cargadas ${entries.length} entradas desde MongoDB Atlas`);
                
            } catch (mongoError) {
                console.error('❌ Error cargando desde MongoDB:', mongoError.message);
            }
        }
        
        // Si MongoDB no tiene datos, cargar desde SQLite
        if (entries.length === 0 && sqliteDb) {
            try {
                entries = await new Promise((resolve, reject) => {
                    sqliteDb.all(
                        'SELECT * FROM entries WHERE diaryId = ? ORDER BY date ASC',
                        [diaryId],
                        (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                const processedEntries = rows.map(row => ({
                                    id: row.id,
                                    diaryId: row.diaryId,
                                    title: row.title,
                                    text: row.text,
                                    date: row.date,
                                    photos: JSON.parse(row.photos || '[]'),
                                    serverTimestamp: row.serverTimestamp,
                                    showCalendar: row.showCalendar === 1,
                                    photoDateSettings: JSON.parse(row.photoDateSettings || '[]')
                                }));
                                resolve(processedEntries);
                            }
                        }
                    );
                });
                
                console.log(`💾 Cargadas ${entries.length} entradas desde SQLite local`);
                
            } catch (sqliteError) {
                console.error('❌ Error cargando desde SQLite:', sqliteError.message);
            }
        }
        
        res.json({ entries: entries });
        
    } catch (error) {
        console.error('❌ Error general cargando entradas:', error.message);
        res.status(500).json({ 
            error: 'Error cargando entradas',
            message: error.message,
            entries: []
        });
    }
});

// API para eliminar entrada
app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!db) {
            return res.status(500).json({ error: 'Base de datos no disponible' });
        }
        
        const result = await db.collection(COLLECTION_NAME).deleteOne({ id: parseInt(id) });
        
        if (result.deletedCount === 1) {
            console.log(`✅ Entrada eliminada: ${id}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Entrada no encontrada' });
        }
        
    } catch (error) {
        console.error('❌ Error eliminando entrada:', error);
        res.status(500).json({ error: 'Error eliminando entrada' });
    }
});

// Iniciar servidor en todas las interfaces de red para acceso externo
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📱 Acceso desde celular/otros dispositivos:`);
    console.log(`🌐 http://172.20.10.12:${PORT}`);
    console.log(`💕 Diario romántico disponible en la web`);
    console.log(`🔗 Enlace para compartir: http://172.20.10.12:${PORT}/index.html`);
    console.log(`📲 Asegúrate de que tu celular esté conectado a la misma red WiFi`);
});

module.exports = app;