import * as T from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { defaultDesign, gpus, museumRacks } from "./gpuData.js";

const palette = {
  stone: "#b9b6a9",
  wall: "#c5c2b5",
  ink: "#283331",
  recess: "#374440",
  brass: "#a69a7f",
  red: "#b74d43",
  light: "#eee5cf",
  paper: "#e9e5d9",
};
const material = (color, roughness = 0.7, metalness = 0.05) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
function box(parent, size, position, mat, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(...size, 2, radius)
    : new T.BoxGeometry(...size);
  const mesh = new T.Mesh(geometry, mat);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
function textPanel(parent, lines, width, height, position, background = null) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.max(64, Math.round((1024 * height) / width));
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  for (const [i, line] of lines.entries()) {
    const item = typeof line === "string" ? { text: line } : line;
    let font = item.size || Math.min(110, canvas.height / (lines.length + 1));
    ctx.font = `${item.weight || 500} ${font}px Arial, sans-serif`;
    while (ctx.measureText(item.text).width > 940 && font > 16) {
      font -= 2;
      ctx.font = `${item.weight || 500} ${font}px Arial, sans-serif`;
    }
    ctx.fillStyle = item.color || palette.paper;
    ctx.textAlign = item.align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      item.text,
      item.align === "left" ? 42 : 512,
      item.y !== undefined
        ? item.y * canvas.height
        : ((i + 0.5) * canvas.height) / lines.length,
    );
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(width, height),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: !background,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
function stoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d"),
    data = ctx.createImageData(256, 256);
  let seed = 13;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const grain = (seed >>> 24) % 15;
    data.data[i] = 183 + grain;
    data.data[i + 1] = 181 + grain;
    data.data[i + 2] = 169 + grain;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(18, 70);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
function contact(parent, x, z, w, d) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d"),
    gradient = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
  gradient.addColorStop(0, "#0009");
  gradient.addColorStop(1, "#0000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new T.CanvasTexture(canvas);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(w, d),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.004, z);
  parent.add(shadow);
}
function outline(width, height) {
  const group = new T.Group(),
    red = new T.MeshBasicMaterial({ color: "#f2907c" });
  for (const x of [-1, 1])
    for (const y of [-1, 1]) {
      box(
        group,
        [0.24, 0.023, 0.025],
        [x * (width / 2 - 0.12), (y * height) / 2, 0],
        red,
      );
      box(
        group,
        [0.023, 0.2, 0.025],
        [(x * width) / 2, y * (height / 2 - 0.1), 0],
        red,
      );
    }
  group.visible = false;
  return group;
}

export function createMuseumArchitecture(makeCard) {
  const world = new T.Group(),
    clickable = [],
    blockers = [],
    collisions = [];
  const stone = material(palette.stone, 0.88),
    wall = material(palette.wall, 0.92),
    ink = material(palette.ink, 0.72, 0.12);
  const recess = material(palette.recess, 0.82),
    brass = material(palette.brass, 0.4, 0.65),
    red = material(palette.red, 0.7);
  const glow = new T.MeshBasicMaterial({ color: palette.light }),
    dark = material("#171e1c", 0.7, 0.1);
  const floorMat = material("#ffffff", 0.8, 0.04);
  floorMat.map = stoneTexture();
  box(world, [18.8, 0.18, 71], [0, -0.1, -14.5], floorMat);
  for (let z = 19; z >= -49; z -= 3)
    box(world, [18.5, 0.006, 0.018], [0, 0.002, z], material("#8a8a7f", 0.9));
  for (const x of [-6, 0, 6])
    box(world, [0.018, 0.006, 70], [x, 0.003, -14.5], material("#9c9c90", 0.9));
  for (const side of [-1, 1]) {
    blockers.push(box(world, [0.45, 8.5, 71], [side * 9.3, 4.2, -14.5], wall));
    box(world, [0.07, 0.2, 70], [side * 9.02, 0.1, -14.5], brass);
    box(world, [2.8, 0.12, 71], [side * 7.9, 8.35, -14.5], wall);
    box(world, [0.055, 0.015, 58], [side * 0.9, 0.012, -14], red);
  }
  box(world, [13, 0.15, 71], [0, 8.55, -14.5], ink);
  // Skylight coffers and suspended tracks give the hall a clear architectural scale.
  for (let z = 15; z >= -43; z -= 6.5) {
    box(world, [4.6, 0.08, 4.7], [0, 8.42, z], glow);
    for (const side of [-1, 1]) {
      box(world, [0.12, 0.12, 5], [side * 5.9, 7.7, z], dark);
      for (const dz of [-1.5, 1.5]) {
        const light = new T.Mesh(
          new T.CylinderGeometry(0.13, 0.16, 0.3, 12),
          dark,
        );
        light.position.set(side * 5.9, 7.48, z + dz);
        light.rotation.z = side * 0.5;
        world.add(light);
        const face = new T.Mesh(new T.CircleGeometry(0.12, 12), glow);
        face.rotation.x = -Math.PI / 2;
        face.position.set(side * 5.9, 7.3, z + dz);
        world.add(face);
      }
    }
  }
  for (let bay = 0; bay < 5; bay++) {
    const z = 8.4 - bay * 13;
    for (const side of [-1, 1]) {
      box(world, [0.65, 7.9, 0.65], [side * 8, 3.95, z], stone, 0.05);
      box(world, [0.15, 6.9, 0.08], [side * 7.65, 3.5, z + 0.36], brass);
    }
    box(world, [16.6, 0.7, 0.65], [0, 7.95, z], stone, 0.07);
    box(world, [13.4, 0.025, 0.08], [0, 7.58, z + 0.12], glow);
  }

  for (const [index, rack] of museumRacks.entries()) {
    const group = new T.Group();
    group.position.set(rack.side * 7.4, 0, 3 - rack.bay * 13);
    group.rotation.y = rack.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    world.add(group);
    const models = gpus.filter((g) => g.generation === rack.generation);
    // Memory variants share a vitrine, with separate cards, labels and hit targets.
    const vitrines = [];
    for (const gpu of models) {
      const key = gpu.name.replace(/ \d+GB$/, "");
      const existing = vitrines.find((v) => v.key === key);
      if (existing) existing.models.push(gpu);
      else vitrines.push({ key, models: [gpu] });
    }
    box(group, [9.3, 6.6, 0.32], [0, 3.3, -0.9], ink, 0.08);
    box(group, [9.5, 0.22, 2.2], [0, 0.11, 0], stone, 0.03);
    box(group, [9.15, 0.04, 1.95], [0, 0.24, 0.08], brass);
    box(group, [9.45, 0.24, 1.95], [0, 6.58, -0.05], stone, 0.04);
    textPanel(
      group,
      [
        { text: `${rack.maker} / ${rack.generation}`, size: 78, weight: 600 },
        {
          text: `${models[0].architecture}  ·  ${models.length} models`,
          size: 36,
          color: "#bcbda9",
        },
      ],
      8.3,
      1.02,
      [0, 5.95, 0.22],
    );
    textPanel(
      group,
      [
        {
          text: String(index + 1).padStart(2, "0"),
          size: 110,
          color: "#c97661",
        },
      ],
      0.65,
      0.6,
      [-4.12, 5.96, 0.25],
    );
    for (const [i, vitrine] of vitrines.entries()) {
      const x = [0, -2.85, 2.85][i % 3],
        y = [2.98, 1.33, 4.6][Math.floor(i / 3)];
      box(group, [2.63, 1.48, 0.17], [x, y, -0.6], recess, 0.025);
      box(group, [2.58, 0.06, 1.35], [x, y - 0.72, 0.02], stone);
      box(group, [2.55, 0.035, 0.045], [x, y + 0.69, 0.38], glow);
      for (const side of [-1, 1])
        box(group, [0.026, 1.45, 0.6], [x + side * 1.3, y, 0.12], brass);
      const glass = new T.Mesh(
        new T.PlaneGeometry(2.58, 1.4),
        new T.MeshPhysicalMaterial({
          color: "#b1d2ca",
          transparent: true,
          opacity: 0.027,
          roughness: 0.1,
          metalness: 0.12,
          depthWrite: false,
        }),
      );
      glass.position.set(x, y, 0.78);
      group.add(glass);
      for (const [j, gpu] of vitrine.models.entries()) {
        const pair = vitrine.models.length > 1,
          dx = pair ? (j - 0.5) * 1.23 : 0;
        const design = defaultDesign(gpu),
          card = makeCard(design, true);
        card.scale.setScalar(pair ? 0.145 : 0.258);
        card.position.set(x + dx, y + 0.03, 0.22);
        group.add(card);
        for (const support of [-0.45, 0.45])
          box(
            group,
            [0.055, 0.2, 0.16],
            [x + dx + support * (pair ? 0.55 : 1), y - 0.59, 0.22],
            brass,
          );
        const name = pair ? `${gpu.vram}GB ${gpu.memory}` : gpu.name;
        textPanel(
          group,
          [
            {
              text: name,
              size: pair ? 100 : 54,
              weight: 600,
              color: "#24312b",
            },
          ],
          pair ? 1.18 : 2.28,
          0.24,
          [x + dx, y - 0.59, 0.8],
          palette.paper,
        );
        const hit = new T.Mesh(
          new T.BoxGeometry(pair ? 1.2 : 2.55, 1.43, 0.95),
          new T.MeshBasicMaterial({ visible: false }),
        );
        hit.position.set(x + dx, y, 0.36);
        const focus = outline(pair ? 1.17 : 2.5, 1.34);
        focus.position.set(x + dx, y, 0.82);
        group.add(focus);
        hit.userData.exhibit = { gpu, design };
        hit.userData.focus = focus;
        group.add(hit);
        clickable.push(hit);
      }
      if (vitrine.models.length > 1)
        textPanel(group, [{ text: vitrine.key, size: 50 }], 2.3, 0.2, [
          x,
          y + 0.51,
          0.8,
        ]);
    }
    contact(world, rack.side * 7.4, 3 - rack.bay * 13, 3, 10);
  }

  // Physical wayfinding hangs from the ceiling, instead of floating beside cards.
  for (let bay = 0; bay < 4; bay++) {
    const z = 7.1 - bay * 13,
      sign = new T.Group();
    sign.position.set(0, 6.1, z);
    world.add(sign);
    for (const x of [-2.3, 2.3])
      box(sign, [0.018, 1.6, 0.018], [x, 1.12, 0], brass);
    box(sign, [6.6, 0.88, 0.12], [0, 0, 0], ink, 0.02);
    const left = museumRacks.find((r) => r.bay === bay && r.side < 0),
      right = museumRacks.find((r) => r.bay === bay && r.side > 0);
    textPanel(
      sign,
      [
        {
          text: `← ${left.maker} ${left.generation}     ${right.maker} ${right.generation} →`,
          size: 53,
        },
      ],
      6.15,
      0.52,
      [0, 0.02, 0.07],
    );
  }

  for (const [i, gpuId] of ["rtx-5090", "rx-9070-xt"].entries()) {
    const gpu = gpus.find((g) => g.id === gpuId),
      design = defaultDesign(gpu),
      x = i === 0 ? -2.4 : 2.4,
      z = 8.7;
    const plinth = new T.Group();
    plinth.position.set(x, 0, z);
    plinth.rotation.y = i === 0 ? 0.2 : -0.2;
    world.add(plinth);
    box(plinth, [2.65, 1.25, 1.65], [0, 0.625, 0], stone, 0.07);
    box(plinth, [2.56, 0.055, 1.56], [0, 1.28, 0], brass, 0.02);
    box(plinth, [0.12, 0.34, 0.35], [-0.72, 1.47, 0], brass);
    box(plinth, [0.12, 0.34, 0.35], [0.72, 1.47, 0], brass);
    const card = makeCard(design, true);
    card.scale.setScalar(0.32);
    card.position.set(0, 2.1, 0);
    plinth.add(card);
    textPanel(
      plinth,
      [
        { text: gpu.name, weight: 600, size: 75 },
        { text: `${gpu.maker} · ${gpu.vram}GB ${gpu.memory}`, size: 40 },
      ],
      2.2,
      0.48,
      [0, 0.98, 0.84],
      palette.ink,
    );
    const hit = new T.Mesh(
      new T.BoxGeometry(2.7, 1.6, 1.1),
      new T.MeshBasicMaterial({ visible: false }),
    );
    hit.position.set(0, 2, 0.1);
    const focus = outline(2.7, 1.45);
    focus.position.set(0, 2.04, 0.57);
    plinth.add(focus);
    hit.userData.exhibit = { gpu, design };
    hit.userData.focus = focus;
    plinth.add(hit);
    clickable.push(hit);
    collisions.push({ x, z, halfX: 1.45, halfZ: 1.05 });
    contact(world, x, z, 4, 3.5);
  }

  // Low benches break up the long hall and establish human scale.
  for (const z of [-3.5, -16.5, -29.5])
    for (const side of [-1, 1]) {
      const x = side * 4.1;
      for (const dx of [-0.43, 0.43])
        box(world, [0.12, 0.6, 2.3], [x + dx, 0.3, z], ink);
      for (let slat = 0; slat < 5; slat++)
        box(
          world,
          [0.2, 0.12, 2.65],
          [x - 0.48 + slat * 0.24, 0.66, z],
          material("#715e47", 0.65, 0.05),
          0.025,
        );
      collisions.push({ x, z, halfX: 0.88, halfZ: 1.6 });
      contact(world, x, z, 2.2, 3.5);
    }
  const foyer = new T.Group();
  foyer.position.set(-8.97, 3.5, 15);
  foyer.rotation.y = Math.PI / 2;
  world.add(foyer);
  textPanel(
    foyer,
    [
      { text: "The PC Museum", size: 100, weight: 600 },
      { text: "The graphics collection", size: 58 },
      {
        text: `${gpus.length} models. Eight galleries.`,
        size: 38,
        color: "#adb5ab",
      },
      {
        text: "Enlarged models. Aim and click to inspect.",
        size: 35,
        color: "#adb5ab",
      },
    ],
    7,
    3.8,
    [0, 0, 0],
    palette.ink,
  );
  const rightFoyer = new T.Group();
  rightFoyer.position.set(8.97, 3.5, 15);
  rightFoyer.rotation.y = -Math.PI / 2;
  world.add(rightFoyer);
  textPanel(
    rightFoyer,
    [
      { text: "From silicon", size: 120, weight: 600 },
      { text: "to worlds.", size: 120, weight: 600 },
      { text: "NVIDIA   /   AMD   /   Intel", size: 42, color: "#e7c7b3" },
    ],
    6,
    3.2,
    [0, 0, 0],
    palette.red,
  );

  blockers.push(box(world, [18.7, 8.4, 0.3], [0, 4.2, -49], wall));
  box(world, [8, 4.6, 0.15], [0, 3.7, -48.77], ink, 0.04);
  box(world, [2.5, 2.5, 0.18], [0, 3.7, -48.6], brass, 0.08);
  box(world, [1.65, 1.65, 0.14], [0, 3.7, -48.42], red, 0.06);
  for (let i = -5; i <= 5; i++)
    if (i !== 0)
      for (const side of [-1, 1]) {
        box(
          world,
          [1.6, 0.03, 0.04],
          [side * 2.3, 3.7 + i * 0.25, -48.52],
          brass,
        );
        box(
          world,
          [0.03, 1.1, 0.04],
          [i * 0.32, 3.7 + side * 1.9, -48.52],
          brass,
        );
      }
  textPanel(
    world,
    [{ text: "The graphics collection", size: 95, weight: 600 }],
    10,
    0.65,
    [0, 6.8, -48.7],
  );
  blockers.push(box(world, [18.7, 8.4, 0.3], [0, 4.2, 21], wall));
  const doors = new T.Group();
  doors.position.set(0, 0, 20.78);
  doors.rotation.y = Math.PI;
  world.add(doors);
  box(doors, [3.8, 4.8, 0.12], [0, 2.4, 0], ink, 0.03);
  for (const side of [-1, 1]) {
    box(
      doors,
      [1.7, 4.35, 0.04],
      [side * 0.92, 2.3, 0.09],
      material("#788780", 0.3, 0.22),
    );
    box(doors, [0.035, 0.75, 0.09], [side * 0.14, 2.2, 0.15], brass);
    box(doors, [1.62, 0.035, 0.05], [side * 0.92, 3.2, 0.14], brass);
  }
  textPanel(
    doors,
    [{ text: "The PC Museum", size: 70 }],
    3.2,
    0.42,
    [0, 5.28, 0.1],
  );
  return { world, clickable, blockers, collisions };
}
