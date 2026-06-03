<script setup>
import {
    OrthographicCamera, Scene, WebGLRenderer, SphereGeometry, PlaneGeometry, CircleGeometry,
    TextureLoader, ShaderMaterial, Mesh,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateGIF } from '@/libs/gif-generator';
import vertexShader from './webgl/vertex.c?raw';
import fragmentShader from './webgl/se-fragment.c?raw';
import { sincos } from 'astronomia/base';

const TEXTURES = {
    Earth1: 'images/earth1.png',
    Earth2: 'images/earth2.jpg',
};
const LOADED = {};
const D2R = Math.PI / 180;

const props = defineProps({
    type: { type: String, default: 'globe' },
    bessel: { type: Object, required: true },
    time: { type: Number, default: 0 },
    cameraPos: { type: Object },
    scale: { type: Number, default: 100 },
    control: { type: Boolean, default: true },
    shadow: { type: Boolean, default: true },
    path: { type: Boolean, default: true },
    texture: { type: String, default: 'Earth1' },
    lineWidth: { type: Number, default: 1.0 },
});

let animated = true;
let controls = null;
let padding = 1.01;
const camera = new OrthographicCamera(-padding, padding, padding, -padding, 0.1, 10);
const scene = new Scene();
const renderer = new WebGLRenderer();
const models = {
    globe: new SphereGeometry(1, 128, 64),
    mer: new PlaneGeometry(2, 2),
    ae: new CircleGeometry(1, 64),
};

LOADED[props.texture] = new TextureLoader().load(TEXTURES[props.texture]);
const uniform = {
    time: { value: props.time },
    tanF1: { value: props.bessel.F[0] },
    tanF2: { value: props.bessel.F[1] },
    X: { value: props.bessel.X },
    Y: { value: props.bessel.Y },
    D: { value: props.bessel.D.map(v => v * D2R) },
    MU: { value: props.bessel.M.map(v => v * D2R) },
    L1: { value: props.bessel.L1.slice(0, 4) },
    L2: { value: props.bessel.L2.slice(0, 4) },
    DX: { value: props.bessel.X.map((v, i) => v * i).slice(1).concat([0]) },
    DY: { value: props.bessel.Y.map((v, i) => v * i).slice(1).concat([0]) },
    DD: { value: props.bessel.D.map(v => v * D2R).map((v, i) => v * i).slice(1).concat([0]) },
    DMU: { value: props.bessel.M.map(v => v * D2R).map((v, i) => v * i).slice(1).concat([0]) },
    isAe: { value: props.type == 'ae' ? 1 : 0 },
    isPath: { value: props.path ? 1 : 0 },
    isShadow: { value: props.shadow ? 1 : 0 },
    lineWidth: { value: props.lineWidth },
    txtr: { value: LOADED[props.texture] },
};

const material = new ShaderMaterial({
    uniforms: uniform,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});
const mesh = new Mesh(models[props.type], material);
camera.position.set(0, 0, 4);
renderer.setPixelRatio(window.devicePixelRatio);
mesh.position.x = 0;
mesh.position.y = 0;
scene.add(mesh);

const el = useTemplateRef('el');
onMounted(() => {
    el.value.appendChild(renderer.domElement);

    animate();
    resize();
    window.addEventListener('resize', function () {
        resize();
    });

    controls = new OrbitControls(camera, el.value);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [65, 83, 68];
    controls.autoRotate = false;
    controls.addEventListener('change', function () {
        render();
    });
    controls.enableRotate = props.control && props.type == 'globe';
    props.type == 'globe' && setCamera(props.cameraPos);
});

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(function () {
        animate();
    });
    if (controls) {
        controls.update();
    }
    if (animated) {
        render();
    }
}
function doScale(v) {
    let scale = Math.min(100, Math.max(10, v));
    let width = Math.floor(el.value.offsetWidth * scale / 100);
    let height = props.type == 'mer' ? width / 2 : width;
    renderer.setSize(width, height);
}
function resize(time = 0) {
    setTimeout(function () {
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        doScale(props.scale);
    }, time);
}

function setCamera(pos){
    let v = pos || {};
    const [sLon, cLon] = sincos(v.lon || 0);
    const [sLat, cLat] = sincos(v.lat || 0);
    const r = v.distance || 4;
    camera.position.set(r * cLat * cLon, r * sLat, r * cLat * sLon);
    if (controls) {
        controls.update();
    }
    render();
}

watch(() => props.cameraPos, value => {
    if (props.type != 'globe' || props.control) {
        return;
    }
    setCamera(value);
}, { deep: true});

watch(() => props.scale, v => {
    doScale(v);
    render();
});

watch(() => props.lineWidth, v => {
    uniform.lineWidth.value = v;
    render();
});

watch(() => props.time, v => {
    uniform.time.value = v;
    render();
});
watch(() => props.type, v => {
    mesh.geometry = models[v];
    uniform.isAe.value = (v == 'ae' ? 1 : 0);
    doScale(props.scale);
    controls.enableRotate = props.control && v == 'globe';
    if(v == 'globe'){
        setCamera(props.cameraPos);
    }else {
        camera.position.set(0, 0, 4);
        render();
    }
});
watch(() => props.path, v => {
    uniform.isPath.value = (v ? 1 : 0);
    render();
});
watch(() => props.shadow, v => {
    uniform.isShadow.value = (v ? 1 : 0);
    render();
});
watch(() => props.control, v => {
    controls.enableRotate = (v && props.type == 'globe');
    render();
});
watch(() => props.texture, v => {
    if (!LOADED[v]) {
        LOADED[v] = new TextureLoader().load(TEXTURES[v]);
    }
    uniform.txtr.value = LOADED[v];
    render();
});


async function download(callback, options = {}) {
    animated = false;
    return generateGIF(renderer.domElement, function (progress) {
        if (callback && callback(progress) === false) {
            return false;
        }
        render();
    }, options).then(buffer => {
        const blob = new Blob([buffer], { type: 'image/gif' });
        animated = true;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = options.filename || 'solar-eclipse.gif';
        link.dispatchEvent(new MouseEvent('click'));
        return true;
    }).catch(() => {
        animated = true;
        return false;
    });
}

function snapshot(options = {}) {
    const link = document.createElement('a');
    render();
    link.href = renderer.domElement.toDataURL();
    link.download = options.filename || 'solar-eclipse.png';
    link.dispatchEvent(new MouseEvent('click'));
}
defineExpose({ download, snapshot });
</script>
<template>
    <div ref="el" style="display: flex;justify-content: center;"></div>
</template>