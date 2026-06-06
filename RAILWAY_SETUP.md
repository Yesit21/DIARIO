# 🚂 Configuración de Railway con PostgreSQL

## 📋 Pasos para desplegar en Railway

### 1. Obtener la URL de PostgreSQL desde Railway

1. Ve a tu proyecto en Railway: https://railway.app
2. Haz clic en tu base de datos PostgreSQL
3. Ve a la pestaña **"Variables"** o **"Connect"**
4. Copia la **DATABASE_URL** completa, se ve así:
   ```
   postgresql://postgres:contraseña@containers-us-west-123.railway.app:5432/railway
   ```

### 2. Configurar las Variables de Entorno en Railway

1. En Railway, ve a tu servicio de la aplicación (no la base de datos)
2. Ve a **"Variables"**
3. Agrega esta variable:
   - **Nombre**: `DATABASE_URL`
   - **Valor**: La URL que copiaste del paso anterior

### 3. Desplegar el Código

#### Opción A: Desde GitHub (Recomendado)

1. Sube tu código a GitHub:
   ```bash
   git add .
   git commit -m "Configuración PostgreSQL para Railway"
   git push origin main
   ```

2. En Railway:
   - Conecta tu repositorio de GitHub
   - Railway detectará automáticamente el `package.json`
   - Desplegará automáticamente

#### Opción B: Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link

# Desplegar
railway up
```

### 4. Verificar el Despliegue

1. Railway te dará una URL pública como: `https://tu-app.railway.app`
2. Prueba el health check: `https://tu-app.railway.app/health`
3. Abre tu diario: `https://tu-app.railway.app`

## 🔧 Pruebas Locales con PostgreSQL

Si quieres probar localmente con tu PostgreSQL de Railway:

1. Copia `.env.example` a `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edita `.env` y agrega tu `DATABASE_URL` de Railway

3. Ejecuta:
   ```bash
   npm start
   ```

## ✅ Checklist de Despliegue

- [ ] DATABASE_URL configurada en Railway
- [ ] Código subido a GitHub
- [ ] Railway conectado al repositorio
- [ ] Despliegue exitoso (sin errores en los logs)
- [ ] Health check funciona: `/health`
- [ ] Aplicación accesible desde la URL pública

## 🐛 Solución de Problemas

### Error: "no pg_hba.conf entry"
- Verifica que tu DATABASE_URL sea correcta
- Asegúrate de tener `ssl: { rejectUnauthorized: false }` en producción

### Error: "relation 'entries' does not exist"
- La tabla se crea automáticamente al iniciar
- Revisa los logs de Railway para ver si hubo errores

### Error: "connect ECONNREFUSED"
- Verifica que DATABASE_URL esté configurada en Railway
- No uses localhost en producción

## 📊 Migrar Datos de SQLite a PostgreSQL

Si tienes datos en SQLite local y quieres migrarlos:

1. Con el servidor local corriendo (SQLite), abre la app
2. Las entradas se sincronizarán automáticamente
3. Una vez desplegado en Railway con PostgreSQL, abre la app
4. Las entradas se subirán automáticamente a PostgreSQL

¡Listo! Tu diario ahora usa PostgreSQL en Railway 🎉
