<script setup>
import { formatLoc, formatTz } from '@/composables/global';
import { localCircumstance } from '@/composables/solar-eclipse';
import locations from '@/data/locations';

const props = defineProps({
    data: {type: Object, required: true},
    date: {type: String},
});

const types = ['', 'P', 'A', 'AT', 'P', 'U', 'T'];
function formatTime(val, row){
    if(val && val.dt){
        if(val.riset){
            return moment(val.dt).utcOffset(row.offset).format('HH:mm') + `(${val.riset})`;
        }
        return moment(val.dt).utcOffset(row.offset).format('HH:mm:ss');
    }
    return '-'
}

const columns = [
    { name: 'ix', label: 'No', width: 6, align: 'right' },
    { name: 'fullname', label: 'City Name', width: 48, },
    { name: 'lat', label: 'Coord', width: 22, format: (_, row) => formatLoc(row)},
    { name: 'offset', label: 'Timezone', width: 10, align: 'center', format: formatTz },
    { name: 'type', label: 'Type', width: 8, format: v => types[v], align: 'center' },
    { name: 'events.0', label: 'P1', width:12, format: formatTime, align: 'center'},
    { name: 'events.0.alt', label: 'P1 Alt', width:8, format: 'deg|2', align: 'right'},
    { name: 'events.1', label: 'U1', width:12, format: formatTime, align: 'center'},
    { name: 'events.2', label: 'Middle', width:12, format: formatTime, align: 'center'},
    { name: 'events.2.alt', label: 'Mid Alt', width:8, format: 'deg|2', align: 'right'},
    { name: 'events.3', label: 'U2', width:12, format: formatTime, align: 'center'},
    { name: 'events.4', label: 'P2', width:12, format: formatTime, align: 'center'},
    { name: 'events.4.alt', label: 'P2 Alt', width:8, format: 'deg|2', align: 'right'},
    { name: 'mag', label: 'Magnitude', width:10, format: 'fixed', align: 'right'},

];

const rows = computed(() => {
    return locations.map(loc => {
        const data = localCircumstance(props.data, loc);
        data.fullname = loc.fullname;
        data.offset = loc.offset;
        data.lat = loc.lat;
        data.lon = loc.lon;
        return data;
    })
    .filter(v => v.type > 0)
    .sort((a,b) => a.events[0].t - b.events[0].t)
    .map((v,ix) => ({...v, ix:ix+1}));
});

</script>
<template>
    <v-row density="compact">
        <v-col cols="12">
            <RawTable :columns="columns" :data="rows" title="Eclipse Path">
            </RawTable>
        </v-col>
    </v-row>
</template>