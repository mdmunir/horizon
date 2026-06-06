<script setup>
import { useRoute, RouterLink } from 'vue-router';
import { eclipseDecade } from '@/composables/solar-eclipse';

const route = useRoute();

const decade = computed(() => route.query.dc ? parseInt(route.query.dc) : 0);
const century = computed(() => route.query.cy === '0' ? 0 : parseInt(route.query.cy || '20'));
const dc = computed(() => century.value * 10 + decade.value);

const dcLinks = computed(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => {
        return {
            to: { query: { ...route.query, dc: v } },
            label: `${century.value}${v}0 - ${century.value}${v}9`,
            active: v == decade.value,
        };
    });
});
const cyLinks = computed(() => {
    return [0, 1, 2].map(m => {
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => {
            let cy = m * 10 + c;
            return {
                to: { query: { ...route.query, cy, dc: 0 } },
                label: m == 0 ? `0${cy}00 - 0${cy}99` : `${cy}00 - ${cy}99`,
                active: cy == century.value,
            }
        });
    });
});

watch(dc, val => eclipseDecade.decade = val, { immediate: true });

</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel :title="`Solar Eclipse ${century}${decade}0 - ${century}${decade}9`">
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
                                <td>{{ moment((row.JDE0 + row.timeP[0]/24).toDate()).utc().format('HH:mm:ss') }}</td>
                                <td>{{ moment((row.JDE0 + row.timeP[3]/24).toDate()).utc().format('HH:mm:ss') }}</td>
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