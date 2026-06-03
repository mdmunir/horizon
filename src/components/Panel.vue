<script setup>
const props = defineProps({
    title: String,
    collapsable: {type: Boolean, default: false},
});
const show = ref(true);
</script>
<template>
    <v-card>
        <v-toolbar density="compact" :title="title">
            <slot name="toolbar"></slot>
            <v-spacer></v-spacer>
            <slot name="toolbar-right"></slot>
            <v-btn v-if="collapsable" @click="show = !show" :icon="show ? 'mdi-menu-up' : 'mdi-menu-down'" density="compact"></v-btn>
        </v-toolbar>
        <v-card-text v-show="show || !collapsable">
            <slot></slot>
        </v-card-text>
        <v-card-actions v-if="$slots.actions">
            <slot name="actions"></slot>
        </v-card-actions>
    </v-card>
</template>