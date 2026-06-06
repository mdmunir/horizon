import { computed, ref, onMounted, onUnmounted } from "vue";
import appLogo from '@/assets/icon.png';

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

export function downloadText(content, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || 'output.txt';
    a.click();

    URL.revokeObjectURL(url);
}

export function copyClipboard(content) {
    const blob = new Blob([content], { type: "text/plain" });
    const data = [new ClipboardItem({ "text/plain": blob })];
    navigator.clipboard.write(data);
    $bus.emit('toast', 'Copy to clipboard');
}