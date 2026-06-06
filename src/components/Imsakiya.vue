<script setup>
import calcPrayer from '@/composables/prayer';
import { Location, Prayer } from '@/composables/store';
import { now } from '@/composables/horison';
import moment from 'moment';
import { useDisplay } from 'vuetify';
const {mobile} = useDisplay();
const { y, m, d } = now();

const rows = computed(() => calcPrayer(y, m, d, Location, Prayer).filter(v => !mobile.value || v.prime));
</script>
<template>
    <v-row density="compact">
        <v-col v-for="time in rows">
            <v-card :subtitle="time.label" density="compact" variant="flat">
                <v-card-text>
                    {{ moment(time.time).format('HH:mm') }}
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>