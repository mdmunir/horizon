<script setup>
const props = defineProps({
    title: { type: String },
    btnClose: { type: Boolean, default: false },
});
const emit = defineEmits(['opened', 'closed']);

const show = defineModel();
watch(show, v => {
    v ? emit('opened') : emit('closed');
});
</script>
<template>
    <v-dialog v-model="show" persistent>
        <v-card>
            <v-toolbar density="compact" :title="title">
                <slot name="toolbar"></slot>
                <template v-slot:append>
                    <v-btn v-if="btnClose" density="compact" size="small" icon="$close" @click="show = false"></v-btn>
                </template>
            </v-toolbar>
            <v-card-text>
                <slot></slot>
            </v-card-text>
            <v-card-actions class="pt-0" v-if="$slots.action">
                <slot name="action"></slot>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>