<script setup>
import format from '@/composables/format';
import moment from 'moment';
const props = defineProps({
    columns: Array,
    data: Array,
    header: String,
    footer: String,
    title: String,
});
const tableHeader = computed(() => {
    const lines = [];
    const labels = [];
    props.columns.forEach(column => {
        lines.push('*'.padStart(column.width || 16, '*'));
        labels.push((column.label || column.name).align('center', column.width || 16));
    });
    return `${lines.join('**')} \n${labels.join('  ')}\n${lines.join('**')}`;
});

/**
 * 
 * @param {Object} row 
 * @param {string} key 
 */
function getValue(obj, path, defaultValue = undefined) {
    if(!path){
        return obj;
    }
    for (const key of path.split('.')) {
        if (obj == null) {
            return defaultValue;
        }
        obj = obj[key];
    }
    return obj ?? defaultValue;
}
const tableRows = computed(() => {
    return props.data.map((row, idx) => {
        const line = [];
        props.columns.forEach(column => {
            let val = getValue(row, column.field || column.name);
            if (column.format) {
                if (typeof column.format === 'function') {
                    val = column.format(val, row, idx);
                } else {
                    val = format(val, column.format);
                }
            }
            line.push(val.toString().align(column.align || 'left', column.width || 16));
        });
        return line.join('  ');
    }).join('\n');
});

const content = computed(() => {
    return `${props.header ? props.header + '\n' : ''}${tableHeader.value}
${tableRows.value}${props.footer ? '\n' + props.footer : ''}`;
});

function download() {
    const url = URL.createObjectURL(new Blob([content.value], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${props.title.replace(/[^\w]/g, '_')}_${moment().format('YYYYMMDD_HHmmss')}.txt`;
    a.click();

    URL.revokeObjectURL(url);
}

function copy() {
    const blob = new Blob([content.value], { type: "text/plain" });
    const data = [new ClipboardItem({ "text/plain": blob })];
    navigator.clipboard.write(data);
    $bus.emit('toast', 'Data sudah tercopy');
}

const showTable = ref(true);

</script>
<template>
    <v-card>
        <v-toolbar class="gradient-orange" density="compact" flat :title="title">
            <v-spacer></v-spacer>
            <v-btn @click="download()" icon="mdi-content-save" density="compact"></v-btn>
            <v-btn @click="copy()" icon="mdi-content-copy" density="compact"></v-btn>
            <v-btn @click="showTable = !showTable" :icon="showTable ? 'mdi-menu-up' : 'mdi-menu-down'"
                density="compact"></v-btn>
        </v-toolbar>
        <v-card-text class="overflow-auto" style="max-height: 100%;" v-show="showTable">
            <v-toolbar density="compact" flat v-if="$slots.toolbar"><slot name="toolbar"></slot></v-toolbar>
            <pre>{{ content }}</pre>
        </v-card-text>
    </v-card>
</template>