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
        console.log('🌐 Conexión recuperada, iniciando sincronización...');
        syncWithServer();
        syncLocalEntriesToDatabase(); // Asegurar que lo local se suba a la nube
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
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
            const response = await fetch('/api/entries');
            if (response.ok) {
                const data = await response.json();
                const serverEntries = data.entries || [];
                
                // Mezclar con locales y evitar duplicados
                const localEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
                const allEntries = [...localEntries, ...serverEntries];
                const uniqueEntries = allEntries.filter((entry, index, self) => 
                    index === self.findIndex(e => e.id === entry.id)
                );
                
                localStorage.setItem('diaryEntries', JSON.stringify(uniqueEntries));
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
            console.log('🔄 Sincronizando con el servidor...');
            await loadEntriesFromServer();
            
            // Cargar desde localStorage (que ya tiene los datos del servidor)
            let allEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            const entries = allEntries.filter(e => {
                if (currentSection === 'recuerdos') {
                    return !e.type || e.type === 'recuerdos';
                }
                return e.type === 'anhelos';
            });
            
            if (entries.length > 0) {
                displayEntriesWithPagination(entries);
            }
            
            console.log('✅ Sincronización completada');
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
    
    // Cargar entradas desde localStorage inmediatamente
    loadEntries();
    
    // Intentar sincronizar con el servidor en segundo plano
    if (isOnline) {
        syncWithServer().then(() => {
        }).catch(() => {
        });
    }
    
    // Manejar cambio de secciones
    const showRecuerdosBtn = document.getElementById('showRecuerdos');
    const showAnhelosBtn = document.getElementById('showAnhelos');
    const headerTitle = document.querySelector('header h1');
    const formTitle = document.querySelector('#entryForm h2');
    const anhelosFields = document.getElementById('anhelosFields');
    const entryTextarea = document.getElementById('entryText');

    function updateSectionUI() {
        if (currentSection === 'recuerdos') {
            document.body.classList.remove('anhelos-theme');
            showRecuerdosBtn.classList.add('active');
            showAnhelosBtn.classList.remove('active');
            headerTitle.innerHTML = '💕 Nuestros Recuerdos de Amor 💕';
            formTitle.innerHTML = 'Nuevo Recuerdo';
            anhelosFields.classList.add('hidden');
            entryTextarea.placeholder = 'Escribe aquí tus pensamientos...';
        } else {
            document.body.classList.add('anhelos-theme');
            showRecuerdosBtn.classList.remove('active');
            showAnhelosBtn.classList.add('active');
            headerTitle.innerHTML = 'Mis Deseos';
            formTitle.innerHTML = 'Nuevo Deseo';
            anhelosFields.classList.remove('hidden');
            entryTextarea.placeholder = 'Descripción o detalles (opcional)';
        }
        currentPage = 1; // Resetear página al cambiar sección
        loadEntries();
    }

    showRecuerdosBtn.addEventListener('click', () => {
        if (currentSection !== 'recuerdos') {
            currentSection = 'recuerdos';
            updateSectionUI();
        }
    });

    showAnhelosBtn.addEventListener('click', () => {
        if (currentSection !== 'anhelos') {
            currentSection = 'anhelos';
            updateSectionUI();
        }
    });

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
        // Intentar guardar en servidor primero
        saveEntryToServer(entry).then(success => {
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
        let allEntries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        
        // Filtrar por la sección actual
        // Si no tiene 'type', asumimos que es 'recuerdos' (para entradas antiguas)
        const entries = allEntries.filter(e => {
            if (currentSection === 'recuerdos') {
                return !e.type || e.type === 'recuerdos';
            }
            return e.type === 'anhelos';
        });
        
        console.log(`📋 Cargando ${entries.length} entradas de tipo ${currentSection}`);
        
        if (entries.length === 0) {
            const emptyMsg = currentSection === 'recuerdos' 
                ? 'Aún no tienen recuerdos. Haz clic en "Nueva Entrada" para comenzar a escribir juntos.'
                : 'Aún no tienen anhelos. ¿Qué sueños les gustaría cumplir juntos?';
            
            entriesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ad1457;">
                    <h3>¡Bienvenidos a nuestros ${currentSection}!</h3>
                    <p>${emptyMsg}</p>
                    <p style="font-size: 0.9em; margin-top: 15px;">💕 Sus ${currentSection} se guardan automáticamente</p>
                </div>
            `;
            return;
        }
        
        console.log('✅ Mostrando entradas con paginación...');
        displayEntriesWithPagination(entries);
        
        // Intentar sincronizar con el servidor en segundo plano
        if (isOnline) {
            syncWithServer();
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
        
        loadEntries(); // Usar loadEntries para que aplique el filtro de sección
    }
    
    // Función global para eliminar entradas
    // Función global para eliminar entradas
    window.deleteEntry = function(entryId) {
        const itemType = currentSection === 'recuerdos' ? 'recuerdo' : 'anhelo';
        if (confirm(`¿Estás segura de que quieres eliminar este ${itemType}?`)) {
            let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
            entries = entries.filter(entry => entry.id !== entryId);
            localStorage.setItem('diaryEntries', JSON.stringify(entries));
            
            loadEntries();
        }
    };

    // Función para cambiar el estado de un anhelo
    window.toggleAnheloStatus = function(entryId) {
        let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        const index = entries.findIndex(e => e.id === entryId);
        
        if (index !== -1) {
            const currentStatus = entries[index].status;
            entries[index].status = currentStatus === 'adquirido' ? 'sin_adquirir' : 'adquirido';
            localStorage.setItem('diaryEntries', JSON.stringify(entries));
            
            // Intentar sincronizar con la base de datos
            saveEntryToServer(entries[index]);
            
            loadEntries();
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