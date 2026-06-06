// Animación de corazoncitos siguiendo el cursor
(function() {
    const hearts = ['💕', '💖', '💗', '💝', '💘', '💞'];
    let heartIndex = 0;
    let lastX = 0;
    let lastY = 0;
    let isMoving = false;
    
    function createHeart(x, y) {
        const heart = document.createElement('div');
        heart.textContent = hearts[heartIndex];
        heartIndex = (heartIndex + 1) % hearts.length;
        
        heart.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${Math.random() * 10 + 15}px;
            pointer-events: none;
            z-index: 9999;
            animation: floatUpHeart ${Math.random() * 2 + 2}s ease-out forwards;
            transform: translate(-50%, -50%);
            user-select: none;
        `;
        
        document.body.appendChild(heart);
        
        // Eliminar después de la animación
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 4000);
    }
    
    // Agregar animación CSS si no existe
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUpHeart {
            0% {
                opacity: 1;
                transform: translate(-50%, -50%) translateY(0) rotate(0deg) scale(1);
            }
            50% {
                opacity: 0.8;
                transform: translate(-50%, -50%) translateY(-50px) rotate(180deg) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) translateY(-100px) rotate(360deg) scale(0.5);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Crear corazones mientras el cursor se mueve
    let createHeartTimeout;
    document.addEventListener('mousemove', function(e) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        // Solo crear corazones si se está moviendo el cursor
        if (distance > 30) {
            isMoving = true;
            createHeart(e.clientX, e.clientY);
            
            clearTimeout(createHeartTimeout);
            createHeartTimeout = setTimeout(() => {
                isMoving = false;
            }, 100);
        }
    });
    
    // Crear corazón en clics
    document.addEventListener('click', function(e) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                createHeart(e.clientX + offsetX, e.clientY + offsetY);
            }, i * 50);
        }
    });
})();
