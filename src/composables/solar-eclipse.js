import { horner, modf, pmod } from "astronomia/base";
import { solar, TYPE } from "astronomia/eclipse";
import { binaryRoot } from "astronomia/iterate";

const types = ['None', 'Partial', 'Annular', 'Annular Total', 'Penumbral', 'Umbral', 'Total'];
const { hypot, abs, PI, sin, cos, tan, atan } = Math;
const D2R = PI / 180;

export function eclipseInfo(row) {
    const { X, Y, L1, L2, D, M, F, date, jdeMax, T0, deltaT } = row;
    let y = 2000 + (jdeMax - 2451545.0) / 365.25;
    let e = solar(y);
    if (e.type) {
        const [i, f] = modf(jdeMax + 0.5);
        const tMax = pmod(f * 24 - T0 + 12, 24) - 12;
        const JDE0 = i + T0 / 24 - 0.5;

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
            X, Y, L1, L2, D, M, F, date, jdeMax, T0, deltaT,
            dt,
            timeMax: moment(dt).utc().format('HH:mm:ss'),
            tMax,
            JDE0,
            type: e.type,
            sType: types[e.type],
            magnitude: e.magnitude,
            distance,
            timeP,
            timeU,
        };
    }
    return {
        X, Y, L1, L2, D, M, F, date, jdeMax, T0, deltaT,
        type: e.type,
        sType: types[e.type],
    }
}

const eclipseData = reactive({
    cy: null,
    dc: null,
    rows: [],
});
export const eclipseCentury = reactive({
    century: computed({
        get() {
            return eclipseData.cy;
        },
        set(value) {
            if (value != eclipseData.cy || !eclipseData.rows.length) {
                fetch(`data/bessel-data-c${value}.json`).then(res => {
                    res.json().then(data => eclipseData.rows = data.map(row => {
                        const { X, Y, L1, L2, D, M, F } = row;
                        const [date, jdeMax, T0, deltaT] = row.info;
                        return { date, jdeMax, T0, deltaT, X, Y, L1, L2, D, M, F };
                    }));
                    eclipseData.cy = value;
                });
            }
        }
    }),
    rows: computed(() => eclipseData.rows),
});
eclipseCentury.century = 20;

export const eclipseDecade = reactive({
    decade: computed({
        get() {
            return eclipseData.cy * 10 + eclipseData.dc;
        },
        set(value) {
            eclipseData.dc = value % 10;
            eclipseCentury.century = Math.floor(value / 10);
        }
    }),
    rows: computed(() => {
        return eclipseData.rows.filter(row => row.date.charAt(2) == `${eclipseData.dc}`)
            .map(row => eclipseInfo(row));
    }),
});

export const solarEclipseMapSetting = reactive({
    texture: 'Earth1',
    type: 'globe',
    shadow: true,
    path: true,
    scale: 100,
    control: true,
    lineWidth: 1.0,
});

export function search(data, position) {
    const { date, jdeMax, T0, deltaT, X, Y, L1, L2, F } = data;
    const [i, f] = modf(jdeMax + 0.5);
    const tMax = pmod(f * 24 - T0 + 12, 24) - 12;
    const JDE0 = i + T0 / 24 - 0.5;

    const D = data.D.map(v => v * D2R);
    const M = data.M.map(v => v * D2R);
    const DX = X.map((v, i) => i * v).slice(1);
    const DY = Y.map((v, i) => i * v).slice(1);
    const DM = M.map((v, i) => i * v).slice(1);
    const DD = D.map((v, i) => i * v).slice(1);

    let _tmp = atan(0.99664719 * tan(position.lat));
    const loc = {
        lon: -position.lon,
        lat: position.lat,
        rhoS: 0.99664719 * sin(_tmp),
        rhoC: cos(_tmp),
    }

    function calcElem(t) {
        const result = {};
        let x = horner(t, X);
        let y = horner(t, Y);
        let d = horner(t, D);
        let mu = horner(t, M);
        let dx = horner(t, DX);
        let dy = horner(t, DY);
        let dd = horner(t, DD);
        let dmu = horner(t, DM);
        let l1 = horner(t, L1);
        let l2 = horner(t, L2);

        let theta = mu + loc.lon;
        let xi = loc.rhoC * sin(theta);
        let eta = loc.rhoS * cos(d) - loc.rhoC * sin(d) * cos(theta);
        let zeta = loc.rhoS * sin(d) + loc.rhoC * cos(d) * cos(theta);
        let u = x - xi;
        let v = y - eta;
        let dxi = dmu * loc.rhoC * cos(theta);
        let deta = dmu * xi * sin(d) - zeta * dd;

        let a = dx - dxi;
        let b = dy - deta;
        let n2 = a * a + b * b;

        result.d = d;
        result.a = a;
        result.b = b;
        result.u = u;
        result.v = v;
        result.zeta = zeta;
        result.n2 = n2;
        result.l1 = l1 - zeta * F[0];
        result.l2 = l2 - zeta * F[1];
        result.theta = theta;
        result.dmu = dmu;
        return result;
    }

    // search time    
    let t = 0.0;
    let dt = 0.0;
    let elem;
    let found = false;
    for(let it=0; it < 15; it++){
        elem = calcElem(t);
        dt = (elem.u*elem.a + elem.v*elem.b) / elem.n2;
        t -= dt;
        if(dt > -0.00001 && dt < 0.00001){
            found = true;
            break;
        }
    }
    if(!found || elem.zeta < 0){
        return false;
    }
    let m = hypot(elem.u, elem.v); // distance from umbra center
    const mid = t;
    const result = {
        date, jdeMax, deltaT,
        middle: JDE0 + t/24,
    };
    if(elem.l2 > 0 && m <= elem.l2){ // annular
        result.type = TYPE.Annular;
    } else if(elem.l2 <= 0 && m <= -elem.l2){ // total
        result.type = TYPE.Total;
    } else if(m <= elem.l1){ // total
        result.type = TYPE.Partial;
    } else {
        return false; // no eclipse
    }
    result.sType = types[result.type];

    // search P1, P2
    [1, 2].forEach(x => {
        const func = t => {
            let elem = calcElem(t);
            return hypot(elem.u, elem.v) - elem.l1;
        };
        let res = x == 1 ? binaryRoot(func, -5, mid) : binaryRoot(func, mid, 5);
        result[`P${x}`] = JDE0 + res / 24;
    });

    if(result.type == TYPE.Annular || result.type == TYPE.Total){
        [1, 2].map(x => {
            const func = t => {
                let elem = calcElem(t);
                return hypot(elem.u, elem.v) - (result.type == TYPE.Annular ? elem.l2 : -elem.l2);
            };
            let res = x == 1 ? binaryRoot(func, -5, mid) : binaryRoot(func, mid, 5);
            result[`U${x}`] = JDE0 + res / 24;
        });
    }
    return result;
}

