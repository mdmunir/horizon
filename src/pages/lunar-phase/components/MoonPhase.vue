<script setup>
import {
    PerspectiveCamera, Scene, WebGLRenderer, SphereGeometry,
    TextureLoader, MeshStandardMaterial, Mesh,
    SRGBColorSpace,
    ACESFilmicToneMapping,
    NoColorSpace,
    DirectionalLight,
    MeshBasicMaterial,
    Vector3,
    Line,
    BufferGeometry,
    LineBasicMaterial,
    LineLoop,
    Group,
    CanvasTexture,
    Sprite,
    SpriteMaterial,
} from 'three';
import * as THREE from 'three';
import { drawerState } from '@/composables/global.js';
import { solarLite, moonLite } from '@/composables/position';
import { pmod, sincos } from 'astronomia/base';
import { saemundsson } from 'astronomia/refraction';

const { sin, cos, asin, atan2, PI, max, min, floor, ceil, tan, abs } = Math;
const R2D = 180 / PI;
const D2R = PI / 180;
const SCALE = 1000;
const GRID_DISTANCE = 155000000 / SCALE;
const MOON_RADIUS = 1737.928 / SCALE; // km
const EARTH_RADIUS = 6378.137 / SCALE;
const SUN_RADIUS = 695991.75 / SCALE;

const TEXTURE = 'images/moon1.jpg';
const TEXTURE_DISPLACEMENT = 'images/moon-displacement.jpg';
const textureLoader = new TextureLoader();

// Baked material settings (MeshStandardMaterial)
const DEFAULT_DISPLACEMENT_SCALE = 0.03;
const DEFAULT_DISPLACEMENT_BIAS = 0;
const MOON_BUMP_SCALE = 3;

// Baked light settings
const LIGHT_INTENSITY = 3.2;

const props = defineProps({
    jde: { type: Number },
    loc: { type: Object },
    scale: { type: Number, default: 100 },
    height: { type: Number, default: 10 },
    lockAt: { type: String },
    ground: { type: Boolean, default: true },
    grid: { type: Boolean, default: true },
    sun: { type: Boolean, default: true },
    refraction: { type: Boolean, default: true },
});
const observerHeight = computed(() => EARTH_RADIUS + props.height / 1000 / SCALE);
const el = useTemplateRef('el');

let animated = true;
function createAzimuthLine(R, az) {
    const color = az % 15 == 0 ? 0xff0000 : 0xffffff;
    let az2 = az * D2R;
    const points = [];
    for (let alt = -90; alt <= 90; alt++) {
        let alt2 = alt * D2R;
        points.push(new Vector3(R * cos(alt2) * cos(az2), R * sin(alt2), R * cos(alt2) * sin(az2)));
    }
    const line = new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color }));
    line.userData = {az};
    return line;
}
function createAltitudeLine(R, alt) {
    const color = alt % 15 == 0 ? 0xff0000 : 0xffffff;
    let alt2 = alt * D2R;
    const points = [];
    for (let az = 0; az < 360; az++) {
        let az2 = az * D2R;
        points.push(new Vector3(R * cos(alt2) * cos(az2), R * sin(alt2), R * cos(alt2) * sin(az2)));
    }
    return new LineLoop(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color }));
}
function createAltAzLabel(R, alt, az) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 32;
    ctx.font = `${fontSize}px Arial`;
    const txt = `${alt}°, ${az}°`;
    let wh = ctx.measureText(txt);
    let width = ceil(wh.width);
    let height = fontSize * 1.5;
    canvas.width = width;
    canvas.height = height;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(0,0,0,0)'; // Background transparan
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff'; // Warna teks (Putih)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(txt, canvas.width / 2, canvas.height / 2);
    const texture = new CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const sprite = new Sprite(new SpriteMaterial({
        map: texture,
        transparent: true,
    }));
    let alt2 = alt * D2R;
    let az2 = az * D2R + PI;
    sprite.position.set(R * cos(alt2) * cos(az2), R * sin(alt2), R * cos(alt2) * sin(az2));
    sprite.userData = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        az,
    };
    return sprite;
}

const SPRITES = [];
const AZ_LINES = [];
function createGrid() {
    const R = GRID_DISTANCE;
    const group = new Group();
    for (let alt = -89; alt < 90; alt++) {
        group.add(createAltitudeLine(R, alt));
    }
    for (let az = 0; az < 360; az++) {
        const line = createAzimuthLine(R, az);
        AZ_LINES.push(line);
        group.add(line);
    }
    for (let az = 0; az < 360; az += 5) {
        for (let alt = -85; alt <= 85; alt += 5) {
            const sprite = createAltAzLabel(R, alt, az);
            group.add(sprite);
            SPRITES.push(sprite);
        }
    }
    return group;
}

function resizeSprite() {
    const fovInRadians = camera.fov * D2R; // / camera.zoom;
    const elWidth = floor(el.value.offsetWidth * props.scale / 100);
    SPRITES.forEach(sprite => {
        const visibleHeight = 2 * GRID_DISTANCE * tan(fovInRadians / 2);
        const unitsPerPixel = visibleHeight / elWidth;
        const w = sprite.userData.canvasWidth;
        const h = sprite.userData.canvasHeight;
        sprite.scale.set(w * unitsPerPixel, h * unitsPerPixel, 1);
    });
}

function showAzLine(alt){
    let sc = cos(alt) < 0.1 ? 10 : floor(1/cos(alt));
    sc = sc < 10 && sc > 6 ? 6 : sc;
    alt = abs(alt * R2D);
    AZ_LINES.forEach(line =>{
        let az = line.userData.az;
        line.visible = az % sc == 0;
    });
    SPRITES.forEach(label =>{
        let az = label.userData.az;
        label.visible = az % sc == 0;
    });
}

function toHorizontal({ gha, dec, range }, { lat, lon }, refraction = true) {
    const H = gha - lon;
    const [sH, cH] = sincos(H);
    const [sφ, cφ] = sincos(lat);
    const [sδ, cδ] = sincos(dec);
    const az = atan2(sH, cH * sφ - (sδ / cδ) * cφ); // (13.5) p. 93
    let alt = asin(sφ * sδ + cφ * cδ * cH); // (13.6) p. 93
    if (refraction) {
        alt += saemundsson(alt);
    }
    return { alt, az, range };
}

function calcTime(jde, loc, refraction = true) {
    const s = toHorizontal(solarLite.Equator(jde), loc, refraction);
    s.range = s.range / SCALE;
    const m = toHorizontal(moonLite.Equator(jde), loc, refraction);
    m.range = m.range / SCALE;
    const sunXyz = [
        s.range * cos(s.alt) * cos(s.az),
        s.range * sin(s.alt),
        s.range * cos(s.alt) * sin(s.az),
    ];
    const moonXyz = [
        m.range * cos(m.alt) * cos(m.az),
        m.range * sin(m.alt),
        m.range * cos(m.alt) * sin(m.az),
    ];

    light.position.set(...sunXyz);
    sun.position.set(...sunXyz);
    moon.position.set(...moonXyz);
    light.target.position.set(...moonXyz);

    camera.up.set(0, 1, 0);
    moon.lookAt(0, 0, 0);
    const up = [cos(loc.lat), sin(loc.lat), 0];
    moon.up.set(...up);
    const lock = ({ sun, moon })[props.lockAt];
    if (lock) {
        camera.lookAt(lock.position);
        let {alt} = cameraAltAz();
        showAzLine(alt);
    }
    moonMaterial.emissiveIntensity = 0.12 * Math.pow(1 - 0.1, 2.3);
}

const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(min(2, window.devicePixelRatio));
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const texture = textureLoader.load(TEXTURE);
const displacementMap = textureLoader.load(TEXTURE_DISPLACEMENT);
texture.colorSpace = SRGBColorSpace;
displacementMap.colorSpace = NoColorSpace;
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1;
texture.anisotropy = maxAnisotropy;

const moonGeometry = new SphereGeometry(MOON_RADIUS, 128, 128);
const moonMaterial = new MeshStandardMaterial({
    map: texture,
    displacementMap: displacementMap,
    displacementScale: DEFAULT_DISPLACEMENT_SCALE,
    displacementBias: DEFAULT_DISPLACEMENT_BIAS,
    bumpMap: displacementMap,
    bumpScale: MOON_BUMP_SCALE,
    roughness: 1.0,
    metalness: 0.0,
});
const moon = new Mesh(moonGeometry, moonMaterial);
moon.position.set(0, 0, -100);
scene.add(moon);

const earthGeometry = new SphereGeometry(EARTH_RADIUS, 256, 256);
const earthMaterial = new MeshBasicMaterial({ color: 0x505050, wireframe: false });
const earth = new Mesh(earthGeometry, earthMaterial);
earth.position.set(0, 0, 0);
scene.add(earth);

const light = new DirectionalLight(0xFFF2CC, LIGHT_INTENSITY);
light.position.set(100, 0, 0);
scene.add(light.target);
scene.add(light);

const sunGeometry = new SphereGeometry(SUN_RADIUS, 64, 64);
const sunMaterial = new MeshBasicMaterial({ color: 0xFFD700, wireframe: false });
const sun = new Mesh(sunGeometry, sunMaterial);
sun.position.set(100, 0, 0);
scene.add(sun);

const altAzGrid = createGrid();
altAzGrid.position.set(0, observerHeight.value, 0);
scene.add(altAzGrid);

const camera = new PerspectiveCamera(2.0, 1.0, 0.0001 / SCALE, 160000000 / SCALE);
camera.position.set(0, observerHeight.value, 0);

const panStatus = {
    isPan: false,
    x: 0,
    y: 0,
    az: 0,
}
function cameraAltAz() {
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    let alt = asin(direction.y);
    let az = direction.x == 0 && direction.z == 0 ? panStatus.az : atan2(direction.z, direction.x);
    return {alt, az};
}
onMounted(() => {
    const element = renderer.domElement;
    el.value.appendChild(element);
    calcTime(props.jde, props.loc, props.refraction);
    animate();
    resize();
    window.addEventListener('resize', function () {
        resize();
    });
    element.addEventListener('wheel', event => {
        camera.fov *= (event.deltaY < 0 ? 0.98 : 1.02);
        camera.fov = min(12, max(0.4, camera.fov));
        camera.updateProjectionMatrix();
        event.preventDefault();
    });
    element.addEventListener('mousedown', e => {
        if (e.button === 0) {
            panStatus.isPan = true;
            panStatus.x = e.clientX;
            panStatus.y = e.clientY;
        }
    });
    element.addEventListener('mouseup', e => {
        panStatus.isPan = false;
    });
    element.addEventListener('mouseleave', ()=>{
        panStatus.isPan = false;
    });
    element.addEventListener('mousemove', e => {
        if (panStatus.isPan && !props.lockAt) {
            let factor = 2 * camera.fov * D2R / el.value.offsetHeight;
            let dx = (e.clientX - panStatus.x) * factor;
            let dy = (e.clientY - panStatus.y) * factor;
            panStatus.x = e.clientX;
            panStatus.y = e.clientY;
            let {alt, az} = cameraAltAz();
            alt += dy;
            az -= dx;
            az = pmod(az, 2*PI);
            panStatus.az = az;
            if(alt >= PI/2) alt = PI/2 - 0.01;
            if(alt <= -PI/2) alt = -PI/2 + 0.01;

            const newTarget = [
                cos(alt)*cos(az) + camera.position.x,
                sin(alt) + camera.position.y,
                cos(alt)*sin(az) + camera.position.z,
            ];
            camera.lookAt(...newTarget);
            showAzLine(alt);
        }
    });
});

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(function () {
        animate();
    });
    if (animated) {
        render();
    }
}
function doScale(v) {
    if (el.value) {
        let scale = min(100, max(10, v));
        let width = floor(el.value.offsetWidth * scale / 100);
        resizeSprite();
        renderer.setSize(width, width);
    }
}
function resize(time = 0) {
    setTimeout(function () {
        //camera.aspect = 1;
        camera.updateProjectionMatrix();
        doScale(props.scale);
    }, time);
}

watch(drawerState, () => resize(250));
watch(() => props.scale, v => {
    doScale(v);
    render();
});
watch(() => props.lockAt, lockAt => {
    const lock = ({ sun, moon })[lockAt];
    if (lock) {
        camera.lookAt(lock.position);
        let {alt} = cameraAltAz();
        showAzLine(alt);
    }
    camera.up.set(0, 1, 0);
    camera.updateProjectionMatrix();
    render();
});
watch(() => ({ ground: props.ground, grid: props.grid }), ({ ground, grid }) => {
    earth.visible = ground;
    altAzGrid.visible = grid;
    render();
}, { deep: true });
watch(() => ({ jde: props.jde, loc: props.loc, refraction: props.refraction }), ({ jde, loc, refraction }) => {
    calcTime(jde, loc, refraction);
    render();
}, { deep: true });
watch(observerHeight, v => {
    altAzGrid.position.set(0, v, 0);
    camera.position.set(0, v, 0);
    render();
});

function snapshot(options = {}) {
    const link = document.createElement('a');
    render();
    link.href = renderer.domElement.toDataURL();
    link.download = options.filename || 'hilal-map.png';
    link.dispatchEvent(new MouseEvent('click'));
}
defineExpose({ snapshot });
</script>
<template>
    <div ref="el" style="display: block;justify-content: center;">
    </div>
</template>