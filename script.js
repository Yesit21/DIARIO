// Animación de entrada al diario
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está autenticado
    const isAuthenticated = sessionStorage.getItem('diaryAuthenticated');
    if (isAuthenticated === 'true') {
        console.log('✅ Usuario ya autenticado, redirigiendo al diario...');
        window.location.href = 'diary.html';
        return;
    }
    
    const heart = document.getElementById('heart');
    const lock = document.getElementById('lock');
    const passwordModal = document.getElementById('passwordModal');
    const passwordInputs = document.querySelectorAll('.password-digit');
    const submitPassword = document.getElementById('submitPassword');
    const cancelPassword = document.getElementById('cancelPassword');
    const passwordError = document.getElementById('passwordError');
    
    // Contraseña correcta (solo números)
    const correctPassword = '20072210';
    
    if (heart) {
        heart.addEventListener('click', function() {
            // Mostrar modal de contraseña
            passwordModal.classList.remove('hidden');
            passwordInputs[0].focus();
        });
        
        // Efecto de latido del corazón
        setInterval(() => {
            heart.style.transform = 'scale(1.05)';
            setTimeout(() => {
                heart.style.transform = 'scale(1)';
            }, 200);
        }, 2000);
    }
    
    // Manejar inputs de contraseña
    passwordInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            // Solo permitir un dígito
            if (this.value.length > 1) {
                this.value = this.value.slice(0, 1);
            }
            
            // Mover al siguiente input automáticamente
            if (this.value && index < passwordInputs.length - 1) {
                passwordInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            // Permitir backspace para ir al input anterior
            if (e.key === 'Backspace' && !this.value && index > 0) {
                passwordInputs[index - 1].focus();
            }
            
            // Permitir Enter para enviar
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    });
    
    // Botón enviar contraseña
    submitPassword.addEventListener('click', checkPassword);
    
    // Botón cancelar
    cancelPassword.addEventListener('click', function() {
        closePasswordModal();
    });
    
    // Cerrar modal al hacer clic fuera
    passwordModal.addEventListener('click', function(e) {
        if (e.target === passwordModal) {
            closePasswordModal();
        }
    });
    
    function checkPassword() {
        const enteredPassword = Array.from(passwordInputs).map(input => input.value).join('');
        
        if (enteredPassword === correctPassword) {
            // Contraseña correcta - guardar autenticación en sessionStorage
            sessionStorage.setItem('diaryAuthenticated', 'true');
            console.log('✅ Usuario autenticado correctamente');
            
            passwordError.classList.add('hidden');
            passwordModal.classList.add('hidden');
            unlockHeart();
        } else {
            // Contraseña incorrecta
            passwordError.classList.remove('hidden');
            
            // Limpiar inputs y enfocar el primero
            passwordInputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#f44336';
            });
            passwordInputs[0].focus();
            
            // Restaurar colores después de 2 segundos
            setTimeout(() => {
                passwordInputs.forEach(input => {
                    input.style.borderColor = '#f8bbd9';
                });
                passwordError.classList.add('hidden');
            }, 2000);
        }
    }
    
    function closePasswordModal() {
        passwordModal.classList.add('hidden');
        passwordError.classList.add('hidden');
        passwordInputs.forEach(input => {
            input.value = '';
            input.style.borderColor = '#f8bbd9';
        });
    }
    
    function unlockHeart() {
        // Animación de desbloqueo
        lock.style.transform = 'translate(-50%, -50%) rotate(15deg)';
        lock.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            lock.style.opacity = '0';
            lock.style.transform = 'translate(-50%, -50%) rotate(15deg) scale(0)';
        }, 300);
        
        // Animación del corazón
        heart.style.transform = 'scale(1.2)';
        heart.style.filter = 'brightness(1.2)';
        
        setTimeout(() => {
            // Transición suave a la página del diario
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                // Redirigir directamente al diario
                window.location.href = 'diary.html';
            }, 500);
        }, 800);
    }
});