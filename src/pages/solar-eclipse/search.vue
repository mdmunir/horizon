<script setup>
import { eclipseCentury, localCircumstance } from '@/composables/solar-eclipse';
import { Location } from '@/composables/store';
import locations from '@/data/locations';
import timezones from '@/data/timezone';

const types = ['', 'P', 'A', 'AT', 'P', 'U', 'T'];
function formatTime(val){
    if(val && val.dt){
        if(val.riset){
            return moment(val.dt).utcOffset(Location.offset).format('HH:mm') + `(${val.riset})`;
        }
        return moment(val.dt).utcOffset(Location.offset).format('HH:mm:ss');
    }
    return '-'
}

const columns = [
    { name: 'ix', label: 'No', width: 6, align: 'right' },
    { name: 'date', label: 'Date', width: 12 },
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

const centuries = Array(30).keys().map(c => ({value:c, title:`${c}00 - ${c}99`}));
const century = ref(20);
const position = reactive({
    lon: LocationState.lon,
    lat: LocationState.lat,
});

const rows = ref([]);

function locationChanged(val) {
    Object.assign(LocationState, val);
}

function zoneChanged(val) {
    if (val) {
        LocationState.offset = val.offset;
        LocationState.zone_name = val.name;
    }
}

function generate(){
    position.lon = LocationState.lon;
    position.lat = LocationState.lat;
    eclipseCentury.load(century.value).then(()=>{
        rows.value = eclipseCentury.rows
            .map(data => localCircumstance(data, position))
            .filter(v => v && v.type > 0)
            .map((v,ix) => ({...v, ix:ix+1}));
    });
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
                                <v-col cols="8">
                                    <Autocomplete density="compact" v-model="LocationState.zone_id" @changed="zoneChanged"
                                        :items="timezones" label="Timezone"></Autocomplete>
                                </v-col>
                                <v-col cols="4">
                                    <NumberInput density="compact" v-model="LocationState.offset" label="Zone Offset" :precision="0"
                                        allow-negative></NumberInput>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                    <v-row density="compact">
                        <v-col>
                            <v-btn @click="generate()" color="primary">Search</v-btn>
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