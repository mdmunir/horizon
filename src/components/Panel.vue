<script setup>
const props = defineProps({
    title: String,
    collapsable: {type: Boolean, default: false},
    contentClass: {type: String},
});
const slots = useSlots();
const show = ref(true);
const showToolbar = computed(() => props.title || props.collapsable || slots.toolbar || slots['toolbar-right']);
</script>
<template>
    <v-card>
        <v-toolbar density="compact" v-if="showToolbar">
            <slot name="toolbar"></slot>
            <v-toolbar-title v-if="title">{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <slot name="toolbar-right"></slot>
            <v-btn v-if="collapsable" @click="show = !show" :icon="show ? 'mdi-menu-up' : 'mdi-menu-down'" density="compact"></v-btn>
        </v-toolbar>
        <v-card-text v-show="show || !collapsable" :class="contentClass">
            <slot></slot>
        </v-card-text>
        <v-card-actions v-if="$slots.actions">
            <slot name="actions"></slot>
        </v-card-actions>
    </v-card>
</template>