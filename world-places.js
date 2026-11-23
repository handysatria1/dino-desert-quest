/* Stylised educational park replicas, not accurate reconstructions or a geographic map. */
(() => {
  'use strict';
  const places = [
    { id: 'wall', name: 'Great Wall', country: 'China', icon: '🧱', color: '#b4bf9b', ground: '#bed390', x: -69, z: -52, activity: 'Carry three stones to our model wall', verb: 'BUILD', fact: 'The Great Wall is in China. It is made of many connected walls, built over a very long time.', skill: 'Count three stones. Watch a small wall grow.', total: 6 },
    { id: 'petra', name: 'Petra', country: 'Jordan', icon: '🏜️', color: '#dba17c', ground: '#e4c599', x: 0, z: -85, activity: 'Follow red, yellow, then blue', verb: 'FOLLOW', fact: 'Petra is in Jordan. Some of its buildings were carved into pink sandstone rock.', skill: 'Remember a three-colour trail, then try it backwards.', total: 3 },
    { id: 'taj', name: 'Taj Mahal', country: 'India', icon: '🌷', color: '#fff2d8', ground: '#a9ce95', x: 69, z: -52, activity: 'Water matching garden beds', verb: 'WATER', fact: 'The Taj Mahal is in India. Its gardens and building have matching shapes on both sides. That is called symmetry.', skill: 'Find three matching pairs in a pretend garden.', total: 6 },
    { id: 'colosseum', name: 'Colosseum', country: 'Italy', icon: '🏛️', color: '#ddc79f', ground: '#d5cd9a', x: 85, z: 28, activity: 'Build a little arch from three shapes', verb: 'FIT', fact: 'The Colosseum is in Rome, in Italy. An arch is a curved opening. Look for rows of arches.', skill: 'Fit two supports and a curved top to a toy arch.', total: 3 },
    { id: 'chichen', name: 'Chichén Itzá', country: 'Mexico', icon: '🔺', color: '#c7bd93', ground: '#c0d58e', x: 38, z: 80, activity: 'Follow five stepping stones', verb: 'HOP', fact: 'Chichén Itzá is an ancient Maya city in Mexico. Its famous stepped pyramid has many stairs.', skill: 'Count five stones. Hop on two of them in our pretend trail.', total: 5 },
    { id: 'machu', name: 'Machu Picchu', country: 'Peru', icon: '🦙', color: '#b0b392', ground: '#9fbe80', x: -38, z: 80, activity: 'Guide a little llama to its meadow', verb: 'HELP', fact: 'Machu Picchu is high in the Andes mountains in Peru. The Inca made flat terraces on the steep hillsides.', skill: 'Guide a pretend llama through three terraces and home.', total: 4 },
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
    else art = '<circle cx="65" cy="50" r="37" fill="#7db5ac"/><path d="M32 25L60 20L75 40L50 52L55 82M83 35L101 47L90 72L72 63" fill="#b2cf89"/>';
    return `<svg viewBox="0 0 132 104" aria-hidden="true"><rect width="132" height="104" rx="15" fill="${id === 'petra' ? '#f4ddbb' : '#dcebcf'}"/>${art}</svg>`;
  }
  function build(api, place) {
    const { group, box, ball, cylinder, segment, arch } = api, p = group(place.x, 0, place.z);
    const b = (color, x, y, z, sx, sy, sz) => box(p, color, x, y, z, sx, sy, sz);
    const c = (color, x, y, z, radius, height, top = radius, sides = 10) => cylinder(p, color, x, y, z, top, radius, height, sides);
    const a = (x, y, z, width = 3, height = 5, color = place.color) => arch(p, color, x, y, z, width, height);
    if (place.id === 'wall') {
      const pts = [[-18, -4], [-9, -8], [0, -5], [8, -12], [18, -10]];
      pts.forEach(([x, z], i) => {
        if (i) { const [px, pz] = pts[i - 1]; const m = b('#bbc09c', (x + px) / 2, 2, (z + pz) / 2, Math.hypot(x - px, z - pz), 4, 2.5); m.rotation.y = -Math.atan2(z - pz, x - px); }
        b('#c5bd97', x, 3, z, 4, 6, 4); b('#ddd0a7', x, 6.1, z, 4.8, .5, 4.8);
        for (const dx of [-1.6, 0, 1.6]) b('#c5bd97', x + dx, 6.6, z, .7, .9, 4.2);
      });
    } else if (place.id === 'petra') {
      for (let i = -2; i <= 2; i++) ball(p, i % 2 ? '#c58e70' : '#d5a17e', i * 6, 5, -7, 5, 8 + i % 2 * 2, 4);
      b('#edbc96', 0, 4, -1.5, 17, 8, 2); b('#c58e70', 0, 3, -.43, 3, 6, .1);
      for (const x of [-7, -4, 4, 7]) { c('#f1c7a1', x, 4, 0, .48, 7); b('#f1c7a1', x, 7.5, 0, 1.5, .5, 1.5); }
      b('#e6ad85', 0, 8, 0, 18, .65, 2.8);
      const roof = cylinder(p, '#efc39a', 0, 9.7, -1, 0, 10, 4, 3); roof.rotation.y = Math.PI / 2; roof.scale.z = .18;
      c('#edbc96', 0, 11, -2, 2.4, 4); c('#f2caa3', 0, 13.5, -2, .4, 1.2);
    } else if (place.id === 'taj') {
      b('#e8d9bd', 0, .4, -6, 23, .8, 18); b('#fff3d9', 0, 3.6, -6, 13, 6, 10);
      ball(p, '#fff9e8', 0, 8, -6, 4.3, 4.3, 4.3); c('#d9bc79', 0, 12.3, -6, .12, 1.6);
      a(0, .8, -.9, 3.8, 5.3, '#d0c4a5');
      for (const x of [-10, 10]) for (const z of [-13, 1]) { c('#fff2d8', x, 5, z, .65, 9); c('#d2c3a2', x, 9, z, 1, .4); ball(p, '#fff9e8', x, 10, z, 1.05, 1.2, 1.05); }
      b('#7ab9b9', 0, .12, 7, 2, .12, 12);
    } else if (place.id === 'colosseum') {
      for (let i = 0; i < 18; i++) {
        const angle = i / 18 * Math.PI * 2, x = Math.cos(angle) * 12, z = Math.sin(angle) * 8 - 5;
        const frame = group(x, 0, z, p); frame.rotation.y = -angle - Math.PI / 2;
        for (let level = 0; level < 2; level++) arch(frame, place.color, 0, level * 4, 0, 3.4, 3.8);
      }
      b('#c9b68e', 0, .15, -5, 16, .3, 10);
    } else if (place.id === 'chichen') {
      for (let i = 0; i < 7; i++) b(i % 2 ? '#c2b88f' : '#d1c59a', 0, .6 + i * 1.1, -6, 21 - i * 2.2, 1.1, 19 - i * 2);
      b('#c9bd91', 0, 9, -6, 5.2, 3.2, 4.5); b('#827e60', 0, 8.8, -3.7, 1.5, 2.7, .1);
      for (let i = 0; i < 15; i++) b('#e3d2a9', 0, .28 + i * .5, 4 - i * .6, 3, .5, .65);
    } else if (place.id === 'machu') {
      const mountain = cylinder(p, '#7c9f78', 0, 8, -15, 1, 10, 18, 6); mountain.scale.z = .65;
      for (let i = 0; i < 4; i++) { b('#b7b88d', 0, .5 + i * .7, -6 - i * 2.5, 27 - i * 3, 1.1, 6); b('#8eae73', 0, 1.1 + i * .7, -6 - i * 2.5, 26 - i * 3, .15, 5.5); }
      for (const x of [-8, -3, 4, 9]) { b('#d1cba6', x, 2, -6, 3.5, 3, 3.5); b('#a1ab83', x, 3.6, -6, 4, .4, 4); b('#777d61', x, 1.8, -4.2, .9, 2, .1); }
    } else if (place.id === 'rio') {
      const mount = cylinder(p, '#7b9b7b', 0, 6, -9, 2, 12, 14, 7); mount.scale.z = .75;
      b('#d6ca9d', 0, 13.3, -9, 7, .6, 5);
      // No statue or human religious figure. The viewpoint represents the site.
      for (const x of [-3, 3]) segment(p, '#daceac', [x, 13.5, -7], [x, 14.5, -7], .12);
      segment(p, '#daceac', [-3, 14.5, -7], [3, 14.5, -7], .1);
      for (let i = 0; i < 5; i++) ball(p, '#93b3a0', 17 + i * 3, -.2, -16 + i * 2, 5, 1, 3);
    }
    return p;
  }
  window.WonderPlaces = Object.freeze({ places, picture, build });
})();
