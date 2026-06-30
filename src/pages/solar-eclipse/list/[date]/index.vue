<script setup>
import { copyClipboard, downloadText, rawTable } from '@/composables/raw-table';
import { Location, LatLon } from '@/composables/store';

const props = defineProps({
    data: {type: Object, required: true},
    date: {type: String},
});

const formatUtc = v => v ? moment(v).utc().format('HH:mm:ss') : '-';
const formatLocal = v => v ? moment(v).utcOffset(Location.offset).format('HH:mm:ss') : '-';

function formatUtc2(val, row){
    if(row && val){
        if(row.riset){
            return moment(val).utc().format('HH:mm') + `(${row.riset})`;
        }
        return moment(val).utc().format('HH:mm:ss');
    }
    return '-'
}
function formatLocal2(val, row){
    if(row && val){
        if(row.riset){
            return moment(val).utcOffset(Location.offset).format('HH:mm') + `(${row.riset})`;
        }
        return moment(val).utcOffset(Location.offset).format('HH:mm:ss');
    }
    return '-'
}
const global = computed(() => {
    const columns = [
        {name: 'name',label:'Event', width:10},
        {name: 'dt', label: 'Time UTC', format: formatUtc, width:10, align:'center'},
        {name: 'dt', label: 'Time Local', format: formatLocal, width:10, align:'center'},
    ];
    return rawTable(props.data.events, columns, {headerLine: false});
});

const local = computed(() => {
    const data = localCircumstance(props.data, Location);
    if(data.type == 0){
        return 'Eclipse is not visible from your location.';
    }
    const columns = [
        {name:'title',label:'Event', width:10},
        {name: 'dt', label: 'Time UTC', format: formatUtc2, width:10, align:'center'},
        {name: 'dt', label: 'Time Local', format: formatLocal2, width:10, align:'center'},
        {name: 'alt', label: 'Alt', format: 'deg|2', width:10, align:'right'},
        {name: 'mag', label: 'Magnitude', 
            format: (v, row) => (v && row.name == 'Mid') ? v.toFixed(4) : '',
            width:10, align:'right'
        },
    ];
    return rawTable(data.events, columns, {headerLine: false});
});

const element = computed(() => {
    const map = { X: 'x ', Y: 'y ', D: 'd ', L1: 'l1', L2: 'l2', M: 'μ ', F: 'Tan ƒ          ' };
    const header = 'n             0           1           2           3\n';
    return header + Object.entries(map).map(([key, label]) => {
        const val = props.data[key];
        return label + '     ' + val.map(v => v.toFixed(8).align('right', 13)).join('');
    }).join('\n');
});

const pre = useTemplateRef('pre');
</script>
<template>
    <Panel content-class="overflow-auto">
        <template #toolbar-right>
            <v-btn @click="downloadText(pre.innerHTML, `solar-eclipse-${date}.txt`)" icon="mdi-content-save" density="compact"></v-btn>
            <v-btn @click="copyClipboard(pre.innerHTML)" icon="mdi-content-copy" density="compact"></v-btn>
        </template>
        <pre ref="pre">Solar Eclipse {{date}}.
Global Circumstance:
{{ global }}

Local Circumstance at {{ Location.name }}({{ LatLon }}):
{{ local }}

Besselian Element. T0={{data.T0}}:
{{ element }}</pre>
    </Panel>
</template>