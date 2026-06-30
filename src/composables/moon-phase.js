import { solarLite, moonLite } from "./position";
import { GST } from "./horizon";

const {sin, cos} = Math;
const SUN_RADIUS = 695991.75; // km
const MOON_RADIUS = 1737.928; // km
const EARTH_RADIUS = 6378.137 / MOON_RADIUS; // km

export function moonPhase(jde, loc){
    const m = moonLite.Equator(jde);
    const gst = GST(jde);
    m.range = m.range / MOON_RADIUS;
    const s = solarLite.Equator(jde);
    s.range = s.range / MOON_RADIUS;
    let sunRa = s.ra - moon.ra;
    const sunXyz = {
        X: s.range * sin(s.dec),
        Y: s.range * cos(s.dec) * sin(sunRa),
        Z: -s.range * cos(s.dec) * cos(sunRa),
    }
    let lon = gst - moon.ra - loc.lon;
    const earth = {
        X: EARTH_RADIUS * sin(loc.dec),
        Y: EARTH_RADIUS * cos(loc.dec) * sin(lon),
        Z: -EARTH_RADIUS * cos(loc.dec) * cos(lon),
    }
    return {
        sun: sunXyz,
        earth,
    }
}