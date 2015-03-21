#ifdef GL_ES
precision highp float;
#endif

uniform vec2 uResolution;
uniform vec3 uLight1Dir;
uniform vec3 uLight1Color;
uniform bool uLight1Enabled;
uniform vec3 uLight2Dir;
uniform vec3 uLight2Color;
uniform bool uLight2Enabled;
uniform vec3 uCameraPos;
uniform int uObjectOneMaterial;
uniform vec3 uObjectOneColor;
uniform int uObjectTwoMaterial;
uniform vec3 uObjectTwoColor;
uniform int uObjectThreeMaterial;
uniform vec3 uObjectThreeColor;
uniform float uRefractiveIndex;

const vec3 up = vec3(0.,1.,0.);

//height = floor plane y-coord
//ro ray origin
//rd ray direction
//height... height!
//t0 point on ray
float intersectfloor(vec3 ro, vec3 rd, float height, out float t0)
{
    if (rd.y==0.0) {
        t0 = 100000.0;
        return 0.0;
    }

    t0 = -(ro.y - height)/rd.y;
    t0 = min(100000.0,t0);
    return t0;
}

// see http://www.cs.unc.edu/~rademach/xroads-RT/RTarticle.html
// axis-aligned; length of side = size; slab implementation (t0 near, t1 far)
// returns positive value if there are intersections
float intersectbox( in vec3 ro, in vec3 rd, float size, out float t0, out float t1, out vec3 normal)
{
    vec3 ir = 1.0/rd; //inverse ray
    vec3 tb = ir * (vec3(-size*.5)-ro);
    vec3 tt = ir * (vec3(size*.5)-ro);
    vec3 tn = min(tt, tb);
    vec3 tx = max(tt, tb);
    vec2 t = max(tn.xx, tn.yz);
    t0 = max(t.x, t.y);
    t = min(tx.xx, tx.yz);
    t1 = min(t.x, t.y);
    float d = (t1-t0);
    vec3 i = ro + t0*rd;
    normal = step(size*.499,abs(i))*sign(i);
    if (t0<-0.01) d = t0;
    return d;
}

//calcuate sphere normals
vec3 nSphere( in vec3 pos, in vec4 sph ){
    return (pos - sph.xyz)/sph.w;
}

//standard line-sphere intersection
//see http://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
float intersectsphere( in vec3 sphPos, in vec3 ro, in vec3 rd, float rad, out float t, out vec3 normal ){
    vec3 coord = ro - sphPos.xyz;
    float b = 2.0 * dot( coord, rd );
    float c = dot( coord, coord ) - rad * rad;
    float h = b*b - 4.0*c;
    if( h < 0.0 ){
        return -1.0;
    }
    t = ( -b - sqrt( h )) / 2.0;

    vec3 pos = ro + t * rd;
    vec4 sph = vec4( sphPos.xyz, rad );
    normal = nSphere( pos, sph );

    return t;
}


float intersect(in vec3 boxPos, in vec3 sphPos, in vec3 sphPos2, in vec3 ro, in vec3 rd, out vec3 intersection, out vec3 normal, out int mode, out vec3 color, out float t)
{
    //check box
    float tb0 = 0.0; //nearpoint
    float tb1 = 0.0; //farpoint
    vec3 boxnormal;
    float dbox = intersectbox( ro-boxPos, rd, 1.0, tb0, tb1, boxnormal );
    //float dbox = intersectsphere( boxPos, ro, rd, 1.0, tb0, boxnormal ); //uncomment to make sphere

    //check sphere one
    float ts = 0.0;
    vec3 spherenormal;
    float ds = intersectsphere( sphPos, ro, rd, 1.0, ts, spherenormal );

    //check sphere two
    float ts2 = 0.0;
    vec3 spherenormal2;
    float ds2 = intersectsphere( sphPos2, ro, rd, 1.0, ts2, spherenormal2 );

    //check floor
    float tf = 0.0; //floor point
    float dfloor = intersectfloor(ro,rd,0.,tf);
    t = tf;
    float d = dfloor;
    mode = 0; // no intersection

    //used to preserve draw order. if there are
    //two intersections, we only draw the closest
    //one to the viewer
    float shortest = 1000000.0;

    if ( d >= 0.0 ) {
        normal = vec3( 0.0, 1.0, 0.0 );
        mode = 2; // floor
    }
    if ( dbox >= 0.0 ) {
        if(tb0<shortest){
            shortest=tb0;
            t = tb0;
            d = dbox;
            normal = boxnormal;
            mode = uObjectOneMaterial; // box
            color = uObjectOneColor;
            if ( t<0.0 ) {
                d =- 0.1;
            }
        }
    }
    if ( ds >= 0.0 ) {
        if(ts<shortest){
            shortest=ts;
            t = ts;
            d = ds;
            normal = spherenormal;
            mode = uObjectTwoMaterial; //sphere one
            color = uObjectTwoColor;
        }
    }
    if ( ds2 >= 0.0 ) {
        if(ts2<shortest){
            shortest = ts2;
            t = ts2;
            d = ds2;
            normal = spherenormal2;
            mode = uObjectThreeMaterial; //sphere two
            color = uObjectThreeColor;
        }
    }
    intersection = ro + t * rd;
    return d;
}

void main(void)
{
    vec3 light1 = uLight1Dir; //light pos
    vec3 light2 = uLight2Dir; //light pos
    float radius = uCameraPos.z; //camera rad from origin
    vec3 boxPos = vec3( 0.0, 1.0, 0.0 ); //cube position
    vec3 sphPos = vec3( 2.0, 1.5, 0.0 ); //sphere position
    vec3 sphPos2 = vec3( -2.0, 1.5, 0.0 ); //refractive sphere position
    //sin(x), cos(z) = disc orbit
    vec3 eye = vec3( radius*sin(uCameraPos.x), uCameraPos.y, radius*cos(uCameraPos.x) ); //camera
    float diff = (eye.y - 1.0) / radius;
    vec3 screen = vec3( ( radius-1.0 )*sin(uCameraPos.x), uCameraPos.y - diff, ( radius-1.0 )*cos(uCameraPos.x) );
    vec2 screenSize = vec2( uResolution.x / uResolution.y, 1.0);
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 offset = screenSize * ( uv - 0.5 );
    vec3 right = cross( up, normalize( screen - eye ) );
    vec3 ro = screen + offset.y * up + offset.x * right; //ray origin
    vec3 rd = normalize( ro - eye ); //ray direction
    vec3 i = vec3( 0.0 ); //intersection
    vec3 n = vec3( 0.0 ); //normal
    int m,m2,m3; //mode (m2 for shadowcast)
    float d,lightd1,lightd2,ra,global,direct1,direct2,shade1,shade2,t,tlight1,tlight2; //ra reflectivity
    vec3 lrd1,lrd2,i2,i3,n2,n3; //lightray direction, shadow intersection, shadow normal (unused)
    i2 = vec3( 0.0 ), i3 = vec3( 0.0 ); //initialise to remove artefacts
    vec3 c = vec3( 0.0 ), c2 = vec3( 0.0 ), c3 = vec3( 0.0 ); //input colour
    vec3 lightColor1, lightColor2; // light colours
    vec3 col = vec3( 0.0 ); //colourisation
    vec3 ca = vec3( 0.0 ); //colourisation
    float lra = 1.0; //attenuation

    //break iteration on matte (non-reflective) objects
    bool breakOut = false;

    for ( int reflections = 0; reflections < 10; reflections++ ) {
        //get intersection
        d = intersect( boxPos, sphPos, sphPos2, ro, rd, i, n, m, c, t );

        //shadows
        global = 0.3;

        //light one
        lrd1 = normalize( light1 - i ); //light direction relative to intersection
        tlight1 = length( light1 - i );
        lightd1 = smoothstep( 0.5 * length( i - i2 ), 0.0, intersect( boxPos, sphPos, sphPos2, i, lrd1, i2, n2, m2, c2, t ) );
        if( m2 == 4 ){ //attenuate shadow for refractive object
            lightd1 *= 10.0;
        }
        if ( t > tlight1 ){
            lightd1 = 1.0;
        }
        direct1 = max( ( 10.0 / length( lrd1 ) ) * dot( lrd1, n ) , 0.0 );
        if( uLight1Enabled ) {
            shade1 = global + direct1 * lightd1;
            lightColor1 = uLight1Color;
        } else {
            shade1 = 1.0;
            lightColor1 = vec3( 1.0, 1.0, 1.0 );
        }

        //light two
        lrd2 = normalize( light2 - i ); //light direction relative to intersection
        tlight2 = length( light2 - i );
        lightd2 = smoothstep( 0.5 * length( i - i3 ), 0.0, intersect( boxPos, sphPos, sphPos2, i, lrd2, i3, n3, m3, c3, t ) );
        if( m3 == 4 ){ //attenuate shadow for refractive object
            lightd2 *= 10.0;
        }
        if ( t > tlight2 ){
            lightd2 = 1.0;
        }
        direct2 = max( ( 10.0 / length( lrd2 ) ) * dot( lrd2, n ) , 0.0 );
        if( uLight2Enabled ) {
            shade2 = global + direct2 * lightd2;
            lightColor2 = uLight2Color;
        } else {
            shade2 = 1.0;
            lightColor2 = vec3( 1.0, 1.0, 1.0 );
        }

        vec3 shadeCol = (shade1 * lightColor1 + shade2 * lightColor2) / 2.0;

        //materials
        if ( m == 0 ) { //"SKY"
            ra = 0.0;
            col = vec3( 0.2, 0.5, 0.9 ); //blue
            breakOut = true; //no reflections; break iteration
        }
        if ( m == 1 ) { //MATTE ISH
            ra = 0.0;
            col = c * shadeCol;
            breakOut = true; //no reflections; break iteration
        }
        if ( m == 2 ) { //FLOOR
            ra = 0.3;
            //nice kitchen tiles
            vec2 mxz = abs( fract( i.xz ) * 2.0 - 1.0 ); //modify these numbers for different patterns!
            float fade = clamp( 1.0 - length( i.xz ) * 0.05, 0.0, 1.0 );
            float fc = mix( 0.5, smoothstep( 1.0, 0.9, mxz.x + mxz.y ), fade );
            col = fc * shadeCol;
        }
        if ( m == 3 ) { //SHINY
            ra = 0.2;
            col = c * shadeCol;
        }
        if ( m == 4 ) { //REFRACTIVE
            ra = 1.0;
            col = vec3( 0.0, 0.0, 0.0 );
        }

        //accumulated shading
        ca += lra * col;

        if( breakOut ) {
            break;
        }

        // attenuate reflections for next iteration
        lra *= ra;
        if( m != 4 ){ //if NOT refractive, reflect...
            rd = reflect( rd, n );
        } else { //otherwise, refract!
            rd = refract( rd, n, uRefractiveIndex );
        }
        ro = i + 0.01 * rd;
    }
    gl_FragColor = vec4( ca / (1.0+ca), 1.0 );
    //gl_FragColor = vec4( sqrt( ca ), 1.0 ); //try this scaling for high exposure effect
}
