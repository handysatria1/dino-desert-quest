/* Playable, architectural learning rooms. Not reconstructions of monument interiors. */
(() => {
  'use strict';
  const rooms = {
    wall: { name: 'Inside the watchtower', welcome: 'Step inside our pretend watchtower! Look through the windows, explore the bricks, and see how a wall follows the hills.', things: [
      ['🪟', 'A lookout window', 'A watchtower has high windows. From a tower, people could look a long way along the wall. Our window opens onto a pretend mountain view.'],
      ['🧱', 'Strong brick layers', 'Look at the bricks! The joins do not all line up. Overlapping layers can help a wall stay strong.'],
      ['⛰️', 'A wall on the hills', 'Our little wall bends up and down over the hills. The Great Wall is not one straight line.'] ] },
    petra: { name: 'Inside the sandstone hall', welcome: 'Welcome inside our pretend sandstone hall! Explore the columns, stone patterns and a little water model.', things: [
      ['🏛️', 'Carved columns', 'At Petra, people carved some buildings into sandstone rock. A carved column is shaped from the rock around it.'],
      ['💧', 'Saving precious water', 'Petra is in a dry place. Channels and storage tanks helped people collect and save water. Tap again to fill our pretend water tank.'],
      ['🪨', 'Sandstone colours', 'Sandstone can have different coloured layers. Look at the pink, orange and sandy stripes in our model.'] ] },
    taj: { name: 'Inside the pattern hall', welcome: 'Welcome to our pretend pattern hall! Find the matching flowers, explore a big arch and look up at a model dome.', things: [
      ['🌸', 'Matching flower patterns', 'The Taj Mahal has beautiful floral decoration. Here our pretend flowers match on both sides. That is symmetry!'],
      ['🏛️', 'A tall curved arch', 'An arch makes a curved opening. Our model arch has a left side and a matching right side.'],
      ['◠', 'A dome overhead', 'A dome is a rounded roof. This little cutaway model lets you see its curved shape from inside.'] ] },
    colosseum: { name: 'Inside the arch walkway', welcome: 'You are inside our pretend Roman walkway! Explore the arches, see the rows of seats, and discover how a curved top fits together.', things: [
      ['🏛️', 'A row of arches', 'The Colosseum has many arches and walkways. Repeating an arch makes a pattern. Can you spot three in our model?'],
      ['🪑', 'Rows of seats', 'Inside the Colosseum are rows where people once sat. Higher rows help people see over the rows in front. Our model is quiet and empty.'],
      ['🧩', 'The top stone', 'The top stone of an arch is called a keystone. It fits between the other stones. Watch the golden piece in our model.'] ] },
    chichen: { name: 'Inside the discovery room', welcome: 'This is a pretend visitor discovery room, not a passage inside the real pyramid. Explore a stair model, stone patterns and the shapes of the sky.', things: [
      ['🔺', 'A stepped pyramid model', 'El Castillo at Chichén Itzá is a stepped pyramid. Our small model has flat layers, one above another.'],
      ['👣', 'Count the model steps', 'One, two, three, four, five! Our little stair model has five steps. The real buildings have many more.'],
      ['☀️', 'Watching the sky', 'Maya people carefully observed the Sun and the sky. Our simple Sun and shadow model helps us notice how a shadow changes.'] ] },
    machu: { name: 'Inside the stone house', welcome: 'Step into our pretend stone house! Explore close-fitting stones, a terrace garden model and a basket of pretend crops.', things: [
      ['🪨', 'Close-fitting stones', 'Inca builders shaped many stones to fit closely together. Look at the different shapes in our little wall.'],
      ['🌱', 'Gardens on terraces', 'A terrace is a flat step on a hillside. Terraces made space for growing crops on mountain slopes.'],
      ['🌽', 'Food from the land', 'People in the Andes grew foods such as maize and potatoes. Here is a pretend basket of crops. No picking from real historic places!'] ] },
    rio: { name: 'Inside the forest lodge', welcome: 'Welcome to our pretend forest visitor lodge! This is an imaginary park building, not inside the statue. Look at the mountain view, leaves and bird nests.', things: [
      ['⛰️', 'A mountain window', 'Corcovado is a mountain in Rio de Janeiro. From high viewpoints, people can see the city, forest and sea.'],
      ['🍃', 'Forest leaf shapes', 'Forest plants have many leaf shapes and sizes. Leaves help plants use sunlight to grow.'],
      ['🪺', 'A home for birds', 'Trees give birds places to rest and build nests. We can help wildlife by caring for forests and watching quietly.'] ] },
    giza: { name: 'Inside the desert discovery room', welcome: 'Welcome to our pretend desert discovery room! Explore giant stone blocks, a model of the River Nile and the camels of the desert.', things: [
      ['🧱', 'Huge stone blocks', 'The pyramids are made of huge stone blocks, stacked layer on layer. Some blocks are heavier than a car!'],
      ['🌊', 'The River Nile', 'The River Nile flows through Egypt. Boats carried stones and food along the river. Tap again to float our little boat.'],
      ['🐪', 'Desert camels', 'Camels can walk a long way in hot, dry deserts. Their humps store fat, which gives them energy.'] ] },
    eiffel: { name: 'Inside the iron workshop', welcome: 'Welcome to our pretend iron workshop! Explore metal pieces, ride a little model lift and see what people eat in Paris.', things: [
      ['🔩', 'Iron and rivets', 'The Eiffel Tower is made of thousands of iron pieces joined with little metal pins called rivets.'],
      ['🛗', 'Going up!', 'Lifts carry visitors up the tower. Tap again to send our little lift up and down.'],
      ['🥐', 'Paris bakery', 'In Paris, people enjoy fresh bread from bakeries, like long baguettes and flaky croissants.'] ] },
    opera: { name: 'Inside the harbour room', welcome: 'Welcome to our pretend harbour room! Explore the shell roofs, the ferry boats and the animals of Australia.', things: [
      ['🐚', 'Shell-shaped roofs', 'The Opera House roofs are made of curved pieces, like slices of a ball. Together they look like shells or sails.'],
      ['⛴️', 'Harbour ferries', 'Ferry boats carry people across Sydney Harbour. Tap again to send our ferry across the water.'],
      ['🐨', 'Australian animals', 'Australia has animals found nowhere else in the wild, like kangaroos, koalas and wombats.'] ] },
    borobudur: { name: 'Inside the stone gallery', welcome: 'Welcome to our pretend stone gallery! Explore a bell-shaped stupa, carved stone pictures and the volcanoes of Java.', things: [
      ['🔔', 'A bell-shaped stupa', 'A stupa at Borobudur is shaped like a bell, with little diamond-shaped holes like a lattice.'],
      ['🪨', 'Carved stone pictures', 'Borobudur has many carved stone panels along its terraces. They show plants, animals, boats and daily life long ago.'],
      ['🌋', 'Volcanoes and rice fields', 'Borobudur is surrounded by volcanoes and green rice fields on the island of Java. Tap again to see our model volcano puff.'] ] },
    petronas: { name: 'Inside the sky lobby', welcome: 'Welcome to our pretend sky lobby! Explore the sky bridge, a star-shaped floor plan and shiny steel and glass.', things: [
      ['🌉', 'The sky bridge', 'A sky bridge joins the two towers high in the air. Tap again to slide our little model bridge into place.'],
      ['⭐', 'Star-shaped floors', 'From above, each tower floor is shaped like an eight-pointed star. Count the points: one, two, three, four, five, six, seven, eight!'],
      ['🪟', 'Steel and glass', 'The towers are made of steel and glass that shine in the sunshine.'] ] }
  };
  function build(api, place) {
    const { T, box, ball, cylinder, segment, arch, group } = api;
    const data = rooms[place.id], scene = new T.Scene(); scene.background = new T.Color('#c9dcc5');
    scene.add(new T.HemisphereLight('#fff8df', '#9caa8a', 2.6));
    const light = new T.DirectionalLight('#fff1d5', 2.5); light.position.set(-10, 24, 18); scene.add(light);
    const shell = group(0, 0, 0, scene), exhibits = group(0, 0, 0, scene), blocks = [];
    const sand = { petra: '#d5a082', taj: '#f5ead1', rio: '#c9b484', giza: '#e4cc96', eiffel: '#cdbfa6', opera: '#ece7dc', borobudur: '#a9a394', petronas: '#d5dade' }[place.id] || '#c9bd98';
    box(shell, '#a9bf97', 0, -.7, 0, 180, .5, 180);
    box(shell, '#e4d6b2', 0, -.2, 0, 25, .5, 22);
    // A dollhouse cutaway leaves the near walls and roof open so nothing hides the child.
    box(shell, sand, 0, 3, -10, 25, 6, .7);
    box(shell, sand, -12, .65, 0, .7, 1.3, 20);
    box(shell, sand, 12, .65, 0, .7, 1.3, 20);
    // Enclosed at eye level; the overhead accessibility view can lift these away.
    const enclosure = group(0, 0, 0, shell);
    for (const x of [-12, 12]) box(enclosure, sand, x, 4.3, 0, .7, 6, 20);
    for (const x of [-7.2, 7.2]) box(enclosure, sand, x, 3.6, 10, 10.1, 7.2, .7);
    box(enclosure, sand, 0, 6.4, 10, 4.4, 1.6, .7);
    box(enclosure, place.id === 'rio' ? '#a9956d' : '#e9daba', 0, 7.5, 0, 25, .4, 21);
    for (const x of [-8, 0, 8]) {
      box(enclosure, '#c7b68d', x, 7.15, 0, .3, .35, 20);
      box(enclosure, '#f8edc9', x, 6.95, -1, 1.7, .12, 2.7);
    }
    for (const x of [-11, 11]) for (const z of [-9, 8]) cylinder(shell, sand, x, 3.2, z, .35, .5, 6.4, 8);
    for (let x = -10; x <= 10; x += 2) for (let z = -8; z <= 8; z += 2) {
      if ((x + z) % 4 === 0) box(shell, place.id === 'taj' ? '#9cbdb2' : '#d8c9a4', x, .065, z, 1.9, .04, 1.9);
    }
    box(shell, '#b0c593', 0, .09, 8, 4, .08, 2);
    arch(shell, '#9bb49c', 0, 0, 9.6, 4, 5);
    const points = [[-7, -3], [0, -5], [7, -3]];
    const hotspots = data.things.map((thing, i) => {
      const [x, z] = points[i], model = group(x, 0, z - 2, exhibits);
      box(model, '#b6a580', 0, .35, 0, 3.7, .7, 2.6);
      blocks.push({ x, z: z - 2, w: 2, d: 1.5 });
      return { x, z: z + 1, icon: thing[0], text: thing[1], fact: thing[2], model, changed: false, animate: null };
    });
    function windowView(parent, mountain = false) {
      box(parent, '#92c6ca', 0, 3, -.1, 4.5, 3.8, .2);
      box(parent, '#7d9c73', 0, 1.5, .1, 4.5, .7, .3);
      for (const x of [-2.35, 2.35]) box(parent, sand, x, 3, .1, .3, 4.4, .5);
      if (mountain) {
        const m = cylinder(parent, '#81a586', 0, 2.6, .1, 0, 2.1, 3, 5); m.scale.z = .1;
        ball(parent, '#f6d681', 1.4, 4.1, .15, .38, .38, .08);
      }
    }
    const [a, b, c] = hotspots.map(h => h.model);
    if (place.id === 'wall') {
      windowView(a, true);
      for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) box(b, row % 2 ? '#a6a68b' : '#c4b18e', -1.3 + i * 1.1 + row % 2 * .35, 1 + row * .55, 0, 1, .5, 1);
      for (let i = 0; i < 5; i++) { ball(c, '#91ad7d', i * .65 - 1.3, .9, 0, .8, .4 + i % 2 * .3, .7); box(c, '#d2c49e', i * .65 - 1.3, 1.4 + i % 2 * .3, 0, .6, .8, .35); }
    } else if (place.id === 'petra') {
      for (const x of [-1.4, 1.4]) { cylinder(a, '#e9b58f', x, 2.1, 0, .3, .4, 3, 10); box(a, '#f1c8a3', x, 3.7, 0, 1.2, .4, 1.2); }
      box(b, '#b88e71', 0, 1.1, 0, 3.2, .8, 2.1);
      const water = box(b, '#80bec2', 0, 1.55, 0, 2.6, .1, 1.6); water.scale.y = .15;
      hotspots[1].animate = on => { water.position.y = on ? 1.8 : 1.55; water.scale.y = on ? 4 : .15; };
      for (let i = 0; i < 5; i++) box(c, ['#e2ad8d', '#c99074', '#f0c6a1'][i % 3], 0, 1 + i * .5, 0, 3.3 - i * .16, .5, 1.6);
      for (const x of [-10, -4, 4, 10]) { cylinder(shell, '#e9b58f', x, 3.5, -8.5, .4, .55, 7, 10); box(shell, '#edc09b', x, 6.9, -8.5, 1.7, .4, 1.5); }
    } else if (place.id === 'taj') {
      box(a, '#fff4d9', 0, 2.4, 0, 4, 3.6, .4);
      for (const x of [-1.1, 1.1]) { segment(a, '#79a18b', [x, .9, .3], [x, 3.3, .3], .08); for (let i = 0; i < 5; i++) ball(a, '#c98c91', x + Math.sin(i * 1.26) * .3, 3.2 + Math.cos(i * 1.26) * .3, .3, .25, .25, .1); }
      arch(b, '#fff6dd', 0, .7, 0, 3.6, 4.7);
      const dome = new T.Mesh(new T.SphereGeometry(1.8, 20, 12, 0, Math.PI * 1.5, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#efe3c3', side: T.DoubleSide, roughness: .9 })); dome.position.set(0, 1.7, 0); c.add(dome);
      for (const x of [-1.3, 1.3]) cylinder(c, '#fff4d9', x, 1.2, 0, .13, .13, 1, 8);
      for (const x of [-8, 0, 8]) arch(shell, '#fff5dc', x, 0, -9.45, 5, 6);
    } else if (place.id === 'colosseum') {
      for (const x of [-1.2, 0, 1.2]) arch(a, '#e5c79b', x, .7, 0, 1.2, 2.6);
      for (let i = 0; i < 4; i++) box(b, '#c4aa80', 0, .8 + i * .4, -.8 + i * .5, 3.5, .4 + i * .8, .6);
      arch(c, '#d9ba8c', 0, .7, 0, 3.3, 3.5);
      const key = box(c, '#e9bf5d', 0, 3.7, 0, .55, .7, 1); hotspots[2].animate = on => { key.position.y = on ? 4.8 : 3.7; };
      for (const x of [-8, 0, 8]) arch(shell, '#e5cba3', x, 0, -9.4, 5.5, 6.5);
    } else if (place.id === 'chichen') {
      for (let i = 0; i < 5; i++) box(a, '#c2b48d', 0, .9 + i * .4, 0, 3.4 - i * .55, .4, 2.4 - i * .35);
      for (let i = 0; i < 5; i++) box(b, i % 2 ? '#cfb97b' : '#e4cf98', -1.4 + i * .65, .8 + i * .3, 0, .65, .3 + i * .6, 1.8);
      const sun = ball(c, '#e7bd61', -1, 3.6, 0, .7); segment(c, '#a8966d', [0, .7, 0], [0, 2.1, 0], .1);
      const shadow = box(c, '#a5a07e', .6, .73, .4, 1.6, .03, .3); hotspots[2].animate = on => { sun.position.x = on ? 1 : -1; shadow.position.x = on ? -.6 : .6; };
    } else if (place.id === 'machu') {
      for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) { const stone = box(a, ['#adb193', '#c3bfa0'][row % 2], -1.1 + i * 1.1 + row % 2 * .15, 1 + row * .55, 0, 1.03, .5, 1); stone.rotation.z = (i - 1) * .025; }
      for (let i = 0; i < 3; i++) { box(b, '#b7b38c', 0, 1 + i * .5, -i * .6, 3.5 - i * .5, .5 + i, .7); box(b, '#8dac72', 0, 1.3 + i * 1, -i * .6, 3.5 - i * .5, .08, .7); }
      cylinder(c, '#b79564', 0, 1.2, 0, 1.3, 1, 1, 12);
      for (let i = 0; i < 7; i++) ball(c, i % 2 ? '#d4b261' : '#b99772', Math.sin(i * 2.4) * .8, 1.8, Math.cos(i * 2.4) * .65, .3, i % 2 ? .6 : .25, .25);
    } else if (place.id === 'giza') {
      for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) box(a, ['#d8bb80', '#cfae72'][(i + row) % 2], -1.1 + i * 1.1 + row * .55, 1.1 + row * .9, 0, 1, .9, 1.4);
      box(b, '#e4cc96', 0, .8, 0, 3.4, .2, 2.2); box(b, '#6fb3c7', 0, .92, 0, 3.4, .06, .8);
      const boat = group(-1.2, 1, 0, b); box(boat, '#a07a4c', 0, 0, 0, 1, .2, .4); segment(boat, '#7a5a35', [0, 0, 0], [0, 1, 0], .03); box(boat, '#f4ecd2', .15, .6, 0, .3, .6, .02);
      hotspots[1].animate = on => { boat.position.x = on ? 1.2 : -1.2; };
      const camel = group(0, .7, 0, c), col = '#c89a62'; ball(camel, col, 0, 1, 0, .5, .4, .8); ball(camel, col, 0, 1.45, 0, .32, .35, .35); segment(camel, col, [0, 1.1, .6], [0, 1.7, 1], .14); ball(camel, col, 0, 1.75, 1.15, .18, .16, .3);
      for (const x of [-.25, .25]) for (const z of [-.5, .5]) segment(camel, col, [x, .8, z], [x, 0, z], .07);
      for (const x of [-8, 8]) { const pyr = new T.Mesh(new T.ConeGeometry(3.5, 5, 4), new T.MeshStandardMaterial({ color: '#d8bb80' })); pyr.position.set(x, 2.5, -9.2); pyr.rotation.y = Math.PI / 4; shell.add(pyr); }
    } else if (place.id === 'eiffel') {
      for (let i = 0; i < 4; i++) { const beam = box(a, '#8b6f4e', -1.2 + i * .8, 1.6, 0, .25, 1.8, .25); beam.rotation.z = i % 2 ? .4 : -.4; for (let k = 0; k < 3; k++) ball(a, '#5d5a52', -1.2 + i * .8, 1 + k * .5, .15, .08); }
      for (const x of [-.9, .9]) segment(b, '#8b6f4e', [x, .7, 0], [x, 4.4, 0], .08);
      const lift = box(b, '#d9b45b', 0, 1.2, 0, 1.4, .9, 1); hotspots[1].animate = on => { lift.position.y = on ? 3.6 : 1.2; };
      box(c, '#a87a4f', 0, .9, 0, 3.2, .3, 1.8); const loaf = ball(c, '#d9a45e', -.6, 1.2, 0, 1.1, .22, .25); loaf.rotation.y = .3;
      for (const x of [.6, 1.2]) { const cr = new T.Mesh(new T.TorusGeometry(.28, .14, 6, 10, Math.PI), new T.MeshStandardMaterial({ color: '#e0a85a' })); cr.position.set(x, 1.15, .2); cr.rotation.x = -Math.PI / 2; c.add(cr); }
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), false);
    } else if (place.id === 'opera') {
      const white = new T.MeshStandardMaterial({ color: '#fbf8f0', side: T.DoubleSide });
      for (let i = 0; i < 3; i++) { const sh = new T.Mesh(new T.SphereGeometry(1.3 - i * .3, 16, 8, 0, Math.PI, 0, Math.PI / 2), white); sh.position.set(-1 + i * 1, .7, 0); sh.rotation.x = -.6; a.add(sh); }
      box(b, '#6fb3c7', 0, .8, 0, 3.4, .12, 2.2);
      const ferry = group(-1.2, 1, 0, b); box(ferry, '#2f6d48', 0, 0, 0, 1.1, .3, .5); box(ferry, '#f4e7b8', 0, .3, 0, .8, .3, .4);
      hotspots[1].animate = on => { ferry.position.x = on ? 1.2 : -1.2; };
      const koala = group(0, 1, 0, c); ball(koala, '#9aa0a3', 0, .6, 0, .45, .55, .4); ball(koala, '#9aa0a3', 0, 1.3, 0, .38); for (const x of [-.32, .32]) ball(koala, '#c2c6c8', x, 1.6, 0, .18, .18, .08); ball(koala, '#3a3a3a', 0, 1.25, .35, .1, .12, .08);
      cylinder(c, '#8a6a45', .7, 1.6, -.2, .12, .15, 3, 8);
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), false);
    } else if (place.id === 'borobudur') {
      cylinder(a, '#8f897c', 0, .85, 0, .9, 1, .3, 12);
      const bell = new T.Mesh(new T.LatheGeometry([[.9, 0], [1, .5], [.9, 1], [.5, 1.4], [.15, 1.6], [0, 1.62]].map(([r, h]) => new T.Vector2(r, h)), 16), new T.MeshStandardMaterial({ color: '#a8a294', flatShading: true })); bell.position.y = 1; a.add(bell);
      box(b, '#9a9486', 0, 2, -.2, 3.4, 2.4, .3);
      for (let i = 0; i < 3; i++) { ball(b, '#7d9a6a', -1 + i, 2.3, -.02, .3, .4, .05); box(b, '#857f72', -1 + i, 1.4, -.02, .5, .15, .05); }
      const volcano = cylinder(c, '#7d8f63', 0, 1.5, 0, .3, 1.4, 1.8, 10); box(c, '#9bc06f', 0, .78, 0, 3.4, .1, 2.2);
      const puff = ball(c, '#e9ecec', 0, 2.7, 0, .35); puff.visible = false; hotspots[2].animate = on => { puff.visible = on; puff.scale.setScalar(on ? 1.6 : 1); }; void volcano;
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), true);
    } else if (place.id === 'petronas') {
      for (const x of [-1.1, 1.1]) for (let i = 0; i < 6; i++) cylinder(a, i % 2 ? '#c9ced3' : '#dde1e5', x, .95 + i * .5, 0, .45 - (i > 3 ? (i - 3) * .1 : 0), .45, .5, 8);
      const span = box(a, '#9aa2a9', 0, 2.3, 0, .2, .2, .5); hotspots[0].animate = on => { span.scale.x = on ? 9 : 1; };
      const star = new T.Shape(); for (let i = 0; i < 16; i++) { const r = i % 2 ? .75 : 1.3, ang = i / 16 * Math.PI * 2; star[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * r, Math.sin(ang) * r); }
      const plan = new T.Mesh(new T.ExtrudeGeometry(star, { depth: .25, bevelEnabled: false }), new T.MeshStandardMaterial({ color: '#c9ced3' })); plan.rotation.x = -Math.PI / 2; plan.position.y = .72; b.add(plan);
      box(c, '#9fb2bf', 0, 1.9, 0, 2.8, 2.2, .2); for (const x of [-.7, 0, .7]) box(c, '#c9ced3', x, 1.9, .12, .08, 2.2, .05);
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), false);
    } else {
      windowView(a, true);
      for (let i = 0; i < 5; i++) { const x = Math.sin(i * 2.4) * 1.3, y = 1.5 + i * .45; segment(b, '#9e865d', [0, .7, 0], [x, y, 0], .07); const leaf = ball(b, i % 2 ? '#88ac79' : '#aac184', x, y, 0, .5, .18, .25); leaf.rotation.z = i * .5; }
      cylinder(c, '#b79c6b', 0, 1.8, 0, .18, .3, 2.5, 8);
      const nest = new T.Mesh(new T.TorusGeometry(.9, .2, 5, 16), new T.MeshStandardMaterial({ color: '#b59a69' })); nest.rotation.x = Math.PI / 2; nest.position.y = 2.6; c.add(nest);
      for (const x of [-.3, .3]) ball(c, '#efe7c8', x, 2.65, 0, .22, .3, .22);
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), true);
    }
    scene.updateMatrixWorld(true);
    return { ...data, scene, hotspots, blocks, enclosure, occluders: [shell, exhibits], exit: { x: 0, z: 7.5, icon: '🚪', verb: 'OUT', text: 'Go back outside' } };
  }
  window.WonderInteriors = Object.freeze({ build });
})();
