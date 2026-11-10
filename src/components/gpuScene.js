import * as T from "three";
import { createMuseumGuide, createScanner } from "./museumCharacters.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  designs,
  gpus,
  makers,
  defaultDesign,
  museumRacks,
} from "./gpuData.js";

const metal = (color, roughness = 0.38, metalness = 0.8) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
function block(parent, w, h, d, mat, x = 0, y = 0, z = 0, round = 0) {
  const m = new T.Mesh(
    round
      ? new RoundedBoxGeometry(w, h, d, 2, round)
      : new T.BoxGeometry(w, h, d),
    mat,
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function label(text, color = "#a9c5d5", width = 512) {
  const c = document.createElement("canvas");
  c.width = width * 3;
  c.height = 64 * 3;
  const ctx = c.getContext("2d");
  ctx.scale(3, 3);
  ctx.fillStyle = color;
  ctx.font = "600 30px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, 43);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new T.Mesh(
    new T.PlaneGeometry(width / 180, 64 / 180),
    new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  return m;
}
function fan(radius, white = false) {
  const g = new T.Group();
  const dark = metal(white ? "#b6bdba" : "#161b20", 0.48, 0.38),
    rim = metal(white ? "#d5dcda" : "#3c4348", 0.3, 0.65);
  const ring = new T.Mesh(new T.TorusGeometry(radius, 0.038, 6, 60), rim);
  g.add(ring);
  const shapes = [];
  for (let i = 0; i < 11; i++) {
    const s = new T.Shape();
    s.moveTo(0.19, 0);
    s.bezierCurveTo(0.43, -0.13, radius * 0.92, -0.18, radius * 0.97, 0.11);
    s.bezierCurveTo(radius * 0.72, 0.11, 0.43, 0.3, 0.19, 0.14);
    s.closePath();
    const geo = new T.ExtrudeGeometry(s, {
      depth: 0.022,
      bevelEnabled: false,
      curveSegments: 6,
    });
    geo.rotateZ((i * Math.PI * 2) / 11);
    shapes.push(geo);
  }
  const blades = new T.Mesh(mergeGeometries(shapes), dark);
  shapes.forEach((s) => s.dispose());
  g.add(blades);
  const hub = new T.Mesh(new T.CylinderGeometry(0.23, 0.23, 0.1, 28), rim);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.06;
  g.add(hub);
  const dot = new T.Mesh(
    new T.CircleGeometry(0.12, 24),
    metal(white ? "#c3cbc8" : "#666b6c"),
  );
  dot.position.z = 0.116;
  g.add(dot);
  g.userData.blades = blades;
  return g;
}
function makeCard(design, lite = false) {
  const root = new T.Group(),
    layers = {};
  const fans = [];
  if (lite) {
    const w = design.style === "astral" ? 8.5 : 7.7,
      h = 3.05;
    const body = metal(
      new T.Color(design.color).multiplyScalar(0.17),
      0.7,
      0.15,
    );
    block(root, w, h, 0.65, body);
    const details = [];
    const count = design.fans;
    for (let i = 0; i < count; i++) {
      const g = new T.RingGeometry(0.26, 1.12, 14);
      g.translate(-w / 2 + (w * (i + 0.5)) / count, 0, 0.34);
      details.push(g);
    }
    const merged = mergeGeometries(details);
    details.forEach((g) => g.dispose());
    root.add(new T.Mesh(merged, metal("#101b23", 0.6, 0.3)));
    block(
      root,
      w - 0.5,
      0.045,
      0.04,
      new T.MeshBasicMaterial({ color: design.trim }),
      0,
      1.55,
      0.32,
    );
    block(root, 3.3, 0.21, 0.08, metal("#a69155"), -0.6, -1.6, 0);
    return root;
  }

  const w =
      design.style === "founders" ? 7.4 : design.style === "astral" ? 8.5 : 7.9,
    h = 3.05;
  const shroud = metal(design.color, 0.31, 0.72),
    silver = metal(design.trim, 0.32, 0.72),
    black = metal("#11171b", 0.6, 0.25),
    finmat = metal("#899397", 0.38, 0.8),
    boardmat = metal("#132628", 0.7, 0.2);
  const luminous = new T.MeshBasicMaterial({ color: design.trim });
  const layer = (id) => {
    const g = new T.Group();
    root.add(g);
    layers[id] = g;
    return g;
  };
  const pcb = layer("pcb");
  block(pcb, w - 0.45, h - 0.12, 0.08, boardmat, 0, 0, -0.22, 0.03);
  // PCIe connector, with individual gold contacts.
  block(
    pcb,
    3.6,
    0.24,
    0.09,
    metal("#bea45d", 0.35, 0.75),
    -0.6,
    -h / 2 - 0.04,
    -0.22,
  );
  if (!lite) {
    for (let i = 0; i < 46; i++)
      block(
        pcb,
        0.036,
        0.19,
        0.012,
        metal("#e5c779", 0.32, 0.8),
        -2.3 + i * 0.074,
        -h / 2 - 0.04,
        -0.165,
      );
    for (let i = 0; i < 20; i++) {
      const x = -w / 2 + 0.5 + (i % 10) * 0.55,
        y = i < 10 ? 1.08 : -1.08;
      block(pcb, 0.2, 0.25, 0.12, black, x, y, -0.1, 0.025);
      block(pcb, 0.08, 0.15, 0.04, finmat, x + 0.16, y, -0.1);
    }
  }
  const chip = layer("chip");
  block(
    chip,
    1.25,
    1.25,
    0.08,
    metal("#22474b", 0.6, 0.4),
    -0.6,
    0,
    -0.1,
    0.05,
  );
  block(
    chip,
    0.77,
    0.77,
    0.035,
    metal("#8c9bad", 0.19, 0.95),
    -0.6,
    0,
    -0.04,
    0.01,
  );
  const memory = layer("memory");
  for (let i = 0; i < 8; i++) {
    let x, y;
    if (i < 3) {
      x = -1.48 + i * 0.85;
      y = 0.98;
    } else if (i < 6) {
      x = -1.48 + (i - 3) * 0.85;
      y = -0.98;
    } else {
      x = i === 6 ? -1.65 : 0.45;
      y = 0;
    }
    block(memory, 0.46, 0.43, 0.07, black, x, y, -0.11, 0.025);
  }
  const sink = layer("heatsink");
  if (lite) block(sink, w - 0.2, h - 0.2, 0.7, finmat, 0, 0, 0.2);
  else {
    const fin = new T.BoxGeometry(0.025, h - 0.32, 0.63);
    const inst = new T.InstancedMesh(fin, finmat, 115);
    const m = new T.Matrix4();
    for (let i = 0; i < 115; i++) {
      m.makeTranslation(-w / 2 + 0.18 + (i * (w - 0.36)) / 114, 0, 0.25);
      inst.setMatrixAt(i, m);
    }
    sink.add(inst);
    for (let j = 0; j < 5; j++) {
      const points = [
        new T.Vector3(-w / 2 + 0.2, -0.9 + j * 0.45, 0.02),
        new T.Vector3(-1.2, -0.9 + j * 0.45, 0.05),
        new T.Vector3(1.5, -0.9 + j * 0.45, 0.05),
        new T.Vector3(w / 2 - 0.3, -0.7 + j * 0.37, 0.05),
      ];
      const pipe = new T.Mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, 0.055, 6, false),
        metal("#b08a5c", 0.3, 0.8),
      );
      sink.add(pipe);
    }
  }
  const face = layer("fans");
  const plate = new T.Shape();
  const r = 0.15;
  plate.moveTo(-w / 2 + r, -h / 2);
  plate.lineTo(w / 2 - r, -h / 2);
  plate.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  plate.lineTo(w / 2, h / 2 - r);
  plate.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  plate.lineTo(-w / 2 + r, h / 2);
  plate.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  plate.lineTo(-w / 2, -h / 2 + r);
  plate.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  for (let i = 0; i < design.fans; i++) {
    const hole = new T.Path();
    hole.absarc(
      -w / 2 + (w * (i + 0.5)) / design.fans,
      0,
      design.style === "founders"
        ? 1.22
        : Math.min((w / design.fans) * 0.44, 1.25) + 0.045,
      0,
      Math.PI * 2,
      true,
    );
    plate.holes.push(hole);
  }
  const outer = new T.Mesh(
    new T.ExtrudeGeometry(plate, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      curveSegments: 36,
    }),
    design.style === "founders" ? metal("#252b2d", 0.42, 0.6) : shroud,
  );
  outer.position.z = 0.58;
  face.add(outer);

  // Frame has open fan windows, rather than a solid plate over the fins.
  block(face, w, 0.19, 0.17, shroud, 0, h / 2 - 0.05, 0.67, 0.06);
  block(face, w, 0.19, 0.17, shroud, 0, -h / 2 + 0.05, 0.67, 0.06);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1])
    block(face, 0.22, h, 0.17, shroud, x, 0, 0.67, 0.05);
  const fe = design.style === "founders";
  const count = design.fans;
  if (fe) {
    for (const a of [-0.38, 0.38]) {
      const beam = block(face, 0.16, h * 1.12, 0.2, silver, 0, 0, 0.7, 0.04);
      beam.rotation.z = a;
    }
    block(face, w, 0.09, 0.13, silver, 0, h / 2 - 0.14, 0.79, 0.025);
    block(face, w, 0.09, 0.13, silver, 0, -h / 2 + 0.14, 0.79, 0.025);
  } else {
    for (let i = 1; i < count; i++)
      block(
        face,
        0.19,
        h - 0.2,
        0.15,
        shroud,
        -w / 2 + (w * i) / count,
        0,
        0.68,
        0.04,
      );
    if (design.style === "nitro")
      for (let i = 0; i < 14; i++) {
        const r = block(face, 0.035, 0.45, 0.06, shroud, w / 2 - 0.5, 0, 0.8);
        r.rotation.z = -0.4;
        r.position.y = -1.1 + i * 0.17;
      }
    block(face, w - 0.9, 0.045, 0.07, luminous, 0, h / 2 + 0.025, 0.61, 0.012);
  }
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / count;
    const r = fe ? 1.16 : Math.min((w / count) * 0.44, 1.25);
    const well = new T.Mesh(new T.CircleGeometry(r + 0.055, 40), black);
    well.position.set(x, 0, 0.685);
    face.add(well);
    if (lite) {
      const disk = new T.Mesh(
        new T.RingGeometry(r * 0.3, r * 0.9, 13),
        metal("#333e45", 0.5, 0.6),
      );
      disk.position.set(x, 0, 0.72);
      face.add(disk);
    } else {
      const f = fan(r, design.style === "white");
      f.position.set(x, 0, 0.73);
      face.add(f);
      fans.push(f);
    }
  }
  if (design.style === "astral" && !lite) {
    const f = fan(0.99);
    f.rotation.y = Math.PI;
    f.position.set(w / 2 - 1.4, 0, -0.5);
    root.add(f);
    fans.push(f);
  }
  const back = layer("backplate");
  block(back, w - 0.1, h - 0.05, 0.08, shroud, 0, 0, -0.43, 0.07);
  if (!lite) {
    for (let i = 0; i < 12; i++) {
      const v = block(
        back,
        0.07,
        1.5,
        0.016,
        black,
        w / 2 - 1.7 + i * 0.12,
        0,
        -0.48,
      );
      v.rotation.z = -0.32;
    }
    const t = label(
      design.brand.toUpperCase() + " / " + design.name.toUpperCase(),
      "#c4cbcb",
    );
    t.position.set(-1.0, 0.12, -0.48);
    t.rotation.y = Math.PI;
    back.add(t);
    const side = label(
      design.style === "founders" ? "GEFORCE RTX" : design.brand.toUpperCase(),
      design.trim,
    );
    side.position.set(0.2, h / 2 + 0.02, 0.16);
    side.rotation.x = -Math.PI / 2;
    root.add(side);
    const screws = new T.CylinderGeometry(0.045, 0.045, 0.025, 10);
    for (const x of [-w / 2 + 0.25, w / 2 - 0.25])
      for (const y of [-1.25, 1.25]) {
        const s = new T.Mesh(screws, finmat);
        s.rotation.x = Math.PI / 2;
        s.position.set(x, y, 0.78);
        face.add(s);
      }
    // I/O bracket and dark display sockets.
    block(pcb, 0.11, h + 0.15, 0.9, finmat, -w / 2 - 0.1, -0.04, 0.05, 0.02);
    for (let i = 0; i < 4; i++)
      block(
        pcb,
        0.035,
        0.42,
        0.17,
        black,
        -w / 2 - 0.165,
        0.94 - i * 0.57,
        0.08,
        0.02,
      );
    block(pcb, 0.62, 0.23, 0.27, black, w / 2 - 1.3, h / 2 + 0.08, -0.2, 0.03);
  }
  for (const layer of Object.values(layers)) {
    const own = new Map();
    layer.traverse((o) => {
      if (o.isMesh && !Array.isArray(o.material)) {
        if (!own.has(o.material)) own.set(o.material, o.material.clone());
        o.material = own.get(o.material);
      }
    });
  }
  root.userData = { layers, fans, width: w };
  return root;
}

export function createGpuScene(
  host,
  {
    onSelect,
    onStatus,
    onDepth,
    onPosition = () => {},
    onHover = () => {},
    onGuide = () => {},
    onPointerLock = () => {},
    onCaptureError = () => {},
    reducedMotion = false,
  },
) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    onStatus("fallback");
    return {
      update() {},
      reset() {},
      dispose() {},
      navigate() {},
      move() {},
      turn() {},
      travel() {},
      enterFirstPerson() {},
      entrance() {},
    };
  }
  const scene = new T.Scene();
  scene.background = new T.Color("#121010");
  scene.fog = new T.FogExp2("#201d1d", 0.014);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Museum view: WASD to move, E to inspect the aimed exhibit",
  );
  host.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(44, 1, 0.1, 190);
  const pmrem = new T.PMREMGenerator(renderer),
    environment = new RoomEnvironment();
  const env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.48;
  environment.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight("#ded6d1", "#1b1919", 1.1));
  const key = new T.DirectionalLight("#fff2ec", 3);
  key.position.set(-3, 9, 8);
  scene.add(key);
  const rim = new T.DirectionalLight("#cb8989", 1.3);
  rim.position.set(9, 6, -6);
  scene.add(rim);
  const warm = new T.DirectionalLight("#e9dfd8", 1.5);
  warm.position.set(-8, 3, 1);
  scene.add(warm);
  const museum = new T.Group();
  scene.add(museum);
  const steel = metal("#aea6a6", 0.32, 0.6),
    deck = metal("#2f2b2a", 0.43, 0.52),
    lightmat = new T.MeshBasicMaterial({ color: "#e26665" }),
    orange = new T.MeshBasicMaterial({ color: "#e26665" });
  const floor = new T.Mesh(
    new T.PlaneGeometry(170, 190),
    metal("#1e1b1b", 0.44, 0.45),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.15, -45);
  museum.add(floor);
  const violet = new T.MeshBasicMaterial({ color: "#b84240" });
  const cyan = new T.MeshBasicMaterial({ color: "#a59b97" });
  const shell = metal("#615958", 0.4, 0.55);
  const carbon = metal("#211e1e", 0.64, 0.25);
  // The room is an oversized PC chassis: broad panels and circuit-board paths.
  block(museum, 0.35, 9.5, 65, carbon, -9.2, 4.5, -14, 0.12);
  block(museum, 0.35, 9.5, 65, carbon, 9.2, 4.5, -14, 0.12);
  for (let bay = 0; bay < 4; bay++) {
    const z = 3 - bay * 13;
    block(
      museum,
      10,
      0.06,
      8.8,
      metal(bay % 2 ? "#2c2929" : "#232020", 0.5, 0.4),
      0,
      -0.12,
      z,
      0.12,
    );
    // Paired, angular PCB traces replace the warehouse floor grid.
    for (const side of [-1, 1]) {
      const m = side < 0 ? cyan : violet;
      block(museum, 0.055, 0.015, 7, m, side * 4, -0.07, z);
      block(museum, 1.2, 0.015, 0.055, m, side * 3.4, -0.07, z - 3.5);
      block(museum, 0.055, 0.015, 4, m, side * 2.8, -0.07, z - 5.5);
      const pad = new T.Mesh(new T.RingGeometry(0.13, 0.19, 24), m);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(side * 2.8, -0.055, z - 7.5);
      museum.add(pad);
    }
  }
  const clickable = [],
    racks = new T.Group();
  museum.add(racks);
  for (const rack of museumRacks) {
    const { side, bay, generation, maker } = rack;
    const group = new T.Group();
    group.position.set(side * 7.4, 0, 3 - bay * 13);
    group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    racks.add(group);
    // Bevelled case sides, a vented rear panel and ARGB edge channels.
    block(group, 8.7, 8.05, 0.22, carbon, 0, 3.8, -1.22, 0.14);
    for (const x of [-4.25, 4.25]) {
      block(group, 0.32, 8.25, 2.7, shell, x, 3.95, 0, 0.1);
      block(
        group,
        0.055,
        7.6,
        0.07,
        side < 0 ? cyan : violet,
        x,
        3.95,
        1.4,
        0.02,
      );
    }
    block(group, 8.7, 0.4, 2.7, shell, 0, 7.95, 0, 0.12);
    block(group, 8.7, 0.35, 2.7, shell, 0, 0.05, 0, 0.1);
    // The tiny rear vents read as a PC enclosure rather than open server shelving.
    for (let vent = 0; vent < 9; vent++)
      block(
        group,
        6.8,
        0.032,
        0.025,
        metal("#433d3d", 0.6, 0.3),
        0,
        0.9 + vent * 0.75,
        -1.08,
      );
    const models = gpus.filter((g) => g.generation === generation);
    const accent = makers[maker].color;
    for (let level = 0; level < 4; level++) {
      const y = 0.5 + level * 1.8;
      block(group, 8.5, 0.12, 2.5, deck, 0, y, 0);
      block(
        group,
        8.1,
        0.028,
        0.045,
        level % 2 ? violet : cyan,
        0,
        y - 0.1,
        1.4,
      );
      block(group, 8.1, 0.025, 0.06, lightmat, 0, y + 1.6, -0.65);
      for (let slot = 0; slot < 3; slot++) {
        const gpu = models[level * 3 + slot];
        if (!gpu) continue;
        const design = defaultDesign(gpu);
        const x = -2.8 + slot * 2.8;
        const card = makeCard(design, true);
        card.scale.setScalar(0.28);
        card.position.set(x, y + 0.7, 0.15);
        group.add(card);
        const hit = new T.Mesh(
          new T.BoxGeometry(2.6, 1.55, 0.9),
          new T.MeshBasicMaterial({ visible: false }),
        );
        hit.position.copy(card.position);
        hit.userData.exhibit = { gpu, design };
        group.add(hit);
        clickable.push(hit);
        block(
          group,
          2.56,
          0.37,
          0.055,
          new T.MeshBasicMaterial({ color: "#191717" }),
          x,
          y,
          1.29,
        );
        const name = label(gpu.name, "#f1f1f1", 500);
        name.scale.setScalar(0.88);
        name.position.set(x, y, 1.326);
        group.add(name);
      }
    }
    block(group, 8.5, 0.7, 0.1, deck, 0, 7.5, 1.15);
    const title = label(maker.toUpperCase() + " / " + generation, accent, 700);
    title.position.set(0, 7.5, 1.23);
    title.scale.setScalar(1.6);
    group.add(title);
  }

  // Four chamfered gateways suggest a premium gaming case skeleton.
  for (let bay = 0; bay < 5; bay++) {
    const z = 12 - bay * 13;
    for (const side of [-1, 1]) {
      block(museum, 0.28, 6.6, 0.38, shell, side * 7.5, 3.15, z, 0.06);
      const shoulder = block(
        museum,
        0.28,
        2.8,
        0.38,
        shell,
        side * 6.55,
        7.45,
        z,
        0.06,
      );
      shoulder.rotation.z = side * 0.76;
      block(
        museum,
        0.055,
        6.3,
        0.08,
        side < 0 ? cyan : violet,
        side * 7.29,
        3.2,
        z + 0.22,
      );
      const light = block(
        museum,
        0.055,
        2.8,
        0.08,
        side < 0 ? cyan : violet,
        side * 6.34,
        7.4,
        z + 0.22,
      );
      light.rotation.z = side * 0.76;
    }
    block(museum, 11.1, 0.28, 0.38, shell, 0, 8.45, z, 0.06);
    block(
      museum,
      10.8,
      0.045,
      0.08,
      bay % 2 ? cyan : violet,
      0,
      8.23,
      z + 0.22,
    );
  }
  const endPanel = new T.Group();
  endPanel.position.set(0, 4.2, -48);
  block(endPanel, 18, 8.5, 0.35, carbon, 0, 0, 0, 0.3);
  const signature = label("GRAPHICS / AWBA", "#e26665", 900);
  signature.position.set(0, 0, 0.25);
  signature.scale.setScalar(2);
  endPanel.add(signature);
  museum.add(endPanel);
  for (let i = 0; i < 4; i++) {
    const t = label("0" + (i + 1) + " / GPU BAY", "#b1aaa9", 500);
    t.rotation.x = -Math.PI / 2;
    t.position.set(0, -0.055, 8 - i * 13);
    museum.add(t);
  }
  // A separate, quiet exhibition stage keeps the selected card readable.
  const stage = new T.Group();
  scene.add(stage);
  const stageFloor = new T.Mesh(
    new T.PlaneGeometry(160, 160),
    metal("#171719", 0.85, 0.08),
  );
  stageFloor.rotation.x = -Math.PI / 2;
  stage.add(stageFloor);
  const pedestal = new T.Group();
  block(
    pedestal,
    7.6,
    1.75,
    2.8,
    metal("#242427", 0.58, 0.35),
    0,
    0.875,
    0,
    0.16,
  );
  block(
    pedestal,
    7.3,
    0.035,
    2.65,
    metal("#514847", 0.5, 0.3),
    0,
    1.76,
    0,
    0.02,
  );
  block(pedestal, 6.9, 0.025, 0.025, orange, 0, 1.79, 1.24);
  for (const x of [-2.3, 2.3])
    block(pedestal, 0.18, 0.35, 0.45, deck, x, 1.93, 0, 0.04);
  pedestal.position.set(2.15, 0, 0);
  stage.add(pedestal);
  const guide = createMuseumGuide();
  guide.position.set(2.2, 0, 10.5);
  scene.add(guide);
  const guideHit = new T.Mesh(
    new T.BoxGeometry(0.95, 2.7, 0.8),
    new T.MeshBasicMaterial({ visible: false }),
  );
  guideHit.position.y = 1.35;
  guideHit.userData.guide = true;
  guide.add(guideHit);
  clickable.push(guideHit);
  const guideName = label("ARI / MUSEUM GUIDE", "#e9d4cf", 650);
  guideName.position.set(0, 2.8, 0);
  guideName.scale.setScalar(0.45);
  guide.add(guideName);
  const scanner = createScanner();
  camera.add(scanner);
  scene.add(camera);
  let hero = makeCard(designs[0]);
  scene.add(hero);
  let state = {
      mode: "vault",
      design: designs[0],
      part: "chip",
      spin: false,
      firstPerson: false,
      tourActive: false,
      reducedMotion,
    },
    depth = 0,
    rotationX = -0.12,
    rotationY = -0.35,
    targetRX = rotationX,
    targetRY = rotationY,
    disposed = false,
    frame = 0,
    last = performance.now(),
    snapCamera = true,
    skipLockClick = false,
    lockUnavailable = false;
  const walk = { x: 0, z: 16, yaw: 0, pitch: 0.08 };
  const keys = new Set(),
    held = new Set();
  let positionTick = 0,
    hovered = null,
    lastReported = "";
  const cameraTarget = new T.Vector3(),
    look = new T.Vector3(),
    lookTarget = new T.Vector3();
  camera.position.set(0, 2.5, 16);
  look.set(0, 2.7, -7);
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  let down = null,
    drag = false;
  function pick(e, centered = false) {
    // Navigation can be followed by an input before the next animation frame.
    // Commit that pose before casting so inspection uses the new destination.
    if (snapCamera && state.mode === "vault") {
      camera.position.set(walk.x, 2.5, walk.z);
      look.set(
        walk.x + Math.sin(walk.yaw) * 15,
        2.5 + Math.sin(walk.pitch) * 15,
        walk.z - Math.cos(walk.yaw) * 15,
      );
      camera.fov = 62;
      camera.updateProjectionMatrix();
      camera.lookAt(look);
      camera.updateMatrixWorld();
      snapCamera = false;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    if (centered) pointer.set(0, 0);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(clickable, false)[0];
  }
  function reportPosition() {
    const stamp = [walk.x, walk.z, walk.yaw, walk.pitch]
      .map((v) => v.toFixed(2))
      .join(",");
    if (stamp === lastReported) return;
    lastReported = stamp;
    depth = (16 - walk.z) / 60;
    onDepth(depth);
    onPosition({ ...walk });
  }
  function move(forward, right, amount) {
    walk.x = Math.max(
      -5.3,
      Math.min(
        5.3,
        walk.x +
          (Math.sin(walk.yaw) * forward + Math.cos(walk.yaw) * right) * amount,
      ),
    );
    walk.z = Math.max(
      -44,
      Math.min(
        18,
        walk.z +
          (-Math.cos(walk.yaw) * forward + Math.sin(walk.yaw) * right) * amount,
      ),
    );
  }
  const lockError = () => {
    lockUnavailable = true;
    onPointerLock(false);
    onCaptureError();
  };
  function lockMouse() {
    renderer.domElement.focus({ preventScroll: true });
    if (
      !renderer.domElement.requestPointerLock ||
      matchMedia("(pointer: coarse)").matches
    ) {
      lockError();
      return;
    }
    try {
      const request = renderer.domElement.requestPointerLock();
      request?.catch(lockError);
    } catch {
      lockError();
    }
  }
  const isLocked = () => document.pointerLockElement === renderer.domElement;
  function inspectHit(hit) {
    if (!hit) return;
    if (isLocked()) document.exitPointerLock();
    if (hit.object.userData.guide) onGuide();
    else onSelect(hit.object.userData.exhibit);
  }
  const lockChange = () => {
    blur();
    onPointerLock(isLocked());
  };
  const mouseLook = (e) => {
    if (
      !isLocked() ||
      state.mode !== "vault" ||
      state.paused ||
      state.tourActive
    )
      return;
    walk.yaw -= e.movementX * 0.0025;
    walk.pitch = Math.max(
      -0.75,
      Math.min(0.85, walk.pitch - e.movementY * 0.0025),
    );
  };
  const onDown = (e) => {
    if (state.paused || state.tourActive || e.button !== 0) return;
    skipLockClick =
      !lockUnavailable &&
      state.firstPerson &&
      state.mode === "vault" &&
      !isLocked() &&
      !matchMedia("(pointer: coarse)").matches;
    if (skipLockClick) {
      lockMouse();
      return;
    }
    if (isLocked()) return;
    down = {
      x: e.clientX,
      y: e.clientY,
      rx: targetRX,
      ry: targetRY,
      yaw: walk.yaw,
      pitch: walk.pitch,
    };
    drag = false;
    renderer.domElement.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (state.paused || state.tourActive || isLocked()) return;
    if (down) {
      const dx = e.clientX - down.x,
        dy = e.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag = true;
      if (state.mode === "vault") {
        walk.yaw = down.yaw - dx * 0.006;
        walk.pitch = Math.max(-0.65, Math.min(0.8, down.pitch + dy * 0.004));
      } else {
        targetRY = down.ry + dx * 0.008;
        targetRX = Math.max(-1.3, Math.min(1.3, down.rx + dy * 0.006));
      }
    } else if (state.mode === "vault") {
      const p = pick(e);
      renderer.domElement.style.cursor = p ? "pointer" : "grab";
      const name = p?.object.userData.guide
        ? "Ari · Museum guide"
        : p?.object.userData.exhibit?.gpu.name || null;
      if (name !== hovered) {
        hovered = name;
        onHover(name);
      }
    }
  };
  const onUp = (e) => {
    if (state.paused || state.tourActive) {
      down = null;
      return;
    }
    if (!drag && state.mode === "vault") {
      const p = pick(e, state.firstPerson);
      if (!skipLockClick) inspectHit(p);
    }
    down = null;
  };
  const onCancel = () => {
    down = null;
  };
  const wheel = (e) => {
    if (state.mode !== "vault" || state.paused || state.tourActive) return;
    e.preventDefault();
    move(e.deltaY * 0.003, 0, 1);
    reportPosition();
  };
  const keyDown = (e) => {
    if (
      state.mode !== "vault" ||
      state.paused ||
      state.tourActive ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    )
      return;
    if (e.code === "KeyE") {
      e.preventDefault();
      inspectHit(pick({ clientX: 0, clientY: 0 }, true));
      return;
    }
    if (
      [
        "ShiftLeft",
        "ShiftRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys.add(e.code);
    }
  };
  const keyUp = (e) => keys.delete(e.code);
  const blur = () => {
    keys.clear();
    held.clear();
    down = null;
  };
  document.addEventListener("pointerlockerror", lockError);
  document.addEventListener("pointerlockchange", lockChange);
  document.addEventListener("mousemove", mouseLook);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointercancel", onCancel);
  renderer.domElement.addEventListener("wheel", wheel, { passive: false });
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const materials = new Set(),
    geometries = new Set(),
    textures = new Set();
  function disposeObject(object) {
    object.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m) {
          materials.add(m);
          if (m.map) textures.add(m.map);
        }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    geometries.clear();
    materials.clear();
    textures.clear();
  }
  function render(now) {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (state.paused || document.hidden || state.mode === "photos") {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const mobile = camera.aspect < 0.85,
      vault = state.mode === "vault",
      inside = state.mode === "inside";
    if (vault) {
      const forward =
        (keys.has("KeyW") || keys.has("ArrowUp") || held.has("forward")
          ? 1
          : 0) -
        (keys.has("KeyS") || keys.has("ArrowDown") || held.has("back") ? 1 : 0);
      const right =
        (keys.has("KeyD") || held.has("right") ? 1 : 0) -
        (keys.has("KeyA") || held.has("left") ? 1 : 0);
      if (!state.paused && !state.tourActive) {
        walk.yaw +=
          ((keys.has("ArrowRight") || held.has("turnRight") ? 1 : 0) -
            (keys.has("ArrowLeft") || held.has("turnLeft") ? 1 : 0)) *
          dt *
          1.25;
        const diagonal = forward && right ? Math.SQRT1_2 : 1;
        const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2 : 4.2;
        move(forward * diagonal, right * diagonal, dt * speed);
      }
      cameraTarget.set(walk.x, 2.5, walk.z);
      lookTarget.set(
        walk.x + Math.sin(walk.yaw) * 15,
        2.5 + Math.sin(walk.pitch) * 15,
        walk.z - Math.cos(walk.yaw) * 15,
      );
      if (now - positionTick > 150) {
        reportPosition();
        positionTick = now;
      }
    } else {
      cameraTarget.set(mobile ? 2.15 : 0, mobile ? 3.9 : 4.1, mobile ? 19 : 15);
      lookTarget.set(mobile ? 2.15 : 0.1, mobile ? -1.2 : 2.9, -1);
    }
    const nextFov = vault ? 62 : 44;
    if (camera.fov !== nextFov) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    const ease = state.reducedMotion ? 1 : 1 - Math.exp(-dt * (vault ? 14 : 4));
    if (snapCamera) {
      camera.position.copy(cameraTarget);
      look.copy(lookTarget);
      snapCamera = false;
    }
    camera.position.lerp(cameraTarget, ease);
    look.lerp(lookTarget, ease);
    camera.lookAt(look);
    hero.visible = !vault;
    museum.visible = vault;
    stage.visible = !vault;
    scanner.visible = vault && state.firstPerson && !state.tourActive;
    scanner.position.y =
      -0.29 +
      (!state.reducedMotion && (keys.size || held.size)
        ? Math.sin(now * 0.009) * 0.012
        : 0);
    guide.visible = vault;
    if (!state.tourActive || !state.guideRack)
      guide.position.x = mobile ? 0.65 : 2.2;
    if (vault && !state.tourActive) {
      const p = pick({ clientX: 0, clientY: 0 }, true);
      const name = p?.object.userData.guide
        ? "Ari · Museum guide"
        : p?.object.userData.exhibit?.gpu.name || null;
      if (name !== hovered) {
        hovered = name;
        onHover(name);
      }
    }
    hero.position.set(2.15, 3.32, 0);
    hero.scale.setScalar(0.88);
    if (state.spin && !down && !state.reducedMotion && !inside)
      targetRY = -0.22 + Math.sin(now * 0.00022) * 0.6;
    rotationX += (targetRX - rotationX) * ease;
    rotationY += (targetRY - rotationY) * ease;
    hero.rotation.set(rotationX, rotationY, 0);
    if (inside) {
      hero.rotation.x += (-0.43 - hero.rotation.x) * ease;
      hero.rotation.y += (-0.3 - hero.rotation.y) * ease;
    }
    const positions = {
      fans: inside ? 1.7 : 0,
      heatsink: inside ? 0.7 : 0,
      chip: inside ? -0.35 : 0,
      memory: inside ? -0.35 : 0,
      pcb: inside ? -0.35 : 0,
      backplate: inside ? -0.9 : 0,
    };
    for (const [id, g] of Object.entries(hero.userData.layers)) {
      g.position.z += (positions[id] - g.position.z) * ease;
      const y = inside
        ? {
            fans: 1.7,
            heatsink: 0.55,
            chip: -0.8,
            memory: -0.8,
            pcb: -0.8,
            backplate: -1.8,
          }[id]
        : 0;
      g.position.y += (y - g.position.y) * ease;
      g.traverse((o) => {
        if (o.isMesh && o.material?.emissive) {
          const active = inside && state.part === id;
          o.material.emissive.set(active ? "#29576b" : "#000000");
          o.material.emissiveIntensity = active ? 0.35 : 0;
        }
      });
    }
    if (!state.reducedMotion)
      for (const f of hero.userData.fans)
        f.userData.blades.rotation.z += dt * 1.7;

    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  onStatus("ready");
  return {
    update(next) {
      if (next.design && next.design !== state.design) {
        const old = hero;
        hero = makeCard(next.design);
        scene.add(hero);
        scene.remove(old);
        disposeObject(old);
        targetRX = -0.12;
        targetRY = -0.35;
      }
      if (
        next.paused ||
        (next.mode && next.mode !== "vault") ||
        next.tourActive
      ) {
        if (isLocked()) document.exitPointerLock();
        keys.clear();
        held.clear();
        down = null;
      }
      if (next.mode && next.mode !== state.mode) {
        snapCamera = true;
        onHover(null);
        keys.clear();
        held.clear();
      }
      state = { ...state, ...next };
      if (next.tourActive !== undefined || next.guideRack !== undefined) {
        const r =
          state.tourActive && museumRacks.find((r) => r.id === state.guideRack);
        guide.position.set(
          r ? r.side * 4.2 : 2.2,
          0,
          r ? 5.2 - r.bay * 13 : 10.5,
        );
        guide.rotation.y = r ? (-r.side * Math.PI) / 2 : 0;
      }
    },
    enterFirstPerson() {
      renderer.domElement.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        if (!disposed) lockMouse();
      });
    },
    entrance() {
      Object.assign(walk, { x: 0, z: 16, yaw: 0, pitch: 0.08 });
      snapCamera = true;
      reportPosition();
    },
    reset() {
      targetRX = -0.12;
      targetRY = -0.35;
      if (state.mode === "vault") {
        Object.assign(walk, { x: 0, z: 16, yaw: 0, pitch: 0.08 });
        reportPosition();
      }
    },
    travel(delta) {
      move(delta, 0, 1);
      reportPosition();
    },
    navigate(id) {
      const r = museumRacks.find((r) => r.id === id);
      if (!r) return;
      snapCamera = true;
      walk.x = r.side * 2.6;
      walk.z = 3 - r.bay * 13;
      walk.yaw = (r.side * Math.PI) / 2;
      walk.pitch = 0.1;
      keys.clear();
      held.clear();
      reportPosition();
    },
    move(direction, active) {
      if (active) held.add(direction);
      else held.delete(direction);
    },
    turn(delta) {
      walk.yaw += delta;
      reportPosition();
    },
    step(direction) {
      if (direction === "forward") move(1, 0, 0.9);
      if (direction === "back") move(-1, 0, 0.9);
      if (direction === "left") move(0, -1, 0.9);
      if (direction === "right") move(0, 1, 0.9);
      if (direction === "turnLeft") walk.yaw -= 0.25;
      if (direction === "turnRight") walk.yaw += 0.25;
      reportPosition();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      if (isLocked()) document.exitPointerLock();
      document.removeEventListener("pointerlockerror", lockError);
      document.removeEventListener("pointerlockchange", lockChange);
      document.removeEventListener("mousemove", mouseLook);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onCancel);
      renderer.domElement.removeEventListener("wheel", wheel);
      disposeObject(scene);
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
