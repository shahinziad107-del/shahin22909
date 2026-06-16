
document.addEventListener("DOMContentLoaded", () => {
    const floatingSearch = document.getElementById('desktop-floating-search');
    const searchModalEl = document.getElementById('searchModal');
    
    if (searchModalEl && floatingSearch) {
        searchModalEl.addEventListener('show.bs.modal', () => {
            floatingSearch.classList.add('morph-hidden');
        });
        searchModalEl.addEventListener('hidden.bs.modal', () => {
            floatingSearch.classList.remove('morph-hidden');
        });
    }
});
