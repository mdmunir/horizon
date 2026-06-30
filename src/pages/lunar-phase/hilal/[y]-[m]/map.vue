<script setup>
import HilalMap from '../../components/HilalMap.vue';

const props = defineProps({
    hilal: Object,
    sMonth: String,
    month: String,
});

const state = reactive({
    day: 0,
    texture: 'Earth1',
    method: 3,
});
const DAYS = [0,1,2];
const TEXTURES = ['Earth1', 'Earth2'];
const METHODS = [
    {value:1, title: 'Geocentric'},
    {value:2, title: 'Topocentric'},
    {value:3, title: 'Apparent'},
];
const map = useTemplateRef('map');
</script>
<template>
    <Panel content-class="overflow-auto">
        <template #toolbar-right>
            <v-toolbar-items>
                <v-select :items="METHODS" v-model="state.method" density="compact" hide-details style="min-width: 80px;"></v-select>
                <v-select :items="TEXTURES" v-model="state.texture" density="compact" hide-details style="min-width: 80px;"></v-select>
                <v-select :items="DAYS" v-model="state.day" density="compact" hide-details style="min-width: 60px;"></v-select>
            </v-toolbar-items>
            <v-btn @click="map.snapshot()" icon="mdi-content-save" density="compact"></v-btn>
        </template>
        <HilalMap ref="map" :hilal="hilal" :day="state.day" :texture="state.texture" :method="state.method"></HilalMap>
    </Panel>
</template>