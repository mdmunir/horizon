export const headTitle = computed({
    get() {
        return document.title.replace(' - Horizon', '');
    },
    set(value) {
        document.title = value + ' - Horizon';
    }
});
