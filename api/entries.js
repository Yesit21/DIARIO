// API para Vercel - manejo de entradas
export default function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Por ahora, solo responder con éxito
    // En Vercel, usaremos localStorage del navegador
    if (req.method === 'GET') {
        res.json({ entries: [] });
    } else if (req.method === 'POST') {
        res.json({ success: true, message: 'Guardado localmente' });
    } else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}