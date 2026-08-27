/* Ajarli Interior Build: an inside-the-room WebGL construction scene with drag-to-look controls. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ease = (value) => value * value * (3 - 2 * value);

function createConcreteTexture() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = textureCanvas.height = 256;
    const context = textureCanvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#d9d2bf');
    gradient.addColorStop(.5, '#b7b09e');
    gradient.addColorStop(1, '#9fa78f');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    let seed = 7241;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 4400; i += 1) {
        const shade = 118 + Math.floor(random() * 92);
        context.fillStyle = `rgba(${shade},${shade - 5},${shade - 16},${.025 + random() * .07})`;
        const size = 1 + random() * 3.2;
        context.fillRect(random() * 256, random() * 256, size, size);
    }
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeBox(width, height, depth, material, position) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
}

function createInteriorScene(canvas, onLook) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = window.innerWidth > 640;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#10281c');
    scene.fog = new THREE.FogExp2('#10281c', .027);
    const camera = new THREE.PerspectiveCamera(68, 1, .1, 70);
    const concreteMap = createConcreteTexture();
    const concrete = new THREE.MeshStandardMaterial({ map: concreteMap, color: '#d2c9b5', roughness: .94 });
    const rawConcrete = new THREE.MeshStandardMaterial({ color: '#a8ad96', roughness: .87 });
    const wallMap = concreteMap.clone();
    wallMap.repeat.set(2.5, 1.5);
    const wall = new THREE.MeshStandardMaterial({ map: wallMap, color: '#d7cdb7', roughness: .92 });
    const floorMap = concreteMap.clone();
    floorMap.repeat.set(4.7, 4.2);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorMap, color: '#bfc0aa', roughness: .98 });
    const wood = new THREE.MeshStandardMaterial({ color: '#795838', roughness: .71 });
    const frame = new THREE.MeshStandardMaterial({ color: '#69745e', roughness: .77 });
    const glass = new THREE.MeshStandardMaterial({ color: '#b8d8b3', roughness: .19, metalness: .04, transparent: true, opacity: .36, side: THREE.DoubleSide });

    scene.add(new THREE.HemisphereLight('#edf7d9', '#162719', 1.4));
    const sun = new THREE.DirectionalLight('#ffefc5', .18);
    sun.position.set(-4, 8, 1.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    scene.add(sun);
    const roomFill = new THREE.PointLight('#b5db9d', .15, 16, 2);
    roomFill.position.set(0, 3.4, 0);
    scene.add(roomFill);

    const floor = makeBox(10.7, .2, 9.7, floorMaterial, [0, -.12, 0]);
    scene.add(floor);

    const dust = new THREE.Group();
    for (let i = 0; i < 34; i += 1) {
        const mote = new THREE.Mesh(new THREE.SphereGeometry(.012 + (i % 4) * .006, 6, 6), new THREE.MeshBasicMaterial({ color: '#fff3d4', transparent: true, opacity: .15 }));
        mote.position.set(-4.1 + (i * 1.71) % 8.2, .35 + (i * .61) % 4.0, -3.8 + (i * .87) % 7.2);
        dust.add(mote);
    }
    scene.add(dust);

    const pillars = new THREE.Group();
    [[-3.95, -3.6], [3.95, -3.6], [-3.95, 3.6], [3.95, 3.6], [-2.35, -1.15], [2.35, -1.15], [-2.35, 2.05], [2.35, 2.05]].forEach(([x, z]) => {
        pillars.add(makeBox(.52, 4.95, .52, concrete, [x, 2.47, z]));
    });
    scene.add(pillars);

    const backWall = new THREE.Group();
    backWall.add(makeBox(3.25, 4.35, .3, wall, [-2.75, 2.17, -4.35]));
    backWall.add(makeBox(3.25, 4.35, .3, wall, [2.75, 2.17, -4.35]));
    const sideWalls = new THREE.Group();
    sideWalls.add(makeBox(.3, 4.35, 8.7, wall, [-4.35, 2.17, 0]));
    sideWalls.add(makeBox(.3, 4.35, 8.7, wall, [4.35, 2.17, 0]));
    const frontWall = new THREE.Group();
    frontWall.add(makeBox(3.14, 4.35, .3, wall, [-2.9, 2.17, 4.35]));
    frontWall.add(makeBox(3.14, 4.35, .3, wall, [2.9, 2.17, 4.35]));
    scene.add(backWall, sideWalls, frontWall);

    const windows = new THREE.Group();
    [[-4.16, 2.35, -1.35], [4.16, 2.35, 1.35]].forEach(([x, y, z], index) => {
        const frameGroup = new THREE.Group();
        const horizontalDepth = .15;
        const verticalDepth = .15;
        if (index === 0) {
            frameGroup.add(makeBox(.18, 2.15, .15, frame, [x, y, z - 1.18]));
            frameGroup.add(makeBox(.18, 2.15, .15, frame, [x, y, z + 1.18]));
            frameGroup.add(makeBox(.18, .14, 2.52, frame, [x, y + 1.02, z]));
            frameGroup.add(makeBox(.18, .14, 2.52, frame, [x, y - 1.02, z]));
            frameGroup.add(makeBox(.07, 1.83, 2.18, glass, [x + .03, y, z]));
        } else {
            frameGroup.add(makeBox(.18, 2.15, .15, frame, [x, y, z - 1.18]));
            frameGroup.add(makeBox(.18, 2.15, .15, frame, [x, y, z + 1.18]));
            frameGroup.add(makeBox(.18, .14, 2.52, frame, [x, y + 1.02, z]));
            frameGroup.add(makeBox(.18, .14, 2.52, frame, [x, y - 1.02, z]));
            frameGroup.add(makeBox(.07, 1.83, 2.18, glass, [x - .03, y, z]));
        }
        windows.add(frameGroup);
    });
    scene.add(windows);

    const ceiling = makeBox(10.1, .25, 9.1, wall, [0, 4.96, 0]);
    const beams = new THREE.Group();
    beams.add(makeBox(10, .38, .35, rawConcrete, [0, 4.6, -3.9]));
    beams.add(makeBox(10, .38, .35, rawConcrete, [0, 4.6, 3.9]));
    beams.add(makeBox(.35, .38, 8, rawConcrete, [-3.9, 4.6, 0]));
    beams.add(makeBox(.35, .38, 8, rawConcrete, [3.9, 4.6, 0]));
    scene.add(ceiling, beams);

    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, -4.12);
    const outside = new THREE.Mesh(new THREE.PlaneGeometry(2.22, 2.92), new THREE.MeshBasicMaterial({ color: '#f3facf', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false }));
    outside.position.set(0, 1.46, -.2);
    doorGroup.add(outside);
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-1.08, 0, 0);
    const door = makeBox(2.06, 2.82, .12, wood, [1.03, 1.41, .08]);
    doorPivot.add(door);
    doorGroup.add(doorPivot);
    doorGroup.add(makeBox(2.42, .28, .36, rawConcrete, [0, 2.96, 0]));
    doorGroup.add(makeBox(.26, 3.0, .36, rawConcrete, [-1.21, 1.48, 0]));
    doorGroup.add(makeBox(.26, 3.0, .36, rawConcrete, [1.21, 1.48, 0]));
    const exitLight = new THREE.PointLight('#e7f5a9', 0, 9, 2);
    exitLight.position.set(0, 2, -.65);
    doorGroup.add(exitLight);
    scene.add(doorGroup);

    const elements = [
        { object: pillars, start: .16, end: .38, lift: 1.15 },
        { object: sideWalls, start: .38, end: .64, lift: .9 },
        { object: backWall, start: .44, end: .68, lift: .9 },
        { object: frontWall, start: .49, end: .72, lift: .9 },
        { object: windows, start: .5, end: .75, lift: .5 },
        { object: ceiling, start: .64, end: .86, lift: .72 },
        { object: beams, start: .6, end: .83, lift: .3 },
        { object: doorGroup, start: .69, end: .87, lift: .2 }
    ];
    elements.forEach((entry) => { entry.object.userData.baseY = entry.object.position.y; });

    const state = { progress: 0, targetProgress: 0, yaw: Math.PI, targetYaw: Math.PI, pitch: -.08, targetPitch: -.08, pointerId: null, lastX: 0, lastY: 0, looking: false, frame: null };
    const target = new THREE.Vector3();

    function setBuild(entry) {
        const progress = ease(clamp01((state.progress - entry.start) / (entry.end - entry.start)));
        entry.object.visible = progress > .001;
        entry.object.scale.y = Math.max(.001, progress);
        entry.object.position.y = entry.object.userData.baseY - entry.lift * (1 - progress);
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    function updateCamera() {
        state.yaw += (state.targetYaw - state.yaw) * .14;
        state.pitch += (state.targetPitch - state.pitch) * .14;
        camera.position.set(0, 1.69 + Math.sin(state.progress * Math.PI) * .045, .92);
        target.set(Math.sin(state.yaw) * Math.cos(state.pitch), Math.sin(state.pitch), Math.cos(state.yaw) * Math.cos(state.pitch));
        camera.lookAt(camera.position.x + target.x, camera.position.y + target.y, camera.position.z + target.z);
    }

    function render() {
        state.progress += (state.targetProgress - state.progress) * .085;
        elements.forEach(setBuild);
        const complete = ease(clamp01((state.progress - .75) / .16));
        doorPivot.rotation.y = -complete * 1.28;
        outside.material.opacity = complete;
        exitLight.intensity = complete * 3;
        sun.intensity = .18 + state.progress * 1.8;
        roomFill.intensity = .12 + state.progress * .45;
        dust.rotation.y += .00048;
        updateCamera();
        renderer.render(scene, camera);
        state.frame = requestAnimationFrame(render);
    }

    function beginLook(event) {
        state.pointerId = event.pointerId;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.looking = false;
        canvas.setPointerCapture?.(event.pointerId);
        canvas.focus({ preventScroll: true });
    }

    function moveLook(event) {
        if (event.pointerId !== state.pointerId) return;
        const deltaX = event.clientX - state.lastX;
        const deltaY = event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
        if (Math.abs(deltaX) > Math.abs(deltaY) || state.looking) {
            state.looking = true;
            state.targetYaw -= deltaX * .008;
            state.targetPitch = clamp(state.targetPitch - deltaY * .0045, -.58, .36);
            onLook();
            event.preventDefault();
        }
    }

    function endLook(event) {
        if (event.pointerId !== state.pointerId) return;
        canvas.releasePointerCapture?.(event.pointerId);
        state.pointerId = null;
    }

    canvas.addEventListener('pointerdown', beginLook);
    canvas.addEventListener('pointermove', moveLook, { passive: false });
    canvas.addEventListener('pointerup', endLook);
    canvas.addEventListener('pointercancel', endLook);
    canvas.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        if (event.key === 'ArrowLeft') state.targetYaw += .16;
        if (event.key === 'ArrowRight') state.targetYaw -= .16;
        if (event.key === 'ArrowUp') state.targetPitch = clamp(state.targetPitch + .09, -.58, .36);
        if (event.key === 'ArrowDown') state.targetPitch = clamp(state.targetPitch - .09, -.58, .36);
        onLook();
        event.preventDefault();
    });

    resize();
    render();
    return { setProgress: (progress) => { state.targetProgress = progress; }, resize, dispose: () => { cancelAnimationFrame(state.frame); renderer.dispose(); } };
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
    const statusText = ['أنت داخل المساحة — حرّك للنظر حولك', 'الأعمدة ترتفع حولك', 'الجدران والغرف تتشكل حولك', 'البيت اكتمل والباب مفتوح'];
    let frame = null;
    let activeScene = -1;
    let entryTimer = null;
    let interior = null;

    try {
        if (!reducedMotion.matches && canvas && window.WebGLRenderingContext) {
            interior = createInteriorScene(canvas, () => body.classList.add('is-looking'));
            body.classList.add('webgl-ready');
        }
    } catch (error) {
        body.classList.remove('webgl-ready');
        console.warn('Ajarli interior WebGL fallback active.', error);
    }

    function cancelAutoEntry() {
        if (entryTimer !== null) { window.clearTimeout(entryTimer); entryTimer = null; }
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
            const active = index === scene;
            stage.classList.toggle('is-active', active);
            stage.setAttribute('aria-hidden', String(!active));
        });
        if (scene === 3) queueAutoEntry();
    }
    function updateJourney() {
        frame = null;
        if (!journey || reducedMotion.matches) { setScene(0); return; }
        const rect = journey.getBoundingClientRect();
        const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
        const progress = clamp01(-rect.top / travel);
        const scene = Math.min(3, Math.floor(progress * 4));
        if (scene === 3 && progress < .95) cancelAutoEntry();
        if (scene === 3 && progress >= .95 && entryTimer === null) queueAutoEntry();
        root.style.setProperty('--house-progress', `${Math.max(5, progress * 100)}%`);
        if (progressBar) progressBar.style.width = `${Math.max(5, progress * 100)}%`;
        interior?.setProgress(progress);
        setScene(scene);
    }
    function requestUpdate() { if (frame === null) frame = requestAnimationFrame(updateJourney); }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { interior?.resize(); requestUpdate(); }, { passive: true });
    reducedMotion.addEventListener('change', () => window.location.reload());
    requestUpdate();
})();
