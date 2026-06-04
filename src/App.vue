<script setup>
import { RouterView, useRoute } from 'vue-router';
import Default from './layouts/Default.vue';
import Main from './layouts/Main.vue';

const layouts = {default: Default, main: Main};
const route = useRoute();
const layout = computed(() => layouts[route.meta.layout || 'default']);
</script>
<template>
    <component :is="layout"><RouterView></RouterView></component>
</template>