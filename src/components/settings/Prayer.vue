<script setup>
import { PrayerState } from '@/composables/store';
const show = ref(false);

$bus.on('setting/prayer', () => {
    show.value = true;
    PrayerState.$reset();
});

function Save() {
    PrayerState.$save();
    show.value = false;
}

</script>
<template>
    <v-dialog density="compact" v-model="show" max-width="600" style="z-index: 1999;" @keydown.esc="show = false">
        <v-card>
            <v-toolbar class="gradient-orange" density="compact" flat title="Prayer">
                <v-spacer></v-spacer>
                <v-btn @click="show=false" icon="mdi-close"></v-btn>
            </v-toolbar>
            <v-card-text class="pa-4 text-caption">
                <v-card variant="outlined">
                    <v-card-title>Altitude (°)</v-card-title>
                    <v-card-text>
                        <v-row density="compact">
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.alt_subuh" label="Subuh"
                                    allow-negative :precision="1"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.alt_dhuha" label="Dhuha"
                                    :precision="1">
                                </NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.alt_isya" label="Isya"
                                    allow-negative :precision="1"></NumberInput>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
                <v-card variant="outlined">
                    <v-card-title>Ihtiyath (minute)</v-card-title>
                    <v-card-text>
                        <v-row density="compact">
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.subuh" label="Subuh" allow-negative
                                    :precision="0"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.terbit" label="Sunrise"
                                    allow-negative :precision="0"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.dzuhur" label="Dzuhur"
                                    allow-negative :precision="0"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.ashar" label="Ashar" allow-negative
                                    :precision="0"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.maghrib" label="Maghrib"
                                    allow-negative :precision="0"></NumberInput>
                            </v-col>
                            <v-col cols="4">
                                <NumberInput density="compact" v-model="PrayerState.isya" label="Isya" allow-negative
                                    :precision="0"></NumberInput>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-card-text>
            <template v-slot:actions>
                <v-btn color="green" text @click.native="show = false">Cancel</v-btn>
                <v-btn dark color="error darken-1" text @click.native="Save()">Save</v-btn>
            </template>
        </v-card>
    </v-dialog>
</template>