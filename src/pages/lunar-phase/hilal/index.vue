<script setup>
import { debounce } from '@/composables/global';
import { moonPhases } from '@/composables/hijriyah';
import { now } from '@/composables/horizon';
import { useRoute, useRouter } from 'vue-router';

const YEAR_MIN = 611;
const YEAR_MAX = 2999;
const { min, max } = Math;
const { y } = now();
const route = useRoute();
const router = useRouter();
const year = computed({
    get: () => route.query.year || y,
    set: debounce(v => {
        v = parseInt(v);
        v = max(min(v, YEAR_MAX), YEAR_MIN);
        router.push({ query: { year: v || y } });
    }),
});

const rows = computed(() => moonPhases(year.value));
const mask = {
    mask: '9000',
    tokens: {
        0: { pattern: /[0-9]/, optional: true },
        9: { pattern: /[0-9]/, optional: false },
    }
}
</script>
<template>
    <v-container fluid>
        <v-row density="compact">
            <v-col cols="12">
                <Panel title="Moon Phases">
                    <v-row density="compact">
                        <v-col cols="12" sm="3">
                            <v-text-field v-model="year" v-maska="mask" density="compact" hide-details>
                                <template #prepend-inner>
                                    <v-btn density="compact" size="small" icon="mdi-chevron-double-left"
                                        @click="year = max(year - 10, YEAR_MIN)"></v-btn>
                                    <v-btn density="compact" size="small" icon="mdi-chevron-left"
                                        @click="year = max(year - 1, YEAR_MIN)"></v-btn>
                                </template>
                                <template #append-inner>
                                    <v-btn density="compact" size="small" icon="mdi-chevron-right"
                                        @click="year = min((1 * year) + 1, YEAR_MAX)"></v-btn>
                                    <v-btn density="compact" size="small" icon="mdi-chevron-double-right"
                                        @click="year = min((1 * year) + 10, YEAR_MAX)"></v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>
                    <v-table density="compact" striped="even">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Conjunction</th>
                                <th>First Quarter</th>
                                <th>Full Moon</th>
                                <th>Last Quarter</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in rows">
                                <td><router-link :to="`/lunar-phase/hilal/${row.y}-${row.m}`">{{ row.name }}</router-link>
                                </td>
                                <td>{{ moment(row.phases[0]).utc().format('YYYY-MM-DD HH:mm:ss') }}</td>
                                <td>{{ moment(row.phases[1]).utc().format('YYYY-MM-DD HH:mm:ss') }}</td>
                                <td>{{ moment(row.phases[2]).utc().format('YYYY-MM-DD HH:mm:ss') }}</td>
                                <td>{{ moment(row.phases[3]).utc().format('YYYY-MM-DD HH:mm:ss') }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </Panel>
            </v-col>
        </v-row>
    </v-container>
</template>