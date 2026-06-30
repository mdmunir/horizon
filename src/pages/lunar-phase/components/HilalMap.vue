<script setup>
import {
    OrthographicCamera, Scene, WebGLRenderer, PlaneGeometry,
    TextureLoader, ShaderMaterial, Mesh,
} from 'three';
import vertexShader from './webgl/vertex.c?raw';
import fragmentShader from './webgl/hilal-fragment.c?raw';
import { drawerState } from '@/composables/global.js';

const TEXTURES = {
    Earth1: 'images/earth1.png',
    Earth2: 'images/earth2.jpg',
};
const LOADED = {};
const props = defineProps({
    day: { type: Number, default: 0 },
    hilal: { type: Object },
    scale: { type: Number, default: 100 },
    texture: { type: String, default: 'Earth1' },
    method: { type: Number },
});

let animated = true;
let padding = 1.01;
const camera = new OrthographicCamera(-padding, padding, padding, -padding, 0.1, 10);
const scene = new Scene();
const renderer = new WebGLRenderer();
const model = new PlaneGeometry(2, 2);

LOADED[props.texture] = new TextureLoader().load(TEXTURES[props.texture]);
const fragment = props.hilal.fragment(props.day);
const uniform = {
    SUN: { value: fragment.SUN },
    MOON: { value: fragment.MOON },
    method: { value: props.method },
    txtr: { value: LOADED[props.texture] },
};

const material = new ShaderMaterial({
    uniforms: uniform,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});
const mesh = new Mesh(model, material);
camera.position.set(0, 0, 4);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    if(el.value){
        let scale = Math.min(100, Math.max(10, v));
        let width = Math.floor(el.value.offsetWidth * scale / 100);
        renderer.setSize(width, width / 2);
        renderer.setViewport(0, 0, width, width / 2); 
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}
function resize(time = 0) {
    setTimeout(function () {
        camera.aspect = 2;
        camera.updateProjectionMatrix();
        doScale(props.scale);
    }, time);
}

watch(drawerState, () => resize(250));
watch(() => props.scale, v => {
    doScale(v);
    render();
});

watch(() => props.day, v => {
    const {SUN, MOON} = props.hilal.fragment(v);
    uniform.SUN.value = SUN;
    uniform.MOON.value = MOON;
    render();
});

watch(() => props.hilal, v => {
    const {SUN, MOON} = v.fragment(props.day);
    uniform.SUN.value = SUN;
    uniform.MOON.value = MOON;
    render();
});

watch(() => props.method, v => {
    uniform.method.value = v;
    render();
});

watch(() => props.texture, v => {
    if (!LOADED[v]) {
        LOADED[v] = new TextureLoader().load(TEXTURES[v]);
    }
    uniform.txtr.value = LOADED[v];
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
    <div ref="el" style="display: flex;justify-content: center;"></div>
</template>