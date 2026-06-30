<script setup>
import { rawTable, copyClipboard, downloadText } from '@/composables/raw-table';
import moment from 'moment';
const props = defineProps({
    columns: Array,
    data: Array,
    showHeader: {type: Boolean, default: true},
    headerLine: {type: Boolean, default: true},
    header: String,
    footer: String,
    title: String,
});
const content = computed(() => rawTable(props.data, props.columns, props));
const fileName = computed(() => `${(props.title || 'file').replace(/[^\w]/g, '_')}_${moment().format('YYYYMMDD_HHmmss')}.txt`)
const showTable = ref(true);

</script>
<template>
    <v-card>
        <v-toolbar density="compact" flat>
            <v-toolbar-title v-if="title">{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <slot name="toolbar-right"></slot>
            <v-btn @click="downloadText(content, fileName)" icon="mdi-content-save" density="compact"></v-btn>
            <v-btn @click="copyClipboard(content)" icon="mdi-content-copy" density="compact"></v-btn>
            <v-btn @click="showTable = !showTable" :icon="showTable ? 'mdi-menu-up' : 'mdi-menu-down'"
                density="compact"></v-btn>
        </v-toolbar>
        <v-card-text class="overflow-auto" style="max-height: 100%;" v-show="showTable">
            <v-toolbar density="compact" flat v-if="$slots.toolbar"><slot name="toolbar"></slot></v-toolbar>
            <slot name="header"></slot>
            <pre>{{ content }}</pre>
        </v-card-text>
    </v-card>
</template>