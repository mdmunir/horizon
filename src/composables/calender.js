import { now, deltaT as deltaTFunc, GST, D2R } from "./horison";
import { newMoon } from "astronomia/moonphase";
import { Moon, Solar } from "./position";
import { pmod, horner, CosSmallAngle, sincos } from "astronomia/base";
import { lagrangePoly } from "astronomia/interpolation";
import { eSmart } from "astronomia/eqtime";

const { cos, sin, tan, atan, atan2, asin, acos, abs, floor, hypot, sqrt, PI } = Math;
const PI_2 = 2 * PI;
const EARTH_RADIUS = 6378.137; // km
const ERR = 1e-6;

const current = now();
const solar = new Solar();
const moon = new Moon();

/**
 * 
 * @param {Number} gha 
 * @param {Number} dec 
 * @param {Object} param2 `{}`
 * @returns 
 */
function toHorizontal(gha, dec, { lat, lon }) {
    const H = gha - lon;
    const [sH, cH] = sincos(H);
    const [sφ, cφ] = sincos(lat);
    const [sδ, cδ] = sincos(dec);
    const az = atan2(sH, cH * sφ - (sδ / cδ) * cφ); // (13.5) p. 93
    const alt = asin(sφ * sδ + cφ * cδ * cH); // (13.6) p. 93
    return { alt, az };
}

function horizontalSep(c1, c2) {
    const [sind1, cosd1] = sincos(c1.alt)
    const [sind2, cosd2] = sincos(c2.alt)
    const cd = sind1 * sind2 + cosd1 * cosd2 * cos(c1.az - c2.az) // (17.1) p. 109
    if (cd < CosSmallAngle) {
        return acos(cd)
    } else {
        const cosd = cos((c2.alt + c1.alt) / 2) // average dec of two bodies
        return hypot((c2.az - c1.az) * cosd, c2.alt - c1.alt) // (17.2) p. 109
    }
}

/**
 * 
 * @param {Number} h 
 * @returns {Number}
 */
function refraction(h) { // (h float64)  float64
    // (16.4) p. 106
    const c102 = 1.02 * D2R / 60;
    const c103 = 10.3 * D2R * D2R;
    const c511 = 5.11 * D2R;
    return c102 / tan(h + c103 / (h + c511));
}

class TFragment {
    /**
     * 
     * @param {Number} JD0 
     */
    constructor(JD0) {
        const ORDE = 3, BEGIN = -13 / 24, END = 24 / 24;

        this.JD0 = JD0;
        const SHa = [], SDec = [], MHa = [], MDec = [],
            Gst = GST(JD0),
            prev = { sha: 0, mha: 0, };
        for (let i = 0; i <= ORDE; i++) {
            let x = (i / ORDE) * (END - BEGIN) + BEGIN,
                jd = JD0 + x,
                gst = Gst + x * 1.00273790935 * PI_2,
                sunPos = solar.position(jd),
                moonPos = moon.position(jd);
            SDec.push([x, sunPos.dec]);
            MDec.push([x, moonPos.dec]);
            let sha = pmod(gst - sunPos.ra, PI_2), mha = pmod(gst - moonPos.ra, PI_2);
            while (sha < prev.sha) {
                sha += PI_2;
            }
            prev.sha = sha;
            while (mha < prev.mha) {
                mha += PI_2;
            }
            prev.mha = mha;
            SHa.push([x, sha]);
            MHa.push([x, mha]);
        }
        this.SHa = lagrangePoly(SHa);
        this.MHa = lagrangePoly(MHa);
        this.SDec = lagrangePoly(SDec);
        this.MDec = lagrangePoly(MDec);
        this.EqTime = eSmart(JD0) / PI_2;
        this.hp = asin(EARTH_RADIUS / moon.position(JD0).range);
    }

    calc(loc) {
        const alt = -50 / 60 * D2R;
        let t = loc.lon / PI_2 - this.EqTime;
        let sDec = horner(t, this.SDec);
        let cosHa = (alt - sin(loc.lat) * sin(sDec)) / (cos(loc.lat) * cos(sDec));
        if (cosHa > 1 || cosHa < -1) {
            return false;
        }
        let H0 = acos(cosHa);
        t += H0 / PI_2;

        sDec = horner(t, this.SDec);
        let sHa = horner(t, this.SHa);
        let mHa = horner(t, this.MHa);
        let mDec = horner(t, this.MDec);

        const sunPos = toHorizontal(sHa, sDec, loc);
        const moonPos = toHorizontal(mHa, mDec, loc);
        moonPos.alt -= this.hp * cos(moonPos.alt);
        const result = {
            sunset: this.JD0 + t,
            sunAlt: sunPos.alt,
            sunAz: sunPos.az,
            moonAlt: moonPos.alt,
            moonAz: moonPos.az,
            elongation: horizontalSep(sunPos, moonPos),
            altitude: moonPos.alt + refraction(moonPos.alt),
        };
        return result;
    }
}

class THilal {
    fragments = {};
    /**
     * 
     * @param {Number} k
     */
    constructor(k) {
        this.k = k;

        this.y = this.k / 12.3685 + 621.498;
        this.deltaT = deltaTFunc(this.y);

        let jd = newMoon(this.y) - this.deltaT / 86400;
        this.conjunctionMeeus = jd;
        this.T0 = floor(jd) + 0.5;
        this.gst = GST(this.T0);
        this.conjunction = this._calcConjunction(jd, 'lon');
        this.conjunctionEq = this._calcConjunction(jd, 'ra');
    }

    /**
     * 
     * @param {Number} jd0 
     * @param {String} key 
     * @returns {Number}
     */
    _calcConjunction(jd0, key) {
        const DELTA = 29.5 / PI_2;
        let jd = jd0;
        for (let i = 0; i < 20; i++) {
            let sunPos = solar.position(jd), moonPos = moon.position(jd),
                dt = (pmod(moonPos[key] - sunPos[key], PI_2) - PI) * DELTA;
            jd -= dt;
            if (abs(dt) < ERR) {
                break;
            }
        }
        return jd;
    }

    /**
     * 
     * @param {Number} day 
     * @returns {TFragment}
     */
    fragment(day = 0) {
        if (!this.fragments[day]) {
            this.fragments[day] = new TFragment(this.T0 + day);
        }
        return this.fragments[day];
    }

    /**
     * 
     * @param {Object} loc 
     * @param {Number} day 
     */
    calc(loc, day = 0) {
        const fragment = this.fragment(day);
        return fragment.calc(loc);
    }

}

const hilalCaches = {};
/**
 * 
 * @param {Number} y 
 * @param {Number} m 
 * @returns {THilal}
 */
export function Hilal(y, m) {
    const k = 12 * y + m;
    if (!hilalCaches[k]) {
        hilalCaches[k] = new THilal(k);
    }
    return hilalCaches[k];
}


export function toHijriah(jd, loc, method = 'MABIMS') {
    let k = floor((jd - 2451545.0) / 29.53066257024) + 17050 - 1;
    let y = floor((k - 1) / 12), m = (k - 1) % 12 + 1;
    const hilal = Hilal(y, m);
    let d = floor(jd) - hilal.T0 + 0.5;
    let res = hilal.calc(loc);
    
}