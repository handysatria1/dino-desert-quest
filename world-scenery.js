/* Scenery upgrade: gradient sky with a sun, animated sea with foam, a sandy beach with a dock,
   natural-looking ground, and thousands of flowers, bushes, rocks and grass tufts. */
(() => {
  'use strict';
  const BEACH = { x: 0, z: 205, ax: 50, az: 27 }, DOCK = { x: 0, z0: 214, z1: 252, w: 1.9, y: .35 };
  let api = null, T = null, seaMat = null, foam = [], sky = null;
  const uniforms = { uTime: { value: 0 } };

  // Sand height across the beach: flat near the trees, then sloping down under the sea.
  function sand(x, z) {
    const e = Math.hypot((x - BEACH.x) / BEACH.ax, (z - BEACH.z) / BEACH.az);
    if (e < .55) return .04;
    return Math.max(-4.2, .04 - 3.6 * (e - .55) / .45);
  }
  const onDock = (x, z) => Math.abs(x - DOCK.x) < DOCK.w && z > DOCK.z0 && z < DOCK.z1;
  function height(x, z) {
    if (onDock(x, z)) return DOCK.y;
    const r = Math.hypot(x, z); if (r < 190) return 0;
    const h = sand(x, z); return r < 201 ? Math.max(0, h) : h;
  }
  function extraLand(x, z) { return onDock(x, z) || (Math.hypot((x - BEACH.x) / BEACH.ax, (z - BEACH.z) / BEACH.az) < 1 && sand(x, z) > -2.25); }

  // Gentle, layered noise on the ground so grass, sand and paths are not flat colours.
  const NOISE = `
    float lxH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float lxN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lxH(i),lxH(i+vec2(1,0)),f.x),mix(lxH(i+vec2(0,1)),lxH(i+vec2(1,1)),f.x),f.y);}`;
  function natural(material, amount, tint) {
    if (!material || material.userData.natural) return; material.userData.natural = true;
    material.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLxW;').replace('#include <project_vertex>', '#include <project_vertex>\nvLxW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vLxW;${NOISE}`).replace('#include <color_fragment>', `#include <color_fragment>
        float lxn = lxN(vLxW.xz * .07) * .5 + lxN(vLxW.xz * .45) * .3 + lxN(vLxW.xz * 2.6) * .2;
        diffuseColor.rgb *= mix(${(1 - amount).toFixed(3)}, ${(1 + amount).toFixed(3)}, lxn);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(${tint}), smoothstep(.5, .8, lxN(vLxW.xz * .021 + 7.)));`);
    };
    material.customProgramCacheKey = () => `natural-${amount}-${tint}`;
    material.needsUpdate = true;
  }

  function buildSky() {
    const sunDir = api.sun.position.clone().sub(api.sun.target.position).normalize();
    const mat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color('#5d9fd6') }, horizon: { value: new T.Color('#d4ebee') }, bottom: { value: new T.Color('#a9d3d2') }, sunDir: { value: sunDir }, sunColour: { value: new T.Color('#fff3d1') } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColour; varying vec3 vDir;
        void main(){ float h = vDir.y; vec3 c = h > 0. ? mix(horizon, top, pow(smoothstep(0., 1., h), .55)) : mix(horizon, bottom, smoothstep(0., -.3, h));
        float s = max(dot(normalize(vDir), sunDir), 0.); c += sunColour * (pow(s, 12.) * .25 + pow(s, 400.) * 1.2 + step(.9993, s) * 1.6);
        gl_FragColor = vec4(c, 1.); }`
    });
    sky = new T.Mesh(new T.SphereGeometry(1, 32, 16), mat); sky.scale.setScalar(400); sky.frustumCulled = false; sky.renderOrder = -10; api.scene.add(sky);
    api.scene.background = new T.Color('#d4ebee'); api.scene.fog.color.set('#d4ebee'); api.scene.fog.near = 170; api.scene.fog.far = 520;
  }

  function buildSea() {
    api.sea.visible = false;
    seaMat = new T.MeshStandardMaterial({ color: '#2f8aa3', roughness: .16, metalness: .05 });
    seaMat.onBeforeCompile = sh => {
      sh.uniforms.uTime = uniforms.uTime;
      const wave = `float lxW(vec2 p, float t){ return .28*sin(p.x*.07+t*1.1) + .22*sin(p.y*.09+t*.9) + .12*sin((p.x+p.y)*.16+t*1.7); }`;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nuniform float uTime; varying float vLxR; varying float vLxH;\n${wave}`)
        .replace('#include <beginnormal_vertex>', `vec2 lxp = position.xy; float lxa = .28*.07*cos(lxp.x*.07+uTime*1.1) + .12*.16*cos((lxp.x+lxp.y)*.16+uTime*1.7); float lxb = .22*.09*cos(lxp.y*.09+uTime*.9) + .12*.16*cos((lxp.x+lxp.y)*.16+uTime*1.7);
          vec3 objectNormal = normalize(vec3(-lxa, -lxb, 1.0));\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(tangent.xyz);\n#endif`)
        .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.z += lxW(position.xy, uTime); vLxR = length(position.xy); vLxH = lxW(position.xy, uTime);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLxR; varying float vLxH;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = mix(vec3(.47,.80,.78), diffuseColor.rgb, smoothstep(203., 255., vLxR));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.17,.44,.6), smoothstep(300., 520., vLxR));
          diffuseColor.rgb += vec3(.10,.12,.12) * smoothstep(.35, .6, vLxH);`);
    };
    const sea = new T.Mesh(new T.PlaneGeometry(1500, 1500, 190, 190), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -2.5; sea.receiveShadow = true; api.scene.add(sea);
    // Foam where the waves meet the cliffs and the beach.
    const foamMat = () => new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .45, depthWrite: false });
    const ring = new T.Mesh(new T.RingGeometry(201.2, 204.5, 180), foamMat()); ring.rotation.x = -Math.PI / 2; ring.position.y = -2.33; api.scene.add(ring); foam.push(ring);
    const shore = new T.Mesh(new T.RingGeometry(.845, .885, 120), foamMat()); shore.rotation.x = -Math.PI / 2; shore.scale.set(BEACH.ax, BEACH.az, 1); shore.position.set(BEACH.x, -2.42, BEACH.z); api.scene.add(shore); foam.push(shore);
  }

  function buildBeach() {
    const sandMat = api.mat('#ecd9a6'); natural(sandMat, .1, '1.04,1.0,.9');
    const geo = new T.PlaneGeometry(BEACH.ax * 2.3, BEACH.az * 2.3, 92, 54); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + BEACH.x, z = p.getZ(i) + BEACH.z; p.setY(i, sand(x, z)); }
    geo.computeVertexNormals();
    const beach = new T.Mesh(geo, sandMat); beach.position.set(BEACH.x, 0, BEACH.z); beach.receiveShadow = true; api.scene.add(beach);
    // Dock on posts.
    const dock = api.group(0, 0, 0);
    for (let z = DOCK.z0; z < DOCK.z1; z += 1.1) api.box(dock, z % 2.2 < 1.1 ? '#b88b5a' : '#a97d4f', DOCK.x, DOCK.y - .08, z + .55, DOCK.w * 2, .16, 1);
    for (let z = DOCK.z0 + 4; z <= DOCK.z1; z += 6) for (const sd of [-1, 1]) api.cylinder(dock, '#8b6a45', DOCK.x + sd * (DOCK.w - .1), -1.6, z, .2, .2, 4.2, 8);
    for (const sd of [-1, 1]) api.box(dock, '#9c7448', DOCK.x + sd * (DOCK.w - .05), 1.05, (DOCK.z0 + DOCK.z1) / 2 + 3, .12, .12, DOCK.z1 - DOCK.z0 - 6);
    // Palm trees, umbrellas and a sandcastle.
    const palms = [[-30, 196, .3], [-22, 212, -.2], [25, 198, -.35], [33, 210, .25], [-12, 190, .1], [14, 191, -.15], [-38, 205, .4], [40, 202, -.4]];
    palms.forEach(([x, z, lean]) => {
      const g = api.group(x, 0, z, dock); let px = 0, py = 0;
      for (let i = 0; i < 7; i++) { const nx = px + lean * .35, ny = py + 1.15; api.segment(g, i % 2 ? '#a88457' : '#94744b', [px, py, 0], [nx, ny, 0], .26 - i * .018); px = nx; py = ny; }
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, leaf = api.ball(g, i % 2 ? '#5e9b55' : '#6fae5f', px + Math.cos(a) * 1.7, py - .35, Math.sin(a) * 1.7, 2.1, .14, .55); leaf.rotation.y = -a; leaf.rotation.z = -.35 * Math.sign(Math.cos(a) || 1); }
      for (let i = 0; i < 3; i++) api.ball(g, '#7a5a35', px + Math.cos(i * 2) * .35, py - .45, Math.sin(i * 2) * .35, .28);
    });
    [[-8, 200, '#e8848e'], [10, 204, '#8fc7e8']].forEach(([x, z, c]) => {
      const g = api.group(x, 0, z, dock); api.segment(g, '#f4ecd2', [0, 0, 0], [0, 3.4, 0], .07);
      api.mesh(g, new T.ConeGeometry(2.4, .9, 12), c, 0, 3.4, 0); api.box(g, c === '#e8848e' ? '#fff0b4' : '#f0a8bf', 1.6, .08, .4, 1.4, .06, 2.6);
    });
    const castle = api.group(-4, 0, 207, dock); api.box(castle, '#e2c98f', 0, .5, 0, 2.2, 1, 2.2);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { api.cylinder(castle, '#e2c98f', x, 1, z, .45, .5, 2, 8); api.mesh(castle, new T.ConeGeometry(.5, .6, 8), '#d9bb7c', x, 2.3, z); }
    api.segment(castle, '#8b6a45', [0, 1, 0], [0, 2.6, 0], .04); api.box(castle, '#e58d7a', .3, 2.45, 0, .55, .3, .04);
    api.sign('BEACH · BOATS AND SHELLS', 0, 14, 182, 12);
    api.merge(dock);
  }

  function buildDecor() {
    const places = (window.WonderPlaces?.places || []).map(p => ({ x: p.x, z: p.z }));
    const keep = [...places.map(p => ({ ...p, r: 33 })), { x: 0, z: 70, r: 17 }, { x: 138, z: -17, r: 36 }, { x: -120, z: -17, r: 22 }, { x: 0, z: 21, r: 9 }, { x: 10, z: -1, r: 8 }, { x: -12, z: 0, r: 6 }, { x: -24, z: 55, r: 26 }];
    let seed = 1234567; const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
    const free = (x, z) => Math.hypot(x, z) < 186 && !keep.some(k => Math.hypot(x - k.x, z - k.z) < k.r) && !(Math.abs(Math.atan2(z, x) - Math.PI / 2) < .45 && Math.hypot(x, z) > 160);
    const g = api.group(0, 0, 0), low = new T.IcosahedronGeometry(1, 0), tuft = new T.ConeGeometry(.16, 1, 4), rock = new T.DodecahedronGeometry(1, 0);
    const petals = ['#f3e07a', '#f0a8bf', '#ffffff', '#c8a3dc', '#e8848e', '#8fc7e8'];
    for (let i = 0; i < 1100; i++) {
      const x = (rnd() - .5) * 370, z = (rnd() - .5) * 370; if (!free(x, z)) continue;
      const c = petals[Math.floor(rnd() * petals.length)], s = .14 + rnd() * .08;
      api.mesh(g, tuft, '#6f9d5a', x, .2, z, .5, .4, .5); api.mesh(g, low, c, x, .42, z, s, s * .6, s); api.mesh(g, low, '#f2c23c', x, .47, z, s * .4);
    }
    for (let i = 0; i < 1800; i++) {
      const x = (rnd() - .5) * 370, z = (rnd() - .5) * 370; if (!free(x, z)) continue;
      const shade = ['#7fae63', '#6f9d5a', '#8fbb6c'][i % 3];
      for (let k = 0; k < 3; k++) { const m = api.mesh(g, tuft, shade, x + (k - 1) * .18, .32, z + (k % 2) * .14, .9, .55 + rnd() * .4, .9); m.rotation.z = (k - 1) * .25; }
    }
    for (let i = 0; i < 160; i++) {
      const x = (rnd() - .5) * 370, z = (rnd() - .5) * 370; if (!free(x, z)) continue;
      const s = .7 + rnd() * .9, c = ['#5f8f55', '#6f9d5a', '#7aa862'][i % 3];
      api.ball(g, c, x, s * .55, z, s, s * .75, s); api.ball(g, c, x + s * .7, s * .4, z + .2, s * .7, s * .55, s * .7); api.ball(g, c, x - s * .6, s * .35, z - .2, s * .6, s * .5, s * .6);
      if (i % 4 === 0) for (let k = 0; k < 4; k++) api.mesh(g, low, '#e05b47', x + Math.cos(k * 1.6) * s * .8, s * .8, z + Math.sin(k * 1.6) * s * .8, .1);
    }
    for (let i = 0; i < 90; i++) {
      const x = (rnd() - .5) * 370, z = (rnd() - .5) * 370; if (!free(x, z)) continue;
      const s = .35 + rnd() * .8, m = api.mesh(g, rock, ['#a7a294', '#b8b2a2', '#958f82'][i % 3], x, s * .3, z, s * 1.2, s * .7, s); m.rotation.y = rnd() * 6;
    }
    api.merge(g);
  }

  window.Scenery = Object.freeze({
    preInit() {},
    init(world) {
      api = world; T = world.T;
      try {
        api.renderer.toneMappingExposure = 1.05; api.sun.color.set('#fff1d8'); api.sun.intensity = 3;
        const hemi = api.scene.children.find(c => c.isHemisphereLight); if (hemi) { hemi.color.set('#dcecff'); hemi.groundColor.set('#7a9466'); hemi.intensity = 1.75; }
        natural(api.mat('#b4ce91'), .13, '1.1,1.04,.82');
        (window.WonderPlaces?.places || []).forEach(p => natural(api.mat(p.ground), .1, '1.05,1.02,.92'));
        natural(api.mat('#e4d8af'), .08, '1.03,1.0,.94');
        buildSky(); buildSea(); buildBeach(); buildDecor();
      } catch (e) { console.warn('Scenery upgrade skipped', e); }
    },
    update(dt, time) {
      if (!api) return; uniforms.uTime.value = api.reduced ? 0 : time;
      if (sky) sky.position.copy(api.getPosition());
      foam.forEach((f, i) => { f.material.opacity = api.reduced ? .4 : .32 + Math.sin(time * 1.3 + i * 1.7) * .14; });
    },
    height, extraLand, BEACH, DOCK
  });
})();
