<script setup>
import { horner, pmod } from 'astronomia/base';
import EclipseMap from '../EclipseMap.vue';
import { solarEclipseMapSetting } from '@/composables/solar-eclipse.js';

const D2R = Math.PI / 180;

const props = defineProps({
    data: { type: Object, required: true },
    date: { type: String },
});

const models = [
    { value: 'globe', title: 'Globe' },
    { value: 'mer', title: 'Mercator' },
    { value: 'ae', title: 'AE' },
];
const slider = reactive({
    value: props.data.tMax,
    min: computed(() => props.data.P1 - 2/60),
    max: computed(() => props.data.P4 + 2/60),
    intervalID: null,
    isPlay: computed(() => slider.intervalID != null),
});

function play() {
    if (slider.isPlay) {
        clearInterval(slider.intervalID);
        slider.intervalID = null;
    } else {
        slider.intervalID = setInterval(() => {
            slider.value += 30/3600; // 30 second
            if (slider.value >= slider.max) {
                clearInterval(slider.intervalID);
                slider.intervalID = null;
            }
        }, 100);
    }
}

const Textures = ['Earth1', 'Earth2'];
const mapState = reactive({
    time: computed(() => slider.value),
    cameraPos: computed(() => ({
        lon: pmod(horner(mapState.time, props.data.M), 360) * D2R,
        lat: horner(mapState.time, props.data.D) * D2R,
    })),
    timeLabel: computed(() => {
        let t = props.data.JDE0 + mapState.time / 24 - props.data.deltaT / (24 * 3600);
        return moment(t.toDate()).utc().format('HH:mm:ss');
    }),
});

const map = useTemplateRef('map');
const saveState = reactive({
    show: false,
    cancel: false,
    progress: 0,
});
function save() {
    if (map.value) {
        const opts = {
            duration: 30,
            fps: 10,
            filename: `solar-eclipse-${props.date}.gif`,
        };
        saveState.cancel = false;
        saveState.show = true;
        map.value.download(i => {
            slider.value = i * (slider.max - slider.min) + slider.min;
            saveState.progress = i * 100;
            if(saveState.cancel){
                saveState.show = false;
                return false;
            }
        }, opts).then(()=>{
            saveState.show = false;
        });
    }
}
</script>
<template>
    <v-row density="compact">
        <v-col cols="12" md="9">
            <v-row density="compact">
                <v-col cols="12">
                    <v-slider density="compact" v-model="slider.value" :min="slider.min" :max="slider.max">
                        <template #prepend>
                            <v-icon icon="mdi-content-save" @click="save()" :disabled="slider.isPlay"></v-icon>
                            <v-icon icon="mdi-camera" @click="map.snapshot({filename:`solar-eclipse-${date}.png`})" :disabled="slider.isPlay"></v-icon>
                            <v-icon :icon="slider.isPlay ? 'mdi-pause' : 'mdi-play'" @click="play()"></v-icon>
                        </template>
                        <template #append>{{ mapState.timeLabel }}</template>
                    </v-slider>
                </v-col>
            </v-row>
            <v-row density="compact">
                <v-col cols="12">
                    <EclipseMap :bessel="data" v-bind="{ ...mapState, ...solarEclipseMapSetting }" ref="map"></EclipseMap>
                </v-col>
            </v-row>
        </v-col>
        <v-col cols="12" md="3">
            <v-row density="compact">
                <v-col cols="12">
                    <v-select density="compact" hide-details v-model="solarEclipseMapSetting.texture" :items="Textures"
                        label="Texture"></v-select>
                </v-col>
                <v-col cols="12">
                    <v-select density="compact" hide-details v-model="solarEclipseMapSetting.type" :items="models"
                        label="Type"></v-select>
                </v-col>
                <v-col cols="12" v-if="solarEclipseMapSetting.type == 'globe'">
                    <v-checkbox density="compact" hide-details v-model="solarEclipseMapSetting.control"
                        label="Rotate Control"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-checkbox density="compact" hide-details v-model="solarEclipseMapSetting.shadow"
                        label="Shadow"></v-checkbox>
                </v-col>
                <v-col cols="6">
                    <v-checkbox density="compact" hide-details v-model="solarEclipseMapSetting.path"
                        label="Path"></v-checkbox>
                </v-col>
                <v-col cols="12">
                    <v-slider density="compact" v-model="solarEclipseMapSetting.scale" :min="20" :max="100" label="Scale"></v-slider>
                </v-col>
                <v-col cols="12">
                    <v-slider density="compact" v-model="solarEclipseMapSetting.lineWidth" :min="0.1" :max="3.0"
                        label="Line Width"></v-slider>
                </v-col>
            </v-row>
        </v-col>
        <v-dialog persistent v-model="saveState.show">
            <div class="text-center">
                <v-progress-circular :model-value="saveState.progress" :size="200" :width="15" color="teal">
                    <v-btn density="compact" icon="mdi-pause" @click="saveState.cancel = true"></v-btn>
                </v-progress-circular>
            </div>
        </v-dialog>
    </v-row>
</template>