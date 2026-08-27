/* Ajarli House Journey controller: maps a brief scroll range to four architectural and editorial stages. */
(() => {
    const root = document.documentElement;
    const body = document.body;
    const journey = document.getElementById('house-journey');
    const progressBar = document.getElementById('house-progress-bar');
    const sceneIndex = document.getElementById('scene-index');
    const stages = Array.from(document.querySelectorAll('[data-copy-stage]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = null;
    let activeScene = -1;

    function setScene(scene) {
        if (scene === activeScene) return;
        activeScene = scene;
        body.dataset.scene = String(scene);
        if (sceneIndex) sceneIndex.firstChild.nodeValue = `0${scene + 1} `;
        stages.forEach((stage, index) => {
            const isActive = index === scene;
            stage.classList.toggle('is-active', isActive);
            stage.setAttribute('aria-hidden', String(!isActive));
        });
    }

    function updateJourney() {
        animationFrame = null;
        if (!journey || reducedMotion.matches) {
            setScene(0);
            return;
        }
        const rect = journey.getBoundingClientRect();
        const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / travel));
        const scene = Math.min(3, Math.floor(progress * 4));
        root.style.setProperty('--house-progress', `${Math.max(5, progress * 100)}%`);
        if (progressBar) progressBar.style.width = `${Math.max(5, progress * 100)}%`;
        setScene(scene);
    }

    function requestUpdate() {
        if (animationFrame === null) animationFrame = window.requestAnimationFrame(updateJourney);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    reducedMotion.addEventListener('change', requestUpdate);
    requestUpdate();
})();
