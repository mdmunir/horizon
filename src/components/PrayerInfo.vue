<script setup>
import { Location, Prayer } from '@/composables/store';
import { now } from '@/composables/horizon';
import calcPrayer from '@/composables/prayer';
import moment from 'moment';

const labels = {
    subuh: 'Subuh',
    terbit: 'Terbit',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya',
    tengah: 'Akhir Isya',
};

const { y, m, d } = now();
const tgl = reactive({
    y, m, d,
});

const date = ref(Date.now());
const times = computed(() => {
    return calcPrayer(tgl.y, tgl.m, tgl.d, Location, Prayer).map(v => {
        v.label = labels[v.name];
        return v;
    }).filter(v => v.label);
});

const info = computed(() => {
    const dt = date.value;
    for (let i = 0; i < times.value.length; i++) {
        let { time, label } = times.value[i];
        time = Math.floor(time / 60000) * 60000;
        if (time > dt) {
            return [label, moment(time - dt).utc().format('- H:mm:ss')];
        } else if (time > dt - 600000) {
            return [label, moment(dt - time).utc().format('H:mm:ss')];
        }
    }
    const { y, m, d } = now();
    Object.assign(tgl, { y, m, d: d + 1 });
    return ['', ''];
});

let timer;
onMounted(() => {
    timer = setInterval(() => {
        date.value = Date.now();
    }, 1000);
});
onUnmounted(() => {
    clearInterval(timer);
});

</script>
<template>
    <v-list-item  @click="$bus.emit('setting/prayer')" :title="info[1]" :subtitle="info[0]">
    </v-list-item>
</template>