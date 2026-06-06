<script setup>
import { eclipseCentury, search } from '@/composables/solar-eclipse';
import { LocationState } from '@/composables/store';
import locations from '@/data/locations';

function formatTime(val){
    if(val){
        return moment(val.toDate()).utc().format('HH:mm:ss');
    }
    return '-'
}
const columns = [
    { name: 'ix', label: 'No', width: 6, align: 'right' },
    { name: 'date', label: 'Date', width: 12 },
    { name: 'sType', label: 'Type', width: 12 },
    { name: 'P1', label: 'P1', width: 12, format: formatTime, align: 'center' },
    { name: 'U1', label: 'U1', width: 12, format: formatTime, align: 'center' },
    { name: 'middle', label: 'Middle', width: 12, format: formatTime, align: 'center' },
    { name: 'U2', label: 'U2', width: 12, format: formatTime, align: 'center' },
    { name: 'P2', label: 'P2', width: 12, format: formatTime, align: 'center' },
];

const centuries = Array(30).keys().map(c => ({value:c, title:`${c}00 - ${c}99`}));
const century = ref(20);
const position = reactive({
    lon: LocationState.lon,
    lat: LocationState.lat,
});

const rows = computed(() => eclipseCentury.rows.map(data => search(data, position)).filter(v => !!v).map((v,ix) => ({...v, ix:ix+1})));

function locationChanged(val) {
    Object.assign(LocationState, val);
}

function generate(){
    position.lon = LocationState.lon;
    position.lat = LocationState.lat;
    eclipseCentury.century = century.value;
}
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel title="Search Solar Eclipse">
                    <v-row density="compact">
                        <v-col cols="12" md="6">
                            <v-row density="compact">
                                <v-col cols="12">
                                    <Autocomplete density="compact" :items="locations" v-model="LocationState.id"
                                        label="Location" @changed="locationChanged"></Autocomplete>
                                </v-col>
                                <v-col cols="6">
                                    <LatLon density="compact" v-model="LocationState.lat" signs="S|N" label="Latitude">
                                    </LatLon>
                                </v-col>
                                <v-col cols="6">
                                    <LatLon density="compact" v-model="LocationState.lon" signs="E|W" label="Longitude">
                                    </LatLon>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-row density="compact">
                                <v-col cols="12">
                                    <v-select density="compact" label="Range" v-model="century" :items="centuries"></v-select>
                                </v-col>
                                <v-col cols="12">
                                    <v-btn @click="generate()">Search</v-btn>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </Panel>
            </v-col>
            <v-col cols="12">
                <RawTable :columns="columns" :data="rows" title="Search Result">
                </RawTable>
            </v-col>
        </v-row>
    </v-container>
</template>