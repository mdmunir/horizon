<script setup>

const items = [
    { value: 1, text: '1 Minute' },
    { value: 5, text: '5 Minutes' },
    { value: 10, text: '10 Minutes' },
    { value: 15, text: '15 Minutes' },
    { value: 30, text: '30 Minutes' },
    { value: 60, text: '1 Hour' },
    { value: 90, text: '1.5 Hours' },
    { value: 180, text: '3 Hours' },
    { value: 360, text: '6 Hours' },
    { value: 720, text: '12 Hours' },
    { value: 1440, text: '1 Day' },
];
</script>
<template>
    <v-select v-model="value" :items="items" item-title="text" item-value="value"></v-select>
</template>