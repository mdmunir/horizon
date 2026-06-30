<script setup>
import MoonPhase from './components/MoonPhase.vue';
import { LocationState } from '@/composables/store.js';
import { deltaTJD } from '@/composables/horizon.js';
import locations from '@/data/locations';
import timezones from '@/data/timezone';
import DateTimeDlg from '@/components/DateTimeDlg.vue';

const SPEEDS = [0, 1, 10, 60, 600, 3600, 21600, 68400].map(v => v / 68400);
const state = reactive({
    intervalID: null,
    lockAt: 'moon',
    jd: (new Date).toJD(),
    isPlay: computed(() => state.intervalID != null),
    speed: 0,
    T0: 0,
    counter: 0,
    ground: true,
    grid: true,
    refraction: true,
    height: 2,
    jde: computed(() => state.jd + deltaTJD(state.jd) / 68400),
    timeLabel: computed(() => moment(state.jd.toDate()).utcOffset(LocationState.offset).format('YYYY-MM-DD HH:mm:ss')),
    datetime: computed({
        get() {
            return moment(state.jd.toDate()).utcOffset(LocationState.offset).format('YYYY-MM-DD HH:mm:ss');
        },
        set(v) {
            state.jd = `${v}Z${formatTz(LocationState.offset)}`.toDate().toJD();
        }
    })
});

const datetime = reactive({
    date: computed({
        get() {
            return state.jd.toDate();
        },
        set(v) {
            let strDate = moment(v).utcOffset(LocationState.offset || 0).format('YYYY-MM-DD');
            let str = `${strDate}T${datetime.time}Z${formatTz(LocationState.offset || 0)}`;
            state.jd = str.toDate().toJD();
        }
    }),
    time: computed({
        get() {
            let dt = state.jd.toDate();
            return moment(dt).utcOffset(LocationState.offset || 0).format('HH:mm:ss');
        },
        set(v) {
            let strDate = moment(datetime.date).utcOffset(LocationState.offset || 0).format('YYYY-MM-DD');
            let str = `${strDate}T${v}Z${formatTz(LocationState.offset || 0)}`;
            state.jd = str.toDate().toJD();
        }
    }),
});
function stop() {
    if (state.intervalID != null) {
        clearInterval(state.intervalID);
        state.intervalID = null;
        state.speed = 0;
    }
}
function doPlay() {
    state.jd = state.T0 + (state.counter++) * SPEEDS[state.speed];
}
function play() {
    if (state.speed < SPEEDS.length - 1) {
        state.T0 = state.jd;
        state.counter = 0;
        state.speed++;
        if (state.intervalID == null) {
            state.intervalID = setInterval(() => doPlay(), 1000);
        }
    }
}
function doNow() {
    stop();
    state.jd = (new Date).toJD();
}
const LOCK_ATs = ['moon', 'sun',];


function locationChanged(val) {
    Object.assign(LocationState, val);
}

function zoneChanged(val) {
    if (val) {
        LocationState.offset = val.offset;
        LocationState.zone_name = val.name;
    }
}
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel title="Moon Phases">
                    <v-row density="compact">
                        <v-col cols="12" sm="8">
                            <Panel>
                                <MoonPhase :loc="LocationState" v-bind="state"></MoonPhase>
                            </Panel>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <Panel>
                                <v-row density="compact">
                                    <v-col cols="12">
                                        <v-btn-group density="compact" divided>
                                            <v-btn icon="mdi-clock" title="Now" @click="doNow()"></v-btn>
                                            <v-btn icon="mdi-pause" title="Stop" @click="stop()"></v-btn>
                                            <v-btn icon="mdi-play" title="Play" @click="play()"></v-btn>
                                        </v-btn-group>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-date-input density="compact" hide-details v-model="datetime.date" input-format="yyyy-mm-dd"
                                            :disabled="state.isPlay" prepend-icon=""></v-date-input>
                                    </v-col>
                                    <v-col cols="6">
                                        <TimeInput density="compact" hide-details v-model="datetime.time"
                                            :disabled="state.isPlay"></TimeInput>
                                    </v-col>
                                    <v-col cols="12">
                                        <Autocomplete density="compact" :items="locations" v-model="LocationState.id"
                                            label="Location" @changed="locationChanged"></Autocomplete>
                                    </v-col>
                                    <v-col cols="6">
                                        <LatLon density="compact" v-model="LocationState.lat" signs="S|N"
                                            label="Latitude">
                                        </LatLon>
                                    </v-col>
                                    <v-col cols="6">
                                        <LatLon density="compact" v-model="LocationState.lon" signs="E|W"
                                            label="Longitude">
                                        </LatLon>
                                    </v-col>
                                    <v-col cols="8">
                                        <Autocomplete density="compact" v-model="LocationState.zone_id"
                                            @changed="zoneChanged" :items="timezones" label="Timezone"></Autocomplete>
                                    </v-col>
                                    <v-col cols="4">
                                        <NumberInput density="compact" v-model="LocationState.offset"
                                            label="Zone Offset" :precision="0" allow-negative></NumberInput>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-select density="compact" v-model="state.lockAt" :items="LOCK_ATs">
                                        </v-select>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-checkbox density="compact" label="Ground" hide-details
                                            v-model="state.ground"></v-checkbox>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-checkbox density="compact" label="Grid" hide-details
                                            v-model="state.grid"></v-checkbox>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-checkbox density="compact" label="Refraction" hide-details
                                            v-model="state.refraction"></v-checkbox>
                                    </v-col>
                                    <v-col cols="6" v-if="false">
                                        <NumberInput density="compact" label="Height" hide-details
                                            v-model="state.height"></NumberInput>
                                    </v-col>
                                </v-row>
                            </Panel>
                        </v-col>
                    </v-row>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>