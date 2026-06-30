<script setup>
import { Location, LatLon } from '@/composables/store';
</script>
<template>
    <v-list-item  @click="$bus.emit('setting/location')" :title="Location.name" :subtitle="LatLon">
    </v-list-item>
</template>