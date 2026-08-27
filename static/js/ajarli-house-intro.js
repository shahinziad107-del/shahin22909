/* Ajarli Interior Build: a WebGL scene that constructs a believable unfinished home around the viewer. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => value * value * (3 - 2 * value);

function createConcreteTexture() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = textureCanvas.height = 256;
    const context = textureCanvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#d2cbb8');
    gradient.addColorStop(.48, '#b6af9d');
    gradient.addColorStop(1, '#9eaa8d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    let seed = 7241;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 4100; i += 1) {
        const shade = 125 + Math.floor(random() * 85);
        context.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 16}, ${0.025 + random() * .07})`;
        const size = 1 + random() * 3;
        context.fillRect(random() * 256, random() * 256, size, size);
    }
    for (let i = 0; i < 13; i += 1) {
        context.strokeStyle = `rgba(100, 93, 78, ${0.035 + random() * .045})`;
        context.lineWidth = 1 + random() * 2;
        context.beginPath();
        context.moveTo(-10, random() * 256);
        context.lineTo(266, random() * 256);
        context.stroke();
    }
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.7, 2.7);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeBox(width, height, depth, material, position) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    object.position.set(position[0], position[1], position[2]);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
}

function buildInterior(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.shadowMap.enabled = window.innerWidth > 600;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d2418');
    scene.fog = new THREE.FogExp2('#0d2418', .038);
    const camera = new THREE.PerspectiveCamera(63, 1, .1, 80);
    const aim = new THREE.Vector3(0, 1.86, -3.6);
    const concrete = createConcreteTexture();
    const concreteMaterial = new THREE.MeshStandardMaterial({ map: concrete, color: '#d5cdb8', roughness: .9, metalness: 0 });
    const wallMaterial = new THREE.MeshStandardMaterial({ map: concrete.clone(), color: '#d8cdb5', roughness: .92, metalness: 0 });
    wallMaterial.map.wrapS = wallMaterial.map.wrapT = THREE.RepeatWrapping;
    wallMaterial.map.repeat.set(2.2, 1.4);
    const rawConcrete = new THREE.MeshStandardMaterial({ color: '#9fa58e', roughness: .82, metalness: 0 });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: concrete.clone(), color: '#b8bca7', roughness: .97, metalness: 0 });
    floorMaterial.map.repeat.set(4.5, 3.5);
    const glassMaterial = new THREE.MeshStandardMaterial({ color: '#b4d4b2', roughness: .25, metalness: .04, transparent: true, opacity: .34 });
    const woodMaterial = new THREE.MeshStandardMaterial({ color: '#785b3d', roughness: .72, metalness: 0 });
    const warmMaterial = new THREE.MeshStandardMaterial({ color: '#e8c586', emissive: '#8f6a2d', emissiveIntensity: .08, roughness: .68 });

    const ambient = new THREE.HemisphereLight('#e8f2d1', '#152418', 1.28);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight('#fff1cf', .18);
    sun.position.set(-6, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    scene.add(sun);
    const fill = new THREE.PointLight('#a5d793', .08, 14, 2);
    fill.position.set(2.2, 2.9, 1.6);
    scene.add(fill);

    const floor = makeBox(10.6, .22, 8.4, floorMaterial, [0, -.13, -1.1]);
    scene.add(floor);
    const dust = new THREE.Group();
    for (let i = 0; i < 24; i += 1) {
        const mote = new THREE.Mesh(new THREE.SphereGeometry(.013 + (i % 3) * .006, 6, 6), new THREE.MeshBasicMaterial({ color: '#fff2d0', transparent: true, opacity: .15 }));
        mote.position.set(-3.5 + (i * 1.71) % 7, .4 + (i * .59) % 3.5, -2.4 + (i * .83) % 4);
        dust.add(mote);
    }
    scene.add(dust);

    const pillars = new THREE.Group();
    [[-2.65, -1.35], [2.65, -1.35], [-4.35, -3.7], [4.35, -3.7], [-4.35, 2.2], [4.35, 2.2], [-1.25, -3.7], [1.25, -3.7]].forEach(([x, z]) => {
        const pillar = makeBox(.48, 4.85, .48, concreteMaterial, [x, 2.42, z]);
        pillars.add(pillar);
    });
    scene.add(pillars);

    const walls = new THREE.Group();
    walls.add(makeBox(3.32, 4.25, .28, wallMaterial, [-2.78, 2.13, -4.05]));
    walls.add(makeBox(3.32, 4.25, .28, wallMaterial, [2.78, 2.13, -4.05]));
    walls.add(makeBox(9.1, 4.25, .26, wallMaterial, [-4.42, 2.13, -1.0]));
    walls.add(makeBox(9.1, 4.25, .26, wallMaterial, [4.42, 2.13, -1.0]));
    scene.add(walls);

    const windows = new THREE.Group();
    const windowFrame = new THREE.Group();
    windowFrame.add(makeBox(2.35, .15, .18, rawConcrete, [-4.23, 2.97, -1.0]));
    windowFrame.add(makeBox(2.35, .15, .18, rawConcrete, [-4.23, 1.22, -1.0]));
    windowFrame.add(makeBox(.15, 1.9, .18, rawConcrete, [-4.23, 2.1, -.01]));
    windowFrame.add(makeBox(.15, 1.9, .18, rawConcrete, [-4.23, 2.1, -2.0]));
    const glass = makeBox(.04, 1.65, 1.75, glassMaterial, [-4.20, 2.1, -1.0]);
    windows.add(windowFrame, glass);
    scene.add(windows);

    const ceiling = makeBox(10.1, .24, 7.9, wallMaterial, [0, 4.92, -1.0]);
    scene.add(ceiling);
    const beam = new THREE.Group();
    beam.add(makeBox(10.0, .38, .34, rawConcrete, [0, 4.58, -3.6]));
    beam.add(makeBox(10.0, .38, .34, rawConcrete, [0, 4.58, .95]));
    beam.add(makeBox(.34, .38, 5.0, rawConcrete, [-3.95, 4.58, -1.3]));
    beam.add(makeBox(.34, .38, 5.0, rawConcrete, [3.95, 4.58, -1.3]));
    scene.add(beam);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0, -3.85);
    const doorwayLight = new THREE.Mesh(
        new THREE.PlaneGeometry(1.76, 2.55),
        new THREE.MeshBasicMaterial({ color: '#fff7c7', transparent: true, opacity: .93, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
    );
    doorwayLight.position.set(0, 1.29, -4.18);
    scene.add(doorwayLight);
    const doorwayGlow = new THREE.PointLight('#d9ef9e', 0, 8, 2);
    doorwayGlow.position.set(0, 1.8, -3.15);
    scene.add(doorwayGlow);
    const door = makeBox(1.48, 2.52, .12, woodMaterial, [.74, 1.26, 0]);
    doorPivot.add(door);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 10), warmMaterial);
    handle.position.set(1.27, 1.3, -.09);
    doorPivot.add(handle);
    scene.add(doorPivot);
    const lintel = makeBox(2.12, .27, .35, rawConcrete, [0, 2.86, -3.95]);
    const jambLeft = makeBox(.24, 2.9, .35, rawConcrete, [-1.0, 1.44, -3.95]);
    const jambRight = makeBox(.24, 2.9, .35, rawConcrete, [1.0, 1.44, -3.95]);
    scene.add(lintel, jambLeft, jambRight);

    const elements = [
        { object: pillars, start: .18, end: .43, y: 0 },
        { object: walls, start: .39, end: .72, y: .9 },
        { object: windows, start: .48, end: .78, y: .45 },
        { object: ceiling, start: .65, end: .92, y: .8 },
        { object: beam, start: .62, end: .9, y: .25 },
        { object: doorPivot, start: .73, end: .93, y: .2 },
        { object: lintel, start: .55, end: .78, y: .3 },
        { object: jambLeft, start: .55, end: .78, y: .3 },
        { object: jambRight, start: .55, end: .78, y: .3 }
    ];

    function setBuild(object, start, end, lift) {
        const progress = ease(clamp01((state.progress - start) / (end - start)));
        object.visible = progress > .001;
        object.scale.y = Math.max(.001, progress);
        object.position.y = object.userData.baseY - lift * (1 - progress);
    }

    elements.forEach((item) => { item.object.userData.baseY = item.object.position.y; });
    const state = { progress: 0, target: 0, frame: null, width: 0, height: 0 };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        state.width = rect.width;
        state.height = rect.height;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    function render() {
        state.progress += (state.target - state.progress) * .085;
        elements.forEach((item) => setBuild(item.object, item.start, item.end, item.y));
        const finished = ease(clamp01((state.progress - .74) / .16));
        doorPivot.rotation.y = -finished * 1.28;
        doorwayLight.material.opacity = finished;
        doorwayGlow.intensity = finished * 3.25;
        sun.intensity = .18 + state.progress * 1.6;
        fill.intensity = .08 + state.progress * .4;
        camera.position.set(.08 * Math.sin(state.progress * 4), 1.74 + state.progress * .12, 2.72 - state.progress * .88);
        aim.set(0, 1.86 + state.progress * .15, -3.75);
        camera.lookAt(aim);
        dust.rotation.y += .00055;
        renderer.render(scene, camera);
        state.frame = requestAnimationFrame(render);
    }

    resize();
    render();
    return { setProgress: (progress) => { state.target = progress; }, resize, dispose: () => { cancelAnimationFrame(state.frame); renderer.dispose(); } };
}

(() => {
    const root = document.documentElement;
    const body = document.body;
    const journey = document.getElementById('house-journey');
    const canvas = document.getElementById('ajarli-interior-canvas');
    const progressBar = document.getElementById('house-progress-bar');
    const sceneIndex = document.getElementById('scene-index');
    const autoEntry = document.getElementById('ajarli-auto-entry');
    const interiorStatus = document.getElementById('interior-status-text');
    const stages = Array.from(document.querySelectorAll('[data-copy-stage]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const statusText = ['الأرض والمساحة أمامك', 'أعمدة البيت ترتفع حولك', 'الغرف والجدران تتشكل', 'البيت اكتمل والباب مفتوح'];
    let animationFrame = null;
    let activeScene = -1;
    let entryTimer = null;
    let interior = null;

    try {
        if (!reducedMotion.matches && canvas && window.WebGLRenderingContext) {
            interior = buildInterior(canvas);
            body.classList.add('webgl-ready');
        }
    } catch (error) {
        body.classList.remove('webgl-ready');
        console.warn('Ajarli interior WebGL fallback active.', error);
    }

    function cancelAutoEntry() {
        if (entryTimer !== null) {
            window.clearTimeout(entryTimer);
            entryTimer = null;
        }
    }

    function queueAutoEntry() {
        cancelAutoEntry();
        if (reducedMotion.matches) return;
        if (autoEntry) autoEntry.textContent = 'سيفتح أجرلي تلقائيًا الآن';
        entryTimer = window.setTimeout(() => { window.location.href = 'home.html'; }, 1800);
    }

    function setScene(scene) {
        if (scene === activeScene) return;
        if (scene !== 3) cancelAutoEntry();
        activeScene = scene;
        body.dataset.scene = String(scene);
        if (sceneIndex) sceneIndex.firstChild.nodeValue = `0${scene + 1} `;
        if (interiorStatus) interiorStatus.textContent = statusText[scene];
        stages.forEach((stage, index) => {
            const isActive = index === scene;
            stage.classList.toggle('is-active', isActive);
            stage.setAttribute('aria-hidden', String(!isActive));
        });
        if (scene === 3) queueAutoEntry();
    }

    function updateJourney() {
        animationFrame = null;
        if (!journey || reducedMotion.matches) {
            setScene(0);
            return;
        }
        const rect = journey.getBoundingClientRect();
        const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
        const progress = clamp01(-rect.top / travel);
        const scene = Math.min(3, Math.floor(progress * 4));
        if (scene === 3 && progress < .95) cancelAutoEntry();
        if (scene === 3 && progress >= .95 && entryTimer === null) queueAutoEntry();
        root.style.setProperty('--house-progress', `${Math.max(5, progress * 100)}%`);
        if (progressBar) progressBar.style.width = `${Math.max(5, progress * 100)}%`;
        if (interior) interior.setProgress(progress);
        setScene(scene);
    }

    function requestUpdate() { if (animationFrame === null) animationFrame = requestAnimationFrame(updateJourney); }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { if (interior) interior.resize(); requestUpdate(); }, { passive: true });
    reducedMotion.addEventListener('change', () => window.location.reload());
    requestUpdate();
})();
