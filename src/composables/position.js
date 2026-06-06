import { Planet } from 'astronomia/planetposition';
import { trueVSOP87 } from 'astronomia/solar';
import { pmod, sincos } from 'astronomia/base';
import { saemundsson } from 'astronomia/refraction';
import elp from 'astronomia/elp';

import { deltaTJD, GST, obliquity } from './horison';

import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import elpMppDe from 'astronomia/data/elpMppDe';


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

function sep(c1, c2) {
    const [sind1, cosd1] = sincos(c1.lon);
    const [sind2, cosd2] = sincos(c2.lon);
    const cd = sind1 * sind2 + cosd1 * cosd2 * cos(c1.lat - c2.lat); // (17.1) p. 109
    if (cd < CosSmallAngle) {
        return acos(cd);
    } else {
        const cosd = cos((c2.lon + c1.lon) / 2); // average dec of two bodies
        return hypot((c2.lat - c1.lat) * cosd, c2.lon - c1.lon); // (17.2) p. 109
    }
}

class TPosition {
    solar = false;
    RADIUS = null;

    position(jd, loc, opt) {
        const options = {
            alt: 'a', //Altitude =>  a:apparent, g:geocentric, t:topocentric, au:apparent upper, al:apparent lower
            elo: 'g', //Elongation => g:geocentric, t:topocentric
            ...(opt || {}),
        }
        let deltaT = deltaTJD(jd);
        let jde = jd + deltaT / 86400;
        let { lon, lat, range } = this._calc(jde);
        let [ε, Δψ] = obliquity(jde);
        lon += Δψ;
        let { ra, dec } = toEquatorial({ lon, lat }, ε);
        let gst = GST(jd);
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
            switch (options.alt) {
                case 't':
                    alt -= result.hp * cos(alt);
                    break;
                case 'a':
                    alt -= result.hp * cos(alt);
                    alt += saemundsson(alt);
                    break;
                case 'au':
                case 'ai':
                    alt -= result.hp * cos(alt);
                    alt += saemundsson(alt);
                    alt += (options.alt == 'au' ? 1 : -1) * (result.sd || 0);
                    break;
            }
            result.alt = alt;
            result.az = az;
        }
        if (this.solar) {
            const sun = solarPos(jde);
            result.phase = pmod(lon - sun.lon, PI_2);
            if (loc && options.elo == 't') {
                const sunEq = toEquatorial(sun, ε);
                const sunHz = toHorizontal(sunEq, loc, gst);
                sunHz.alt -= asin(EARTH_RADIUS / sun.range) * cos(sunHz.alt);
                result.elongation = horizontalSep(sunHz, { alt, az });
            } else {
                result.elongation = sep(sun, { lat, lon });
            }
            const [sψ, cψ] = sincos(result.elongation);
            let pa = atan(sun.range * sψ / (range - sun.range * cψ));
            if(pa < 0){
                pa += PI;
            }
            result.fraction = (1 + cos(pa)) / 2;
        }
        return result;
    }
}

export class Solar extends TPosition {
    RADIUS = SUN_RADIUS;
    _calc(jde) {
        return solarPos(jde);
    }
}

export class Moon extends TPosition {
    RADIUS = MOON_RADIUS;
    _calc(jde) {
        return moonPos(jde);
    }
}