import { Planet } from 'astronomia/planetposition';
import { trueVSOP87 } from 'astronomia/solar';
import { horner, pmod, sincos } from 'astronomia/base';
import { saemundsson } from 'astronomia/refraction';
import elp from 'astronomia/elp';

import { deltaTJD, GST, obliquity, sep } from './horizon';

import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import elpMppDe from 'astronomia/data/elpMppDe';
import { lagrangePoly } from 'astronomia/interpolation';

const { cos, sin, tan, atan, atan2, asin, acos, abs, floor, hypot, sqrt, PI } = Math;
const AU = 149597870;
const PI_2 = 2 * PI;

const CosSmallAngle = cos(10 * PI / 180 / 60);

const EARTH_RADIUS = 6378.137; // km
const SUN_RADIUS = 695991.75; // km
const MOON_RADIUS = 1737.928; // km
const ERR = 1e-6;

const earth = new Planet(vsop87Bearth);
const elpMoon = new elp.Moon(elpMppDe);

export function solarPos(jde) {
    const pos = trueVSOP87(earth, jde);
    pos.lon -= 20.4898 / 3600 * Math.PI / 180 / pos.range; // aberration
    pos.range *= AU;
    return pos;
}

export function moonPos(jde) {
    return elpMoon.position(jde);
}

/**
 * 
 * @param {Object} param0 
 * @param {Number} ε 
 * @returns {Object}
 */
function toEquatorial({ lat, lon, range }, ε) {
    const [εsin, εcos] = sincos(ε);
    const [sβ, cβ] = sincos(lat);
    const [sλ, cλ] = sincos(lon);
    let ra = atan2(sλ * εcos - (sβ / cβ) * εsin, cλ); // (13.3) p. 93
    if (ra < 0) {
        ra += 2 * PI;
    }
    const dec = asin(sβ * εcos + cβ * εsin * sλ); // (13.4) p. 93
    return { ra, dec, range };
}

/**
 * 
 * @param {Object} param0 
 * @param {Object} param1 
 * @param {Number} gst 
 * @returns {Object}
 */
function toHorizontal({ ra, dec }, { lat, lon }, gst) {
    const H = gst - ra - lon;
    const [sH, cH] = sincos(H);
    const [sφ, cφ] = sincos(lat);
    const [sδ, cδ] = sincos(dec);
    const az = atan2(sH, cH * sφ - (sδ / cδ) * cφ); // (13.5) p. 93
    const alt = asin(sφ * sδ + cφ * cδ * cH); // (13.6) p. 93
    return { alt, az };
}

function horizontalSep(c1, c2) {
    const [sind1, cosd1] = sincos(c1.alt);
    const [sind2, cosd2] = sincos(c2.alt);
    const cd = sind1 * sind2 + cosd1 * cosd2 * cos(c1.az - c2.az); // (17.1) p. 109
    if (cd < CosSmallAngle) {
        return acos(cd);
    } else {
        const cosd = cos((c2.alt + c1.alt) / 2); // average dec of two bodies
        return hypot((c2.az - c1.az) * cosd, c2.alt - c1.alt); // (17.2) p. 109
    }
}

class TPosition {
    isSolar = false;
    RADIUS = null;

    constructor(radius) {
        this.RADIUS = radius;
    }

    position(jde, loc) {
        let deltaT = deltaTJD(jde);
        let { lon, lat, range } = this.LBR(jde);
        let [ε, Δψ] = obliquity(jde);
        lon += Δψ;
        let { ra, dec } = toEquatorial({ lon, lat }, ε);
        let gst = GST(jde);
        let gha = gst - ra;

        lon = pmod(lon, 2 * PI);
        ra = pmod(ra, 2 * PI);
        gha = pmod(gha, 2 * PI);

        const result = {
            lon, lat, range, ra, dec, gha, gst, ε, deltaT,
            hp: asin(EARTH_RADIUS / range),
            sd: asin(this.RADIUS / range),
        };
        if (loc) {
            result.lha = result.gha - loc.lon;
            let { alt, az } = toHorizontal({ ra, dec }, loc, gst);
            let altT = alt - result.hp * cos(alt); // topocentric altitude
            result.altitudes = {
                g: alt, // geocentric
                t: altT, // topocentric
                a: altT + saemundsson(altT), // apparent (refraction)
                au: altT + saemundsson(altT) + (result.sd || 0), // apparent upper
                al: altT + saemundsson(altT) - (result.sd || 0), // apparent lower
            };
            result.alt = alt;
            result.az = az;
        }
        if (!this.isSolar) {
            const sun = solarLite.LBR(jde);
            let elongation = sep(sun, { lat, lon });
            result.phase = pmod(lon - sun.lon, PI_2);
            result.elongation = elongation;
            result.elongations = {
                g: elongation,
            }
            if (loc) {
                const sunEq = solarLite.Equator(jde);
                const sunHz = toHorizontal(sunEq, loc, gst);
                sunHz.alt -= asin(EARTH_RADIUS / sun.range) * cos(sunHz.alt);
                result.elongations.t = horizontalSep(sunHz, { alt: result.altitudes.t, az: result.az }); // topocentric elongation
            }

            const [sψ, cψ] = sincos(elongation);
            let pa = atan(sun.range * sψ / (range - sun.range * cψ));
            if (pa < 0) {
                pa += PI;
            }
            result.fraction = (1 + cos(pa)) / 2;
        }
        return result;
    }

    Equator(jde) {
        let { lon, lat, range } = this.LBR(jde);
        let [ε, Δψ] = obliquity(jde);
        lon += Δψ;
        let { ra, dec } = toEquatorial({ lon, lat }, ε);
        return { ra, dec, range };
    }

    rise(JDE, loc, alt, sign = 1) {
        let t = 0, Δt, lha, H0;
        for (let ix = 0; ix < 15; ix++) {
            let { ra, dec } = this.Equator(JDE + t);
            lha = pmod(GST(JDE + t) - loc.lon - ra + PI, PI_2) - PI;
            const cosH = (sin(alt) - sin(loc.lat) * sin(dec)) / (cos(loc.lat) * cos(dec));
            if (cosH > 1 || cosH < -1) return false;
            H0 = sign * acos(cosH);
            Δt = (H0 - lha) / PI_2;
            if (abs(Δt) < 0.0001) {
                return JDE + t;
            }
            t = pmod(t + Δt, 1);
        }
        return false;
    }

    noon(JDE, loc, sign = 1) {
        const H0 = sign > 0 ? 0 : PI;
        let t = 0, Δt, lha;
        for (let ix = 0; ix < 15; ix++) {
            let { ra } = this.Equator(JDE + t);
            lha = pmod(GST(JDE + t) - ra - loc.lon + PI, PI_2) - PI;
            Δt = (H0 - lha) / PI_2;
            if (abs(Δt) < 0.0001) {
                return JDE + t;
            }
            t = pmod(t + Δt, 1);
        }
    }
}

class Solar extends TPosition {
    constructor() {
        super(SUN_RADIUS);
        this.isSolar = true;
    }
    LBR(jde) {
        return solarPos(jde);
    }
}

class Moon extends TPosition {
    constructor() {
        super(SUN_RADIUS);
    }
    LBR(jde) {
        return moonPos(jde);
    }
}

const [POLY_BEGIN, POLY_END, POLY_SIZE] = [0, 2, 4];
class TPolynomial {
    constructor(func, T0) {
        this.func = func;
        this.T0 = floor(T0);
        const L = [], B = [], R = [], Ra = [], Dec = [];
        const prev = { lon: 0, ra: 0, ha: 0 };
        let [ε, Δψ] = obliquity(T0);
        for (let i = 0; i <= POLY_SIZE; i++) {
            let x = i / POLY_SIZE * (POLY_END - POLY_BEGIN) + POLY_BEGIN;
            let jde = this.T0 + x;
            let { lon, lat, range } = func(jde);;
            while (lon < prev.lon) lon += 2 * PI;
            prev.lon = lon;

            let { ra, dec } = toEquatorial({ lon: lon + Δψ, lat }, ε);
            while (ra < prev.ra) ra += 2 * PI;
            prev.ra = ra;

            L.push([x, lon]);
            B.push([x, lat]);
            R.push([x, range]);
            Ra.push([x, ra]);
            Dec.push([x, dec]);
        }
        this.SERIES = {
            L: lagrangePoly(L),
            B: lagrangePoly(B),
            R: lagrangePoly(R),
            Ra: lagrangePoly(Ra),
            Dec: lagrangePoly(Dec),
        }
        const GX = [GST(T0), 1.00273790935 * PI * 2];
        const GHA = this.SERIES.Ra.map((v, ix) => (GX[ix] || 0) - v);
        GHA[0] = pmod(GHA[0], 2 * PI);
        this.SERIES.GHA = GHA;
    }

    LBR(jde) {
        let x = jde - this.T0;
        const { L, B, R } = this.SERIES;
        return {
            lon: pmod(horner(x, L), 2 * PI),
            lat: horner(x, B),
            range: horner(x, R),
        }
    }

    Equator(jde) {
        let x = jde - this.T0;
        const { Ra, Dec, R, GHA } = this.SERIES;
        return {
            ra: pmod(horner(x, Ra), 2 * PI),
            dec: horner(x, Dec),
            range: horner(x, R),
            gha: pmod(horner(x, GHA), 2 * PI),
        }
    }

    Test() {
        let err1 = 0, err2 = 0;
        const { L } = this.SERIES;
        const func = this.func;
        const T0 = this.T0;
        for (let x = POLY_BEGIN; x < POLY_END; x += (POLY_END - POLY_BEGIN) / 100) {
            let l1 = pmod(horner(x, L), PI_2);
            let l2 = func(T0 + x).lon;
            let e = l1 - l2;
            if (e < err1) err1 = e;
            if (e > err2) err2 = e;
        }
        console.log({ name: func.name, T0, err1: err1 * 180 / PI * 3600, err2: err2 * 180 / PI * 3600 });
    }
}

class TLitePosition extends TPosition {
    POLYNOMIALS = [];
    poly = null;

    constructor(func, radius) {
        super(radius);
        this.func = func;
    }

    /**
     * 
     * @param {number} JDE 
     * @returns {TPolynomial}
     */
    getPolynomial(JDE) {
        const T0 = floor(JDE);
        if (this.poly && T0 == this.poly.T0) {
            return this.poly;
        }
        let poly = this.POLYNOMIALS.find(v => v.T0 == T0);
        if (!poly) {
            poly = new TPolynomial(this.func, T0);
            if (this.POLYNOMIALS.length > 100) {
                this.POLYNOMIALS.splice(0, 1);
            }
            this.POLYNOMIALS.push(poly);
        }
        this.poly = poly;
        return poly;
    }
    LBR(jde) {
        let poly = this.getPolynomial(jde);
        return poly.LBR(jde);
    }
    Equator(jde) {
        let poly = this.getPolynomial(jde);
        return poly.Equator(jde);
    }

    /**
     * 
     * @param {number} JDE 
     * @returns {Object}
     */
    series(JDE) {
        let poly = this.getPolynomial(JDE);
        return poly.SERIES;
    }
}

class SolarLite extends TLitePosition {
    constructor() {
        super(solarPos, SUN_RADIUS);
        this.isSolar = true;
    }
}

class MoonLite extends TLitePosition {
    constructor() {
        super(moonPos, MOON_RADIUS);
    }
}

export const solar = new Solar();
export const moon = new Moon();
export const solarLite = new SolarLite();
export const moonLite = new MoonLite();