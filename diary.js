// Configuración de MongoDB Atlas
const MONGODB_CONFIG = {
    connectionString: 'mongodb+srv://YesitAndrade:2210jared@cluster0.mongodb.net/DiarioRomantico?retryWrites=true&w=majority',
    databaseName: 'DiarioRomantico',
    collectionName: 'entradas'
};

// API endpoints para MongoDB (usando MongoDB Data API)
const MONGODB_API = {
    baseUrl: 'https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1',
    apiKey: 'tu-api-key-aqui', // Necesitarás configurar esto en MongoDB Atlas
    dataSource: 'Cluster0',
    database: 'DiarioRomantico',
    collection: 'entradas'
};

// Estado de sincronización
let isOnline = navigator.onLine;
let isSyncing = false;

// Funcionalidad del diario con MongoDB
document.addEventListener('DOMContentLoaded', function() {
    const newEntryBtn = document.getElementById('newEntryBtn');
    const entryForm = document.getElementById('entryForm');
    const saveEntryBtn = document.getElementById('saveEntry');
    const cancelEntryBtn = document.getElementById('cancelEntry');
    const entriesContainer = document.getElementById('entriesContainer');
    const syncStatus = document.getElementById('syncIndicator');
    
    // Variables para paginación
    let currentPage = 1;
    const entriesPerPage = 10;
    
    // ID único del diario
    let DIARY_ID = 'nuestro-diario-secreto-2024';
    
    // Función para obtener parámetros de la URL
    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            diaryId: urlParams.get('diary'),
            password: urlParams.get('pass')
        };
    }
    
    // Función para generar enlace de acceso dinámico
    function generateAccessLink() {
        // Usar la URL actual del navegador (funciona en local y en Vercel)
        const baseUrl = window.location.origin;
        const accessUrl = `${baseUrl}/index.html`;
        return accessUrl;
    }
    
    // Función para compartir enlace del diario
    window.shareDiaryLink = function() {
        const accessLink = generateAccessLink();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(accessLink).then(() => {
                alert(`🔗 ¡Enlace del diario copiado!\n\n📱 Comparte este enlace:\n\n${accessLink}\n\n💕 Funciona desde cualquier dispositivo con internet.\n🔐 Al abrir el enlace, verán la página con el corazón y deberán ingresar la contraseña (20072210).\n\n🌐 Este enlace es público pero seguro con contraseña.`);
            }).catch(() => {
                prompt('🔗 Copia este enlace para compartir:', accessLink);
            });
        } else {
            prompt('🔗 Copia este enlace para compartir:', accessLink);
        }
    };
    
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
    
    // Función para actualizar estado de sincronización
    function updateSyncStatus(status, message = '') {
        if (syncStatus) {
            switch (status) {
                case 'online':
                    syncStatus.innerHTML = '✅ Sincronizado';
                    syncStatus.style.color = '#4caf50';
                    break;
                case 'syncing':
                    syncStatus.innerHTML = '🔄 Sincronizando...';
                    syncStatus.style.color = '#ff9800';
                    break;
                case 'offline':
                    syncStatus.innerHTML = '📱 Sin conexión';
                    syncStatus.style.color = '#f44336';
                    break;
                case 'error':
                    syncStatus.innerHTML = '⚠️ Error de sync';
                    syncStatus.style.color = '#f44336';
                    break;
                case 'ready':
                    syncStatus.innerHTML = '✅ Listo';
                    syncStatus.style.color = '#4caf50';
                    break;
            }
        }
    }
    
    // Detectar cambios de conexión
    window.addEventListener('online', () => {
        isOnline = true;
        updateSyncStatus('syncing');
        syncWithMongoDB();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateSyncStatus('offline');
    });
    
    // Función para guardar entrada en MongoDB
    async function saveEntryToMongoDB(entry) {
        if (!isOnline) {
            console.log('Sin conexión, guardando solo localmente');
            return false;
        }
        
        try {
            updateSyncStatus('syncing');
            
            // Usar fetch para enviar datos a MongoDB (simulado)
            // En producción necesitarías un backend o usar MongoDB Realm
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diaryId: DIARY_ID,
                    entry: entry
                })
            });
            
            if (response.ok) {
                console.log('✅ Entrada guardada en MongoDB');
                updateSyncStatus('online');
                return true;
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('❌ Error guardando en MongoDB:', error);
            updateSyncStatus('error');
            return false;
        }
    }
    
    // Función para cargar entradas desde MongoDB
    async function loadEntriesFromMongoDB() {
        if (!isOnline) {
            console.log('Sin conexión, cargando solo desde localStorage');
            return JSON.parse(localStorage.getItem('diaryEntries')) || [];
        }
        
        try {
            updateSyncStatus('syncing');
            
            // Usar fetch para obtener datos de MongoDB (simulado)
            const response = await fetch(`/api/entries?diaryId=${DIARY_ID}`);
            
            if (response.ok) {
                const data = await response.json();
                const cloudEntries = data.entries || [];
                
                // Combinar con entradas locales
                const localEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                const allEntries = [...localEntries, ...cloudEntries];
                
                // Eliminar duplicados por ID
                const uniqueEntries = allEntries.filter((entry, index, self) => 
                    index === self.findIndex(e => e.id === entry.id)
                );
                
                // Ordenar por fecha
                uniqueEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Actualizar localStorage
                localStorage.setItem('diaryEntries', JSON.stringify(uniqueEntries));
                
                console.log(`✅ Cargadas ${uniqueEntries.length} entradas desde MongoDB`);
                updateSyncStatus('online');
                return uniqueEntries;
                
            } else {
                throw new Error('Error cargando desde MongoDB');
            }
            
        } catch (error) {
            console.error('❌ Error cargando desde MongoDB:', error);
            updateSyncStatus('error');
            
            // Usar solo entradas locales como fallback
            return JSON.parse(localStorage.getItem('diaryEntries')) || [];
        }
    }
    
    // Función para verificar uso de almacenamiento en MongoDB
    async function checkMongoDBStorage() {
        try {
            const response = await fetch('/api/storage-info');
            if (response.ok) {
                const data = await response.json();
                console.log(`💾 Uso de MongoDB: ${data.usedMB}MB / ${data.limitMB}MB (${data.percentage}%)`);
                
                if (data.percentage > 80) {
                    alert(`⚠️ Almacenamiento casi lleno: ${data.percentage}% usado\n\nConsidera eliminar entradas antiguas o usar menos fotos por entrada.`);
                }
                
                return data;
            }
        } catch (error) {
            console.log('No se pudo verificar el uso de almacenamiento');
        }
        return null;
    }
    async function syncWithMongoDB() {
        if (!isOnline || isSyncing) {
            return;
        }
        
        isSyncing = true;
        
        try {
            console.log('🔄 Iniciando sincronización con MongoDB...');
            
            // Cargar entradas desde MongoDB
            const entries = await loadEntriesFromMongoDB();
            
            // Actualizar la vista
            if (entries.length > 0) {
                displayEntriesWithPagination(entries);
            }
            
            console.log('✅ Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            updateSyncStatus('error');
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
            updateSyncStatus('syncing');
            
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
                
                // Mostrar mensaje de éxito
                const successMsg = document.createElement('div');
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4caf50;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    z-index: 1000;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                `;
                successMsg.textContent = `🎉 ${result.syncedCount} entradas sincronizadas a la base de datos`;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    if (document.body.contains(successMsg)) {
                        document.body.removeChild(successMsg);
                    }
                }, 5000);
                
                updateSyncStatus('online');
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('❌ Error sincronizando entradas locales:', error);
            updateSyncStatus('error');
        }
    }
    
    // Función global para sincronizar manualmente
    window.syncToDatabase = function() {
        if (confirm('¿Quieres sincronizar todas las entradas locales a la base de datos?\n\nEsto asegurará que aparezcan en otros dispositivos.')) {
            syncLocalEntriesToDatabase();
        }
    };
    
    // Verificar acceso y inicializar
    if (!checkUrlAccess()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar sincronización con MongoDB
    updateSyncStatus('ready');
    
    // Cargar entradas desde localStorage inmediatamente
    loadEntries();
    
    // Intentar sincronizar con MongoDB en segundo plano
    if (isOnline) {
        syncWithMongoDB().then(() => {
            updateSyncStatus('online');
        }).catch(() => {
            updateSyncStatus('ready');
        });
    } else {
        updateSyncStatus('offline');
    }
    
    // Sincronizar cada 30 segundos si hay conexión
    setInterval(() => {
        if (isOnline && !isSyncing) {
            syncWithMongoDB();
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
    
    // Función para comprimir imágenes (versión optimizada para MongoDB)
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
                    
                    // Compresión más agresiva para MongoDB
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
                    
                    console.log(`📸 Foto optimizada para MongoDB:`);
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
        
        if (!title || !text) {
            alert('Por favor completa todos los campos obligatorios');
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
            photos: []
        };
        
        if (photoFiles.length > 0) {
            const filesArray = Array.from(photoFiles);
            processPhotosSimple(filesArray, entry);
        } else {
            saveEntry(entry);
        }
    });
    
    function saveEntry(entry) {
        // Intentar guardar en MongoDB primero
        saveEntryToMongoDB(entry).then(success => {
            // Siempre guardar localmente como respaldo
            try {
                let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                
                // Verificar si ya existe la entrada
                const existingIndex = entries.findIndex(e => e.id === entry.id);
                if (existingIndex >= 0) {
                    entries[existingIndex] = entry;
                } else {
                    entries.push(entry);
                }
                
                const dataToSave = JSON.stringify(entries);
                localStorage.setItem('diaryEntries', dataToSave);
                
                loadEntries();
                entryForm.classList.add('hidden');
                clearForm();
                newEntryBtn.style.display = 'inline-block';
                
                const successMsg = document.createElement('div');
                successMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4caf50;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    z-index: 1000;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                `;
                
                if (success) {
                    successMsg.textContent = '✅ Entrada guardada y sincronizada en la nube';
                } else {
                    successMsg.textContent = '✅ Entrada guardada (se sincronizará cuando haya conexión)';
                }
                
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    if (document.body.contains(successMsg)) {
                        document.body.removeChild(successMsg);
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Error guardando localmente:', error);
                
                let errorMessage = 'Error guardando la entrada. ';
                if (error.name === 'QuotaExceededError') {
                    errorMessage += 'El almacenamiento está lleno. Intenta eliminar algunas entradas antiguas o usar fotos más pequeñas.';
                } else {
                    errorMessage += 'Por favor intenta de nuevo con fotos más pequeñas.';
                }
                
                alert(errorMessage);
            }
        }).finally(() => {
            // Restaurar botón
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
        // Cargar desde localStorage primero
        const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        
        console.log(`📋 Cargando ${entries.length} entradas desde localStorage`);
        console.log('📝 Entradas encontradas:', entries);
        
        if (entries.length === 0) {
            console.log('❌ No hay entradas, mostrando mensaje de bienvenida');
            entriesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ad1457;">
                    <h3>¡Bienvenidos a nuestros recuerdos!</h3>
                    <p>Aún no tienen entradas. Haz clic en "Nueva Entrada" para comenzar a escribir juntos.</p>
                    <p style="font-size: 0.9em; margin-top: 15px;">💕 Sus recuerdos se guardan automáticamente</p>
                </div>
            `;
            return;
        }
        
        console.log('✅ Mostrando entradas con paginación...');
        displayEntriesWithPagination(entries);
        
        // Intentar sincronizar con MongoDB en segundo plano
        if (isOnline) {
            syncWithMongoDB();
        }
    }
    
    function displayEntriesWithPagination(entries) {
        console.log(`📄 Mostrando ${entries.length} entradas con paginación`);
        
        // Ordenar por ID (que es timestamp) en lugar de fecha
        const sortedEntries = entries.sort((a, b) => a.id - b.id);
        
        console.log('📋 Entradas ordenadas:', sortedEntries);
        
        const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
        entriesContainer.innerHTML = '';
        
        console.log(`📖 Creando ${totalPages} páginas`);
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const startIndex = (pageNum - 1) * entriesPerPage;
            const endIndex = startIndex + entriesPerPage;
            const pageEntries = sortedEntries.slice(startIndex, endIndex);
            
            console.log(`📄 Página ${pageNum}: ${pageEntries.length} entradas`);
            createPage(pageNum, pageEntries, pageNum === currentPage);
        }
        
        createPagination(totalPages);
        console.log('✅ Paginación completada');
    }
    
    function createPage(pageNum, entries, isVisible) {
        const pageContainer = document.createElement('div');
        pageContainer.className = `diary-page-container page-${((pageNum - 1) % 6) + 1}`;
        pageContainer.id = `page-${pageNum}`;
        pageContainer.style.display = isVisible ? 'block' : 'none';
        
        const pageTitles = [
            { title: '💖 Nuestros Primeros Momentos 💖', subtitle: 'Donde comenzó nuestra historia de amor' },
            { title: '💕 Recuerdos Dulces 💕', subtitle: 'Momentos que nos hacen sonreír' },
            { title: '💗 Aventuras Juntos 💗', subtitle: 'Explorando el mundo de la mano' },
            { title: '💝 Tesoros del Corazón 💝', subtitle: 'Memorias que guardamos con amor' },
            { title: '💘 Días Especiales 💘', subtitle: 'Celebrando nuestro amor único' },
            { title: '💞 Eternos Momentos 💞', subtitle: 'Para siempre en nuestros corazones' }
        ];
        
        const pageTitle = pageTitles[((pageNum - 1) % 6)];
        
        pageContainer.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">${pageTitle.title}</h2>
                <p class="page-subtitle">${pageTitle.subtitle}</p>
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
            emptySlot.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ccc; font-style: italic;">
                    <span>💭 Esperando nuevos recuerdos...</span>
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
        entryElement.className = 'diary-entry';
        
        let photosHtml = '';
        if (entry.photos && entry.photos.length > 0) {
            console.log(`📸 Mostrando entrada "${entry.title}" con ${entry.photos.length} fotos en orden:`);
            entry.photos.forEach((photo, index) => {
                console.log(`  ${index + 1}. Foto mostrada en posición ${index + 1} (${photo.length} caracteres)`);
            });
            
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
        } else {
            console.log(`❌ No hay fotos en la entrada "${entry.title}"`);
        }
        
        entryElement.innerHTML = `
            <div class="entry-header">
                <button onclick="deleteEntry(${entry.id})" class="delete-btn">×</button>
            </div>
            <h3 class="entry-title">${entry.title}</h3>
            <p class="entry-text">${entry.text.replace(/\n/g, '<br>')}</p>
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
        
        const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        displayEntriesWithPagination(entries);
    }
    
    // Función global para eliminar entradas
    // Función global para eliminar entradas
    window.deleteEntry = function(entryId) {
        if (confirm('¿Estás segura de que quieres eliminar esta entrada?')) {
            let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            entries = entries.filter(entry => entry.id !== entryId);
            localStorage.setItem('diaryEntries', JSON.stringify(entries));
            
            loadEntries();
        }
    };
    
    // Función global para borrar todas las entradas
    window.clearAllEntries = function() {
        if (confirm('⚠️ ¿Estás seguro de que quieres borrar TODAS las entradas? Esta acción no se puede deshacer.')) {
            if (confirm('🚨 ÚLTIMA CONFIRMACIÓN: Se borrarán todas las entradas y fotos del diario.')) {
                localStorage.removeItem('diaryEntries');
                loadEntries();
                alert('🗑️ Todas las entradas han sido eliminadas.');
            }
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
    
    // Cargar entradas existentes
    console.log('🚀 Iniciando carga de entradas...');
    loadEntries();
    
    // Sincronizar entradas locales automáticamente después de 3 segundos
    setTimeout(() => {
        const localEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        if (localEntries.length > 0) {
            console.log(`🔄 Auto-sincronizando ${localEntries.length} entradas locales...`);
            syncLocalEntriesToDatabase();
        }
    }, 3000);
    
}); // Cierre del DOMContentLoaded