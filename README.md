# 💕 Diario Romántico

Un diario romántico privado con fotos y sincronización en la nube.

## 🌐 Desplegar en Vercel

### Paso 1: Conectar con Vercel
1. Ve a https://vercel.com
2. Haz clic en "Sign Up" y regístrate con GitHub
3. Haz clic en "New Project"
4. Selecciona este repositorio: `YesidA24/Diario`

### Paso 2: Configurar el proyecto
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: `npm install`
- **Output Directory**: ./
- **Install Command**: `npm install`

### Paso 3: Variables de entorno (opcional)
Si quieres usar MongoDB Atlas:
- `MONGODB_URI`: Tu string de conexión de MongoDB
- `NODE_ENV`: production

### Paso 4: Deploy
1. Haz clic en "Deploy"
2. Espera 2-3 minutos
3. ¡Tu diario estará en línea!

## 🔗 Enlace Final
Vercel te dará un enlace como:
`https://diario-romantico.vercel.app`

## 🔐 Contraseña
La contraseña para acceder es: **20072210**

## 📱 Características
- ✅ Funciona desde cualquier dispositivo
- ✅ Fotos con texto al lado en modal
- ✅ Compresión automática de imágenes
- ✅ Guardado en localStorage del navegador
- ✅ Sincronización con MongoDB (opcional)
- ✅ Diseño romántico con corazoncitos
- ✅ Sistema de páginas (10 entradas por página)

## 💾 Almacenamiento
- **Principal**: localStorage del navegador
- **Respaldo**: MongoDB Atlas (si está configurado)
- **Fotos**: Comprimidas automáticamente en base64

## 🔒 Seguridad
- Contraseña requerida para acceso
- Enlace privado de Vercel
- Solo localStorage, no cookies
- Datos encriptados en tránsito (HTTPS)