<script setup>
const props = defineProps({
    month: { type: Number, required: true }
});
const DAYS = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Ahad',
];
</script>
<template>
    <v-table density="compact">
        <thead>
            <tr>
                <th colspan="7"></th>
            </tr>
            <tr>
                <th v-for="d in DAYS">
                    {{ d }}
                </th>
            </tr>
        </thead>
        <tbody>

        </tbody>
    </v-table>
</template>