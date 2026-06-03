<script setup>
import { vMaska } from "maska/vue";
const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;

const props = defineProps({
    signs: { type: String, required: true, default:'-|' },
});
const model = defineModel();

const state = reactive({
    sign: computed({
        get() {
            return model.value < 0 ? -1 : 1;
        },
        set(v) {
            model.value = v * state.value * D2R;
        }
    }),
    value: computed({
        get() {
            return parseFloat((Math.abs(model.value || 0) * R2D).toFixed(6));
        },
        set(v) {
            model.value = state.sign * v * D2R;
        }
    }),
    signLabel: computed(() => {
        const [s1, s2] = props.signs.split('|');
        return state.sign < 0 ? s1 : s2;
    }),
});
const maskaOption = {
    mask: '9.000000',
    tokens: {
        0: { pattern: /[0-9]/, optional: true },
        9: { pattern: /[0-9]/, multiple: true },
    }
}
</script>
<template>
    <v-text-field v-model="state.value" v-maska="maskaOption" append-inner-icon="mdi-swap-vertical" @click:append-inner="state.sign = -1 * state.sign" :prefix="state.signLabel">
    </v-text-field>
</template>