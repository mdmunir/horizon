<script setup>
import { formatTz } from '@/composables/global';
const props = defineProps({
    title: { type: String },
    btnClose: { type: Boolean, default: false },
    btnOk: { type: Boolean, default: false },
    offset: { type: Number },
});
const emit = defineEmits(['opened', 'closed']);

const show = defineModel();
const jd = defineModel('jd');
const state = reactive({
    jd: null,
    date: computed({
        get(){
            return state.jd.toDate();
        },
        set(v){
            state.jd = calculateJd(v, state.time);
            if(!props.btnOk){
                jd.value = state.jd;
            }
        }
    }),
    time: computed({
        get(){
            let dt = state.jd.toDate();
            return moment(dt).utcOffset(props.offset || 0).format('HH:mm:ss');
        },
        set(v){
            state.jd = calculateJd(state.date, v);
            if(!props.btnOk){
                jd.value = state.jd;
            }
        }
    }),
});

watch(show, v => {
    if(v){
        state.jd = jd.value;
    }
    v ? emit('opened') : emit('closed');
});
watch(jd, v => {
    if(!props.btnOk){
        state.jd = v;
    }
});
const tab = ref('date');
function calculateJd(date, time) {
    let str = moment(date).utcOffset(props.offset || 0).format('YYYY-MM-DD');
    str = `${str}T${time}Z${formatTz(props.offset || 0)}`;
    let dt = str.toDate();
    return dt.toJD();
}
function okClick() {
    jd.value = state.jd;
    show.value = false;
}
</script>
<template>
    <v-dialog v-model="show" persistent max-width="350px">
        <v-card>
            <v-toolbar density="compact" :title="title">
                <slot name="toolbar"></slot>
                <template v-slot:append>
                    <v-btn v-if="btnClose" density="compact" size="small" icon="$close" @click="show = false"></v-btn>
                </template>
            </v-toolbar>
            <v-card-text>
                <v-tabs v-model="tab">
                    <v-tab value="date" icon="mdi-calendar">Date</v-tab>
                    <v-tab value="time" icon="mdi-clock">Time</v-tab>
                </v-tabs>
                <v-window v-model="tab">
                    <v-window-item value="date">
                        <v-date-picker v-model="state.date" hide-title></v-date-picker>
                    </v-window-item>
                    <v-window-item value="time">
                        <v-time-picker v-model="state.time" format="24hr" use-seconds hide-title></v-time-picker>
                    </v-window-item>
                </v-window>
            </v-card-text>
            <v-card-actions class="pt-0" v-if="btnOk">
                <v-btn @click="okClick()">Change</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>