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
      ['🪺', 'A home for birds', 'Trees give birds places to rest and build nests. We can help wildlife by caring for forests and watching quietly.'] ] }
  };
  function build(api, place) {
    const { T, box, ball, cylinder, segment, arch, group } = api;
    const data = rooms[place.id], scene = new T.Scene(); scene.background = new T.Color('#c9dcc5');
    scene.add(new T.HemisphereLight('#fff8df', '#9caa8a', 2.6));
    const light = new T.DirectionalLight('#fff1d5', 2.5); light.position.set(-10, 24, 18); scene.add(light);
    const shell = group(0, 0, 0, scene), exhibits = group(0, 0, 0, scene), blocks = [];
    const sand = place.id === 'petra' ? '#d5a082' : place.id === 'taj' ? '#f5ead1' : place.id === 'rio' ? '#c9b484' : '#c9bd98';
    box(shell, '#a9bf97', 0, -.7, 0, 180, .5, 180);
    box(shell, '#e4d6b2', 0, -.2, 0, 25, .5, 22);
    // A dollhouse cutaway leaves the near walls and roof open so nothing hides the child.
    box(shell, sand, 0, 3, -10, 25, 6, .7);
    box(shell, sand, -12, .65, 0, .7, 1.3, 20);
    box(shell, sand, 12, .65, 0, .7, 1.3, 20);
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
    } else {
      windowView(a, true);
      for (let i = 0; i < 5; i++) { const x = Math.sin(i * 2.4) * 1.3, y = 1.5 + i * .45; segment(b, '#9e865d', [0, .7, 0], [x, y, 0], .07); const leaf = ball(b, i % 2 ? '#88ac79' : '#aac184', x, y, 0, .5, .18, .25); leaf.rotation.z = i * .5; }
      cylinder(c, '#b79c6b', 0, 1.8, 0, .18, .3, 2.5, 8);
      const nest = new T.Mesh(new T.TorusGeometry(.9, .2, 5, 16), new T.MeshStandardMaterial({ color: '#b59a69' })); nest.rotation.x = Math.PI / 2; nest.position.y = 2.6; c.add(nest);
      for (const x of [-.3, .3]) ball(c, '#efe7c8', x, 2.65, 0, .22, .3, .22);
      for (const x of [-8, 0, 8]) windowView(group(x, 0, -9.3, shell), true);
    }
    return { ...data, scene, hotspots, blocks, exit: { x: 0, z: 7.5, icon: '🚪', verb: 'OUT', text: 'Go back outside' } };
  }
  window.WonderInteriors = Object.freeze({ build });
})();
