# 💕 Guía de Uso del Diario (Modo Offline y Despliegue)

¡Hola! Aquí tienes todo lo necesario para que el diario funcione como una aplicación mágica en tu celular y en el de la otra persona.

## 🚀 Pasos para el Despliegue (En tu PC)

Para que la otra persona pueda entrar, debes subir el código a internet. Te recomiendo **Railway.app**:

1. **Sube tu código a GitHub**: Crea un repositorio privado y sube la carpeta `DIARIO`.
2. **Conecta con Railway**: 
   - Crea una cuenta en [Railway.app](https://railway.app/).
   - Dale a "New Project" -> "Deploy from GitHub repo".
   - Selecciona tu repositorio.
3. **Configura la Base de Datos**:
   - En Railway, añade un "Plugin" de **PostgreSQL**.
   - En las variables de entorno de tu proyecto, Railway añadirá automáticamente `DATABASE_URL`. El servidor que construimos la detectará sola.

---

## 📱 Instrucciones para ella (Uso en el Celular)

Para que el **Modo Offline** funcione perfectamente, ella debe seguir estos pasos una sola vez:

1. **Primera Carga**: Abrir el enlace del diario con sus datos móviles o WiFi activados.
2. **Contraseña**: Introducir la clave secreta (`20072210`) para entrar.
3. **Instalación (PWA)**:
   - **En Android (Chrome)**: Tocar los tres puntos arriba a la derecha y seleccionar **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**.
   - **En iPhone (Safari)**: Tocar el botón de "Compartir" (el cuadradito con la flecha hacia arriba) y seleccionar **"Añadir a pantalla de inicio"**.
4. **¡Listo!**: Ahora tendrá un icono con un corazón en su pantalla de inicio.

---

## ☁️ ¿Cómo funciona el Modo Offline?

- **Sin Internet**: Ella puede abrir el icono del corazón, entrar y escribir un deseo o recuerdo. Al darle a guardar, se guardará en su celular.
- **Sincronización**: En cuanto su celular detecte internet (al llegar a casa o activar datos), el diario enviará automáticamente lo que escribió a la base de datos para que tú también puedas verlo.
- **Seguridad**: Sus recuerdos nunca se pierden, se quedan guardados en el celular hasta que puedan subir a la nube.

---

## 🔑 Datos Clave
- **URL**: (La que te dé Railway al terminar)
- **Contraseña**: `20072210`
- **Secciones**:
  - **Recuerdos**: Vuestro diario rosa.
  - **Mis Deseos**: Vuestra tienda de sueños púrpura.

¡Disfruten de su lugar secreto! 💕
