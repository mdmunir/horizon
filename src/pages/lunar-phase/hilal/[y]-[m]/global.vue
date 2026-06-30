<script setup>
import { formatLoc, formatTz } from '@/composables/global';
import locations from '@/data/locations';

const R2D = 180 / Math.PI;

const props = defineProps({
    hilal: Object,
    sMonth: String,
    month: String,
});

const state = reactive({
    loc: 'All',
    day: 0,
    elo:'t',
    alt:'a',
    sort:0,
});

function formatTime(val, row){
    if(val){
        return moment(val).utcOffset(row.offset).format('HH:mm:ss');
    }
    return '-'
}

const formatAlt = (v) => (v[state.alt] * R2D).toFixed(2);
const formatElo = (v) => (v[state.elo] * R2D).toFixed(2);

const columns = [
    { name: 'ix', label: 'No', width: 6, align: 'right' },
    { name: 'fullname', label: 'City Name', width: 48, },
    { name: 'lat', label: 'Coord', width: 22, format: (_, row) => formatLoc(row)},
    { name: 'sunSetDate', label: 'Sunset UTC', width: 18, format: 'utc|YYYY-MM-DD HH:mm:ss', align: 'left' },
    { name: 'offset', label: 'Timezone', width: 10, align: 'center', format: formatTz },
    { name: 'sunSetDate', label: 'Sunset', width: 10, format: formatTime, align: 'left' },
    { name: 'moonSetDate', label: 'Moonset', width: 10, format: formatTime, align: 'left' },
    { name: 'altitudes', label: 'Alt', width:8, format: formatAlt, align: 'right'},
    { name: 'elongations', label: 'Elo', width:8, format: formatElo, align: 'right'},
    { name: 'az', label: 'Az', width:8, format: 'deg|2', align: 'right'},
];

const rows = computed(() => {
    const sortFunc = SORTS[state.sort].func;
    return locations
    .filter(v => state.loc == 'All' || v.level > 0)
    .map(loc => {
        const data = props.hilal.calc(loc, state.day);
        data.fullname = loc.fullname;
        data.offset = loc.offset;
        data.lat = loc.lat;
        data.lon = loc.lon;
        return data;
    })
    .filter(v => v.sunSet !== false)
    .sort(sortFunc)
    .map((v,ix) => ({...v, ix:ix+1}));
});

const LOC_TYPES = ['All', 'Indonesia'];
const DAYS = [0, 1, 2];

const altitudes = [
    { id: 't', name: 'Topocentric' },
    { id: 'g', name: 'Geocentric' },
    { id: 'a', name: 'Apparent' },
    { id: 'au', name: 'Apparent Upper' },
    { id: 'ai', name: 'Apparent Lower' },
];

const elongations = [
    { id: 't', name: 'Topocentric' },
    { id: 'g', name: 'Geocentric' },
];

const SORTS = [
    {name: 'Sunset First', func: (a,b) => a.sunSet - b.sunSet},
    {name: 'Sunset Last', func: (a,b) => b.sunSet - a.sunSet},
    {name: 'Altitude High', func: (a,b) => b.altitudes[state.alt] - a.altitudes[state.alt]},
    {name: 'Altitude Low', func: (a,b) => a.altitudes[state.alt] - b.altitudes[state.alt]},
].map((v, id) => ({...v, id}));
</script>
<template>
    <v-row density="compact">
        <v-col cols="12">
            <RawTable :columns="columns" :data="rows" title="Hilal Path">
                <template #header>
                    <v-row density="compact">
                        <v-col cols="12" sm="4">
                            <v-row density="compact">
                                <v-col cols="8">
                                    <v-select label="Location" :items="LOC_TYPES" v-model="state.loc" density="compact" hide-details></v-select>
                                </v-col>
                                <v-col cols="4">
                                    <v-select label="Day" :items="DAYS" v-model="state.day" density="compact" hide-details></v-select>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-row density="compact">
                                <v-col cols="6">
                                    <v-select density="compact" label="Altitude" v-model="state.alt" :items="altitudes"
                                        item-value="id" item-title="name"></v-select>
                                </v-col>
                                <v-col cols="6">
                                    <v-select density="compact" label="Elongation" v-model="state.elo" :items="elongations"
                                        item-value="id" item-title="name"></v-select>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-row density="compact">
                                <v-col cols="6">
                                    <v-select density="compact" label="Sort" v-model="state.sort" :items="SORTS"
                                        item-value="id" item-title="name"></v-select>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </template>
            </RawTable>
        </v-col>
    </v-row>
</template>