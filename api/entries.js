// API para Vercel - manejo de entradas del diario
export default function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        if (req.method === 'GET') {
            // Respuesta simple para GET
            return res.status(200).json({ 
                success: true, 
                entries: [],
                message: 'API funcionando correctamente'
            });
        } 
        
        if (req.method === 'POST') {
            // Respuesta simple para POST
            return res.status(200).json({ 
                success: true, 
                message: 'Datos recibidos correctamente'
            });
        }
        
        // Método no permitido
        return res.status(405).json({ 
            error: 'Método no permitido',
            allowedMethods: ['GET', 'POST']
        });
        
    } catch (error) {
        console.error('Error en API:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}