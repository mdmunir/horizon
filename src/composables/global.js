import { computed, ref, onMounted, onUnmounted } from "vue";
import appLogo from '@/assets/icon.png';

const {abs, PI} = Math;
const STORAGE_KEY = '__theme';
const theme = ref(localStorage.getItem(STORAGE_KEY));

export const darkMode = computed({
    get() {
        return theme.value == 'dark';
    },
    set(value) {
        theme.value = value ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, theme.value);
    }
});

export const drawerState = ref(true);

class Bus {
    constructor() {
        this.events = {};
    }

    /**
     * Register event
     * @param {string} name 
     * @param {Function} fn 
     */
    on(name, fn) {
        const events = this.events;
        onMounted(() => {
            events[name] = events[name] || [];
            events[name].push(fn);
        });
        onUnmounted(() => {
            if (events[name]) {
                events[name] = events[name].filter(f => f !== fn);
            }
        });
    }

    /**
     * Trigger event
     * @param {string} name 
     */
    emit(name) {
        const args = [...arguments].slice(1);
        var th = this;
        if (this.events[name]) {
            this.events[name].forEach((fn) => fn.apply(th, args));
        }
    }
}

export const $bus = new Bus();
export {appLogo};

export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }
}
export function formatTz(offset){
    let res = offset == 0 ? ' ' : (offset < 0 ? '-' : '+');
    let val = Math.abs(offset);
    res += (Math.floor(val/60).toString().padStart(2, '0'));
    res += ':';
    res += (Math.floor(val % 60).toString().padStart(2, '0'));
    return res;
}

export function formatLoc(loc){
    let lat = loc.lat * 180 / PI;
    let lon = loc.lon * 180 / PI;
    return `${abs(lat).toFixed(4).padStart(7,' ')} ${lat > 0 ? 'N' : 'S'}, ${abs(lon).toFixed(4).padStart(8, ' ')} ${lon > 0 ? 'W' : 'E'}`;
}