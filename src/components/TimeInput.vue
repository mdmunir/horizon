<script setup>
const model = defineModel();
const showMenu = ref(false);
</script>
<template>
    <v-text-field :model-value="model" readonly>
        <v-menu v-model="showMenu" :close-on-content-click="false" activator="parent" min-width="0">
            <v-time-picker v-model="model" format="24hr" use-seconds hide-title></v-time-picker>
        </v-menu>
    </v-text-field>
</template>