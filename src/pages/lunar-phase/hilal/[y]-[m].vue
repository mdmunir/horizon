<script setup>
import { RouterView, useRoute } from 'vue-router';
import { THilal, MONTHS } from '@/composables/hijriyah';

const route = useRoute();
const y = computed(() => parseInt(route.params.y));
const m = computed(() => parseInt(route.params.m));
const month = computed(() => `${y.value}-${m.value}`);
const sMonth = computed(() => `${MONTHS[m.value - 1].name} ${y.value}`);
const next = computed(() => {
    let sm = m.value < 12 ? `${y.value}-${m.value + 1}`:`${y.value + 1}-1`;
    return route.path.replace(month.value, sm);
});
const prev = computed(() => {
    let sm = m.value > 1 ? `${y.value}-${m.value - 1}`:`${y.value - 1}-12`;
    return route.path.replace(month.value, sm);
});

const valid = (()=> y.value >= 0 && y.value <= 2000);
const tabs = {
    '/lunar-phase/hilal/[y]-[m]/': 'General',
    '/lunar-phase/hilal/[y]-[m]/global': 'Global',
    '/lunar-phase/hilal/[y]-[m]/map': 'Map',
};
const tabChildren = computed(() => Object.entries(tabs).map(([name, label]) => {
    let to = name.replace('[y]-[m]', month.value).replace(/\/index$/, '');
    return { name, label, to };
}));

const hilal = computed(() => new THilal(y.value, m.value));
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
                <Panel :title="`Hilal ${sMonth}`">
                    <template #toolbar>
                        <v-btn density="compact" icon="mdi-arrow-left" :to="`/lunar-phase/hilal?year=${hilal.year}`"></v-btn>
                    </template>
                    <template #toolbar-right>
                        <v-btn density="compact" icon="mdi-chevron-left" :to="prev"></v-btn>
                        <v-btn density="compact" icon="mdi-chevron-right" :to="next"></v-btn>
                    </template>
                    <v-tabs v-model="selected">
                        <v-tab v-for="ch in tabChildren" :value="ch.name" :to="ch.to">{{ ch.label }}</v-tab>
                    </v-tabs>
                    <v-divider></v-divider>
                    <v-tabs-window v-model="selected">
                        <v-tabs-window-item :value="selected">
                            <RouterView v-if="valid" :hilal="hilal" :s-month="sMonth" :month="month"></RouterView>
                            <div v-else>Invalid year.</div>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>