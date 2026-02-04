// API para información de almacenamiento
export default function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            storage: {
                used: 0,
                available: 1000000,
                type: 'localStorage'
            }
        });
    }
    
    return res.status(405).json({ error: 'Método no permitido' });
}