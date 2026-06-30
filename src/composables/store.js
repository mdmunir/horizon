import { reactive, readonly } from "vue";
const {PI, abs} = Math;

const STORAGE_KEY = '__store/';

function useSetting(name, c) {
    const key = STORAGE_KEY + name;
    var rec = reactive({
        ...(c || {}),
        ...(JSON.parse(localStorage.getItem(key) || '{}') || {}),
    });
    var state = reactive({
        ...rec,
        $reset() {
            Object.assign(this, { ...rec });
        },
        $save() {
            const { $save, $reset, ...newVal } = this;
            Object.assign(rec, newVal);
            localStorage.setItem(key, JSON.stringify(newVal));
        }
    })
    return [readonly(rec), state];
}

export const [Location, LocationState] = useSetting('location', {
    id: 163,
    level: 2,
    parent: "DKI JAKARTA",
    name: "Jakarta Pusat",
    fullname: "Jakarta Pusat, DKI JAKARTA",
    lon: -1.8645526931980623,
    lat: -0.1076897237301368,
    zone_id: "Asia/Jakarta",
    zone_name: "Asia/Jakarta (+07)",
    offset: 420,
    height: 10,
});

export const [Prayer, PrayerState] = useSetting('prayer', {
    alt_subuh: -20,
    alt_isya: -18,
    alt_dhuha: 4.5,
    alt_ashar: 1,
    subuh: 2,
    dhuha: 2,
    dzuhur: 2,
    ashar: 2,
    maghrib: 2,
    isya: 2,
    terbit: -2,
});

export const LatLon = computed(() => {
    let lat = Location.lat * 180 / PI;
    let lon = Location.lon * 180 / PI;
    return `${abs(lat).toFixed(4)} ${lat > 0 ? 'N' : 'S'}, ${abs(lon).toFixed(4)} ${lon > 0 ? 'W' : 'E'}`;
});
