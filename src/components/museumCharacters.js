import * as T from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const material = (color, metalness = 0) =>
  new T.MeshStandardMaterial({ color, roughness: 0.6, metalness });
function box(parent, size, position, mat, radius = 0.04) {
  const mesh = new T.Mesh(new RoundedBoxGeometry(...size, 2, radius), mat);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
function sphere(parent, size, position, mat) {
  const mesh = new T.Mesh(new T.SphereGeometry(1, 20, 16), mat);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
// Original stylised museum host, rather than a borrowed game character.
export function createMuseumGuide() {
  const root = new T.Group();
  const skin = material("#ac7358"),
    coat = material("#27282c"),
    trousers = material("#16181d");
  const hair = material("#211b1a"),
    red = material("#dc5b56"),
    white = material("#eee7df");
  for (const side of [-1, 1]) {
    box(root, [0.22, 0.81, 0.27], [side * 0.17, 0.52, 0], trousers);
    box(root, [0.26, 0.15, 0.43], [side * 0.17, 0.08, 0.09], hair);
    const arm = new T.Group();
    arm.position.set(side * 0.43, 1.6, 0);
    arm.rotation.z = side * 0.12;
    box(arm, [0.23, 0.64, 0.28], [0, -0.27, 0], coat);
    sphere(arm, [0.115, 0.15, 0.115], [0, -0.67, 0.01], skin);
    root.add(arm);
  }
  box(root, [0.74, 0.82, 0.4], [0, 1.36, 0], coat, 0.1);
  box(root, [0.055, 0.69, 0.018], [0, 1.39, 0.21], red, 0.005);
  box(root, [0.19, 0.13, 0.02], [-0.2, 1.54, 0.225], red, 0.015);
  box(root, [0.11, 0.022, 0.025], [-0.2, 1.55, 0.24], white, 0.004);
  sphere(root, [0.13, 0.16, 0.13], [0, 1.84, 0], skin);
  sphere(root, [0.29, 0.36, 0.26], [0, 2.12, 0], skin);
  sphere(root, [0.3, 0.18, 0.27], [0, 2.37, -0.025], hair);
  for (const side of [-1, 1]) {
    sphere(root, [0.055, 0.085, 0.045], [side * 0.285, 2.13, 0], skin);
    sphere(root, [0.057, 0.035, 0.018], [side * 0.105, 2.16, 0.237], white);
    sphere(root, [0.025, 0.027, 0.012], [side * 0.105, 2.16, 0.253], hair);
    box(root, [0.09, 0.018, 0.025], [side * 0.105, 2.23, 0.23], hair, 0.005);
  }
  sphere(root, [0.045, 0.065, 0.055], [0, 2.09, 0.26], skin);
  const smile = new T.Mesh(
    new T.TorusGeometry(0.075, 0.011, 6, 16, Math.PI),
    hair,
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 2.015, 0.25);
  root.add(smile);
  return root;
}
// Camera-mounted scanner with a barrel, grip, display and gloved hands.
export function createScanner() {
  const root = new T.Group();
  const shell = material("#292c32", 0.45),
    trim = material("#a7a2a0", 0.6);
  const red = material("#d95d57", 0.3),
    glove = material("#343335");
  const light = new T.MeshBasicMaterial({ color: "#ff7670" });
  box(root, [0.24, 0.22, 0.61], [0, 0, -0.12], shell);
  box(root, [0.19, 0.14, 0.28], [0, 0.015, -0.55], trim);
  box(root, [0.13, 0.07, 0.025], [0, 0.015, -0.7], light, 0.01);
  box(root, [0.13, 0.28, 0.16], [0.015, -0.19, 0.02], shell);
  box(root, [0.25, 0.04, 0.1], [0, 0.13, -0.12], red);
  box(root, [0.12, 0.025, 0.13], [0, 0.145, 0.065], light, 0.005);
  box(root, [0.15, 0.2, 0.2], [0.08, -0.2, 0.09], glove);
  box(root, [0.18, 0.17, 0.37], [0.12, -0.26, 0.32], shell);
  const support = box(root, [0.16, 0.15, 0.38], [-0.23, -0.22, 0.13], glove);
  support.rotation.y = -0.65;
  const screen = new T.MeshBasicMaterial({ color: "#122c29" });
  const readout = new T.MeshBasicMaterial({ color: "#b3c5aa" });
  box(root, [0.15, 0.09, 0.012], [0, 0.005, 0.192], screen, 0.006);
  for (let i = 0; i < 3; i++)
    box(
      root,
      [0.09 - i * 0.015, 0.008, 0.014],
      [-i * 0.007, 0.027 - i * 0.021, 0.202],
      readout,
      0.002,
    );
  root.scale.setScalar(0.52);
  root.position.set(0.36, -0.35, -0.82);
  root.rotation.set(0.02, -0.3, -0.04);
  return root;
}
