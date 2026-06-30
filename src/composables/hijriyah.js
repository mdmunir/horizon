import { newMoon, first, full, last } from 'astronomia/moonphase';
import { deltaT } from './horizon';
import { moonLite, solarLite } from './position';
import { limb, pmod, sincos } from 'astronomia/base';
import { binaryRoot } from 'astronomia/iterate';

const { PI, abs, atan, cos, floor, acos, sin, asin } = Math;
const EARTH_RADIUS = 6378.137; // km
const SUN_RADIUS = 695991.75; // km
const MOON_RADIUS = 1737.928; // km
const D2R = PI / 180;
const PI_2 = 2 * PI;
const ERR = 1e-6;

const _MONTHS = [
    'Muharram',
    'Shafar',
    'Rabiul Awal',
    'Rabiul Akhir',
    'Jumadil Awal',
    'Jumadil Akhir',
    'Rajab',
    "Sya'ban",
    'Ramadhan',
    'Syawal',
    "Dzulqa'dah",
    'Dzulhijah',
];

export const MONTHS = _MONTHS.map((v, i) => {
    return { id: i + 1, name: v };
});

export function currentMonth() {
    let jd = (new Date).toJD();
    let year = (jd - 2451545.0) / 365.25 + 2000;
    let nm = newMoon(year);
    let k = floor((nm - 2451545.0) / 29.53066257024) + 17050 - 1;
    let d = floor(jd - nm + 1);
    if (nm > jd - 0.5) {
        k--;
        d = 30;
    }
    let y = floor(k / 12);
    let m = k % 12;
    return [y, m + 1, d];
}

export class THilal {
    /**
     * 
     * @param {Number} y Hijriyah year
     * @param {Number} m Hijriyah month
     */
    constructor(y, m) {
        let k = floor(12 * y + m - 17050);
        let data = THilal.Caches.find(v => v.k == k);
        if (!data) {
            const year = k / 12.3685 + 2000; // solar year
            const DT = deltaT(year);
            const meeus = newMoon(year);
            const T0 = floor(meeus + 0.5);
            data = {
                k, y, m, year: floor(year), T0,
                deltaT: DT,
                meeus,
            };

            const funcEcl = jde => pmod(moonLite.LBR(jde).lon - solarLite.LBR(jde).lon + PI, 2 * PI) - PI;
            const funcEqu = jde => pmod(moonLite.Equator(jde).ra - solarLite.Equator(jde).ra + PI, 2 * PI) - PI;
            const conjunctions = [meeus,
                binaryRoot(funcEcl, meeus - 0.5, meeus + 0.5),
                binaryRoot(funcEqu, meeus - 0.5, meeus + 0.5)
            ];
            const NAMES = ['Meeus', 'Ecliptic', 'Equator'];
            data.conjunctions = conjunctions.map((v, ix) => ({ name: NAMES[ix], jd: v - DT / 86400, date: (v - DT / 86400).toDate() }));

            if (THilal.Caches.length > 60) {
                THilal.Caches.splice(0, 1);
            }
            THilal.Caches.push(data);
        }
        Object.assign(this, data);
    }

    calc(loc, day = 0) {
        const { deltaT, T0 } = this;
        let H0 = -50 / 60 * D2R;
        let jd = T0 - 0.5 + loc.lon/PI_2 + day;
        let sunSet = solarLite.rise(jd, loc, H0, 1);
        if (sunSet === false) {
            return { sunSet };
        }
        const sunPos = solarLite.position(sunSet, loc);
        const moonPos = moonLite.position(sunSet, loc);
        H0 = -34 / 60 * D2R + moonPos.hp - moonPos.sd;
        let moonSet = moonLite.rise(sunSet - 1 / 24, loc, H0, 1);
        const result = {
            sunSet, sunPos, moonSet, moonPos,
            age: sunSet - this.meeus,
            duration: moonSet === false ? null : moonSet - sunSet,
            limb: limb(moonPos, sunPos),
            alt: moonPos.alt,
            az: moonPos.az,
            altitudes: moonPos.altitudes,
            elongation: moonPos.elongation,
            elongations: moonPos.elongations,
            sunSetDate: (sunSet - deltaT / 86400).toDate(),
            moonSetDate: moonSet === false ? null : (moonSet - deltaT / 86400).toDate(),
        };

        const [sψ, cψ] = sincos(result.elongation);
        let i = atan(sunPos.range * sψ / (moonPos.range - sunPos.range * cψ));
        if (i < 0) {
            i += PI;
        }
        result.fraction = (1 + cos(i)) / 2;
        result.phase = pmod(moonPos.lon - sunPos.lon, 2 * PI);

        return result;
    }

    fragment(day = 0){
        const T0 = this.T0 - 0.5;
        const SUN = [0, 1, 2].map(v => {
            const {GHA, Dec, R} = solarLite.getPolynomial(T0 + v + day).SERIES;
            return {GHA, Dec, R};
        });
        const MOON = [0, 1, 2].map(v => {
            const {GHA, Dec, R} = moonLite.getPolynomial(T0 + v + day).SERIES;
            return {GHA, Dec, R};
        });
        return {
            SUN, MOON,
        };
    }
}
THilal.Caches = [];

export class Criteria {
    constructor(alt, elongation, age, method_alt, method_elongation) {
        if (typeof alt === 'object') {
            age = alt.age;
            elongation = alt.elongation;
            method_alt = alt.method_alt;
            method_elongation = alt.method_elongation;
            alt = alt.alt;
        }
        this.alt = (alt || 0) * D2R;
        this.elongation = (elongation || 0) * D2R;
        this.age = (age || 0) / 24.0;
        this.method_elongation = method_elongation || 'g';
        this.method_alt = method_alt || 'a';
    }

    test(info) {
        let valid = info.alt >= this.alt && info.elongation >= this.elongation;
        return valid || (this.age > 0 && info.age > this.age);
    }
}

export class Hijriyah {
    constructor(criteria) {
        this.criteria = criteria || new Criteria();
    }

    calcCurrent(g) {
        let [y, m] = currentMonth();
        let k = 12 * y + m;
        const rows = this.calc(g, k - 1, k);
        return {
            ...rows[1],
            prevCount: rows[0].count,
        }
    }

    calcMonth(g, y, m) {
        let [y_, m_] = currentMonth();
        let k = 12 * (y || y_) + (m || m_);
        const rows = this.calc(g, k - 1, k);
        return {
            ...rows[1],
            prevCount: rows[0].count,
        }
    }

    /**
     * 
     * @param {Object} g geograpic coordinat
     * @param {*} k1 lunation = 12*y1 + m1
     * @param {*} k2  lunation = 12*y2 + m2
     */
    calc(g, k1, k2) {
        if (!k2 || k2 <= k1) {
            k2 = k1 + 1;
        } else {
            k2++;
        }
        const criteria = this.criteria;
        const method = {
            alt: criteria.method_alt || 'a',
            elongation: criteria.method_elongation || 'g',
        };
        let hilal, info, result = new Array(k2 - k1), lastNewMoonJD;
        let y = floor((k2 - 1) / 12);
        let m = (k2 - 1) % 12 + 1;
        hilal = Hilal.create(y, m);
        info = hilal.calc(g, 0, method);
        lastNewMoonJD = info.sunSet;
        if (!criteria.test(info)) {
            lastNewMoonJD += 1;
        }

        for (let k = k2 - 1; k >= k1; k--) {
            y = floor((k - 1) / 12);
            m = (k - 1) % 12 + 1;
            hilal = new Hilal(y, m);
            info = hilal.calc(g, 0, method);

            let newMoonJD = info.sunSet;
            if (!criteria.test(info)) {
                newMoonJD += 1;
            }
            let days = floor(lastNewMoonJD - newMoonJD + 0.5);
            lastNewMoonJD = newMoonJD;
            result[k - k1] = {
                year: y, month: m,
                jd: newMoonJD,
                count: days,
                sunSet: info.sunSet,
                moonSet: info.moonSet,
                alt: info.alt,
                elongation: info.elongation,
                age: info.age,
                conjunction: hilal.conjunction,
            }
        }
        return result;
    }
}

const DEFAULT_LEAP_YEAR = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
export class Arithmetic {
    constructor(correction = 0) {
        this.JD0 = 1948438 + (correction || 0);
        let years = [], c = 0;
        for (let i = 0; i < 30; i++) {
            years[i] = { day: c, isLeap: (DEFAULT_LEAP_YEAR.indexOf(i + 1) >= 0) };
            c += (years[i].isLeap ? 355 : 354);
        }
        this.years = years;
    }

    toJD(y, m = 1, d = 1) {
        let y30 = floor((y - 1) / 30);
        let jd = y30 * 10631;
        y = y - y30 * 30;
        jd += this.years[y - 1].day;
        return this.JD0 + jd + 30 * (m - 1) - (floor((m - 1) / 2)) + d;
    }

    fromJD(jd) {
        let day = floor(jd) - this.JD0;
        if (day < 0) {
            return false;
        }
        let y = floor((day - 1) / 10631) * 30;
        day -= (y / 30) * 10631;
        let i;
        for (i = 1; i < 30; i++) {
            if (day < this.years[i].day) {
                y += i;
                day -= this.years[i - 1].day;
                break;
            }
        }
        let m = floor((day - 1) / 59) * 2;
        day = day - (m * 29.5);
        if (day > 30) {
            day -= 30;
            m++;
        }
        return [y, m + 1, day]
    }

    calc(k1, k2) {
        let k, result = [];
        if (!k2 || k2 < k1) {
            k2 = k1;
        }
        for (k = k1; k <= k2; k++) {
            let y = floor((k - 1) / 12)
            let m = (k - 1) % 12 + 1
            let jd = this.toJD(y, m, 1)
            let count = 29 + m % 2
            let y30 = (y - 1) % 30
            if (this.years[y30].isLeap && m == 12) {
                count = 30
            }
            result.push({
                y, m, jd, days: count,
                jd0: floor(jd),
            })
        }
        return result
    }
}

export function moonPhases(year) {
    year = Math.floor(year);
    let K = (year - 2000) * 12.3685 - 1;
    let Y = K / 12.3685 + 2000;
    const result = [];
    for (; Y <= year + 1; Y += 1 / 12.3685) {
        let DT = deltaT(Y);
        let jdeNm = newMoon(Y);
        let nm = (jdeNm - DT / 86400).toDate();
        if (nm.getFullYear() == year) {
            let k = floor((jdeNm - 2451544.0) / 29.53066257024) + 17050 - 1;
            let y = floor(k / 12);
            let m = k % 12;
            const phases = [jdeNm, first(Y + 0.25 / 12.3685), full(Y + 0.5 / 12.3685), last(Y + 0.75 / 12.3685)];
            const row = {
                y, m: m + 1,
                name: `${_MONTHS[m]} ${y}`,
                deltaT: DT,
                phases: phases.map(jde => (jde - DT / 86400).toDate()),
            }
            result.push(row);
        }
    }
    return result;
}
