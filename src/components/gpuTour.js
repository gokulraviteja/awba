import { defaultDesign, gpus, makers, museumRacks } from "./gpuData.js";

const lesson = (id, title, text, extra = {}) => ({
  id,
  chapter: "Start here",
  title,
  text,
  view: "vault",
  ...extra,
});
const history = (id, year, title, text, source) => ({
  id,
  chapter: "The evolution",
  year,
  title,
  text,
  source,
  view: "vault",
});
const foundation = [
  lesson(
    "welcome",
    "Hi, I’m Ari. Let’s start small.",
    "Welcome to the graphics wing. We’ll learn what a GPU does, follow the ideas that changed it, then walk the NVIDIA, AMD and Intel collections. You choose the pace. Use the chapter menu to skip ahead; voice is optional.",
  ),
  lesson(
    "what-is-a-gpu",
    "A GPU turns a scene into pixels.",
    "Your game describes a world: shapes, textures, lights and a camera. The graphics processing unit does many small calculations in parallel to draw that world on your monitor. The CPU also matters: it prepares game logic and work for the GPU.",
  ),
  lesson(
    "chip-and-card",
    "The chip is only one part of the card.",
    "GPU usually means the processor itself. The graphics card is the whole assembly: processor, circuit board, dedicated memory, cooler, fans, power connections and display ports. That is why two cards with the same GPU can look very different.",
  ),
  lesson(
    "memory",
    "VRAM is the GPU’s workbench.",
    "Dedicated video memory holds things such as textures, geometry and frame buffers. Capacity is measured in GB. More memory can help when a game needs it, but a 16GB card is not automatically faster than every 8GB card. The chip, memory speed and workload all matter.",
  ),
  lesson(
    "partners",
    "One chip. Several card makers.",
    "NVIDIA, AMD and Intel design the processors. Companies such as ASUS, MSI, Gigabyte, Sapphire and ASRock build cards around them. Cooler size, noise, dimensions, warranty and factory settings can differ. Our design archive lets you explore selected partner designs.",
  ),
  lesson(
    "names",
    "Learn to read the name.",
    "A family such as RTX 50 groups a generation. Within a family, a higher tier generally targets more demanding work. Ti, SUPER and XT identify particular variants; they are not universal speed multipliers. Always compare the exact model, memory version and real game benchmarks.",
  ),
];
const evolution = [
  history(
    "history-1999",
    "1999",
    "More of the 3D pipeline moves to the GPU.",
    "GeForce 256 brought hardware transform and lighting to NVIDIA’s consumer graphics line. Work that helps position and light 3D objects could move from the CPU to graphics hardware. It is one milestone in a much longer graphics history.",
    "https://blogs.nvidia.com/blog/first-gpu-gaming-ai/",
  ),
  history(
    "history-2001",
    "2001",
    "Developers get programmable shaders.",
    "GeForce3 introduced programmable shaders to NVIDIA’s consumer lineup. Instead of choosing only fixed effects, developers could write small programs controlling how surfaces and vertices look. That flexibility helped games create more varied materials and lighting.",
    "https://www.nvidia.com/content/timeline/time_01.html",
  ),
  history(
    "history-2006",
    "2006",
    "Unified shaders share the work.",
    "The GeForce 8800 architecture used unified shader processors. Rather than separate pools dedicated to different shader stages, resources could be assigned more flexibly. Modern GPU designs build on this general idea of massive parallel processing.",
    "https://www.nvidia.com/content/PDF/Geforce_8800/GeForce_8800_GPU_Architecture_Technical_Brief.pdf",
  ),
  history(
    "history-2018",
    "2018",
    "RTX adds specialised hardware.",
    "NVIDIA’s Turing GeForce RTX generation added dedicated ray tracing and Tensor hardware. Ray tracing models light paths; AI features can reconstruct images. Support and quality depend on the game, and generated frames are different from the game’s native rendered frames.",
    "https://nvidianews.nvidia.com/news/10-years-in-the-making-nvidia-brings-real-time-ray-tracing-to-gamers-with-geforce-rtx",
  ),
  history(
    "history-2022",
    "2022",
    "Intel Arc joins desktop gaming.",
    "Intel’s Arc A750 and A770 launched in October 2022. Arc brought another processor and software platform into the discrete gaming card market. The museum’s Arc A bay introduces this Alchemist family; the Arc B bay follows its successor.",
    "https://game.intel.com/us/stories/intel-arc-graphics-a7series-perf-per-dollar/",
  ),
  history(
    "history-2025",
    "2024–25",
    "New architectures, different strengths.",
    "Intel’s Arc B series moved to Xe2. AMD’s RX 9000 family introduced RDNA 4, while NVIDIA’s RTX 50 family uses Blackwell. These names describe architecture families, not directly comparable performance scores. Next we’ll visit the actual models in our collection.",
    "https://www.intel.com/content/www/us/en/newsroom/news/intel-launches-arc-b-series-graphics-cards.html",
  ),
];
function modelText(g) {
  const variants = gpus.filter(
    (x) =>
      x.maker === g.maker &&
      x.name.replace(/ (8|16)GB/, "") === g.name.replace(/ (8|16)GB/, ""),
  );
  const variant =
    variants.length > 1
      ? ` This model has a separate ${variants.find((x) => x.id !== g.id).vram}GB version too; check the exact memory variant when buying.`
      : "";
  return `${g.name} is part of ${g.maker}’s ${g.generation} family, using ${g.architecture}. It has ${g.vram}GB of ${g.memory} memory and a ${g.bus}-bit memory interface. Reference board power is ${g.watts}W; that is the card’s figure, not the whole PC’s power supply requirement.${variant} Retail coolers and power limits can vary. This is a simplified 3D teaching model.`;
}
const collection = museumRacks.flatMap((r) => {
  const models = gpus.filter(
    (g) => g.generation === r.generation && g.maker === r.maker,
  );
  return [
    {
      id: `bay-${r.id}`,
      chapter: `${r.maker} · ${r.generation}`,
      title: `The ${r.maker} ${r.generation} collection.`,
      text: `${makers[r.maker].description} This bay contains ${models.length} reference models from the ${models[0].architecture} family. We’ll examine each one next. You can also jump directly to any model in the chapter menu.`,
      view: "vault",
      rack: r.id,
    },
    ...models.map((g) => ({
      id: `model-${g.id}`,
      chapter: `${r.maker} · ${r.generation}`,
      title: g.name,
      text: modelText(g),
      view: "inspect",
      gpu: g,
      design: defaultDesign(g),
      rack: r.id,
      source: g.source,
    })),
  ];
});
export const tourStops = [
  ...foundation,
  ...evolution,
  ...collection,
  {
    id: "your-cs2-pc",
    chapter: "Your own PC",
    title: "Bring it back to your CS2 build.",
    text: "For a 360Hz display, one refresh takes about 2.78 milliseconds. Smooth play also depends on the CPU, memory, game settings and frame-time consistency. A graphics card alone cannot promise a minimum 400 FPS. Compare measured CS2 results for a complete build, then check case fit, power supply and local warranty before buying. You’re ready to explore on your own.",
    view: "vault",
  },
];
export const tourChapters = [...new Set(tourStops.map((s) => s.chapter))];
