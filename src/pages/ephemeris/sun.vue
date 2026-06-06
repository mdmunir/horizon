<script setup>
import RawTable from '@/components/RawTable.vue';
import { headTitle } from '@/composables/headTitle';
import { LocationState } from '@/composables/store';
import locations from '@/data/locations';
import { Solar } from '@/composables/position';

const altitudes = [
    { id: 't', name: 'Topocentric' },
    { id: 'g', name: 'Geocentric' },
    { id: 'a', name: 'Apparent' },
    { id: 'au', name: 'Apparent Upper' },
    { id: 'ai', name: 'Apparent Lower' },
];
const solar = new Solar();
const columns = [
    { name: 'no', label: 'No', width: 6, align: 'right' },
    { name: 'dt', label: 'Time', width: 20, format: 'utc|YYYY-MM-DD HH:mm' },
    { name: 'jd', label: 'JD', width: 20, align: 'right', format: 'fixed' },
    { name: 'lon', label: 'Longitude', width: 15, align: 'right', format: 'deg' },
    { name: 'lat', label: 'Latitude', width: 15, align: 'right', format: 'dmsc|4' },
    { name: 'ra', label: 'RA', width: 15, align: 'right', format: 'deg' },
    { name: 'dec', label: 'Dec', width: 15, align: 'right', format: 'deg' },
    { name: 'alt', label: 'Altitude', width: 15, align: 'right', format: 'deg' },
    { name: 'az', label: 'Azimuth', width: 15, align: 'right', format: 'deg' },
    { name: 'range', label: 'RANGE', width: 15, align: 'right', format: 'fixed|3' },
    { name: 'hp', label: 'HP', width: 15, align: 'right', format: 'dmsc|4' },
    { name: 'sd', label: 'SD', width: 15, align: 'right', format: 'dmsc|4' },
    { name: 'gst', label: 'GST', width: 15, align: 'right', format: 'deg' },
    { name: 'deltaT', label: 'DeltaT', width: 8, align: 'right', format: 'fixed|1' },
];

const state = reactive({
    show: true,
    dateRange: [new Date()],
    from: computed(() => {
        if (state.dateRange && state.dateRange[0]) {
            return moment.utc(moment(state.dateRange[0]).format('YYYY-MM-DD'), 'YYYY-MM-DD').toDate();
        }
    }),
    to: computed(() => {
        if (state.dateRange && state.dateRange.length) {
            return moment.utc(moment(state.dateRange[state.dateRange.length - 1]).format('YYYY-MM-DD'), 'YYYY-MM-DD')
                .add(86399999, 'milliseconds').toDate();
        }
    }),
    interval: 60,
    alt: 'a',
});

function format(date) {
    return moment(date).format('YYYY-MM-DD');
}

const rows = ref([]);

function locationChanged(val) {
    Object.assign(LocationState, val);
}

function generate() {
    const result = [];
    const { lat, lon, height } = LocationState;
    if (state.from && state.to && state.interval > 0) {
        let i = 1, jd = state.from.toJD(), to = state.to.toJD();
        for (; jd < to; jd += state.interval / 1440, i++) {
            const row = solar.position(jd, { lat, lon, height }, { alt: state.alt });
            row.no = i;
            result.push({
                no: i, jd,
                ...row,
                dt: jd.toDate(),
            });
            if (i >= 10000) {
                break;
            }
        }
    }
    rows.value = result;
}

onMounted(() => {
    LocationState.$reset();
});
headTitle.value = 'Sun Position';
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel title="Sun position">
                    <v-row density="compact">
                        <v-col cols="12" md="4">
                            <v-row density="compact">
                                <v-col cols="12">
                                    <v-date-input density="compact" label="Date Range (UTC)" multiple="range"
                                        v-model="state.dateRange" :display-format="format" input-format="yyyy-mm-dd"
                                        prepend-icon=""></v-date-input>
                                </v-col>
                                <v-col cols="12">
                                    <Interval v-model="state.interval" density="compact" label="Interval"></Interval>
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col cols="12" md="4">
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
                        <v-col cols="12" md="4">
                            <v-row density="compact">
                                <v-col cols="12">
                                    <v-select density="compact" label="Altitude" v-model="state.alt" :items="altitudes"
                                        item-value="id" item-title="name"></v-select>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-btn @click="generate()">Generate</v-btn>
                        </v-col>
                    </v-row>
                </Panel>
            </v-col>
            <v-col cols="12">
                <RawTable :columns="columns" :data="rows" title="Sun Position">
                </RawTable>
            </v-col>
        </v-row>
    </v-container>
</template>