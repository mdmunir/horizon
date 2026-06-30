<script setup>
import { CalendarToJD, isCalendarGregorian } from 'astronomia/julian';

const props = defineProps({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
});
const DAYS = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Ahad',
].map(v => [v, v.charAt(0)]);

const JD = computed(()=> CalendarToJD(props.year, props.month, 1, !isCalendarGregorian(props.year, props.month)));
const D0 = computed(() => JD.value % 7);
const rows = computed(() => {
    const res = [];
    
    return res;
});
</script>
<template>
    <v-table density="compact">
        <thead>
            <tr>
                <th colspan="7"></th>
            </tr>
            <tr>
                <th v-for="d in DAYS">
                    <span class="d-none d-sm-inline">{{ d[0] }}</span>
                    <span class="d-sm-none d-inline">{{ d[1] }}</span>
                </th>
            </tr>
        </thead>
        <tbody>

        </tbody>
    </v-table>
</template>