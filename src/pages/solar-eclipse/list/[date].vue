<script setup>
import { RouterView, useRoute } from 'vue-router';
import { eclipseDecade } from '@/composables/solar-eclipse';

const route = useRoute();
const date = computed(() => route.params.date);

watch(date, val => {
    let dc = parseInt(val.substring(0, 3));
    eclipseDecade.decade = dc;
}, { immediate: true });

const tabs = {
    '/solar-eclipse/list/[date]/': 'General',
    '/solar-eclipse/list/[date]/global-path': 'Global Path',
    '/solar-eclipse/list/[date]/animation': 'Animation',
};
const tabChildren = computed(() => Object.entries(tabs).map(([name, label]) => {
    let to = name.replace('[date]', route.params.date).replace(/\/index$/, '');
    return { name, label, to };
}));

const data = computed(() => eclipseDecade.rows.find(row => row.date == date.value));
const selected = computed({
    get(){
        return route.name
    },
    set(v){}
});
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel :title="`Solar Eclipse ${date}`">
                    <template #toolbar>
                        <v-btn density="compact" icon="mdi-arrow-left" :to="`/solar-eclipse/list?dc=${eclipseDecade.decade}`"></v-btn>
                    </template>
                    <v-tabs v-model="selected">
                        <v-tab v-for="ch in tabChildren" :value="ch.name" :to="ch.to">{{ ch.label }}</v-tab>
                    </v-tabs>
                    <v-divider></v-divider>
                    <v-tabs-window v-model="selected">
                        <v-tabs-window-item :value="selected">
                            <RouterView v-if="data" :data="data" :date="date"></RouterView>
                            <div v-else>Eclipse not found.</div>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>