<script setup>
import { LocationState } from '@/composables/store';
import locations from '@/data/locations';
import timezones from '@/data/timezone';
import NumberInput from '../NumberInput.vue';

const show = ref(false);

$bus.on('setting/location', () => {
    show.value = true;
    LocationState.$reset();
});

function locationChanged(val) {
    if (val) {
        Object.assign(LocationState, val);
    }
}

function zoneChanged(val) {
    if (val) {
        LocationState.offset = val.offset;
        LocationState.zone_name = val.name;
    }
}

function Save() {
    LocationState.$save();
    show.value = false;
}

</script>
<template>
    <v-dialog density="compact" v-model="show" max-width="600" style="z-index: 1999;" @keydown.esc="show = false">
        <v-card>
            <v-toolbar class="gradient-orange" density="compact" flat title="Location">
                <v-spacer></v-spacer>
                <v-btn @click="show=false" icon="mdi-close"></v-btn>
            </v-toolbar>
            <v-card-text class="pa-4 text-caption">
                <v-row density="compact">
                    <v-col cols="12">
                        <Autocomplete density="compact" :items="locations" v-model="LocationState.id" label="Location"
                            @changed="locationChanged"></Autocomplete>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field density="compact" v-model="LocationState.name" label="Name">
                        </v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <LatLon density="compact" v-model="LocationState.lat" signs="S|N" label="Latitude"></LatLon>
                    </v-col>
                    <v-col cols="6">
                        <LatLon density="compact" v-model="LocationState.lon" signs="E|W" label="Longitude"></LatLon>
                    </v-col>
                    <v-col cols="6">
                        <Autocomplete density="compact" v-model="LocationState.zone_id" @changed="zoneChanged"
                            :items="timezones" label="Timezone"></Autocomplete>
                    </v-col>
                    <v-col cols="3">
                        <NumberInput density="compact" v-model="LocationState.offset" label="Zone Offset" :precision="0"
                            allow-negative></NumberInput>
                    </v-col>
                    <v-col cols="3">
                        <NumberInput density="compact" v-model="LocationState.height" label="Height(m)" :precision="0"></NumberInput>
                    </v-col>
                </v-row>
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="green" text @click.native="show = false">Cancel</v-btn>
                <v-btn dark color="error darken-1" text @click.native="Save()">Save</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>