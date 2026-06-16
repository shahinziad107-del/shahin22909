
document.addEventListener("DOMContentLoaded", () => {
    const floatingSearch = document.getElementById('desktop-floating-search');
    if (floatingSearch) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Hide on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                floatingSearch.classList.add('hidden');
            } else {
                floatingSearch.classList.remove('hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});
