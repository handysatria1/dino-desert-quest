/* Stylised educational park replicas, not accurate reconstructions or a geographic map. */
(() => {
  'use strict';
  const places = [
    { id: 'wall', name: 'Great Wall', country: 'China', icon: '🧱', color: '#b4bf9b', ground: '#bed390', x: -69, z: -52, activity: 'Carry three stones to our model wall', verb: 'BUILD', fact: 'The Great Wall is in China. It is made of many connected walls, built over a very long time.', skill: 'Count three stones. Watch a small wall grow.', total: 6 },
    { id: 'giza', name: 'Pyramids of Giza', country: 'Egypt', icon: '🐪', color: '#e2c98a', ground: '#e8d3a0', x: -43.6, z: -85.7, activity: 'Carry stones to build a little pyramid', verb: 'BUILD', fact: 'The Pyramids of Giza are in Egypt. They were built long ago from huge stone blocks, in the desert beside the River Nile.', skill: 'Carry stones and build three layers, big to small.', total: 6, custom: true },
    { id: 'petra', name: 'Petra', country: 'Jordan', icon: '🏜️', color: '#dba17c', ground: '#e4c599', x: 0, z: -85, activity: 'Follow red, yellow, then blue', verb: 'FOLLOW', fact: 'Petra is in Jordan. Some of its buildings were carved into pink sandstone rock.', skill: 'Remember a three-colour trail, then try it backwards.', total: 3 },
    { id: 'eiffel', name: 'Eiffel Tower', country: 'France', icon: '🗼', color: '#9b7b57', ground: '#b9d394', x: 43.6, z: -85.7, activity: 'Light the tower, one level at a time', verb: 'LIGHT', fact: 'The Eiffel Tower is in Paris, France. It is made of iron and has three levels where visitors can stand.', skill: 'Count three levels from the bottom to the top.', total: 3, custom: true },
    { id: 'taj', name: 'Taj Mahal', country: 'India', icon: '🌷', color: '#fff2d8', ground: '#a9ce95', x: 69, z: -52, activity: 'Water matching garden beds', verb: 'WATER', fact: 'The Taj Mahal is in India. Its gardens and building have matching shapes on both sides. That is called symmetry.', skill: 'Find three matching pairs in a pretend garden.', total: 6 },
    { id: 'colosseum', name: 'Colosseum', country: 'Italy', icon: '🏛️', color: '#ddc79f', ground: '#d5cd9a', x: 85, z: 28, activity: 'Build a little arch from three shapes', verb: 'FIT', fact: 'The Colosseum is in Rome, in Italy. An arch is a curved opening. Look for rows of arches.', skill: 'Fit two supports and a curved top to a toy arch.', total: 3 },
    { id: 'opera', name: 'Sydney Opera House', country: 'Australia', icon: '🦘', color: '#f4f1e8', ground: '#a9cf9a', x: 72.9, z: 63.6, activity: 'Hop like a kangaroo on four stones', verb: 'HOP', fact: 'The Sydney Opera House is in Australia, beside the sea. Its white roofs look like sails or shells.', skill: 'Hop four times, counting each stone.', total: 4, custom: true },
    { id: 'chichen', name: 'Chichén Itzá', country: 'Mexico', icon: '🔺', color: '#c7bd93', ground: '#c0d58e', x: 38, z: 80, activity: 'Follow five stepping stones', verb: 'HOP', fact: 'Chichén Itzá is an ancient Maya city in Mexico. Its famous stepped pyramid has many stairs.', skill: 'Count five stones. Hop on two of them in our pretend trail.', total: 5 },
    { id: 'borobudur', name: 'Borobudur', country: 'Indonesia', icon: '🔔', color: '#8d877a', ground: '#9fc98a', x: 0, z: 100, activity: 'Find four bell-shaped stupas', verb: 'FIND', fact: 'Borobudur is in Indonesia, on the island of Java. It is a huge stone temple built in layers, with many bell-shaped stupas.', skill: 'Walk around the terraces and find four stupas.', total: 4, custom: true },
    { id: 'machu', name: 'Machu Picchu', country: 'Peru', icon: '🦙', color: '#b0b392', ground: '#9fbe80', x: -38, z: 80, activity: 'Guide a little llama to its meadow', verb: 'HELP', fact: 'Machu Picchu is high in the Andes mountains in Peru. The Inca made flat terraces on the steep hillsides.', skill: 'Guide a pretend llama through three terraces and home.', total: 4 },
    { id: 'petronas', name: 'Petronas Towers', country: 'Malaysia', icon: '🏙️', color: '#c9ced3', ground: '#b4cf98', x: -71.4, z: 64.3, activity: 'Build two matching towers', verb: 'STACK', fact: 'The Petronas Twin Towers are in Kuala Lumpur, Malaysia. They are two matching towers joined by a sky bridge.', skill: 'Add floors in pairs so both towers match.', total: 8, custom: true },
    { id: 'rio', name: 'Corcovado', country: 'Brazil', icon: '🌳', color: '#8faf91', ground: '#98c285', x: -85, z: 28, activity: 'Grow three trees for the birds', verb: 'GROW', fact: 'Corcovado is a mountain in Rio de Janeiro, Brazil. Forest grows around it, giving birds places to live.', skill: 'Plant and water three trees. Watch the birds return.', total: 6 }
  ];
  function picture(id) {
    let art = '';
    if (id === 'wall') art = '<path d="M8 65L27 45L47 53L70 25L91 36L118 19V43L94 60L72 49L50 77L29 68L8 88Z" fill="#9caa84"/><path d="M8 65L27 45L47 53L70 25L91 36L118 19" fill="none" stroke="#eddfb7" stroke-width="7"/><path d="M23 47V28H37V50M65 29V11H79V31M104 28V8H118V21" fill="#c8b58e"/>';
    else if (id === 'petra') art = '<path d="M4 90L10 15L41 4L67 10L98 5L126 25V90Z" fill="#d6a17d"/><path d="M29 81V37H103V81M27 37L65 14L106 37Z" fill="#f0c09a"/><path d="M37 75V43M52 75V43M78 75V43M94 75V43" stroke="#af7e62" stroke-width="6"/><path d="M58 81V58H73V81" fill="#785c49"/>';
    else if (id === 'taj') art = '<path d="M7 87H124M27 77V45H103V77Z" fill="#fff2d6" stroke="#c9bf9f" stroke-width="2"/><path d="M43 45Q40 23 65 12Q90 23 87 45" fill="#fff9e6"/><path d="M15 76V29M116 76V29" stroke="#fff6df" stroke-width="9"/><path d="M56 77V60Q65 47 75 60V77" fill="#a5b6aa"/><path d="M58 98L62 83H71L77 98" fill="#7bbdc0"/>';
    else if (id === 'colosseum') art = '<ellipse cx="65" cy="34" rx="53" ry="21" fill="#9b9378"/><path d="M12 34V74Q65 105 118 74V34Q65 65 12 34" fill="#e4cba0"/><path d="M19 49V62M36 56V69M54 60V73M73 60V73M92 56V69M109 49V62M20 69V79M38 76V86M57 80V90M77 79V89M96 74V84" stroke="#927e5c" stroke-width="7"/>';
    else if (id === 'chichen') art = '<path d="M9 88V76H21V62H33V48H43V34H53V21H79V34H89V48H101V62H113V76H125V88Z" fill="#c7b88c"/><path d="M54 90L61 30H71L79 90" fill="#e9d8ac"/><path d="M58 40H73M57 51H75M55 64H77M54 78H78" stroke="#a79772" stroke-width="3"/>';
    else if (id === 'machu') art = '<path d="M6 92L47 7L81 92M54 92L100 21L130 92" fill="#8daf89"/><path d="M13 89H105V75H33V62H91V49H49" fill="none" stroke="#c5c395" stroke-width="10"/><path d="M38 73V60H52V73M68 60V47H83V60M18 89V77H32V89" fill="#e3d8b2"/>';
    else if (id === 'rio') art = '<path d="M3 96Q29 70 43 36Q56 -2 74 34L112 96Z" fill="#85a887"/><path d="M0 89Q37 72 70 91T135 87V103H0" fill="#b3cf8d"/><path d="M78 47Q85 38 92 47Q99 38 106 47M20 30Q26 23 32 30Q38 23 44 30" fill="none" stroke="#f9e8b5" stroke-width="4"/><circle cx="104" cy="17" r="11" fill="#f7d88c"/>';
    else if (id === 'giza') art = '<circle cx="104" cy="20" r="11" fill="#f7d88c"/><path d="M0 92Q40 80 70 88T132 84V104H0Z" fill="#e8cf96"/><path d="M14 88L44 36L74 88Z" fill="#d8b878"/><path d="M44 36L74 88H52Z" fill="#c29c5d"/><path d="M62 88L88 46L114 88Z" fill="#e0c084"/><path d="M88 46L114 88H96Z" fill="#c7a265"/><path d="M98 92L112 70L126 92Z" fill="#d8b878"/>';
    else if (id === 'eiffel') art = '<path d="M66 8L70 30L80 62L96 92H82L72 70H60L50 92H36L52 62L62 30Z" fill="#9b7b57"/><path d="M48 62H84M56 40H76M60 70Q66 60 72 70" fill="none" stroke="#e6d6b4" stroke-width="3"/><path d="M0 94H132V104H0Z" fill="#b9d394"/>';
    else if (id === 'opera') art = '<path d="M0 78H132V104H0Z" fill="#6fb3c7"/><path d="M12 76H122V68H12Z" fill="#e3d8c3"/><path d="M18 68Q30 26 48 18Q44 46 50 68Z" fill="#fbf8f0"/><path d="M48 68Q60 30 80 22Q74 48 80 68Z" fill="#f4f0e4"/><path d="M80 68Q92 40 108 34Q104 52 110 68Z" fill="#fbf8f0"/><path d="M30 52Q38 38 46 30M62 52Q70 38 78 30" stroke="#d9d2c0" stroke-width="2" fill="none"/>';
    else if (id === 'borobudur') art = '<path d="M8 90H124V80H16V70H116V60H26V50H106V42H38V34H94V28H70V18H62V28H38" fill="#8d877a"/><path d="M8 90H124V80H8ZM16 80H116V70H16ZM26 70H106V60H26ZM38 50H94V42H38Z" fill="#9f998a"/><circle cx="66" cy="16" r="7" fill="#a8a294"/><path d="M66 4V10" stroke="#a8a294" stroke-width="3"/><g fill="#a8a294"><circle cx="44" cy="40" r="4"/><circle cx="56" cy="40" r="4"/><circle cx="76" cy="40" r="4"/><circle cx="88" cy="40" r="4"/></g>';
    else if (id === 'petronas') art = '<path d="M30 92V30L38 14L46 30V92Z" fill="#c9ced3"/><path d="M86 92V30L94 14L102 30V92Z" fill="#c9ced3"/><path d="M38 4V14M94 4V14" stroke="#aeb4ba" stroke-width="3"/><path d="M46 52H86V58H46Z" fill="#9aa2a9"/><path d="M34 40H42M34 50H42M34 60H42M34 70H42M34 80H42M90 40H98M90 50H98M90 60H98M90 70H98M90 80H98" stroke="#8b959e" stroke-width="2"/><path d="M0 94H132V104H0Z" fill="#b4cf98"/>';
    else art = '<circle cx="65" cy="50" r="37" fill="#7db5ac"/><path d="M32 25L60 20L75 40L50 52L55 82M83 35L101 47L90 72L72 63" fill="#b2cf89"/>';
    return `<svg viewBox="0 0 132 104" aria-hidden="true"><rect width="132" height="104" rx="15" fill="${id === 'petra' || id === 'giza' ? '#f4ddbb' : id === 'opera' ? '#cfe7ef' : '#dcebcf'}"/>${art}</svg>`;
  }
  function build(api, place) {
    const { group, box, ball, cylinder, segment, arch } = api, T = api.T, p = group(place.x, 0, place.z);
    const b = (color, x, y, z, sx, sy, sz) => box(p, color, x, y, z, sx, sy, sz);
    const c = (color, x, y, z, radius, height, top = radius, sides = 10) => cylinder(p, color, x, y, z, top, radius, height, sides);
    const a = (x, y, z, width = 3, height = 5, color = place.color) => arch(p, color, x, y, z, width, height);
    const shape = (geo, color, x, y, z, parent = p) => api.mesh(parent, geo, color, x, y, z);
    const lathe = (pts, color, x, y, z, parent = p) => shape(new T.LatheGeometry(pts.map(([r, h]) => new T.Vector2(r, h)), 20), color, x, y, z, parent);
    const pyramid = (x, z, base, h, color, parent = p) => { const m = shape(new T.ConeGeometry(base * .7071, h, 4), color, x, h / 2, z, parent); m.rotation.y = Math.PI / 4; return m; };
    const cypress = (x, z) => { c('#7a6448', x, .6, z, .12, 1.2, .1, 6); shape(new T.ConeGeometry(.55, 3.2, 8), '#4f7a4c', x, 2.6, z); };
    if (place.id === 'wall') {
      // The wall climbs over green hills, with watchtowers and battlements.
      for (const [x, z, s] of [[-16, -12, 7], [-2, -15, 9], [12, -17, 8], [20, -13, 6]]) ball(p, '#9fbf83', x, 0, z, s, s * .45, s * .8);
      const pts = [[-20, -2, 0], [-12, -8, 1.2], [-4, -6, .4], [4, -12, 2.2], [12, -10, 1.4], [20, -14, 2.8]];
      pts.forEach(([x, z, h], i) => {
        if (i) {
          const [px, pz, ph] = pts[i - 1], len = Math.hypot(x - px, z - pz), ang = -Math.atan2(z - pz, x - px), mid = (h + ph) / 2;
          const m = b('#bbb894', (x + px) / 2, 2 + mid, (z + pz) / 2, len, 4, 2.6); m.rotation.y = ang;
          const walk = b('#d6cba3', (x + px) / 2, 4.1 + mid, (z + pz) / 2, len, .2, 2.2); walk.rotation.y = ang;
          for (let k = 0; k < Math.floor(len / 1.3); k++) for (const side of [-1, 1]) {
            const f = (k + .5) / Math.floor(len / 1.3), cx = px + (x - px) * f + Math.sin(-ang) * side * 1.15, cz = pz + (z - pz) * f + Math.cos(-ang) * side * 1.15;
            const m2 = b('#c9c19b', cx, 4.6 + ph + (h - ph) * f, cz, .6, .8, .3); m2.rotation.y = ang;
          }
        }
        b('#c5bd97', x, 3.4 + h, z, 4.2, 6.8 + h * .2, 4.2); b('#ddd0a7', x, 6.9 + h, z, 4.9, .5, 4.9);
        for (const dx of [-1.6, 0, 1.6]) for (const dz of [-1.9, 1.9]) b('#c5bd97', x + dx, 7.5 + h, z + dz, .7, .9, .5);
        b('#6d6750', x, 4 + h, z + 2.11, .9, 1.3, .05); b('#6d6750', x - 2.11, 4 + h, z, .05, 1.3, .9);
      });
    } else if (place.id === 'giza') {
      for (const [x, z, s] of [[-14, -15, 6], [15, -16, 7], [-17, -2, 4], [17, -3, 4]]) ball(p, '#e6cf98', x, -.3, z, s, s * .25, s * .7);
      pyramid(-4, -9, 15, 11, '#d6b779'); pyramid(-4, -9, 3.1, 2.3, '#efe1b8').position.y = 10;
      pyramid(7, -4, 10, 7.5, '#dcbf83'); pyramid(13, 0, 5, 3.6, '#d2b273');
      for (let i = 0; i < 4; i++) b('#c7a86e', -4, .25 + i * .5, -1.6 + i * .55, 4 - i * .4, .5, .55);
      for (const [x, z] of [[-15, 2], [16, 3]]) { segment(p, '#94744b', [x, 0, z], [x + .4, 4.4, z], .22); for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2, leaf = ball(p, '#6fae5f', x + .4 + Math.cos(ang) * 1.4, 4.2, z + Math.sin(ang) * 1.4, 1.7, .12, .45); leaf.rotation.y = -ang; } }
    } else if (place.id === 'petra') {
      // A layered sandstone cliff with the carved Treasury facade.
      for (let i = -3; i <= 3; i++) for (let layer = 0; layer < 3; layer++) ball(p, ['#c58e70', '#d5a17e', '#b87f64'][(i + layer + 9) % 3], i * 4.8, 3 + layer * 4.2, -8 - layer * .6, 3.8, 3.2, 3.5);
      b('#edbc96', 0, 4, -1.6, 15, 8, 1.8);
      for (const x of [-6, -3.6, -1.2, 1.2, 3.6, 6]) { c('#f3cba5', x, 3.6, -.3, .42, 7.2); b('#f1c7a1', x, 7.4, -.3, 1.1, .4, 1.1); }
      b('#7d5a47', 0, 2.6, -.66, 2.2, 5.2, .1); b('#e6ad85', 0, 7.9, -.4, 15.5, .7, 2.4);
      const ped = cylinder(p, '#efc39a', 0, 9.3, -.5, 0, 8, 2.2, 3); ped.rotation.z = Math.PI / 2; ped.rotation.y = Math.PI / 2; ped.scale.set(1, 1, .22);
      b('#edbc96', 0, 11.8, -1.6, 13, 5, 1.6);
      c('#f3cba5', 0, 12.2, -.6, 1.9, 4.4, 1.9, 16); for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; c('#f6d4b1', Math.cos(ang) * 2.1, 12.2, -.6 + Math.sin(ang) * 1, .2, 4.2); }
      lathe([[2, 0], [1.6, .7], [.5, 1.3], [.4, 2], [.7, 2.4], [0, 2.9]], '#f1c7a1', 0, 14.4, -.6);
      for (const x of [-5.4, 5.4]) { c('#f3cba5', x, 12, -.6, .35, 4); const half = cylinder(p, '#efc39a', x, 14.6, -.6, 0, 2.2, 1.2, 3); half.rotation.y = Math.PI / 2; half.scale.z = .25; }
    } else if (place.id === 'eiffel') {
      const zc = -6, legTop = 9, iron = '#9b7b57', dark = '#7f6446';
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const base = [sx * 6.5, 0, zc + sz * 6.5], mid = [sx * 4.2, 4.2, zc + sz * 4.2], top = [sx * 2.2, legTop, zc + sz * 2.2];
        segment(p, iron, base, mid, .55); segment(p, iron, mid, top, .42);
        for (let k = 0; k < 4; k++) { const f0 = k / 4, f1 = (k + 1) / 4, lerp = (u, v, f) => u.map((n, i) => n + (v[i] - n) * f);
          const p0 = lerp(base, top, f0), p1 = lerp(base, top, f1); segment(p, dark, [p0[0] - sx * .5, p0[1], p0[2]], [p1[0] + sx * .4, p1[1], p1[2]], .07); }
      }
      b(dark, 0, 4.3, zc, 10.8, .55, 10.8); b('#b39066', 0, 4.75, zc, 11.2, .2, 11.2);
      const archFront = api.mesh(p, new T.TorusGeometry(3.4, .22, 6, 20, Math.PI), dark, 0, 0, zc + 5.3); archFront.scale.y = 1.15;
      b(dark, 0, legTop, zc, 5.2, .45, 5.2); b('#b39066', 0, legTop + .4, zc, 5.6, .15, 5.6);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) segment(p, iron, [sx * 2, legTop, zc + sz * 2], [sx * .5, 18, zc + sz * .5], .26);
      for (let y = 11; y < 18; y += 1.6) { const w = 2 - (y - legTop) / 9 * 1.5; b(dark, 0, y, zc, w * 2.05, .12, w * 2.05); }
      b(dark, 0, 18.2, zc, 1.5, .9, 1.5); segment(p, iron, [0, 18.6, zc], [0, 21.5, zc], .12);
      for (const x of [-11, 11]) for (const z of [-1, 3]) { b('#a6cd8c', x, .1, z, 5, .2, 3.2); cypress(x + (x < 0 ? 2.8 : -2.8), z); }
    } else if (place.id === 'taj') {
      b('#efe3c6', 0, .5, -6, 26, 1, 19); b('#e5d6b6', 0, 1.05, -6, 26.4, .1, 19.4);
      const body = c('#fff4dc', 0, 4.4, -6, 7.4, 7, 7.4, 8); body.rotation.y = Math.PI / 8;
      a(0, 1, -1.6, 4.4, 6.4, '#e6d8b8'); b('#f9efd6', 0, 4.2, -1.7, 5.8, 7, .3);
      for (const x of [-4.6, 4.6]) { a(x, 1.2, -2.6, 2, 2.6, '#e6d8b8'); a(x, 4.4, -2.6, 2, 2.6, '#e6d8b8'); }
      c('#fff7e4', 0, 8.9, -6, 3.6, 2, 3.6, 20);
      lathe([[3.6, 0], [4.3, 1], [4.6, 2.2], [4.3, 3.4], [3.5, 4.5], [2.3, 5.5], [1.1, 6.4], [.3, 7.2], [0, 7.6]], '#fffaee', 0, 9.9, -6);
      segment(p, '#d9bc79', [0, 17.4, -6], [0, 19.2, -6], .1); ball(p, '#d9bc79', 0, 18.3, -6, .22);
      for (const x of [-4.6, 4.6]) for (const z of [-10.2, -1.8]) { c('#fff4dc', x, 8.6, z, .9, 1.4, .9, 8); for (const dx of [-.6, .6]) c('#fff4dc', x + dx, 9.6, z, .12, .8); lathe([[1, 0], [1.1, .4], [.8, 1], [.3, 1.4], [0, 1.7]], '#fffaee', x, 10, z); }
      for (const x of [-11.6, 11.6]) for (const z of [-14, 2]) {
        c('#fff2d8', x, 6.5, z, .75, 12, .55, 12);
        for (const y of [4, 8, 11.6]) c('#e8dcc0', x, y, z, 1.05, .3, 1.05, 12);
        c('#fff2d8', x, 12.6, z, .6, 1, .6, 8); lathe([[.85, 0], [.9, .3], [.6, .8], [0, 1.3]], '#fffaee', x, 13.1, z);
      }
      b('#6fb7bb', 0, 1.12, 9, 2.4, .1, 16); b('#e9dcc0', 0, 1.06, 9, 3.4, .08, 16.6);
      for (let z = 3; z <= 15; z += 3) for (const x of [-3, 3]) cypress(x, z);
    } else if (place.id === 'colosseum') {
      // Three rings of arches and an upper wall, with one side worn away by time.
      const zc = -5, n = 26;
      for (let i = 0; i < n; i++) {
        const ang = i / n * Math.PI * 2, x = Math.cos(ang) * 12.5, z = Math.sin(ang) * 8.5 + zc;
        const worn = ang > Math.PI * 1.15 && ang < Math.PI * 1.6;
        const frame = group(x, 0, z, p); frame.rotation.y = -ang - Math.PI / 2;
        const levels = worn ? 1 + (i % 2) : 3;
        for (let level = 0; level < levels; level++) arch(frame, level === 1 ? '#e7d0a6' : place.color, 0, level * 3.6, 0, 3.1, 3.5);
        if (!worn) box(frame, '#d6bf93', 0, 11.6, 0, 3.2, 1.6, .7);
      }
      const arena = cylinder(p, '#cbb58b', 0, .15, zc, 8.2, 8.2, .3, 28); arena.scale.z = .62;
      for (let r = 0; r < 4; r++) { const tier = cylinder(p, '#bea67d', 0, .6 + r * .7, zc, 9.2 + r * .8, 9.4 + r * .8, .5, 30); tier.scale.z = .64; }
    } else if (place.id === 'opera') {
      b('#ddd3bd', 0, .9, -6, 22, 1.8, 13); b('#cfc4ac', 0, 1.85, -6, 22.4, .1, 13.4);
      for (let i = 0; i < 9; i++) b('#e9e0cb', 0, .1 + i * .2, 1.2 + i * .22, 9, .2, .5);
      b('#6fb3c7', 0, .06, -15.5, 34, .1, 6);
      const white = new T.MeshStandardMaterial({ color: '#fbf8f0', roughness: .35, side: T.DoubleSide });
      const shell = (x, z, r, tilt, turn) => { const m = new T.Mesh(new T.SphereGeometry(r, 22, 12, 0, Math.PI, 0, Math.PI / 2), white); m.position.set(x, 1.9, z); m.rotation.set(tilt, turn, 0); m.scale.set(.72, 1.7, 1); m.castShadow = true; p.add(m); const rib = new T.Mesh(new T.TorusGeometry(r, .06, 4, 22, Math.PI), new T.MeshStandardMaterial({ color: '#d9d2c0' })); rib.position.copy(m.position); rib.rotation.set(tilt, turn, 0); rib.scale.copy(m.scale); p.add(rib); return m; };
      [[-6.5, -2, 5.4, -.55], [-6.5, -6, 4.4, -.75], [-6.5, -9.5, 3.2, -.95]].forEach(([x, z, r, t]) => shell(x, z, r, t, 0));
      [[4.5, -2.5, 4.6, -.55], [4.5, -6, 3.8, -.75], [4.5, -9, 2.8, -.95]].forEach(([x, z, r, t]) => shell(x, z, r, t, 0));
      shell(12, -3, 2.2, -.6, 0);
    } else if (place.id === 'chichen') {
      const zc = -6;
      for (let i = 0; i < 9; i++) { const w = 22 - i * 2.1; b(i % 2 ? '#c2b88f' : '#d1c59a', 0, .55 + i * 1.05, zc, w, 1.05, w); b('#b0a57e', 0, 1.02 + i * 1.05, zc, w + .2, .1, w + .2); }
      b('#c9bd91', 0, 10.4, zc, 5.4, 2.8, 5.4); b('#b5a982', 0, 12, zc, 6, .4, 6);
      for (const [dx, dz] of [[0, 2.71], [2.71, 0], [-2.71, 0]]) b('#6f6a52', dx, 10.1, zc + dz, dz ? 1.4 : .05, 2, dz ? .05 : 1.4);
      for (const [rx, rz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (let i = 0; i < 18; i++) {
        const d = 11.1 - i * .58, y = .27 + i * .52; b('#e3d2a9', rx * d, y, zc + rz * d, rz ? 3.2 : .62, .52, rz ? .62 : 3.2);
      }
      for (const x of [-1.9, 1.9]) { ball(p, '#a9a07c', x, .7, zc + 11.9, .7, .6, .9); ball(p, '#6f6a52', x, .9, zc + 12.6, .12); }
    } else if (place.id === 'borobudur') {
      const zc = -6, stone = ['#8d877a', '#999385', '#837d70'];
      for (let i = 0; i < 5; i++) {
        const w = 24 - i * 3; b(stone[i % 3], 0, .6 + i * 1.2, zc, w, 1.2, w); b('#a49e8f', 0, 1.25 + i * 1.2, zc, w + .2, .15, w + .2);
        for (let k = 0; k < 8; k++) for (const side of [-1, 1]) { const t = -w / 2 + .8 + k * (w - 1.6) / 7; ball(p, '#a8a294', t, 1.55 + i * 1.2, zc + side * (w / 2 - .2), .22, .3, .22); ball(p, '#a8a294', side * (w / 2 - .2), 1.55 + i * 1.2, zc + t, .22, .3, .22); }
      }
      [[5.2, 12], [4, 9], [2.8, 6]].forEach(([r, count], ring) => {
        const y = 6.6 + ring * .9; c('#9a9486', 0, y - .3, zc, r + 1, .9, r + 1, 32);
        for (let k = 0; k < count; k++) { const ang = k / count * Math.PI * 2 + ring * .2, x = Math.cos(ang) * r, z = zc + Math.sin(ang) * r;
          c('#8f897c', x, y + .3, z, .5, .3, .5, 10); lathe([[.55, 0], [.62, .35], [.55, .7], [.32, 1], [.12, 1.12], [0, 1.15]], '#a8a294', x, y + .45, z); segment(p, '#a8a294', [x, y + 1.5, z], [x, y + 2, z], .08); }
      });
      lathe([[1.7, 0], [1.9, .6], [1.75, 1.3], [1.1, 2], [.4, 2.3], [0, 2.35]], '#a8a294', 0, 9.5, zc); segment(p, '#a8a294', [0, 11.8, zc], [0, 13.2, zc], .14);
      for (let i = 0; i < 8; i++) b('#9a9486', 0, .3 + i * .6, zc + 12.3 - i * .38, 2.4, .6, .5);
    } else if (place.id === 'machu') {
      const peak = cylinder(p, '#6f9670', 4, 10, -17, .6, 7, 20, 7); peak.scale.z = .7;
      const mountain = cylinder(p, '#7c9f78', -7, 6, -15, 1, 9, 13, 6); mountain.scale.z = .65;
      for (let i = 0; i < 5; i++) { b('#b7b88d', 0, .5 + i * .7, -5 - i * 2.2, 28 - i * 3, 1.1, 5.4); b('#8eae73', 0, 1.1 + i * .7, -5 - i * 2.2, 27 - i * 3, .15, 5); }
      for (const [x, z, y] of [[-8, -6, 1.5], [-3, -6, 1.5], [4, -6, 1.5], [9, -6, 1.5], [-5, -10.4, 2.9], [2, -10.4, 2.9], [7, -10.4, 2.9]]) {
        b('#d1cba6', x, y + .5, z, 3.2, 2.6, 3.2); b('#777d61', x, y + .2, z + 1.62, .8, 1.7, .05);
        pyramid(x, z, 4.4, 2, '#a58b5a').position.y = y + 2.8;
      }
    } else if (place.id === 'petronas') {
      const steel = '#c9ced3', glass = '#9fb2bf';
      b('#b7bcc2', 0, 1, -7, 22, 2, 9);
      for (const x of [-5.5, 5.5]) {
        for (let i = 0; i < 9; i++) { const r = 2.3 - (i > 5 ? (i - 5) * .32 : 0), y = 2 + i * 2.4; const tier = c(i % 2 ? steel : '#dde1e5', x, y + 1.2, -7, r, 2.4, r, 8); tier.rotation.y = Math.PI / 8; c(glass, x, y + 2.35, -7, r + .05, .16, r + .05, 8); }
        shape(new T.ConeGeometry(.8, 3, 8), steel, x, 24.9, -7); segment(p, '#aeb4ba', [x, 26, -7], [x, 30.5, -7], .12); ball(p, '#dde1e5', x, 27.5, -7, .35);
      }
      b('#9aa2a9', 0, 11.5, -7, 7, .9, 1.4); b(glass, 0, 11.5, -6.3, 7, .5, .05);
      for (const sx of [-1, 1]) segment(p, '#9aa2a9', [sx * 3.3, 7, -7], [sx * .6, 11, -7], .18);
    } else if (place.id === 'rio') {
      const mount = cylinder(p, '#7b9b7b', 0, 6, -9, 2, 12, 14, 7); mount.scale.z = .75;
      for (let i = 0; i < 18; i++) { const ang = i * 2.4, r = 6 + i % 4 * 1.7; ball(p, ['#6d9a64', '#7fae6a', '#5f8f59'][i % 3], Math.cos(ang) * r, 2 + (i % 3), -9 + Math.sin(ang) * r * .7, 1.8, 1.5, 1.8); }
      b('#d6ca9d', 0, 13.3, -9, 7, .6, 5);
      // No statue or human religious figure. The viewpoint represents the site.
      for (const x of [-3, 3]) segment(p, '#daceac', [x, 13.5, -7], [x, 14.5, -7], .12);
      segment(p, '#daceac', [-3, 14.5, -7], [3, 14.5, -7], .1);
      for (let i = 0; i < 5; i++) ball(p, '#93b3a0', 17 + i * 3, -.2, -16 + i * 2, 5, 1, 3);
    }
    return p;
  }
  // Activities for the newer wonders. Steps are in front of each landmark; positions are relative to its centre.
  const glowMat = (T, colour) => new T.MeshBasicMaterial({ color: colour });
  const custom = {
    giza: {
      steps(n) { const k = Math.floor(n / 2) + 1; return n % 2 ? { x: 8, z: 15, icon: '🔺', verb: 'BUILD', text: `Add layer ${k} to the pyramid` } : { x: -10, z: 15, icon: '🪨', verb: 'LIFT', text: `Lift stone ${k}` }; },
      say(n) { return n % 2 ? 'Heave! A big stone block. Carry it to the little pyramid.' : n === 6 ? 'Layer 3! The pyramid is finished. A pyramid has a square bottom and a pointy top. Big layers at the bottom, small at the top!' : `Layer ${n / 2}! Fetch another stone from the pile.`; },
      models(api, g) {
        const quarry = [0, 1, 2].map(i => api.box(g, '#cfae72', -11 + i * 1.6, .7, 14 + (i % 2) * .8, 1.4, 1.2, 1.2));
        api.sign('STONE PILE', g.position.x - 10, 3.6, g.position.z + 14, 6); api.sign('LITTLE PYRAMID', g.position.x + 8, 5.2, g.position.z + 15, 7.5);
        api.disk(g, '#d9c08a', 8, 15, 3.2);
        const layers = [[3.8, 0], [2.6, 1], [1.4, 2]].map(([w, i]) => api.box(g, ['#dcbf83', '#d6b779', '#e6cc93'][i], 8, .45 + i * .9, 15, w, .9, w));
        const carried = api.box(g, '#cfae72', 0, -9, 0, 1, .8, 1);
        const camels = [0, 1].map(i => {
          const c = api.group(-14 + i * 4, 0, 27 + i * 1.5, g), col = '#c89a62';
          api.ball(c, col, 0, 1.9, 0, .7, .55, 1.2); api.ball(c, col, 0, 2.55, -.1, .45, .5, .5); api.segment(c, col, [0, 2.1, .9], [0, 3, 1.5], .2); api.ball(c, col, 0, 3.05, 1.75, .25, .22, .45);
          const legs = []; for (const x of [-.35, .35]) for (const z of [-.7, .7]) { const l = api.group(x, 1.6, z, c); api.segment(l, col, [0, 0, 0], [0, -1.6, 0], .1); legs.push(l); }
          return { c, legs, phase: i * 1.3 };
        });
        return {
          sync(n) { layers.forEach((l, i) => { l.visible = i < Math.floor(n / 2); }); quarry.forEach((q, i) => { q.visible = i >= Math.ceil(n / 2); }); this.carrying = n % 2 === 1; },
          update(dt, t, n, player) {
            carried.visible = !!this.carrying && !!player; if (carried.visible) carried.position.set(player.x - g.position.x, 2.6, player.z - g.position.z - .8);
            camels.forEach(m => { const x = Math.sin(t * .25 + m.phase) * 9; m.c.position.x = x; m.c.rotation.y = Math.cos(t * .25 + m.phase) > 0 ? Math.PI / 2 : -Math.PI / 2; m.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 5 + i * 1.6) * .3; }); });
          }
        };
      }
    },
    eiffel: {
      steps(n) { const [x, z] = [[-8, 15], [0, 22], [8, 15]][n]; return { x, z, icon: '💡', verb: 'LIGHT', text: `Light level ${n + 1}` }; },
      say(n) { return n < 3 ? `Level ${n} is shining! Now light level ${n + 1}.` : 'All three levels are shining! One, two, three, from the bottom to the top. The real tower sparkles with lights at night!'; },
      models(api, g) {
        const lamps = [[-8, 15], [0, 22], [8, 15]].map(([x, z], i) => { api.segment(g, '#5d5a52', [x, 0, z], [x, 3, z], .09); api.sign(String(i + 1), g.position.x + x, 4.4, g.position.z + z, 1.6); return api.ball(g, '#efe6c7', x, 3.2, z, .38); });
        const rings = [[5.8, 6.2], [13.1, 3], [26.3, 1.2]].map(([y, r]) => { const m = api.mesh(g, new api.T.TorusGeometry(r * 1.15, .18, 6, 28), '#ffe27a', 0, y, -6.6); m.rotation.x = Math.PI / 2; m.material = glowMat(api.T, '#ffe27a'); return m; });
        const lit = glowMat(api.T, '#ffe27a'), off = lamps[0].material;
        return { sync(n) { rings.forEach((r, i) => { r.visible = i < n; }); lamps.forEach((l, i) => { l.material = i < n ? lit : off; }); }, update(dt, t) { rings.forEach((r, i) => { r.scale.setScalar(1 + Math.sin(t * 3 + i) * .03); }); } };
      }
    },
    opera: {
      steps(n) { const [x, z] = [[-9, 14], [-3, 20], [3, 24], [9, 18]][n]; return { x, z, icon: '🦘', verb: 'HOP', text: `Hop onto stone ${n + 1}`, auto: true, hop: true }; },
      say(n) { return n < 4 ? `Boing! ${n}! Hop to the next stone.` : 'Boing! Four hops! Kangaroos hop on their strong back legs. A mother kangaroo carries her baby, called a joey, in a pouch.'; },
      models(api, g) {
        const stones = [[-9, 14], [-3, 20], [3, 24], [9, 18]];
        stones.forEach(([x, z], i) => { api.disk(g, '#c7c1b0', x, z, 1.8); api.sign(`${i + 1} HOP`, g.position.x + x, 2.8, g.position.z + z, 3.4); });
        const k = api.group(-13, 0, 12, g), col = '#b9824f';
        api.ball(k, col, 0, 1.4, 0, .6, .85, .55); api.ball(k, '#e2c39a', 0, 1.3, .35, .35, .5, .2); api.ball(k, col, 0, 2.45, .25, .32, .3, .42);
        for (const sd of [-1, 1]) { api.ball(k, col, sd * .14, 2.85, .1, .09, .3, .06); api.ball(k, '#2b211a', sd * .14, 2.55, .55, .05); api.ball(k, col, sd * .3, .25, .3, .14, .12, .55); }
        const tail = api.segment(k, col, [0, 1, -.4], [0, .2, -1.5], .14);
        let target = { x: -13, z: 12 }, from = { x: -13, z: 12 }, f = 1;
        return {
          sync(n) { const s = n ? stones[n - 1] : [-13, 12]; from = { x: k.position.x, z: k.position.z }; target = { x: s[0] + 1.6, z: s[1] - 1.2 }; f = 0; },
          update(dt, t) { f = Math.min(1, f + dt * 1.4); k.position.x = from.x + (target.x - from.x) * f; k.position.z = from.z + (target.z - from.z) * f; k.position.y = f < 1 ? Math.sin(f * Math.PI) * 1.5 : Math.abs(Math.sin(t * 2.4)) * .25; void tail; }
        };
      }
    },
    borobudur: {
      steps(n) { const [x, z] = [[-11, 14], [-4, 24], [4, 24], [11, 14]][n]; return { x, z, icon: '🔔', verb: 'FIND', text: `Find stupa ${n + 1}`, auto: true }; },
      say(n) { return n < 4 ? `Stupa ${n}! It is shaped like a bell. Find the next one.` : 'You found all four stupas! At the top of Borobudur, many stupas sit in circles on round terraces.'; },
      models(api, g) {
        const glows = [[-11, 14], [-4, 24], [4, 24], [11, 14]].map(([x, z], i) => {
          api.cylinder(g, '#8f897c', x, .35, z, 1.4, 1.5, .7, 12);
          const bell = api.mesh(g, new api.T.LatheGeometry([[1.2, 0], [1.35, .7], [1.2, 1.4], [.7, 2], [.25, 2.25], [0, 2.3]].map(([r, h]) => new api.T.Vector2(r, h)), 18), '#a8a294', x, .7, z);
          api.segment(g, '#a8a294', [x, 3, z], [x, 4, z], .12); api.sign(String(i + 1), g.position.x + x, 5.2, g.position.z + z, 1.6);
          const glow = api.mesh(g, new api.T.TorusGeometry(1.7, .14, 6, 24), '#ffe27a', x, .2, z); glow.rotation.x = Math.PI / 2; glow.material = glowMat(api.T, '#ffe27a'); void bell; return glow;
        });
        return { sync(n) { glows.forEach((gl, i) => { gl.visible = i < n; }); }, update(dt, t) { glows.forEach((gl, i) => { gl.position.y = .25 + Math.sin(t * 2 + i) * .1; }); } };
      }
    },
    petronas: {
      steps(n) { const right = n % 2 === 1, floor = Math.floor(n / 2) + 1; return { x: right ? 6 : -6, z: 15, icon: right ? '➡️' : '⬅️', verb: 'STACK', text: `Add floor ${floor} to the ${right ? 'right' : 'left'} tower` }; },
      say(n) { return n % 2 ? 'Now add the same floor to the other tower, so they match!' : n === 8 ? 'Both towers have four floors. They match! And look, the sky bridge joins them. Twin towers!' : `Both towers have ${n / 2} floor${n > 2 ? 's' : ''}. They match!`; },
      models(api, g) {
        const floors = [-1, 1].map(sd => { api.disk(g, '#b7bcc2', sd * 6, 15, 2.2); return [0, 1, 2, 3].map(i => api.box(g, i % 2 ? '#c9ced3' : '#dde1e5', sd * 6, .6 + i * 1.15, 15, 2.2 - i * .2, 1.1, 2.2 - i * .2)); });
        const bridge = api.box(g, '#9aa2a9', 0, 3.4, 15, 9.6, .4, .8);
        api.sign('BUILD TWIN TOWERS', g.position.x, 7.5, g.position.z + 15, 9);
        return { sync(n) { floors[0].forEach((f, i) => { f.visible = i < Math.ceil(n / 2); }); floors[1].forEach((f, i) => { f.visible = i < Math.floor(n / 2); }); bridge.visible = n >= 8; }, update() {} };
      }
    }
  };
  places.forEach(p => { if (custom[p.id]) Object.assign(p, custom[p.id]); });
  const signY = { taj: 27, eiffel: 34, petronas: 48, machu: 32 };
  places.forEach(p => { p.signY = signY[p.id] || 22; });
  window.WonderPlaces = Object.freeze({ places, picture, build });
})();
