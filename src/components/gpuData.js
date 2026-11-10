const NV = "https://www.nvidia.com/en-us/geforce/graphics-cards/compare/";
const AMD = "https://www.amd.com/en/products/graphics/desktops/radeon";
const INTEL =
  "https://www.intel.com/content/www/us/en/products/details/discrete-gpus/arc.html";
export const makers = {
  NVIDIA: {
    color: "#b9e680",
    family: "GeForce",
    description:
      "Designs GeForce GPU chips and the NVIDIA software platform. Founders Edition is NVIDIA’s own card design; partners build their own coolers around GeForce chips.",
  },
  AMD: {
    color: "#ff7b69",
    family: "Radeon",
    description:
      "Designs Radeon GPU chips and the AMD software platform. Partners such as Sapphire, PowerColor and XFX turn those chips into complete graphics cards.",
  },
  Intel: {
    color: "#7fbcff",
    family: "Arc",
    description:
      "Designs Arc GPU chips and the Intel graphics software platform. Limited Edition and partner cards can use the same chip with very different cooling systems.",
  },
};
function series(maker, generation, architecture, rows) {
  return rows.map(([name, vram, memory, watts, bus]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    maker,
    generation,
    architecture,
    vram,
    memory,
    watts,
    bus,
    source:
      maker === "NVIDIA"
        ? NV
        : maker === "AMD"
          ? `${AMD}/${generation === "RX 9000" ? "9000" : generation === "RX 7000" ? "7000" : "6000"}-series/amd-radeon-${
              generation === "RX 6000"
                ? name.toLowerCase().replaceAll(" ", "-")
                : name
                    .toLowerCase()
                    .replace(/ (8|16)gb/g, "")
                    .replaceAll(" ", "-")
                    .replace("-xt", "xt")
            }.html`
          : INTEL,
  }));
}
// Reference chip specifications, not factory-overclocked partner board specifications.
export const gpus = [
  ...series("NVIDIA", "RTX 50", "Blackwell", [
    ["RTX 5090", 32, "GDDR7", 575, 512],
    ["RTX 5080", 16, "GDDR7", 360, 256],
    ["RTX 5070 Ti", 16, "GDDR7", 300, 256],
    ["RTX 5070", 12, "GDDR7", 250, 192],
    ["RTX 5060 Ti 16GB", 16, "GDDR7", 180, 128],
    ["RTX 5060 Ti 8GB", 8, "GDDR7", 180, 128],
    ["RTX 5060", 8, "GDDR7", 145, 128],
    ["RTX 5050", 8, "GDDR6", 130, 128],
  ]),
  ...series("NVIDIA", "RTX 40", "Ada Lovelace", [
    ["RTX 4090", 24, "GDDR6X", 450, 384],
    ["RTX 4080 SUPER", 16, "GDDR6X", 320, 256],
    ["RTX 4080", 16, "GDDR6X", 320, 256],
    ["RTX 4070 Ti SUPER", 16, "GDDR6X", 285, 256],
    ["RTX 4070 Ti", 12, "GDDR6X", 285, 192],
    ["RTX 4070 SUPER", 12, "GDDR6X", 220, 192],
    ["RTX 4070", 12, "GDDR6 / 6X", 200, 192],
    ["RTX 4060 Ti 16GB", 16, "GDDR6", 165, 128],
    ["RTX 4060 Ti 8GB", 8, "GDDR6", 160, 128],
    ["RTX 4060", 8, "GDDR6", 115, 128],
  ]),
  ...series("NVIDIA", "RTX 30", "Ampere", [
    ["RTX 3090 Ti", 24, "GDDR6X", 450, 384],
    ["RTX 3090", 24, "GDDR6X", 350, 384],
    ["RTX 3080 Ti", 12, "GDDR6X", 350, 384],
    ["RTX 3080 10GB", 10, "GDDR6X", 320, 320],
    ["RTX 3070 Ti", 8, "GDDR6X", 290, 256],
    ["RTX 3070", 8, "GDDR6", 220, 256],
    ["RTX 3060 Ti", 8, "GDDR6 / 6X", 200, 256],
    ["RTX 3060 12GB", 12, "GDDR6", 170, 192],
    ["RTX 3050 8GB", 8, "GDDR6", 130, 128],
  ]),
  ...series("AMD", "RX 9000", "RDNA 4", [
    ["RX 9070 XT", 16, "GDDR6", 304, 256],
    ["RX 9070", 16, "GDDR6", 220, 256],
    ["RX 9060 XT 16GB", 16, "GDDR6", 160, 128],
    ["RX 9060 XT 8GB", 8, "GDDR6", 150, 128],
  ]),
  ...series("AMD", "RX 7000", "RDNA 3", [
    ["RX 7900 XTX", 24, "GDDR6", 355, 384],
    ["RX 7900 XT", 20, "GDDR6", 315, 320],
    ["RX 7900 GRE", 16, "GDDR6", 260, 256],
    ["RX 7800 XT", 16, "GDDR6", 263, 256],
    ["RX 7700 XT", 12, "GDDR6", 245, 192],
    ["RX 7600 XT", 16, "GDDR6", 190, 128],
    ["RX 7600", 8, "GDDR6", 165, 128],
  ]),
  ...series("AMD", "RX 6000", "RDNA 2", [
    ["RX 6900 XT", 16, "GDDR6", 300, 256],
    ["RX 6800 XT", 16, "GDDR6", 300, 256],
    ["RX 6700 XT", 12, "GDDR6", 230, 192],
    ["RX 6600", 8, "GDDR6", 132, 128],
  ]),
  ...series("Intel", "Arc B", "Xe2 · Battlemage", [
    ["Arc B580", 12, "GDDR6", 190, 192],
    ["Arc B570", 10, "GDDR6", 150, 160],
  ]),
  ...series("Intel", "Arc A", "Xe HPG · Alchemist", [
    ["Arc A770 16GB", 16, "GDDR6", 225, 256],
    ["Arc A750", 8, "GDDR6", 225, 256],
    ["Arc A580", 8, "GDDR6", 185, 256],
  ]),
];
// Product pages also serve as attribution for manufacturer photography.
export const designs = [
  {
    id: "founders",
    brand: "NVIDIA",
    name: "Founders Edition",
    gpu: "rtx-5090",
    style: "founders",
    color: "#34383a",
    trim: "#a6a79b",
    fans: 2,
    length: 304,
    slots: "2",
    photos: ["fe-front.jpg", "fe-back.jpg"],
    url: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/",
    note: "A compact, two-slot metal frame with a double flow-through cooler. The reference design looks very different from a typical triple-fan partner card.",
  },
  {
    id: "astral",
    brand: "ASUS",
    name: "ROG Astral OC",
    gpu: "rtx-5090",
    style: "astral",
    color: "#555d63",
    trim: "#91d9e0",
    fans: 3,
    length: 357.6,
    slots: "3.8",
    photos: ["astral-front.png", "astral-back.png"],
    url: "https://rog.asus.com/us/graphics-cards/graphics-cards/rog-astral/rog-astral-rtx5090-o32g-gaming/",
    note: "A substantial metal frame, three front fans and a fourth fan at the rear. Same RTX 5090 chip family, a much larger cooler than Founders Edition.",
  },
  {
    id: "nitro",
    brand: "Sapphire",
    name: "NITRO+ OC",
    gpu: "rx-9070-xt",
    style: "nitro",
    color: "#8a9095",
    trim: "#adbcff",
    fans: 3,
    length: 330.8,
    slots: "3.2",
    photos: ["nitro-front.jpg", "nitro-back.jpg"],
    url: "https://www.sapphiretech.com/en/consumer/nitro-radeon-rx-9070-xt-16g-gddr6",
    note: "A sculpted silver enclosure, three fans and a long light strip. The removable rear cover hides the power connection and cable routing.",
  },
  {
    id: "pulse",
    brand: "Sapphire",
    name: "PULSE",
    gpu: "rx-9070-xt",
    style: "pulse",
    color: "#22262b",
    trim: "#e35945",
    fans: 3,
    length: 320,
    slots: "3",
    photos: ["pulse-front.jpg"],
    url: "https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-9070-xt-16g-gddr6",
    note: "A black triple-fan design with red accents. PULSE is a different Sapphire cooler family, not a different GPU chip maker.",
  },
  {
    id: "pure",
    brand: "Sapphire",
    name: "PURE",
    gpu: "rx-9070-xt",
    style: "white",
    color: "#e0e4df",
    trim: "#f08c88",
    fans: 3,
    length: 320,
    slots: "3",
    photos: ["pure-front.jpg"],
    url: "https://www.sapphiretech.com/en/consumer/pure-radeon-rx-9070-xt-16g-gddr6",
    note: "A white shroud and white fans with a red-lit logo. Compare the appearance with PULSE: both use the RX 9070 XT chip and 16GB of memory.",
  },
  {
    id: "steel",
    brand: "ASRock",
    name: "Steel Legend OC",
    gpu: "arc-b580",
    style: "white",
    color: "#dce4e5",
    trim: "#74e2d4",
    fans: 3,
    length: 298,
    slots: "2.6",
    photos: ["steel-3.png", "steel-2.png"],
    url: "https://www.asrock.com/Graphics-Card/Intel/Intel%20Arc%20B580%20Steel%20Legend%2012GB%20OC/index.asp",
    note: "A white, three-fan card with ARGB lighting and a metal backplate. It uses an Intel Arc B580 chip, not an ASRock-designed GPU chip.",
  },
];
export const anatomy = [
  {
    id: "fans",
    title: "Fans & shroud",
    short: "Move the air.",
    text: "Fans push air through the metal fins. The outer shroud guides airflow and gives a card its appearance. Fan count alone does not tell you temperature or noise.",
  },
  {
    id: "heatsink",
    title: "Heatsink & heatpipes",
    short: "Carry the heat away.",
    text: "A cold plate touches the GPU through thermal paste. Heatpipes or a vapour chamber spread that heat into a large stack of fins, where airflow removes it.",
  },
  {
    id: "chip",
    title: "GPU die",
    short: "This is the actual GPU.",
    text: "The small silicon chip performs graphics and parallel computation. NVIDIA, AMD or Intel designs it. Most of the graphics card you see is there to power and cool this chip.",
  },
  {
    id: "memory",
    title: "VRAM",
    short: "The GPU’s own workspace.",
    text: "These memory packages hold textures, frame buffers and other data. VRAM capacity is not the same as speed: 16GB does not automatically beat a faster 12GB GPU.",
  },
  {
    id: "pcb",
    title: "PCB & power delivery",
    short: "Connect and power everything.",
    text: "The circuit board connects the GPU, memory, power stages and display outputs. Its gold PCIe edge connector slots into the motherboard; additional power usually comes from the PSU.",
  },
  {
    id: "backplate",
    title: "Backplate",
    short: "Structure at the back.",
    text: "The backplate helps protect and stiffen the card. Cut-outs can allow air to pass through. Some designs also use it to help spread heat.",
  },
];
export function defaultDesign(gpu) {
  return (
    designs.find((d) => d.gpu === gpu.id) || {
      id: "study",
      brand: gpu.maker,
      name: "Architecture study",
      style:
        gpu.maker === "NVIDIA"
          ? "founders"
          : gpu.maker === "AMD"
            ? "pulse"
            : "dual",
      color: gpu.maker === "Intel" ? "#314b6a" : "#34383a",
      trim: makers[gpu.maker].color,
      fans: gpu.maker === "AMD" ? 3 : 2,
      note: "A representative educational model for this GPU family. It is not an exact retail card. Select a photographed design in the Design archive to inspect a specific product.",
      photos: [],
      url: gpu.source,
    }
  );
}

export const museumRacks = [
  { id: "nvidia-50", maker: "NVIDIA", generation: "RTX 50", side: -1, bay: 0 },
  { id: "amd-9000", maker: "AMD", generation: "RX 9000", side: 1, bay: 0 },
  { id: "nvidia-40", maker: "NVIDIA", generation: "RTX 40", side: -1, bay: 1 },
  { id: "amd-7000", maker: "AMD", generation: "RX 7000", side: 1, bay: 1 },
  { id: "nvidia-30", maker: "NVIDIA", generation: "RTX 30", side: -1, bay: 2 },
  { id: "amd-6000", maker: "AMD", generation: "RX 6000", side: 1, bay: 2 },
  { id: "intel-a", maker: "Intel", generation: "Arc A", side: -1, bay: 3 },
  { id: "intel-b", maker: "Intel", generation: "Arc B", side: 1, bay: 3 },
];
