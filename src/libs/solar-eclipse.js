import { horner, modf } from "astronomia/base";
import { solar } from "astronomia/eclipse";
import { binaryRoot } from "astronomia/iterate";

const types = ['None', 'Partial', 'Annular', 'Annular Total', 'Penumbral', 'Umbral', 'Total'];
const { hypot, abs } = Math;

export function eclipseInfo(row) {
    let y = 2000 + (row.info[1] - 2451545.0) / 365.25;
    let e = solar(y);
    if (e.type) {
        const { X, Y, L1, L2 } = row;
        const [date, jdeMax, T0, deltaT] = row.info;
        const [i, f] = modf(jdeMax + 0.5);
        const tMax = f * 24 - T0;
        const JDE0 = i + T0/24 - 0.5;

        let distance = hypot(horner(tMax, X), horner(tMax, Y));
        const [rP, rU] = [horner(tMax, L1), abs(horner(tMax, L2))];
        const isP2 = distance + rP < 1;
        const isU1 = distance - rU < 1;
        const isU2 = distance + rU < 1;
        const sign = [1, -1, -1, 1];
        const timeP = [true, isP2, isP2, true].map((valid, ix) => {
            if (!valid) {
                return null;
            }
            const func = t => hypot(horner(t, X), horner(t, Y)) - sign[ix] * horner(t, L1) - 1;
            return ix < 2 ? binaryRoot(func, -5, tMax) : binaryRoot(func, tMax, 5);
        });
        const timeU = [isU1, isU2, isU2, isU1].map((valid, ix) => {
            if (!valid) {
                return null;
            }
            const func = t => hypot(horner(t, X), horner(t, Y)) - sign[ix] * abs(horner(t, L2)) - 1;
            return ix < 2 ? binaryRoot(func, -5, tMax) : binaryRoot(func, tMax, 5);
        });
        const dt = jdeMax.toDate();
        return {
            ...row,
            date,
            dt,
            timeMax: moment(dt).utc().format('HH:mm:ss'),
            T0,
            JDE0,
            deltaT,
            type: e.type,
            sType: types[e.type],
            magnitude: e.magnitude,
            distance,
            timeP,
            timeU,
        };
    }
    return {
        ...row,
        type: e.type,
        sType: types[e.type],
    }
}

export function eclipseContact(row) {
    const { X, Y, L1, L2 } = row;
    const [, jdeMax, T0,] = row.info;
    const [i, f] = modf(jdeMax + 0.5);
    const tMax = f * 24 - T0;

    let distance = hypot(horner(tMax, X), horner(tMax, Y));
    const [rP, rU] = [horner(tMax, L1), horner(tMax, L2)];
    const isP2 = distance + rP < 1;
    const isU1 = distance - rU < 1;
    const isU2 = distance + rU < 1;
    const sign = [-1, 1, 1, -1];
    const timeP = [true, isP2, isP2, true].map((valid, ix) => {
        if (!valid) {
            return null;
        }
        const func = t => hypot(horner(t, X), horner(t, Y)) + sign[ix] * horner(t, L1) - 1;
        return ix < 2 ? binaryRoot(func, -5, tMax) : binaryRoot(func, tMax, 5);
    });
    const timeU = [isU1, isU2, isU2, isU1].map((valid, ix) => {
        if (!valid) {
            return null;
        }
        const func = t => hypot(horner(t, X), horner(t, Y)) + sign[ix] * horner(t, L2) - 1;
        return ix < 2 ? binaryRoot(func, -5, tMax) : binaryRoot(func, tMax, 5);
    });
    return {
        ...row,
        timeP,
        timeU,
        distance,
    }
}

export const eclipseDecade = reactive({
    _cy: null,
    _dc: null,
    _rows: [],
    decade: computed({
        get() {
            return eclipseDecade._cy * 10 + eclipseDecade._dc;
        },
        set(value) {
            eclipseDecade._dc = value % 10;
            let cy = Math.floor(value / 10);
            if (cy != eclipseDecade._cy || !eclipseDecade._rows.length) {
                fetch(`data/bessel-data-c${cy}.json`).then(res => {
                    res.json().then(data => eclipseDecade._rows = data);
                    eclipseDecade._cy = cy;
                });
            }
        }
    }),
    rows: computed(() => {
        return eclipseDecade._rows.filter(row => row.info[0].charAt(2) == `${eclipseDecade._dc}`)
            .map(row => eclipseInfo(row));
    }),
});