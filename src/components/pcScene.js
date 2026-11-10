import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Schematic, original geometry: intentionally not a CAD model of a retail part.
export function createPCScene(host, onSelect, onReady) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive 3D desktop computer. Use the component buttons to explore with a keyboard.",
  );
  renderer.domElement.setAttribute("role", "img");
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5.5;
  controls.maxDistance = 14;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.target.set(0, 0, 0);
  function resetCamera() {
    camera.position.set(5.9, 3.5, 8.8);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  resetCamera();
  scene.add(new THREE.HemisphereLight(0xcce4ff, 0x171923, 3.5));
  const key = new THREE.DirectionalLight(0xffffff, 5);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9a9cff, 4);
  rim.position.set(-4, 2, -2);
  scene.add(rim);
  const warm = new THREE.PointLight(0xd7ff82, 22, 10);
  warm.position.set(2, -1, 4);
  scene.add(warm);

  const root = new THREE.Group();
  scene.add(root);
  const parts = {},
    fans = [],
    pickables = [];
  const colors = {
    cpu: "#d7ff82",
    motherboard: "#7ac6b6",
    ram: "#d1a4ff",
    gpu: "#9dafff",
    ssd: "#f1c47e",
    psu: "#f2a79b",
    cooling: "#85d4e3",
    case: "#c0c7d5",
  };
  const offsets = {
    cpu: [-0.35, 1.6, 1.6],
    motherboard: [-1.9, 0, -0.6],
    ram: [1.5, 1.2, 0.8],
    gpu: [0.2, -0.45, 2.1],
    ssd: [-1.2, -0.4, 1.2],
    psu: [-1.5, -0.8, 1.1],
    cooling: [0, 2.3, 0.35],
    case: [0, 0, 0],
  };
  function group(id, pos) {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.userData.base = g.position.clone();
    g.userData.id = id;
    root.add(g);
    parts[id] = g;
    return g;
  }
  function mat(color, metalness = 0.3, roughness = 0.55) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness });
  }
  function add(g, geo, material, pos = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos);
    mesh.userData.part = g.userData.id;
    g.add(mesh);
    pickables.push(mesh);
    return mesh;
  }
  function box(g, size, color, pos, opacity) {
    const material = mat(color);
    if (opacity != null) {
      material.transparent = true;
      material.opacity = opacity;
      material.depthWrite = false;
    }
    return add(g, new THREE.BoxGeometry(...size), material, pos);
  }
  function cylinder(g, radius, height, color, pos) {
    const m = add(
      g,
      new THREE.CylinderGeometry(radius, radius, height, 32),
      mat(color),
      pos,
    );
    m.rotation.x = Math.PI / 2;
    return m;
  }
  function line(g, points, color = "#86a59b", opacity = 0.45) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(...p)),
      ),
      material,
    );
    g.add(l);
    return l;
  }
  function fan(g, position, radius = 0.42, orientation = "z") {
    const f = new THREE.Group();
    f.position.set(...position);
    g.add(f);
    if (orientation === "x") f.rotation.y = Math.PI / 2;
    const ring = add(
      g,
      new THREE.TorusGeometry(radius, 0.025, 8, 64),
      mat("#91a99a"),
    );
    g.remove(ring);
    f.add(ring);
    const housing = box(g, [radius * 2.25, radius * 2.25, 0.08], "#202730");
    g.remove(housing);
    f.add(housing);
    const spinner = new THREE.Group();
    spinner.position.z = 0.07;
    f.add(spinner);
    for (let i = 0; i < 7; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.68, radius * 0.25, 0.035),
        mat("#495360"),
      );
      const a = (i / 7) * Math.PI * 2;
      blade.position.set(
        Math.cos(a) * radius * 0.42,
        Math.sin(a) * radius * 0.42,
        0,
      );
      blade.rotation.z = a + 0.5;
      spinner.add(blade);
    }
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, 0.11, 24),
      mat("#d7ff82"),
    );
    hub.rotation.x = Math.PI / 2;
    spinner.add(hub);
    const led = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.91, 0.013, 6, 64),
      new THREE.MeshBasicMaterial({ color: "#bedc96" }),
    );
    led.position.z = 0.1;
    f.add(led);
    f.traverse((o) => {
      if (o.isMesh) o.userData.part = g.userData.id;
    });
    fans.push(spinner);
    return f;
  }
  function label(g, text, pos, width = 0.9, color = "#e4e8e4") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "500 46px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 82);
    const texture = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 4),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
    );
    mesh.position.set(...pos);
    g.add(mesh);
  }

  const chassis = group("case", [0, 0, 0]);
  for (const x of [-1.48, 1.48])
    for (const z of [-1.05, 1.05])
      box(chassis, [0.085, 4.52, 0.085], "#535a65", [x, 0, z]);
  for (const y of [-2.25, 2.25]) {
    box(chassis, [3.05, 0.13, 2.17], "#242a32", [0, y, 0]);
    for (const z of [-1.05, 1.05])
      box(chassis, [3.05, 0.06, 0.06], "#7b818a", [0, y, z]);
  }
  box(chassis, [2.93, 0.09, 2.07], "#303640", [0, -1.21, 0]);
  box(chassis, [0.07, 4.34, 2.02], "#242b34", [-1.47, 0, 0]);
  box(chassis, [0.06, 4.32, 2.08], "#434f53", [1.47, 0, 0], 0.16);
  // Side panel is a thin edge outline so internal parts remain visible and clickable.
  line(
    chassis,
    [
      [-1.42, -2.15, 1.08],
      [1.42, -2.15, 1.08],
      [1.42, 2.15, 1.08],
      [-1.42, 2.15, 1.08],
      [-1.42, -2.15, 1.08],
    ],
    "#a7bbbf",
    0.3,
  );
  for (const x of [-1.1, 1.1])
    for (const z of [-0.7, 0.7])
      box(chassis, [0.3, 0.17, 0.35], "#11161d", [x, -2.39, z]);
  for (let i = 0; i < 13; i++)
    box(chassis, [0.045, 0.02, 1.5], "#6b747c", [-1.05 + i * 0.175, 2.325, 0]);
  cylinder(chassis, 0.065, 0.03, "#d7ff82", [1.1, 2.33, 0.7]).rotation.x = 0;
  label(chassis, "AWBA / 01", [0.1, -1.4, 1.065], 1.1, "#a9b1bc");

  const board = group("motherboard", [-0.13, 0.37, -0.76]);
  box(board, [2.38, 2.95, 0.09], "#183a36", [0, 0, 0]);
  for (let i = 0; i < 22; i++) {
    const x = -1.1 + i * 0.1;
    line(
      board,
      [
        [x, -1.4, 0.055],
        [x, -0.9 + (i % 4) * 0.1, 0.055],
        [x + 0.22, -0.65 + (i % 4) * 0.1, 0.055],
        [x + 0.22, 1.4, 0.055],
      ],
      "#609d87",
      0.38,
    );
  }
  box(board, [1.1, 0.17, 0.14], "#0c151b", [-0.18, -0.7, 0.1]);
  box(board, [1.1, 0.1, 0.14], "#65717b", [-0.18, -0.69, 0.15]);
  box(board, [0.33, 1.5, 0.26], "#68737e", [-0.94, 0.55, 0.15]);
  for (let i = 0; i < 7; i++)
    box(board, [0.02, 1.48, 0.04], "#a1acb5", [-1.07 + i * 0.041, 0.55, 0.3]);
  for (let i = 0; i < 7; i++)
    cylinder(board, 0.055, 0.12, "#afb6bd", [-0.7 + i * 0.15, 1.1, 0.13]);
  box(board, [0.45, 0.45, 0.15], "#566574", [0.55, -0.9, 0.16]);
  for (const x of [-1.08, 1.08])
    for (const y of [-1.35, 1.35])
      cylinder(board, 0.035, 0.02, "#c1c6cb", [x, y, 0.07]);
  label(board, "AM5 / DDR5", [-0.25, -1.23, 0.07], 1.0, "#b2d4c2");

  const cpu = group("cpu", [-0.32, 0.87, -0.52]);
  box(cpu, [0.88, 0.88, 0.1], "#262d36", [0, 0, 0]);
  box(cpu, [0.7, 0.7, 0.11], "#cad1ca", [0, 0, 0.075]);
  box(cpu, [0.59, 0.59, 0.015], "#a9b3ad", [0, 0, 0.14]);
  label(cpu, "CPU", [0, 0.04, 0.155], 0.43, "#303d34");
  label(cpu, "SOCKET AM5", [0, -0.16, 0.156], 0.48, "#303d34");

  const ram = group("ram", [0.8, 0.92, -0.38]);
  for (const x of [-0.13, 0.13]) {
    box(ram, [0.09, 1.46, 0.42], "#272f3c", [x, 0, 0]);
    box(ram, [0.095, 1.38, 0.07], "#b39bce", [x, 0.0, 0.24]);
    box(ram, [0.1, 1.45, 0.025], "#d9c4f3", [x, 0, 0.29]);
    for (let i = 0; i < 4; i++)
      box(ram, [0.1, 0.17, 0.13], "#111820", [x + 0.01, -0.46 + i * 0.3, 0.1]);
  }

  const gpu = group("gpu", [-0.07, -0.46, 0.21]);
  box(gpu, [2.4, 0.38, 1.2], "#2c343e", [0, 0, 0]);
  box(gpu, [2.39, 0.035, 1.17], "#5f6b77", [0, 0.205, 0]);
  box(gpu, [2.3, 0.05, 0.035], "#a1b4eb", [0, 0.09, 0.61]);
  for (let i = 0; i < 29; i++)
    box(gpu, [0.025, 0.21, 1.03], "#a0a6ae", [-1.12 + i * 0.079, 0, 0]);
  const gf1 = fan(gpu, [-0.57, -0.24, 0], 0.42);
  gf1.rotation.x = Math.PI / 2;
  const gf2 = fan(gpu, [0.52, -0.24, 0], 0.42);
  gf2.rotation.x = Math.PI / 2;
  label(gpu, "GRAPHICS / PCIe", [0, -0.045, 0.63], 1.55, "#cad5ef");

  const ssd = group("ssd", [-0.5, -0.93, -0.47]);
  box(ssd, [0.96, 0.27, 0.055], "#263b36", [0, 0, 0]);
  box(ssd, [0.65, 0.24, 0.035], "#c2b79d", [-0.03, 0, 0.045]);
  label(ssd, "NVMe / SSD", [-0.03, -0.01, 0.067], 0.63, "#242c28");
  cylinder(ssd, 0.035, 0.02, "#bbc0bd", [-0.44, 0, 0.04]);

  const psu = group("psu", [-0.48, -1.74, -0.08]);
  box(psu, [1.62, 0.83, 1.7], "#242c36", [0, 0, 0]);
  label(psu, "POWER / ATX", [0, 0.05, 0.86], 1.2, "#c4c9d3");
  label(psu, "650W", [0, -0.17, 0.86], 0.54, "#b5c296");
  for (let i = 0; i < 12; i++)
    box(psu, [0.04, 0.65, 0.02], "#68737c", [-0.69 + i * 0.12, 0, -0.87]);
  for (let i = 0; i < 3; i++)
    line(
      psu,
      [
        [0.8, 0.15, 0.3 + i * 0.09],
        [1.15, 0.2, 0.3 + i * 0.09],
        [1.45, 0.7, -0.25],
        [1.45, 2.5, -0.3],
      ],
      "#333f4c",
      0.9,
    );

  const cooling = group("cooling", [-0.32, 0.87, 0.12]);
  for (let i = 0; i < 20; i++)
    box(cooling, [0.93, 0.025, 0.78], "#8796a2", [0, -0.58 + i * 0.061, 0]);
  fan(cooling, [0, 0, 0.46], 0.49);
  for (const x of [-0.29, 0.29])
    cylinder(cooling, 0.04, 0.98, "#bca488", [x, 0.1, -0.3]).rotation.x = 0;
  // Intake and exhaust belong to the cooling system, separate from the CPU tower.
  for (const y of [-0.38, 0.75, 1.87])
    fan(cooling, [1.72, y - 0.87, -0.12], 0.46, "x");

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 80),
    new THREE.MeshBasicMaterial({
      color: "#171e24",
      transparent: true,
      opacity: 0.48,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.5;
  scene.add(floor);
  const grid = new THREE.GridHelper(16, 32, "#2d3d36", "#1a2528");
  grid.position.y = -2.51;
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  scene.add(grid);

  const signalGroup = new THREE.Group();
  scene.add(signalGroup);
  const paths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, -0.93, -0.3),
      new THREE.Vector3(0.7, -0.4, 0.6),
      new THREE.Vector3(0.8, 0.9, 0.1),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, 0.9, 0.1),
      new THREE.Vector3(0.4, 1.4, 0.2),
      new THREE.Vector3(-0.32, 0.87, 0.7),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.87, 0.7),
      new THREE.Vector3(-0.8, 0.1, 1),
      new THREE.Vector3(0, -0.46, 0.85),
    ]),
  ];
  const signals = paths.map((path, index) => {
    const curve = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(path.getPoints(45)),
      new THREE.LineBasicMaterial({
        color: ["#f1c47e", "#d1a4ff", "#d7ff82"][index],
        transparent: true,
        opacity: 0.55,
      }),
    );
    signalGroup.add(curve);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 8),
      new THREE.MeshBasicMaterial({ color: "#d7ff82" }),
    );
    signalGroup.add(dot);
    return { path, dot, index };
  });
  let selected = "cpu",
    exploded = false,
    autoRotate = false,
    mode = "inspect",
    visible = null,
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const raycaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2();
  let pointerStart = null,
    frame,
    stopped = false,
    active = true,
    inView = true,
    last = 0;
  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    return raycaster
      .intersectObjects(pickables, false)
      .find(
        (hit) =>
          hit.object.visible &&
          parts[hit.object.userData.part]?.visible &&
          hit.object.material.opacity > 0.3,
      )?.object.userData.part;
  }
  function down(e) {
    pointerStart = [e.clientX, e.clientY];
  }
  function up(e) {
    if (
      pointerStart &&
      Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) < 6
    ) {
      const id = pick(e);
      if (id) onSelect(id);
    }
    pointerStart = null;
  }
  function move(e) {
    renderer.domElement.style.cursor = pick(e) ? "pointer" : "grab";
  }
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointermove", move);
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const intersection = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
  });
  intersection.observe(host);
  function visibility() {
    active = !document.hidden;
  }
  document.addEventListener("visibilitychange", visibility);
  function render(time) {
    if (stopped) return;
    frame = requestAnimationFrame(render);
    if (!active || !inView || time - last < 32) return;
    const dt = Math.min((time - last) / 1000, 0.1);
    last = time;
    controls.autoRotate = autoRotate && !reduced;
    controls.autoRotateSpeed = 0.45;
    controls.update();
    Object.entries(parts).forEach(([id, g]) => {
      g.visible = !visible || visible.includes(id);
      const target = g.userData.base
        .clone()
        .add(
          new THREE.Vector3(...offsets[id]).multiplyScalar(exploded ? 0.7 : 0),
        );
      g.position.lerp(target, reduced ? 1 : 0.12);
      g.traverse((o) => {
        if (!o.isMesh || !o.material.isMeshStandardMaterial) return;
        o.material.emissive.set(id === selected ? colors[id] : "#000000");
        o.material.emissiveIntensity = id === selected ? 0.13 : 0;
      });
    });
    if (!reduced)
      fans.forEach((f) => {
        f.rotation.z += dt * 1.5;
      });
    signalGroup.visible = mode === "flow" && !exploded;
    signals.forEach(({ path, dot, index }) =>
      dot.position.copy(
        path.getPoint(reduced ? 0.5 : (time / 3500 + index * 0.3) % 1),
      ),
    );
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  onReady?.();
  return {
    update(options) {
      selected = options.selected;
      exploded = options.exploded;
      autoRotate = options.autoRotate;
      mode = options.mode;
      visible = options.visible;
      reduced = options.reduced;
      camera.zoom = exploded ? 0.72 : 1;
      camera.updateProjectionMatrix();
    },
    reset: resetCamera,
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      controls.dispose();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointermove", move);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
