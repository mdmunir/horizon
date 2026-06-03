<script setup>
import { RouterView, useRoute } from 'vue-router';
import { eclipseDecade } from '@/libs/solar-eclipse';

const route = useRoute();
const date = computed(() => route.params.date);

watch(date, val => {
    let dc = parseInt(val.substring(0, 3));
    eclipseDecade.decade = dc;
}, { immediate: true });

const tabs = {
    '/solar-eclipse/[date]/index': 'General',
    '/solar-eclipse/[date]/map': 'Map',
};
const tabChildren = computed(() => Object.entries(tabs).map(([name, label]) => {
    let to = name.replace('[date]', route.params.date).replace(/\/index$/, '');
    return { name, label, to };
}));

const data = computed(() => eclipseDecade.rows.find(row => row.date == date.value));
const selected = computed(() => route.name);
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel :title="`Solar Eclipse ${date}`">
                    <v-tabs :model-value="selected">
                        <v-tab v-for="ch in tabChildren" :value="ch.name" :to="ch.to">{{ ch.label }}</v-tab>
                    </v-tabs>
                    <v-divider></v-divider>
                    <v-tabs-window :model-value="selected">
                        <v-tabs-window-item :value="selected">
                            <RouterView v-if="data" :data="data" :date="date"></RouterView>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>