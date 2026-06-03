<script setup>
import calcPrayer from '@/libs/prayer';
import { Location, Prayer } from '@/composables/store';
import { now } from '@/libs/horison';
import moment from 'moment';
const { y, m, d } = now();
const labels = {
    subuh: 'Subuh',
    terbit: 'Terbit',
    dhuha: 'Dhuha',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya',
    tengah: 'Akhir Isya',
};
const rows = computed(() => {
    const ts = calcPrayer(y, m, d, Location, Prayer).map(v => {
        v.label = labels[v.name] || v.name;
        return v;
    });
    const size = 4;
    const result = [];
    for (let i = 0; i < ts.length; i += size) {
        result.push(ts.slice(i, i + size));
    }
    return result;
});
</script>
<template>
    <v-row density="compact">
        <v-col cols="12" md="6" v-for="times in rows">
            <v-row density="compact">
                <v-col v-for="time in times">
                    <v-card :subtitle="time.label" density="compact" variant="flat">
                        <v-card-text>
                            {{ moment(time.time).format('HH:mm') }}
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
</template>