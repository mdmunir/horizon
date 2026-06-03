<script setup>
import { vMaska } from 'maska/vue';
const props = defineProps({
    precision: { type: Number, default: 6 },
    allowNegative:{type:Boolean, default: false},
});

const model = defineModel();
const opt = reactive({
    mask: computed(() => {
        return (props.allowNegative ? '-':'') + '9' + (props.precision > 0 ? '.' + '0'.padEnd(props.precision, '0') : '');
    }),
    tokens: {
        0: { pattern: /[0-9]/, optional: true },
        9: { pattern: /[0-9]/, multiple: true },
        '-': { pattern: /\-/, optional: true },
    }
});
</script>
<template>
    <v-text-field v-model="model" v-maska="opt"></v-text-field>
</template>