import { horner, modf, pmod } from "astronomia/base";
import { solar, TYPE } from "astronomia/eclipse";
import { binaryRoot } from "astronomia/iterate";

const types = ['None', 'Partial', 'Annular', 'Annular Total', 'Penumbral', 'Umbral', 'Total'];
const { hypot, abs, PI, sin, cos, tan, atan, asin, acos, sqrt, floor} = Math;
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
    load(cy) {
        return new Promise((resolve, reject) => {
            if (cy != eclipseData.cy || !eclipseData.rows.length) {
                fetch(`data/bessel-data-c${cy}.json`).then(res => {
                    res.json().then(data => {
                        eclipseData.rows = data.map(row => {
                            const { X, Y, L1, L2, D, M, F } = row;
                            const [date, jdeMax, T0, deltaT] = row.info;
                            return { date, jdeMax, T0, deltaT, X, Y, L1, L2, D, M, F };
                        });
                        resolve(true);
                    });
                    eclipseData.cy = cy;
                }).catch(err => reject(err));
            } else {
                resolve(true);
            }
        });
    }
});
export const eclipseCentury = reactive({
    century: computed(() => eclipseData.cy),
    load(cy) {
        return eclipseData.load(cy);
    },
    rows: computed(() => eclipseData.rows),
});
eclipseCentury.load(20);

export const eclipseDecade = reactive({
    decade: computed({
        get() {
            return eclipseData.cy * 10 + eclipseData.dc;
        },
        set(value) {
            eclipseData.dc = value % 10;
            eclipseData.load(floor(value / 10));
        }
    }),
    load(value) {
        eclipseData.dc = value % 10;
        return eclipseData.load(floor(value / 10));
    },
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

    const flatten = atan(0.99664719 * tan(position.lat));
    const loc = {
        lon: -position.lon,
        lat: position.lat,
        rhoS: 0.99664719 * sin(flatten),
        rhoC: cos(flatten),
    }

    function calcElem(t) {
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

        let theta = mu + loc.lon - deltaT / 13713.44; // h
        let xi = loc.rhoC * sin(theta);
        let eta = loc.rhoS * cos(d) - loc.rhoC * sin(d) * cos(theta);
        let zeta = loc.rhoS * sin(d) + loc.rhoC * cos(d) * cos(theta);
        let u = x - xi;
        let v = y - eta;
        let dxi = dmu * loc.rhoC * cos(theta);
        let deta = dmu * xi * sin(d) - zeta * dd;
        let r = hypot(u, v);
        l1 = l1 - zeta * F[0];
        l2 = l2 - zeta * F[1];

        let a = dx - dxi;
        let b = dy - deta;
        let n = hypot(a,b);
        let n2 = n * n; // n2 = n*n

        let mag = (l1 - r) / (l1 + l2);
        let ratio = (l1 - l2) / (l1 + l2); // moon/sun

        let alt = asin(sin(d) * sin(loc.lat) + cos(d) * cos(loc.lat) * cos(theta));
        let visible = alt > -0.00524;
        return { x, y, d, mu, a, b, u, v, zeta, n, n2, l1, l2, theta, dmu, r, mag, ratio, alt, visible, t };
    }

    function searchMid() {
        let t = 0.0;
        let dt = 0.0;
        for (let it = 0; it < 50; it++) {
            const { u, a, v, b, n2 } = calcElem(t);
            dt = (u * a + v * b) / n2;
            t -= dt;
            if (abs(dt) < 0.00001) {
                return calcElem(t);
            }
        }
        return null;
    }

    function searchC1C4(sign, mid) {
        let t = mid.t;
        let dt = 0.0;
        for (let it = 0; it < 50; it++) {
            const { a, v, u, b, n, n2, l1 } = calcElem(t);
            let tmp = (a * v - u * b) / n / l1;
            if (abs(tmp) > 1) {
                return null;
            }
            tmp = sign * sqrt(1 - tmp * tmp) * l1 / n;

            dt = (u * a + v * b) / n2 - tmp;
            
            t -= dt;
            if (abs(dt) < 0.00001) {
                return calcElem(t);
            }
        }
        return null;
    }

    function searchC2C3(sign, mid) {
        let t = mid.t;
        if (mid.l2 < 0) {
            sign = -sign;
        }
        let dt = 0.0;
        for (let it = 0; it < 50; it++) {
            const { a, v, u, b, n2, l2 } = calcElem(t);
            if (l2 == 0) return null;
            let n = sqrt(n2);
            let tmp = (a * v - u * b) / n / l2;
            if (abs(tmp) > 1) return null;
            tmp = sign * sqrt(1 - tmp * tmp) * l2 / n;

            dt = (u * a + v * b) / n2 - tmp;
            t -= dt;
            if (abs(dt) < 0.00001) {
                return calcElem(t);
            }
        }
        return null;
    }

    /**
     * 
     * @param {number} rs -1 = rise, 1 = set
     */
    function riseSet(rs, elem) {
        let t = elem.t;
        let _acosH0;
        let _h0;
        let dt;
        for (let it = 0; it < 15; it++) {
            const { d, theta, dmu, alt } = calcElem(t);
            _acosH0 = (sin(-0.00524) - sin(loc.lat) * sin(d)) / (cos(loc.lat) * cos(d));
            if (_acosH0 > 1.0 || _acosH0 < -1.0) {
                return null;
            }
            _h0 = acos(_acosH0);
            dt = (rs * _h0 - theta) / dmu;
            while (dt >= 12.0) dt -= 24.0;
            while (dt <= -12.0) dt += 24.0;
            t += dt;
            if (abs(dt) < 0.00001) {
                return calcElem(t);
            }
        }
        return null;
    }

    let mid = searchMid(), C1, C2, C3, C4;
    let type = TYPE.None;
    let pattern = '';
    if (mid && mid.mag >= 0) {
        C1 = searchC1C4(-1, mid);
        C4 = searchC1C4(1, mid);
        type = TYPE.Partial;
        if (mid.r <= abs(mid.l2)) {
            C2 = searchC2C3(-1, mid);
            C3 = searchC2C3(1, mid);
            type = mid.l2 < 0 ? TYPE.Total : TYPE.Annular;
            pattern = [C1, C2, mid, C3, C4].map(elem => elem && elem.visible ? '1' : '0').join('');
            switch (pattern) {
                case '11111':
                    break;
                case '11110':
                    C4 = riseSet(1, C4);
                    C4.riset = 'S';
                    break;
                case '11100':
                    C3 = riseSet(1, C3);
                    C3.riset = 'S';
                    C4 = C3;
                    break;
                case '11000':
                    mid = riseSet(1, mid);
                    mid.riset = 'S';
                    C4 = C3 = mid;
                    break;
                case '10000':
                    C2 = riseSet(1, C2);
                    C2.riset = 'S';
                    C4 = C3 = mid = C2;
                    type = TYPE.Partial;
                    break;
                case '01111':
                    C1 = riseSet(-1, C1);
                    C1.riset = 'R';
                    break;
                case '00111':
                    C2 = riseSet(-1, C2);
                    C2.riset = 'R';
                    C1 = C2;
                    break;
                case '00011':
                    mid = riseSet(-1, mid);
                    mid.riset = 'R';
                    C1 = C2 = mid;
                    break;
                case '00001':
                    C3 = riseSet(-1, C3);
                    C3.riset = 'R';
                    C1 = C2 = mid = C3;
                    type = TYPE.Partial;
                    break;
                default:
                    type = TYPE.None;
                    break;
            }
        } else {
            pattern = [C1, mid, C4].map(elem => elem && elem.visible ? '1' : '0').join('');
            switch (pattern) {
                case '111':
                    break;
                case '110':
                    C4 = riseSet(1, C4);
                    C4.riset = 'S';
                    break;
                case '100':
                    mid = riseSet(1, mid);
                    mid.riset = 'S';
                    C4 = mid;
                    break;
                case '011':
                    C1 = riseSet(-1, C1);
                    C1.riset = 'R';
                    break;
                case '001':
                    mid = riseSet(-1, mid);
                    mid.riset = 'R';
                    C1 = mid;
                    break;
                default:
                    type = TYPE.None;
                    break;
            }
        }
    }
    const contacts = [C1, C2, mid, C3, C4].map(elem => {
        if (elem) {
            elem.dt = (JDE0 + elem.t / 24 - (deltaT - 0.5)/86400).toDate();
            if(elem.alt <= 0){
                elem.alt = 0.0;
            }
        }
        return elem;
    });
    let {mag, ratio} = mid || {};
    if(type == TYPE.Annular || type == TYPE.Total){
        mag = ratio;
    }
    return {
        date, jdeMax, T0, JDE0, deltaT, mag, ratio, pattern,
        type, sType: types[type],
        contacts,
    }
}

