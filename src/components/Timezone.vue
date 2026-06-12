<script setup>
const props = defineProps({
    signs: { type: String, required: true, default:'-|+' },
});
const {abs, floor} = Math;
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
            let offset = abs(model.value || 0);
            let h = floor(offset / 60);
            let m = offset % 60;
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        },
        set(v) {
            let[h,m] = (v || '00:00').split(':');
            model.value = state.sign * (parseInt(h) * 60 + parseInt(m));
        }
    }),
    signLabel: computed(() => {
        const [s1, s2] = props.signs.split('|');
        return state.sign < 0 ? s1 : s2;
    }),
});
const mask = {
    mask:'K#:L#',
    tokens: {
        K:{
            pattern: /[01]/
        },
        L:{
            pattern: /[0-5]/
        },
    }
}
</script>
<template>
    <v-mask-input v-model="state.value" :mask="mask" append-inner-icon="mdi-swap-vertical" @click:append-inner="state.sign = -1 * state.sign" :prefix="state.signLabel">
    </v-mask-input>
</template>