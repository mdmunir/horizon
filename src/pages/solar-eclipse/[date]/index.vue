<script setup>
const props = defineProps({
    data: {type: Object, required: true},
    date: {type: String},
});

const textInfo = computed(() => {
    if (props.data) {
        const { T0, deltaT, JDE0 } = props.data;
        let res = '';
        res += `Contacts:
         DT            UT
`;
        res += props.data.timeP.map((t, ix) => {
            let res = `P${ix + 1}:`;
            if (t === null) return res + '        -';
            res += '    ' + moment((JDE0 + t / 24).toDate()).utc().format('HH:mm:ss');
            res += '    ' + moment((JDE0 + t / 24 - deltaT / 86400).toDate()).utc().format('HH:mm:ss');
            return res;
        }).join('\n') + '\n';
        res += props.data.timeU.map((t, ix) => {
            let res = `U${ix + 1}:`;
            if (t === null) return res + '        -';
            res += '    ' + moment((JDE0 + t / 24).toDate()).utc().format('HH:mm:ss');
            res += '    ' + moment((JDE0 + t / 24 - deltaT / 86400).toDate()).utc().format('HH:mm:ss');
            return res;
        }).join('\n') + '\n';

        res += `
Polynomial Besselian Elements (T0 = ${props.data.T0}):
n             0           1           2           3\n`;
        const map = { X: 'x ', Y: 'y ', D: 'd ', L1: 'l1', L2: 'l2', M: 'μ ', F: 'Tan ƒ          ' };
        res += Object.entries(map).map(([key, label]) => {
            const val = props.data[key];
            return label + '     ' + val.map(v => v.toFixed(8).align('right', 13)).join('');
        }).join('\n');

        return res;
    }
});
</script>
<template>
    <pre>{{ textInfo }}</pre>
</template>