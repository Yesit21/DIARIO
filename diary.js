// Configuración del servidor local
const SERVER_API = {
    baseUrl: window.location.origin,
    syncUrl: '/api/sync-local-entries',
    entriesUrl: '/api/entries'
};

// Estado de sincronización
let isOnline = navigator.onLine;
let isSyncing = false;

// Funcionalidad del diario
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    // Función para cambiar tema
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
    
    // Crear indicador de estado de conexión (diseño moderno)
    const connectionIndicator = document.createElement('div');
    connectionIndicator.id = 'connectionStatus';
    connectionIndicator.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 50px;
        font-size: 0.85em;
        font-weight: 600;
        z-index: 1000;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        opacity: 0;
        pointer-events: none;
    `;
    document.body.appendChild(connectionIndicator);
    
    // Variable para timeout de desvanecimiento
    let connectionStatusTimeout;
    
    // PWA: Detectar si se puede instalar
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('🎯 Evento beforeinstallprompt detectado - La app se puede instalar');
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación después de 10 segundos
        setTimeout(() => {
            console.log('⏰ 10 segundos pasaron, mostrando botón de instalación...');
            showInstallButton();
        }, 10000);
    });
    
    function showInstallButton() {
        if (!deferredPrompt) {
            console.log('❌ No se puede mostrar botón - deferredPrompt es null');
            return;
        }
        
        console.log('✅ Creando botón de instalación...');
        
        const installBtn = document.createElement('button');
        installBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Instalar App</span>
        `;
        installBtn.id = 'pwaInstallBtn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
            color: white;
            border: none;
            border-radius: 50px;
            font-size: 0.95em;
            font-weight: 600;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 10px 40px rgba(233, 30, 99, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            animation: slideInUp 0.5s ease, pulse 3s infinite;
        `;
        
        installBtn.onmouseover = () => {
            installBtn.style.transform = 'translateY(-3px) scale(1.05)';
            installBtn.style.boxShadow = '0 15px 50px rgba(233, 30, 99, 0.5)';
        };
        
        installBtn.onmouseout = () => {
            installBtn.style.transform = 'translateY(0) scale(1)';
            installBtn.style.boxShadow = '0 10px 40px rgba(233, 30, 99, 0.4)';
        };
        
        installBtn.onclick = async () => {
            console.log('🖱️ Usuario hizo clic en instalar');
            if (!deferredPrompt) return;
            
            installBtn.style.opacity = '0.5';
            installBtn.style.pointerEvents = 'none';
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log('📊 Resultado de instalación:', outcome);
            
            if (outcome === 'accepted') {
                console.log('✅ Usuario instaló la app');
                installBtn.style.animation = 'slideOutDown 0.3s ease';
                setTimeout(() => installBtn.remove(), 300);
            } else {
                console.log('❌ Usuario rechazó la instalación');
                installBtn.style.opacity = '1';
                installBtn.style.pointerEvents = 'auto';
            }
            
            deferredPrompt = null;
        };
        
        document.body.appendChild(installBtn);
        console.log('✅ Botón de instalación agregado al DOM');
        
        // Agregar animaciones
        if (!document.getElementById('pwa-animations')) {
            const style = document.createElement('style');
            style.id = 'pwa-animations';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideOutDown {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Detectar cuando la app fue instalada (mensaje moderno)
    window.addEventListener('appinstalled', () => {
        console.log('🎉 ¡App instalada exitosamente!');
        showToast('¡App instalada exitosamente!', 'success');
    });
    
    // Función para actualizar indicador de conexión (diseño moderno)
    function updateConnectionStatus() {
        // Limpiar timeout anterior si existe
        if (connectionStatusTimeout) {
            clearTimeout(connectionStatusTimeout);
        }
        
        // Mostrar el indicador
        connectionIndicator.style.opacity = '1';
        connectionIndicator.style.pointerEvents = 'auto';
        
        if (isOnline) {
            connectionIndicator.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <span>Conectado</span>
            `;
            connectionIndicator.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(56, 142, 60, 0.9))';
            connectionIndicator.style.color = 'white';
        } else {
            connectionIndicator.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                </svg>
                <span>Sin conexión</span>
            `;
            connectionIndicator.style.background = 'linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(245, 124, 0, 0.9))';
            connectionIndicator.style.color = 'white';
        }
        
        // Desvanecer después de 3 segundos
        connectionStatusTimeout = setTimeout(() => {
            connectionIndicator.style.opacity = '0';
            connectionIndicator.style.pointerEvents = 'none';
        }, 3000);
    }
    
    // Mostrar indicador al cargar la página (solo una vez)
    updateConnectionStatus();

    const newEntryBtn = document.getElementById('newEntryBtn');
    const entryForm = document.getElementById('entryForm');
    const saveEntryBtn = document.getElementById('saveEntry');
    const cancelEntryBtn = document.getElementById('cancelEntry');
    const entriesContainer = document.getElementById('entriesContainer');
    
    // Estado de la sección activa
    let currentSection = 'recuerdos'; // 'recuerdos' o 'anhelos'
    
    // Variables para paginación
    let currentPage = 1;
    const entriesPerPage = 10;
    
    // Verificar acceso por URL
    function checkUrlAccess() {
        // Verificar si ya se autenticó en esta sesión
        const isAuthenticated = sessionStorage.getItem('diaryAuthenticated');
        if (isAuthenticated === 'true') {
            console.log('✅ Usuario ya autenticado en esta sesión');
            return true;
        }
        
        // Si no está autenticado, redirigir a la página de contraseña
        console.log('❌ Acceso no autorizado, redirigiendo a página de contraseña');
        return false;
    }
    
    // Detectar cambios de conexión
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus();
        console.log('🌐 Conexión recuperada, iniciando sincronización...');
        syncWithServer();
        syncLocalEntriesToDatabase(); // Asegurar que lo local se suba a la nube
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus();
        console.log('📴 Sin conexión - trabajando en modo offline');
    });
    
    // Función para guardar entrada en el servidor
    async function saveEntryToServer(entry) {
        if (!isOnline) return false;
        
        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entry: entry })
            });
            return response.ok;
        } catch (error) {
            console.error('❌ Error guardando en servidor:', error);
            return false;
        }
    }
    
    // Función para cargar entradas desde el servidor
    async function loadEntriesFromServer() {
        if (!isOnline) return JSON.parse(localStorage.getItem('diaryEntries')) || [];
        
        try {
            console.log('📡 Pidiendo entradas al servidor...');
            const response = await fetch('/api/entries');
            if (response.ok) {
                const data = await response.json();
                const serverEntries = data.entries || [];
                
                // Mezclar con locales y evitar duplicados, PRIORIZANDO los del servidor
                const localEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                
                // Usamos un Map para manejar duplicados por ID, el servidor sobreescribe lo local
                const entriesMap = new Map();
                
                // Primero metemos los locales
                localEntries.forEach(entry => {
                    if (entry && entry.id) entriesMap.set(String(entry.id), entry);
                });
                
                // Luego los del servidor (que sobreescribirán los locales con el mismo ID)
                serverEntries.forEach(entry => {
                    if (entry && entry.id) entriesMap.set(String(entry.id), entry);
                });
                
                const uniqueEntries = Array.from(entriesMap.values());
                
                localStorage.setItem('diaryEntries', JSON.stringify(uniqueEntries));
                console.log(`✅ ${serverEntries.length} entradas recibidas del servidor.`);
                return uniqueEntries;
            }
        } catch (error) {
            console.error('❌ Error cargando desde servidor:', error);
        }
        return JSON.parse(localStorage.getItem('diaryEntries')) || [];
    }
    
    async function syncWithServer() {
        if (!isOnline || isSyncing) return;
        isSyncing = true;
        
        try {
            console.log('🔄 Iniciando sincronización...');
            await loadEntriesFromServer();
            
            // Forzar actualización de la pantalla leyendo lo que acabamos de guardar
            loadEntries();
            console.log('✨ Pantalla actualizada con datos del servidor');
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        } finally {
            isSyncing = false;
        }
    }
    
    // Función para sincronizar entradas locales a la base de datos
    async function syncLocalEntriesToDatabase() {
        try {
            const localEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            
            if (localEntries.length === 0) {
                console.log('📝 No hay entradas locales para sincronizar');
                return;
            }
            
            console.log(`🔄 Sincronizando ${localEntries.length} entradas locales a la base de datos...`);
            
            const response = await fetch('/api/sync-local-entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ entries: localEntries })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Sincronización exitosa: ${result.syncedCount} entradas`);
                
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('❌ Error sincronizando entradas locales:', error);
        }
    }
    
    // Verificar acceso y inicializar
    if (!checkUrlAccess()) {
        window.location.href = 'index.html';
        return;
    }
    
    // NO inicializar UI todavía - esperar a sincronizar con servidor primero
    // updateSectionUI() se llamará después de la sincronización inicial
    
    // Manejar cambio de secciones
    const showRecuerdosBtn = document.getElementById('showRecuerdos');
    const showAnhelosBtn = document.getElementById('showAnhelos');
    const showCuadernoBtn = document.getElementById('showCuaderno');
    const headerTitle = document.querySelector('header h1');
    const formTitle = document.querySelector('#entryForm h2');
    const anhelosFields = document.getElementById('anhelosFields');
    const entryTextarea = document.getElementById('entryText');
    const cuadernoContainer = document.getElementById('cuadernoContainer');

    function updateSectionUI() {
        const calendarioContainer = document.getElementById('calendarioContainer');
        
        // Ocultar todo primero
        entriesContainer.style.display = 'none';
        cuadernoContainer.classList.add('hidden');
        if (calendarioContainer) calendarioContainer.classList.add('hidden');
        entryForm.classList.add('hidden');
        newEntryBtn.style.display = 'none';
        
        // Remover active de todos los botones
        showRecuerdosBtn.classList.remove('active');
        showAnhelosBtn.classList.remove('active');
        showCuadernoBtn.classList.remove('active');
        const showCalendarioBtn = document.getElementById('showCalendario');
        if (showCalendarioBtn) showCalendarioBtn.classList.remove('active');
        
        if (currentSection === 'recuerdos') {
            document.body.classList.remove('anhelos-theme');
            showRecuerdosBtn.classList.add('active');
            headerTitle.innerHTML = '💕 Nuestros Recuerdos de Amor 💕';
            formTitle.innerHTML = 'Nuevo Recuerdo';
            anhelosFields.classList.add('hidden');
            entryTextarea.placeholder = 'Escribe aquí tus pensamientos...';
            entriesContainer.style.display = 'block';
            newEntryBtn.style.display = 'inline-block';
        } else if (currentSection === 'cuaderno') {
            document.body.classList.remove('anhelos-theme');
            showCuadernoBtn.classList.add('active');
            headerTitle.innerHTML = '📝 Mi Cuaderno Personal 📝';
            cuadernoContainer.classList.remove('hidden');
            loadCuaderno();
        } else if (currentSection === 'calendario') {
            document.body.classList.remove('anhelos-theme');
            if (showCalendarioBtn) showCalendarioBtn.classList.add('active');
            headerTitle.innerHTML = '📅 Mi Calendario 📅';
            if (calendarioContainer) calendarioContainer.classList.remove('hidden');
        } else {
            document.body.classList.add('anhelos-theme');
            showAnhelosBtn.classList.add('active');
            headerTitle.innerHTML = 'Mis Deseos';
            formTitle.innerHTML = 'Nuevo Deseo';
            anhelosFields.classList.remove('hidden');
            entryTextarea.placeholder = 'Descripción o detalles (opcional)';
            entriesContainer.style.display = 'block';
            newEntryBtn.style.display = 'inline-block';
        }
        
        if (currentSection !== 'cuaderno' && currentSection !== 'calendario') {
            currentPage = 1;
            loadEntries();
        }
    }

    showRecuerdosBtn.addEventListener('click', () => {
        console.log('🖱️ Click en botón Recuerdos');
        if (currentSection !== 'recuerdos') {
            currentSection = 'recuerdos';
            console.log('📍 Cambiando a sección: recuerdos');
            updateSectionUI();
        }
    });

    showAnhelosBtn.addEventListener('click', () => {
        console.log('🖱️ Click en botón Mis Deseos');
        if (currentSection !== 'anhelos') {
            currentSection = 'anhelos';
            console.log('📍 Cambiando a sección: anhelos');
            updateSectionUI();
        }
    });

    showCuadernoBtn.addEventListener('click', () => {
        console.log('🖱️ Click en botón Cuaderno');
        if (currentSection !== 'cuaderno') {
            currentSection = 'cuaderno';
            console.log('📍 Cambiando a sección: cuaderno');
            updateSectionUI();
        }
    });
    
    const showCalendarioBtn = document.getElementById('showCalendario');
    if (showCalendarioBtn) {
        showCalendarioBtn.addEventListener('click', () => {
            console.log('🖱️ Click en botón Calendario');
            if (currentSection !== 'calendario') {
                currentSection = 'calendario';
                console.log('📍 Cambiando a sección: calendario');
                updateSectionUI();
                // Renderizar el calendario solo cuando se cambia a esa sección
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                    checkUpcomingReminders();
                }
            }
        });
    }
    
    console.log('✅ Event listeners de secciones configurados');
    console.log('🔍 Verificando botones en DOM:');
    console.log('  - showRecuerdos:', showRecuerdosBtn ? '✅' : '❌');
    console.log('  - showAnhelos:', showAnhelosBtn ? '✅' : '❌');
    console.log('  - showCuaderno:', showCuadernoBtn ? '✅' : '❌');
    console.log('  - showCalendario:', showCalendarioBtn ? '✅' : '❌');

    // Sincronizar cada 30 segundos si hay conexión
    setInterval(() => {
        if (isOnline && !isSyncing) {
            syncWithServer();
            syncLocalEntriesToDatabase();
        }
    }, 30000);
    
    // Mostrar formulario de nueva entrada
    newEntryBtn.addEventListener('click', function() {
        entryForm.classList.remove('hidden');
        newEntryBtn.style.display = 'none';
    });
    
    // Cancelar nueva entrada
    cancelEntryBtn.addEventListener('click', function() {
        entryForm.classList.add('hidden');
        clearForm();
        newEntryBtn.style.display = 'inline-block';
    });
    
    // Función para comprimir imágenes
    function compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                try {
                    let { width, height } = img;
                    const fileSizeMB = file.size / (1024 * 1024);
                    let targetWidth = maxWidth;
                    let targetQuality = quality;
                    
                    // Compresión más agresiva para archivos grandes
                    if (fileSizeMB > 5) {
                        targetWidth = 500;  // Más pequeño
                        targetQuality = 0.5; // Más compresión
                    } else if (fileSizeMB > 3) {
                        targetWidth = 600;
                        targetQuality = 0.6;
                    } else if (fileSizeMB > 1) {
                        targetWidth = 700;
                        targetQuality = 0.7;
                    }
                    
                    if (width > targetWidth) {
                        height = (height * targetWidth) / width;
                        width = targetWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', targetQuality);
                    const compressedSize = compressedDataUrl.length * 0.75 / 1024;
                    
                    console.log(`📸 Foto optimizada:`);
                    console.log(`   Original: ${(file.size / 1024).toFixed(0)}KB (${img.width}x${img.height}px)`);
                    console.log(`   Comprimida: ${compressedSize.toFixed(0)}KB (${width}x${height}px)`);
                    console.log(`   Reducción: ${(((file.size - compressedSize * 1024) / file.size) * 100).toFixed(1)}%`);
                    
                    resolve(compressedDataUrl);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Error cargando imagen'));
            img.src = URL.createObjectURL(file);
        });
    }
    
    // Función simplificada para procesar fotos manteniendo orden exacto
    async function processPhotosSimple(filesArray, entry) {
        entry.photos = [];
        
        console.log(`🔄 Iniciando procesamiento de ${filesArray.length} fotos`);
        console.log('📋 Orden de archivos seleccionados:');
        filesArray.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        });
        
        const maxPhotos = 10;
        const photosToProcess = filesArray.slice(0, maxPhotos);
        
        if (filesArray.length > maxPhotos) {
            alert(`Solo se pueden subir máximo ${maxPhotos} fotos por entrada.`);
        }
        
        try {
            let totalSizeMB = 0;
            photosToProcess.forEach(file => {
                totalSizeMB += file.size / (1024 * 1024);
            });
            
            console.log(`📊 Tamaño total de fotos: ${totalSizeMB.toFixed(1)}MB`);
            
            // Procesar cada foto en orden secuencial (NO paralelo)
            for (let i = 0; i < photosToProcess.length; i++) {
                const file = photosToProcess[i];
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                
                console.log(`🖼️ Procesando foto ${i + 1}/${photosToProcess.length}: "${file.name}" (${fileSizeMB}MB)`);
                
                saveEntryBtn.textContent = `Procesando foto ${i + 1}/${photosToProcess.length}...`;
                
                // Comprimir imagen
                const compressedDataUrl = await compressImage(file);
                
                // Agregar al array en la posición exacta
                entry.photos[i] = compressedDataUrl;
                
                console.log(`✅ Foto ${i + 1} procesada y guardada en posición ${i}`);
            }
            
            // Verificar que no hay espacios vacíos en el array
            const finalPhotos = entry.photos.filter(photo => photo && photo.length > 0);
            entry.photos = finalPhotos;
            
            console.log(`🎯 Orden final de fotos guardadas:`);
            entry.photos.forEach((photo, index) => {
                console.log(`  ${index + 1}. Foto guardada (${(photo.length / 1024).toFixed(0)}KB)`);
            });
            
            console.log(`✨ Todas las fotos procesadas. Total: ${entry.photos.length}`);
            
            const entriesData = JSON.stringify([entry]);
            const finalSizeInMB = (new Blob([entriesData]).size / 1024 / 1024).toFixed(2);
            
            console.log(`💾 Tamaño final de la entrada: ${finalSizeInMB}MB`);
            
            if (finalSizeInMB > 5) {
                const proceed = confirm(`⚠️ Esta entrada ocupa ${finalSizeInMB}MB. Esto puede afectar el rendimiento.\n\n¿Quieres continuar guardando?`);
                if (!proceed) {
                    saveEntryBtn.textContent = 'Guardar';
                    saveEntryBtn.disabled = false;
                    return;
                }
            }
            
            saveEntry(entry);
            
        } catch (error) {
            console.error('❌ Error procesando fotos:', error);
            alert(`Error procesando las fotos: ${error.message}\n\nIntenta con fotos más pequeñas o menos fotos.`);
            saveEntryBtn.textContent = 'Guardar';
            saveEntryBtn.disabled = false;
        }
    }
    
    // Guardar nueva entrada
    saveEntryBtn.addEventListener('click', function() {
        const title = document.getElementById('entryTitle').value;
        const text = document.getElementById('entryText').value;
        const photoFiles = document.getElementById('entryPhoto').files;
        
        // Campos específicos de Anhelos
        const price = document.getElementById('entryPrice').value;
        const status = document.getElementById('entryStatus').value;
        
        // Validación: El título siempre es obligatorio. 
        // El texto es obligatorio solo en Recuerdos, en Anhelos es opcional.
        if (!title || (currentSection === 'recuerdos' && !text)) {
            alert(currentSection === 'recuerdos' ? 'Por favor completa el título y tus pensamientos' : 'Por favor ingresa un nombre para tu anhelo');
            return;
        }
        
        if (photoFiles.length > 10) {
            alert('Una o más fotos son demasiado grandes. Por favor usa fotos menores a 10MB cada una.');
            return;
        }
        
        if (photoFiles.length > 0) {
            saveEntryBtn.textContent = 'Procesando fotos...';
            saveEntryBtn.disabled = true;
        }
        
        const entry = {
            id: Date.now(),
            title: title,
            text: text,
            photos: [],
            type: currentSection, // Guardar si es recuerdo o anhelo
            price: currentSection === 'anhelos' ? price : null,
            status: currentSection === 'anhelos' ? status : null
        };
        
        if (photoFiles.length > 0) {
            const filesArray = Array.from(photoFiles);
            processPhotosSimple(filesArray, entry);
        } else {
            saveEntry(entry);
        }
    });
    
    function saveEntry(entry) {
        // SIEMPRE intentar guardar en servidor primero
        saveEntryToServer(entry).then(success => {
            if (success) {
                console.log('✅ Guardado en servidor');
                // También guardar localmente como respaldo
                let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                const existingIndex = entries.findIndex(e => e.id === entry.id);
                if (existingIndex >= 0) {
                    entries[existingIndex] = entry;
                } else {
                    entries.push(entry);
                }
                localStorage.setItem('diaryEntries', JSON.stringify(entries));
                
                // Recargar desde el servidor para asegurar sincronización
                setTimeout(() => {
                    loadEntriesFromServer().then(() => {
                        loadEntries();
                    });
                }, 500);
            } else {
                // Solo si falla el servidor, guardar localmente
                console.log('⚠️ Guardado solo localmente');
                let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                const existingIndex = entries.findIndex(e => e.id === entry.id);
                if (existingIndex >= 0) {
                    entries[existingIndex] = entry;
                } else {
                    entries.push(entry);
                }
                localStorage.setItem('diaryEntries', JSON.stringify(entries));
                loadEntries();
            }
            
            entryForm.classList.add('hidden');
            clearForm();
            newEntryBtn.style.display = 'inline-block';
            
        }).catch(error => {
            console.error('Error guardando:', error);
            alert('Error al guardar. Por favor intenta de nuevo.');
        }).finally(() => {
            saveEntryBtn.textContent = 'Guardar';
            saveEntryBtn.disabled = false;
        });
    }
    
    function clearForm() {
        document.getElementById('entryTitle').value = '';
        document.getElementById('entryText').value = '';
        document.getElementById('entryPhoto').value = '';
    }
    
    function loadEntries() {
        // SIEMPRE intentar cargar desde servidor primero si está online
        if (isOnline) {
            console.log('📡 Cargando entradas desde servidor...');
            loadEntriesFromServer().then(() => {
                console.log('✅ Entradas cargadas desde servidor');
                displayFilteredEntries();
            }).catch((error) => {
                // Si falla, cargar desde localStorage
                console.error('❌ Error cargando desde servidor, usando localStorage:', error);
                displayFilteredEntries();
            });
        } else {
            // Si está offline, cargar desde localStorage
            console.log('📴 Offline: Cargando desde localStorage');
            displayFilteredEntries();
        }
    }
    
    function displayFilteredEntries() {
        // Cargar desde localStorage
        let allEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        
        // Filtrar por la sección actual
        const entries = allEntries.filter(e => {
            if (currentSection === 'recuerdos') {
                return !e.type || e.type === 'recuerdos';
            }
            return e.type === currentSection;
        });
        
        console.log(`📋 Cargando ${entries.length} entradas de tipo ${currentSection}`);
        
        if (entries.length === 0) {
            const emptyMsg = currentSection === 'recuerdos' 
                ? 'Aún no tienes recuerdos. Haz clic en "Nueva Entrada" para comenzar a escribir.'
                : currentSection === 'cuaderno'
                ? 'Tu cuaderno está vacío. ¡Comienza a escribir!'
                : 'Aún no tienes anhelos. ¿Qué sueños te gustaría cumplir?';
            
            entriesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ad1457;">
                    <h3>¡Bienvenida a ${currentSection}!</h3>
                    <p>${emptyMsg}</p>
                    <p style="font-size: 0.9em; margin-top: 15px;">💕 Todo se guarda automáticamente</p>
                </div>
            `;
            return;
        }
        
        console.log('✅ Mostrando entradas con paginación...');
        displayEntriesWithPagination(entries);
    }
    
    function displayEntriesWithPagination(entries) {
        console.log(`📄 Mostrando ${entries.length} entradas con paginación`);
        
        // Ordenar por ID (que es timestamp) en lugar de fecha
        const sortedEntries = entries.sort((a, b) => a.id - b.id);
        
        const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
        
        // Asegurar que la página actual sea válida
        if (currentPage > totalPages) {
            currentPage = totalPages || 1;
        }
        
        entriesContainer.innerHTML = '';
        
        console.log(`📖 Creando ${totalPages} páginas`);
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const startIndex = (pageNum - 1) * entriesPerPage;
            const endIndex = startIndex + entriesPerPage;
            const pageEntries = sortedEntries.slice(startIndex, endIndex);
            
            createPage(pageNum, pageEntries, pageNum === currentPage);
        }
        
        createPagination(totalPages);
    }
    
    function createPage(pageNum, entries, isVisible) {
        const pageContainer = document.createElement('div');
        pageContainer.className = `diary-page-container page-${((pageNum - 1) % 6) + 1}`;
        pageContainer.id = `page-${pageNum}`;
        pageContainer.style.display = isVisible ? 'block' : 'none';
        
        const pageTitles = currentSection === 'recuerdos' ? [
            { title: '💖 Nuestros Primeros Momentos 💖', subtitle: 'Donde comenzó nuestra historia de amor' },
            { title: '💕 Recuerdos Dulces 💕', subtitle: 'Momentos que nos hacen sonreír' },
            { title: '💗 Aventuras Juntos 💗', subtitle: 'Explorando el mundo de la mano' },
            { title: '💝 Tesoros del Corazón 💝', subtitle: 'Memorias que guardamos con amor' },
            { title: '💘 Días Especiales 💘', subtitle: 'Celebrando nuestro amor único' },
            { title: '💞 Eternos Momentos 💞', subtitle: 'Para siempre en nuestros corazones' }
        ] : [
            { title: '✨ Mis Deseos ✨', subtitle: '' },
            { title: '🌟 Anhelos del Corazón 🌟', subtitle: '' },
            { title: '💫 Futuro Juntos 💫', subtitle: '' },
            { title: '🌈 Deseos Compartidos 🌈', subtitle: '' },
            { title: '🔮 Promesas de Amor 🔮', subtitle: '' },
            { title: '🌌 Infinitos Anhelos 🌌', subtitle: '' }
        ];
        
        const pageTitle = pageTitles[((pageNum - 1) % 6)];
        
        const subtitleHtml = pageTitle.subtitle ? `<p class="page-subtitle">${pageTitle.subtitle}</p>` : '';
        
        pageContainer.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">${pageTitle.title}</h2>
                ${subtitleHtml}
            </div>
            <div class="entries-grid" id="grid-${pageNum}"></div>
        `;
        
        const grid = pageContainer.querySelector(`#grid-${pageNum}`);
        
        entries.forEach((entry, index) => {
            if (index < 10) {
                const entryElement = createEntryElement(entry);
                grid.appendChild(entryElement);
            }
        });
        
        for (let i = entries.length; i < 10; i++) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'diary-entry empty-slot';
            const emptySlotText = currentSection === 'recuerdos' ? '💭 Esperando nuevos recuerdos...' : '✨ Esperando nuevos anhelos...';
            emptySlot.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ccc; font-style: italic;">
                    <span>${emptySlotText}</span>
                </div>
            `;
            grid.appendChild(emptySlot);
        }
        
        entriesContainer.appendChild(pageContainer);
    }
    
    function createEntryElement(entry) {
        console.log(`🖼️ Creando elemento para entrada: "${entry.title}"`);
        console.log(`📸 Fotos en la entrada:`, entry.photos ? entry.photos.length : 0);
        
        const entryElement = document.createElement('div');
        entryElement.className = `diary-entry ${entry.type === 'anhelos' ? 'anhelo-item' : ''}`;
        
        let photosHtml = '';
        if (entry.photos && entry.photos.length > 0) {
            photosHtml = `
                <div class="entry-photos">
                    ${entry.photos.slice(0, 4).map((photo, index) => `
                        <div class="photo-container">
                            <img src="${photo}" alt="Foto ${index + 1} del diario" class="entry-photo" onclick="openPhotoModal('${photo.replace(/'/g, '&apos;')}', '${entry.title.replace(/'/g, '&apos;')}', '${entry.text.replace(/'/g, '&apos;').replace(/\n/g, '\\n')}')" title="Foto ${index + 1} - Orden: ${index + 1}" loading="lazy">
                        </div>
                    `).join('')}
                    ${entry.photos.length > 4 ? `<div style="font-size: 0.8em; color: #ad1457; text-align: center;">+${entry.photos.length - 4} más fotos</div>` : ''}
                </div>
            `;
        }
        
        // Contenido específico para Anhelos (Tienda)
        let anhelosInfoHtml = '';
        if (entry.type === 'anhelos') {
            const statusLabel = entry.status === 'adquirido' ? '✅ Adquirido' : '⏳ Sin adquirir';
            const statusClass = entry.status === 'adquirido' ? 'status-acquired' : 'status-pending';
            const priceHtml = entry.price ? `<div class="entry-price">💰 Precio: $${entry.price}</div>` : '';
            
            anhelosInfoHtml = `
                <div class="anhelo-details">
                    ${priceHtml}
                    <div class="entry-status ${statusClass}" onclick="toggleAnheloStatus(${entry.id})">
                        ${statusLabel}
                    </div>
                </div>
            `;
        }
        
        // Preparar el texto (opcional en Anhelos)
        const textHtml = entry.text ? `<p class="entry-text">${entry.text.replace(/\n/g, '<br>')}</p>` : '';
        
        entryElement.innerHTML = `
            <div class="entry-header">
                <button onclick="deleteEntry(${entry.id})" class="delete-btn">×</button>
            </div>
            <h3 class="entry-title">${entry.title}</h3>
            ${anhelosInfoHtml}
            ${textHtml}
            ${photosHtml}
        `;
        
        console.log(`✅ Elemento creado para "${entry.title}"`);
        return entryElement;
    }
    
    function createPagination(totalPages) {
        if (totalPages <= 1) return;
        
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '← Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => changePage(currentPage - 1);
        paginationContainer.appendChild(prevBtn);
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => changePage(i);
            paginationContainer.appendChild(pageBtn);
        }
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Siguiente →';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => changePage(currentPage + 1);
        paginationContainer.appendChild(nextBtn);
        
        const pageInfo = document.createElement('div');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationContainer.appendChild(pageInfo);
        
        entriesContainer.appendChild(paginationContainer);
    }
    
    function changePage(newPage) {
        const totalPages = document.querySelectorAll('.diary-page-container').length;
        if (newPage < 1 || newPage > totalPages) return;
        
        const currentPageElement = document.getElementById(`page-${currentPage}`);
        if (currentPageElement) {
            currentPageElement.style.display = 'none';
        }
        
        currentPage = newPage;
        const newPageElement = document.getElementById(`page-${currentPage}`);
        if (newPageElement) {
            newPageElement.style.display = 'block';
            newPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Actualizar paginación sin recargar todo
        updatePaginationButtons();
    }
    
    function updatePaginationButtons() {
        const totalPages = document.querySelectorAll('.diary-page-container').length;
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;
        
        // Actualizar estado de botones
        const buttons = paginationContainer.querySelectorAll('.pagination-btn');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Anterior')) {
                btn.disabled = currentPage === 1;
            } else if (btn.textContent.includes('Siguiente')) {
                btn.disabled = currentPage === totalPages;
            } else if (!isNaN(parseInt(btn.textContent))) {
                const pageNum = parseInt(btn.textContent);
                btn.classList.toggle('active', pageNum === currentPage);
            }
        });
        
        // Actualizar info de página
        const pageInfo = paginationContainer.querySelector('.pagination-info');
        if (pageInfo) {
            pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        }
    }
    
    // Funciones globales (definidas solo una vez)
    window.deleteEntry = function(entryId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            console.log(`🗑️ Eliminando entrada ${entryId}...`);
            
            // Eliminar de localStorage
            let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            entries = entries.filter(e => e.id !== entryId);
            localStorage.setItem('diaryEntries', JSON.stringify(entries));
            
            // Intentar eliminar del servidor también
            if (isOnline) {
                fetch('/api/entries/' + entryId, {
                    method: 'DELETE'
                }).then(response => {
                    if (response.ok) {
                        console.log(`✅ Entrada ${entryId} eliminada del servidor`);
                    }
                }).catch(err => console.error('❌ Error eliminando del servidor:', err));
            }
            
            console.log(`✅ Entrada ${entryId} eliminada localmente`);
            
            // Recargar entradas desde servidor para sincronizar
            if (isOnline) {
                loadEntriesFromServer().then(() => {
                    loadEntries();
                });
            } else {
                loadEntries();
            }
        } catch (error) {
            console.error('❌ Error eliminando entrada:', error);
            alert('Error al eliminar la entrada. Por favor intenta de nuevo.');
        }
    };

    window.toggleAnheloStatus = function(entryId) {
        try {
            let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            const entry = entries.find(e => e.id === entryId);
            
            if (entry) {
                entry.status = entry.status === 'adquirido' ? 'sin_adquirir' : 'adquirido';
                localStorage.setItem('diaryEntries', JSON.stringify(entries));
                
                // Actualizar en el servidor
                if (isOnline) {
                    saveEntryToServer(entry).catch(err => console.error('Error actualizando en servidor:', err));
                }
                
                console.log(`✅ Estado de anhelo ${entryId} cambiado a: ${entry.status}`);
                loadEntries();
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
        }
    };
    
    // Función global para abrir modal de fotos con información de la entrada
    window.openPhotoModal = function(photoSrc, entryTitle = '', entryText = '', entryDate = '') {
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        
        const heartsContainer = document.createElement('div');
        heartsContainer.className = 'floating-hearts';
        
        const heartEmojis = ['💖', '💕', '💗', '💝', '💘', '💞'];
        
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'floating-heart left-heart';
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            heart.style.left = Math.random() * 20 + '%';
            heart.style.animationDelay = Math.random() * 4 + 's';
            heart.style.animationDuration = (Math.random() * 3 + 4) + 's';
            heartsContainer.appendChild(heart);
        }
        
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'floating-heart right-heart';
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            heart.style.right = Math.random() * 20 + '%';
            heart.style.animationDelay = Math.random() * 4 + 's';
            heart.style.animationDuration = (Math.random() * 3 + 4) + 's';
            heartsContainer.appendChild(heart);
        }
        
        const modalContent = document.createElement('div');
        modalContent.className = 'photo-modal-content';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'photo-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            document.body.removeChild(modal);
        };
        
        // Contenedor principal con foto y texto lado a lado
        const mainContainer = document.createElement('div');
        mainContainer.className = 'photo-modal-main';
        
        // Contenedor de la foto
        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-modal-photo';
        
        const img = document.createElement('img');
        img.src = photoSrc;
        img.alt = 'Foto del diario';
        
        photoContainer.appendChild(img);
        
        // Contenedor del texto (solo si hay información)
        if (entryTitle || entryText) {
            const textContainer = document.createElement('div');
            textContainer.className = 'photo-modal-text';
            
            if (entryTitle) {
                const title = document.createElement('h3');
                title.className = 'photo-modal-title';
                title.textContent = entryTitle;
                textContainer.appendChild(title);
            }
            
            if (entryText) {
                const text = document.createElement('p');
                text.className = 'photo-modal-description';
                text.innerHTML = entryText.replace(/\n/g, '<br>');
                textContainer.appendChild(text);
            }
            
            const caption = document.createElement('div');
            caption.className = 'photo-caption';
            caption.innerHTML = '💕 Recuerdo especial de nuestros momentos 💕';
            textContainer.appendChild(caption);
            
            mainContainer.appendChild(photoContainer);
            mainContainer.appendChild(textContainer);
        } else {
            // Si no hay texto, solo mostrar la foto centrada
            const caption = document.createElement('div');
            caption.className = 'photo-caption';
            caption.innerHTML = '💕 Recuerdo especial de nuestros momentos 💕';
            
            mainContainer.appendChild(photoContainer);
            modalContent.appendChild(caption);
        }
        
        modalContent.appendChild(mainContainer);
        modal.appendChild(heartsContainer);
        modal.appendChild(closeBtn);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target === heartsContainer) {
                document.body.removeChild(modal);
            }
        });
        
        const handleEscape = function(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
    };
    
    // Cargar entradas existentes y sincronizar
    console.log('🚀 Iniciando aplicación...');
    
    // Intentar sincronizar con el servidor ANTES de mostrar cualquier cosa
    if (isOnline) {
        console.log('🌐 Online: Sincronizando datos con el servidor PRIMERO...');
        Promise.all([
            syncWithServer(),
            syncLocalEntriesToDatabase()
        ]).then(() => {
            console.log('✅ Sincronización inicial completada');
            // AHORA SÍ inicializar la UI con datos frescos
            updateSectionUI();
        }).catch((error) => {
            console.error('❌ Error en sincronización inicial:', error);
            // Si falla, igual mostrar UI con datos locales
            updateSectionUI();
        });
    } else {
        console.log('📴 Offline: Trabajando con datos locales');
        // Mostrar UI con datos locales si está offline
        updateSectionUI();
    }
    
    // Cargar mensaje motivacional al entrar
    loadMotivationalMessage();
    
    // Funcionalidad del Cuaderno
    initCuaderno();
    
    // Inicializar calendario
    initCalendar();
    
}); // Cierre del DOMContentLoaded

// ========== FUNCIONES DEL CUADERNO ==========
function initCuaderno() {
    const cuadernoTextarea = document.getElementById('cuadernoTextarea');
    const saveCuadernoBtn = document.getElementById('saveCuaderno');
    const clearCuadernoBtn = document.getElementById('clearCuaderno');
    const wordCountSpan = document.getElementById('cuadernoWordCount');
    const dateSpan = document.getElementById('cuadernoDate');
    
    // Actualizar fecha
    const updateDate = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateSpan.textContent = now.toLocaleDateString('es-ES', options);
    };
    updateDate();
    
    // Contador de palabras
    const updateWordCount = () => {
        const text = cuadernoTextarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCountSpan.textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
    };
    
    cuadernoTextarea.addEventListener('input', updateWordCount);
    
    // Guardar cuaderno
    saveCuadernoBtn.addEventListener('click', () => {
        const text = cuadernoTextarea.value;
        const timestamp = new Date().toISOString();
        
        localStorage.setItem('cuadernoText', text);
        localStorage.setItem('cuadernoLastSaved', timestamp);
        
        showSavedMessage();
        console.log('📝 Cuaderno guardado');
    });
    
    // Limpiar cuaderno
    clearCuadernoBtn.addEventListener('click', () => {
        if (confirm('¿Estás segura de que quieres limpiar el cuaderno? Esta acción no se puede deshacer.')) {
            cuadernoTextarea.value = '';
            updateWordCount();
            localStorage.removeItem('cuadernoText');
            console.log('🗑️ Cuaderno limpiado');
        }
    });
    
    // Autoguardado cada 30 segundos
    setInterval(() => {
        if (cuadernoTextarea.value.trim()) {
            const text = cuadernoTextarea.value;
            localStorage.setItem('cuadernoText', text);
            localStorage.setItem('cuadernoLastSaved', new Date().toISOString());
            console.log('💾 Autoguardado del cuaderno');
        }
    }, 30000);
}

function loadCuaderno() {
    const cuadernoTextarea = document.getElementById('cuadernoTextarea');
    const savedText = localStorage.getItem('cuadernoText');
    
    if (savedText) {
        cuadernoTextarea.value = savedText;
        // Actualizar contador de palabras
        const text = savedText.trim();
        const words = text ? text.split(/\s+/).length : 0;
        document.getElementById('cuadernoWordCount').textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
    }
}

function showSavedMessage() {
    showToast('Cuaderno guardado exitosamente', 'success');
}

// Función para cargar mensaje motivacional
async function loadMotivationalMessage() {
    try {
        const response = await fetch('/api/motivational-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            showMotivationalMessage(data.message);
        }
    } catch (error) {
        console.log('No se pudo cargar mensaje motivacional');
    }
}

// Mostrar mensaje motivacional (diseño moderno glassmorphism)
function showMotivationalMessage(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 50px 40px;
        border-radius: 30px;
        max-width: 450px;
        text-align: center;
        box-shadow: 0 20px 80px rgba(233, 30, 99, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5);
        animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
    `;
    
    messageBox.innerHTML = `
        <div style="
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: linear-gradient(135deg, #ffc1e3 0%, #e91e63 100%);
            border-radius: 50%;
            opacity: 0.1;
        "></div>
        <div style="
            font-size: 4em;
            margin-bottom: 20px;
            animation: heartBeat 1.5s infinite;
            filter: drop-shadow(0 4px 8px rgba(233, 30, 99, 0.3));
        ">💕</div>
        <h2 style="
            color: #d81b60;
            margin-bottom: 25px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 1.5em;
            font-weight: 600;
            letter-spacing: -0.5px;
        ">Mensaje del Corazón</h2>
        <p style="
            color: #555;
            font-size: 1.15em;
            line-height: 1.7;
            font-weight: 500;
            margin-bottom: 35px;
        ">${message}</p>
        <button id="closeMotivational" style="
            margin-top: 10px;
            background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
            color: white;
            border: none;
            padding: 14px 40px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(233, 30, 99, 0.35);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.3);
        ">
            ¡Gracias! 💖
        </button>
    `;
    
    modal.appendChild(messageBox);
    document.body.appendChild(modal);
    
    const closeBtn = document.getElementById('closeMotivational');
    closeBtn.onmouseover = () => {
        closeBtn.style.transform = 'translateY(-2px) scale(1.05)';
        closeBtn.style.boxShadow = '0 12px 35px rgba(233, 30, 99, 0.45)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.transform = 'translateY(0) scale(1)';
        closeBtn.style.boxShadow = '0 8px 25px rgba(233, 30, 99, 0.35)';
    };
    
    closeBtn.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        messageBox.style.animation = 'scaleOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            messageBox.style.animation = 'scaleOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    });
}

// Agregar animaciones CSS modernas
const motivationalStyle = document.createElement('style');
motivationalStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes scaleIn {
        from {
            transform: scale(0.8);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    @keyframes scaleOut {
        from {
            transform: scale(1);
            opacity: 1;
        }
        to {
            transform: scale(0.8);
            opacity: 0;
        }
    }
    @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1); }
    }
`;
document.head.appendChild(motivationalStyle);

// Sistema de Toast Notifications moderno
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    const colors = {
        success: 'linear-gradient(135deg, #4caf50, #388e3c)',
        error: 'linear-gradient(135deg, #f44336, #c62828)',
        info: 'linear-gradient(135deg, #2196f3, #1565c0)'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 50px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        font-size: 0.95em;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.3);
        animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 400px;
    `;
    
    toast.innerHTML = `
        <div style="flex-shrink: 0;">${icons[type]}</div>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Agregar animaciones de toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastSlideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(toastStyle);


// ========== CALENDARIO CON RECORDATORIOS ==========

let currentCalendarDate = new Date();
let calendarEvents = [];

// Fechas especiales con temas
const specialDates = {
    '01-01': { name: 'Año Nuevo', theme: '🎆 ¡Feliz Año Nuevo!', color: '#4caf50' },
    '02-14': { name: 'San Valentín', theme: '💕 ¡Día del Amor y la Amistad!', color: '#e91e63' },
    '10-31': { name: 'Halloween', theme: '🎃 ¡Noche de Halloween!', color: '#ff9800' },
    '12-24': { name: 'Nochebuena', theme: '🎄 ¡Feliz Nochebuena!', color: '#4caf50' },
    '12-25': { name: 'Navidad', theme: '🎅 ¡Feliz Navidad!', color: '#d32f2f' },
    '12-31': { name: 'Fin de Año', theme: '🎉 ¡Último día del año!', color: '#ffc107' }
};

function initCalendar() {
    const calendarioContainer = document.getElementById('calendarioContainer');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventModal = document.getElementById('eventModal');
    const saveEventBtn = document.getElementById('saveEvent');
    const cancelEventBtn = document.getElementById('cancelEvent');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    // IMPORTANTE: Asegurar que el modal esté oculto al iniciar
    if (eventModal) {
        eventModal.classList.add('hidden');
        console.log('✅ Modal de eventos ocultado al inicializar');
    }
    
    // Solicitar permisos de notificaciones
    requestNotificationPermission();
    
    // Cargar eventos desde localStorage
    loadCalendarEvents();
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            console.log('🖱️ Click en Agregar Evento');
            eventModal.classList.remove('hidden');
            document.getElementById('eventDate').valueAsDate = new Date();
        });
    }
    
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', (e) => {
            console.log('🖱️ Click en Cancelar Evento');
            e.preventDefault();
            e.stopPropagation();
            eventModal.classList.add('hidden');
            clearEventForm();
        });
    }
    
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveCalendarEvent);
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Cerrar modal al hacer clic fuera
    if (eventModal) {
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                console.log('🖱️ Click fuera del modal - cerrando');
                eventModal.classList.add('hidden');
                clearEventForm();
            }
        });
    }
    
    // Verificar recordatorios cada hora
    setInterval(checkUpcomingReminders, 3600000);
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Colores por mes (gradientes hermosos)
    const monthColors = [
        { primary: '#3b82f6', secondary: '#1e40af', accent: '#dbeafe', name: '❄️ Invierno' },      // Enero - Azul helado
        { primary: '#ec4899', secondary: '#be185d', accent: '#fce7f3', name: '💕 Amor' },          // Febrero - Rosa amor
        { primary: '#10b981', secondary: '#047857', accent: '#d1fae5', name: '🌸 Primavera' },     // Marzo - Verde primavera
        { primary: '#a855f7', secondary: '#7e22ce', accent: '#f3e8ff', name: '🌺 Flores' },        // Abril - Morado flores
        { primary: '#f59e0b', secondary: '#d97706', accent: '#fef3c7', name: '🌼 Alegría' },       // Mayo - Amarillo alegre
        { primary: '#06b6d4', secondary: '#0891b2', accent: '#cffafe', name: '🌊 Verano' },        // Junio - Cyan verano
        { primary: '#ef4444', secondary: '#dc2626', accent: '#fee2e2', name: '🔥 Calor' },         // Julio - Rojo calor
        { primary: '#8b5cf6', secondary: '#6d28d9', accent: '#ede9fe', name: '🌙 Misterio' },      // Agosto - Violeta noche
        { primary: '#14b8a6', secondary: '#0d9488', accent: '#ccfbf1', name: '🍃 Renovación' },    // Septiembre - Teal renovación
        { primary: '#f97316', secondary: '#ea580c', accent: '#ffedd5', name: '🎃 Otoño' },         // Octubre - Naranja otoño
        { primary: '#a78bfa', secondary: '#7c3aed', accent: '#ede9fe', name: '🍂 Nostalgia' },     // Noviembre - Lavanda
        { primary: '#059669', secondary: '#047857', accent: '#d1fae5', name: '🎄 Navidad' }        // Diciembre - Verde navidad
    ];
    
    const currentMonthColor = monthColors[month];
    
    // Aplicar colores al contenedor del calendario
    const calendarioContainer = document.querySelector('.calendario-container');
    if (calendarioContainer) {
        calendarioContainer.style.setProperty('--month-primary', currentMonthColor.primary);
        calendarioContainer.style.setProperty('--month-secondary', currentMonthColor.secondary);
        calendarioContainer.style.setProperty('--month-accent', currentMonthColor.accent);
    }
    
    // Actualizar título con emoji del mes
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('currentMonthYear').textContent = `${currentMonthColor.name} - ${monthNames[month]} ${year}`;
    
    // Actualizar estilos del header con gradiente del mes
    const calendarioHeader = document.querySelector('.calendario-header');
    if (calendarioHeader) {
        calendarioHeader.style.background = `linear-gradient(135deg, ${currentMonthColor.primary}, ${currentMonthColor.secondary})`;
    }
    
    // Verificar tema especial del mes
    checkSpecialDateTheme(month + 1);
    
    // Obtener primer y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Días de la semana con color del mes
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.style.cssText = `font-weight: bold; text-align: center; padding: 10px; color: ${currentMonthColor.primary};`;
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Días del mes anterior
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevLastDate - i;
        calendarGrid.appendChild(createDayCell(day, true, year, month - 1));
    }
    
    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= lastDate; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        calendarGrid.appendChild(createDayCell(day, false, year, month, isToday));
    }
    
    // Días del siguiente mes
    const remainingCells = 42 - (firstDayWeek + lastDate);
    for (let day = 1; day <= remainingCells; day++) {
        calendarGrid.appendChild(createDayCell(day, true, year, month + 1));
    }
    
    // Renderizar lista de eventos
    renderEventsList();
}

function createDayCell(day, isOtherMonth, year, month, isToday = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = calendarEvents.filter(e => e.date === dateStr);
    
    if (dayEvents.length > 0) {
        cell.classList.add('has-event');
    }
    
    cell.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-event-dots">
            ${dayEvents.map(e => `<div class="event-dot" style="background: ${getEventColor(e.type)};"></div>`).join('')}
        </div>
    `;
    
    cell.onclick = () => showDayEvents(dateStr, dayEvents);
    
    return cell;
}

function getEventColor(type) {
    const colors = {
        'examen': '#e91e63',
        'cumpleaños': '#9c27b0',
        'cita': '#2196f3',
        'otro': '#4caf50'
    };
    return colors[type] || '#4caf50';
}

function saveCalendarEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const date = document.getElementById('eventDate').value;
    const type = document.getElementById('eventType').value;
    const reminder = document.getElementById('eventReminder').checked;
    
    if (!title || !date) {
        showToast('Por favor completa título y fecha', 'error');
        return;
    }
    
    const event = {
        id: Date.now(),
        title,
        description,
        date,
        type,
        reminder,
        created: new Date().toISOString()
    };
    
    calendarEvents.push(event);
    saveCalendarEventsToStorage();
    
    // Programar recordatorio si está activado
    if (reminder) {
        scheduleReminder(event);
    }
    
    document.getElementById('eventModal').classList.add('hidden');
    clearEventForm();
    renderCalendar();
    showToast('Evento agregado exitosamente', 'success');
}

function clearEventForm() {
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventDate').valueAsDate = new Date();
    document.getElementById('eventType').value = 'examen';
    document.getElementById('eventReminder').checked = true;
}

function loadCalendarEvents() {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) {
        calendarEvents = JSON.parse(saved);
    }
}

function saveCalendarEventsToStorage() {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
}

function renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    const upcomingEvents = calendarEvents
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcomingEvents.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay eventos próximos</p>';
        return;
    }
    
    eventsList.innerHTML = '<h3 style="text-align: center; color: #e91e63; margin-bottom: 20px;">Próximos Eventos</h3>';
    
    upcomingEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.style.borderLeftColor = getEventColor(event.type);
        
        const eventDate = new Date(event.date + 'T00:00:00');
        const dateStr = eventDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        eventItem.innerHTML = `
            <div class="event-item-header">
                <div>
                    <div class="event-item-title">${event.title}</div>
                    <div class="event-item-date">${dateStr}</div>
                </div>
                <button class="event-delete-btn" onclick="deleteCalendarEvent(${event.id})">Eliminar</button>
            </div>
            ${event.description ? `<div class="event-item-description">${event.description}</div>` : ''}
        `;
        
        eventsList.appendChild(eventItem);
    });
}

window.deleteCalendarEvent = function(eventId) {
    if (!confirm('¿Eliminar este evento?')) return;
    
    calendarEvents = calendarEvents.filter(e => e.id !== eventId);
    saveCalendarEventsToStorage();
    renderCalendar();
    showToast('Evento eliminado', 'success');
};

function showDayEvents(dateStr, events) {
    if (events.length === 0) {
        showToast('No hay eventos en este día', 'info');
        return;
    }
    
    // Aquí podrías mostrar un modal con los eventos del día
    const eventTitles = events.map(e => `• ${e.title}`).join('\n');
    showToast(`Eventos:\n${eventTitles}`, 'info');
}

function checkSpecialDateTheme(month) {
    const today = new Date();
    const dateKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const themeMessage = document.getElementById('calendarThemeMessage');
    
    if (specialDates[dateKey]) {
        const special = specialDates[dateKey];
        themeMessage.textContent = special.theme;
        themeMessage.style.background = special.color;
        themeMessage.style.color = 'white';
        themeMessage.classList.remove('hidden');
    } else if (month === 12) {
        themeMessage.textContent = '🎄 ¡Feliz temporada navideña!';
        themeMessage.style.background = '#4caf50';
        themeMessage.style.color = 'white';
        themeMessage.classList.remove('hidden');
    } else if (month === 10) {
        themeMessage.textContent = '🎃 Mes de Halloween';
        themeMessage.style.background = '#ff9800';
        themeMessage.style.color = 'white';
        themeMessage.classList.remove('hidden');
    } else {
        themeMessage.classList.add('hidden');
    }
}

// ========== NOTIFICACIONES PUSH ==========

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Permisos de notificación concedidos');
                showToast('Notificaciones activadas', 'success');
            }
        });
    }
}

function checkUpcomingReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const upcomingEvents = calendarEvents.filter(e => e.date === tomorrowStr && e.reminder);
    
    upcomingEvents.forEach(event => {
        // Verificar si ya se envió notificación hoy
        const notificationKey = `notif_${event.id}_${tomorrowStr}`;
        if (!localStorage.getItem(notificationKey)) {
            sendPushNotification(event);
            localStorage.setItem(notificationKey, 'sent');
        }
    });
}

function sendPushNotification(event) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('📅 Recordatorio', {
            body: `Mañana tienes: ${event.title}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
            tag: `event-${event.id}`,
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        console.log('🔔 Notificación enviada:', event.title);
    }
}

function scheduleReminder(event) {
    // Calcular tiempo hasta 1 día antes
    const eventDate = new Date(event.date + 'T00:00:00');
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM
    
    const now = new Date();
    const timeUntilReminder = reminderDate - now;
    
    if (timeUntilReminder > 0 && timeUntilReminder < 86400000 * 2) { // Dentro de 2 días
        setTimeout(() => {
            sendPushNotification(event);
        }, timeUntilReminder);
    }
}

// El calendario se inicializa dentro del DOMContentLoaded principal
