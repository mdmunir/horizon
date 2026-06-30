<script setup>
import { formatTz } from '@/composables/global';
import { Location } from '@/composables/store';

const {PI} = Math;
const R2D = 180 / PI;

const props = defineProps({
    hilal: Object,
    sMonth: String,
    month: String,
});

const tz = computed(() => formatTz(Location.offset));
const sConjunction = computed(() => {
    return props.hilal.conjunctions.map(v => [
            v.name.padEnd(25, ' '), 
            ': ',
            moment(v.date).utc().format('YYYY-MM-DD HH:mm:ss'),
            '(UTC)   ',
            moment(v.date).utcOffset(Location.offset).format('YYYY-MM-DD HH:mm:ss'),
            `(${tz.value})`,
        ].join('')).join('\n');
});

const info = computed(() => props.hilal.calc(Location));
const pre = useTemplateRef('pre');
</script>
<template>
    <Panel content-class="overflow-auto">
        <template #toolbar-right>
            <v-btn @click="downloadText(pre.innerHTML, `Hilal-${sMonth}.txt`)" icon="mdi-content-save" density="compact"></v-btn>
            <v-btn @click="copyClipboard(pre.innerHTML)" icon="mdi-content-copy" density="compact"></v-btn>
        </template>
        <pre ref="pre">Conjunction {{sMonth}}:
{{ sConjunction }}
<template v-if="info.sunSet === false">
No Sunset @ {{ Location.name }}({{ LatLon }})
</template>
<template v-else>
Hilal {{ moment(info.sunSetDate).utcOffset(Location.offset).format('YYYY-MM-DD')  }} @ {{ Location.name }}({{ LatLon }}) Timezone {{ tz }}:
Sun Set                  : {{ moment(info.sunSetDate).utcOffset(Location.offset).format('HH:mm:ss') }}
Moon Set                 : {{ moment(info.moonSetDate).utcOffset(Location.offset).format('HH:mm:ss') }}
Apparent Altitude        : {{ (info.altitudes.a * R2D).toFixed(2) }}
Topocentric Altitude     : {{ (info.altitudes.t * R2D).toFixed(2) }}
Geocentric Altitude      : {{ (info.altitudes.g * R2D).toFixed(2) }}
Azimuth                  : {{ (info.az * R2D).toFixed(2) }}
Topocentric Elongation   : {{ (info.elongations.t * R2D).toFixed(2) }}
Geocentric Elongation    : {{ (info.elongations.g * R2D).toFixed(2) }}
</template>
        </pre>
    </Panel>
</template>