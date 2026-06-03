<script setup>
import Toast from './Toast.vue';
import Location from '@/components/settings/Location.vue';
import Prayer from '@/components/settings/Prayer.vue';
import { darkMode } from '@/composables/global';
</script>
<template>
    <v-app :theme="darkMode ? 'dark' : 'light'">
        <slot></slot>
        <div id="end-page">
            <Toast></Toast>
            <Location></Location>
            <Prayer></Prayer>
            END PAGE
        </div>
    </v-app>
</template>