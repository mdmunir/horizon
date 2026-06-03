<script setup>
import { watch } from "vue";

const props = defineProps({
    items: Array,
    itemValue: { type: String, default: 'id' },
    itemTitle: { type: String, default: 'name' },
});
const emit = defineEmits(['changed']);

const modelRaw = defineModel('raw');
const model = defineModel();

watch(model, (val) => {
    if (val) {
        var res = props.items.find(x => x[props.itemValue] == val);
        modelRaw.value = res;
    }
}, { immediate: true });

function changed(value) {
    model.value = value ? value[props.itemValue] : null;
    modelRaw.value = value;
    emit('changed', value);
}

async function onFocus(event) {
    await nextTick()
    event.target.select();
}
</script>
<template>
    <v-autocomplete v-model="modelRaw" :items="items" :item-value="itemValue" :item-title="itemTitle" return-object
        @update:model-value="changed" @focus="onFocus"></v-autocomplete>
</template>