<script setup>
import locations from '@/data/locations';
const { PI, abs } = Math;
const SIZE = 25;
const R2D = 180 / PI;
const props = defineProps({
    icon: { type: String, default: 'mdi-map-marker' },
});
const emit = defineEmits(['selected']);

const show = ref(false);
const search = ref('');
const searchRef = ref(null);
const filtered = computed(() => {
    var s = search.value.toLowerCase();
    if (s) {
        return locations.filter(v => v.fullname.toLowerCase().indexOf(s) >= 0).slice(0, SIZE);
    }
    return locations.slice(0, SIZE);
});
function subtitle(item) {
    let lat = item.lat * R2D;
    let lon = item.lon * R2D;
    return `${item.fullname} (${abs(lat).toFixed(4)} ${lat > 0 ? 'N' : 'S'}, ${abs(lon).toFixed(4)} ${lon > 0 ? 'W' : 'E'})`;
}
function clicked() {
    show.value = true;
}
function selected(item) {
    emit('selected', item);
    show.value = false;
}
</script>
<template>
    <v-icon @click="clicked" v-bind="$attrs" :icon="icon"></v-icon>
    <Teleport to="#end-page">
        <v-dialog density="compact" v-model="show" max-width="400" style="z-index: 9001;" @keydown.esc="show = false" @afterEnter="searchRef.focus();searchRef.select()">
            <v-card>
                <v-toolbar class="gradient-orange" density="compact" flat title="Location">
                    <v-spacer></v-spacer>
                    <v-btn @click="show = false" icon="mdi-close"></v-btn>
                </v-toolbar>
                <v-card-text class="pa-4 text-caption">
                    <v-row density="compact">
                        <v-col cols="12">
                            <v-text-field density="compact" variant="solo" v-model="search" ref="searchRef"></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-list nav>
                                <v-list-item v-for="item in filtered" :key="item.id" :subtitle="subtitle(item)"
                                    :title="item.name" @click="selected(item)"></v-list-item>
                            </v-list>
                        </v-col>
                    </v-row>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn color="green" text @click.native="show = false">Cancel</v-btn>
                    <v-btn dark color="error darken-1" text @click.native="Save()">Save</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </Teleport>
</template>