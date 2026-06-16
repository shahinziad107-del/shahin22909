
// Fix BFCache Animation Freeze for Liquid Glass Buttons
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.querySelectorAll('.liquid-search-btn, .chat-toggle-btn').forEach(btn => {
            const oldAnimation = btn.style.animation;
            btn.style.animation = 'none';
            btn.offsetHeight; // trigger reflow
            btn.style.animation = null;
        });
        
        // Also fix the navbar scroll state if restoring
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.background = 'rgba(255, 255, 255, 0.85)';
            navbar.style.backdropFilter = 'blur(15px)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }
    }
});
