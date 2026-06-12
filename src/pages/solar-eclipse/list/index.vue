<script setup>
import { useRoute, RouterLink } from 'vue-router';
import { eclipseDecade } from '@/composables/solar-eclipse';

const route = useRoute();

const decade = computed(() => parseInt(route.query.dc || '202'));

const dcLinks = computed(() => {
    const cy = Math.floor(decade.value / 10).toString().padStart(2, '0');
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => {
        return {
            to: { query: { ...route.query, dc: `${cy}${v}` } },
            label: `${cy}${v}0 - ${cy}${v}9`,
            active: v == decade.value % 10,
        };
    });
});
const cyLinks = computed(() => {
    return [0, 1, 2].map(m => {
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => {
            let cy = m * 10 + c;
            return {
                to: { query: { ...route.query, dc: `${m}${c}0` } },
                label: `${m}${c}00 - ${m}${c}99`,
                active: cy == Math.floor(decade.value / 10),
            }
        });
    });
});

watch(decade, val => eclipseDecade.decade = val, { immediate: true });

</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel :title="`Solar Eclipse ${decade}0 - ${decade}9`">
                    <ul>
                        <li>
                            <span v-for="link in dcLinks" :key="link.label">
                                [
                                <span v-if="link.active">{{ link.label }}</span>
                                <router-link v-else :to="link.to">{{ link.label }}</router-link>
                                ]
                            </span>
                        </li>
                    </ul>
                    <v-table density="compact" striped="even">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Greatest Eclipse</th>
                                <th>P1</th>
                                <th>P4</th>
                                <th>Gamma</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in eclipseDecade.rows">
                                <td><router-link :to="`/solar-eclipse/list/${row.date}`">{{ row.date }}</router-link>
                                </td>
                                <td>{{ row.sType }}</td>
                                <td>{{ row.timeMax }}</td>
                                <td>{{ moment((row.JDE0 + row.P1 / 24).toDate()).utc().format('HH:mm:ss') }}</td>
                                <td>{{ moment((row.JDE0 + row.P4 / 24).toDate()).utc().format('HH:mm:ss') }}</td>
                                <td>{{ row.distance.toFixed(8) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                    <ul>
                        <li v-for="mLinks in cyLinks">
                            <span v-for="link in mLinks" :key="link.label">
                                [
                                <span v-if="link.active">{{ link.label }}</span>
                                <router-link v-else :to="link.to">{{ link.label }}</router-link>
                                ]
                            </span>
                        </li>
                    </ul>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>