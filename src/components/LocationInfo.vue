<script setup>
import { Location } from '@/composables/store';
const { abs, PI } = Math;
const R2D = 180 / PI;
const latLon = computed(() => {
    let lat = Location.lat * R2D;
    let lon = Location.lon * R2D;
    return `${abs(lat).toFixed(4)} ${lat > 0 ? 'N' : 'S'}, ${abs(lon).toFixed(4)} ${lon > 0 ? 'W' : 'E'}`;
});
</script>
<template>
    <v-list-item  @click="$bus.emit('setting/location')" :title="Location.name" :subtitle="latLon">
    </v-list-item>
</template>