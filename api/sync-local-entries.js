// API para sincronización de entradas locales
export default function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        return res.status(200).json({
            success: true,
            message: 'Sincronización completada',
            synced: 0
        });
    }
    
    return res.status(405).json({ error: 'Método no permitido' });
}