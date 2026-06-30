const int SIZE = 4;
const int POLY_COUNT = 3;
const float PI = 3.14159265;
const float PI2 = 6.2831853;
const float R2D = 57.29578;
const float D2R = 0.01745329252;
const float ERR1 = 0.03;
const float ERR2 = 0.01;
const float EARTH_RADIUS = 6378.137;
const float MOON_RADIUS = 1737.928; // km

const float ODEH[SIZE] = float[](7.1651, -6.3226, 0.7319, -0.1018);

struct TPoly {
    float GHA[SIZE];
    float Dec[SIZE];
    float R[SIZE];
};

uniform TPoly SUN[POLY_COUNT];
uniform TPoly MOON[POLY_COUNT];
uniform int method; // 1:geo, 2:topo, 3:apparent
uniform sampler2D txtr;

varying vec2 vUv;

struct TPos {
    float lha;
    float dec;
    float alt;
    float az;
    float range;
};

float horner(float t, float c[SIZE]){    
    int i = c.length() - 1;
    float res = c[i];
    while(i > 0){
        i--;
        res = res*t + c[i];
    }
    return res;
}

float saemundsson (float h) { // (h float64)  float64
  // (16.4) p. 106
  float c102 = 1.02 * D2R / 60.0;
  float c103 = 10.3 * D2R * D2R;
  float c511 = 5.11 * D2R;
  return c102 / tan(h + c103 / (h + c511));
}

TPos calcPos(float t, TPoly poly[POLY_COUNT], float lon, float lat){
    int X = 0;
    while(t > 1.0){
        X++;
        t = t - 1.0;
    }
    float lha = mod(horner(t, poly[X].GHA) - lon + PI, PI2) - PI;
    float dec = horner(t, poly[X].Dec);
    float range = horner(t, poly[X].R);
    float alt = asin(sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(lha));    
    float az = atan(sin(lha), cos(lha) * sin(lat) - (sin(dec) / cos(dec)) * cos(lat));
    float hp = asin(EARTH_RADIUS / range);
    if(method == 2){ // topocentric
        alt = alt - hp * cos(alt);
    } else if(method == 3){ // apparent
        alt = alt - hp * cos(alt);
        alt = alt + saemundsson(alt);
    } else { // geocentric
        alt = alt;
    }
    return TPos(lha, dec, alt, az, range);
}

void main(void){
    vec2 position = -1.0 + 2.0 * vUv;
    float lat = radians(position.y * 90.0);
    float lon = radians(-position.x * 180.0);
    vec3 color = texture2D(txtr, vUv).rgb;    
    
    float T0 = 0.5 + lon/PI2;
    float t = T0 + 0.5;
    TPos sun;
    TPos moon;
    int found = 0;
    float alt;
    float elo;
    for(int it=0; it<=10; it++){
        sun = calcPos(t, SUN, lon, lat);
        float cosHa = (-0.01454441 - sin(lat)*sin(sun.dec))/(cos(lat)*cos(sun.dec));
        if(cosHa < -1.0 || cosHa > 1.0) break;
        float dt = (acos(cosHa) - sun.lha) / PI2;
        if(abs(dt) < 0.0001){
            found = 1;
            break;
        }
        t = t + dt;
        while(t < T0) t = t + 1.0;
        while(t > T0 + 1.0) t = t - 1.0;
    }

    gl_FragColor = vec4(color.x * 0.2, color.y * 0.2, color.z * 0.2, 1.0); // hilal di bawah ufuk
    if(found == 1){ // sunset
        moon = calcPos(t, MOON, lon, lat);
        float cosElo = sin(sun.alt)*sin(moon.alt) + cos(sun.alt)*cos(moon.alt) * cos(sun.az - moon.az);
        alt = moon.alt * R2D;
        elo = acos(cosElo) * R2D;
        if(alt > 0.0){
            if(abs(alt - 3.0) < ERR1 && elo >= 6.4){ // mabims
                gl_FragColor = vec4(0.0, 0.8, 0.8, 1.0 );
            } else if(alt >= 3.0 && abs(elo - 6.4) < ERR2){ // mabims
                gl_FragColor = vec4(0.0, 0.8, 0.8, 1.0 );
            } else if(abs(alt - 5.0) < ERR1 && elo >= 8.0){ // KHGT
                gl_FragColor = vec4(0.8, 0.8, 0.0, 1.0 );
            } else if(alt >= 5.0 && abs(elo - 8.0) < ERR2){ // KHGT
                gl_FragColor = vec4(0.8, 0.8, 0.0, 1.0 );
            } else {
                // odeh
                float W = asin(MOON_RADIUS / moon.range) * (1.0 - cos(elo * D2R)) * R2D * 60.0;
                float V = alt - horner(W, ODEH);
                if(V < -0.96){
                    gl_FragColor = vec4(color.x * 0.4, color.y * 0.4, color.z * 0.4, 1.0);
                } else if(V < 2.0){
                    gl_FragColor = vec4(color.x * 0.6, color.y * 0.6, color.z * 0.4, 1.0);
                } else if(V < 5.65){
                    gl_FragColor = vec4(color.x * 0.7, color.y * 1.0, color.z * 0.7, 1.0);
                } else {
                    gl_FragColor = vec4(color.x, color.y, color.z, 1.0);
                }
            }
        }
    }
}