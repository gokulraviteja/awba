export function explainGpu(gpu, design) {
  const architecture = gpu.architecture.replace(" · ", " / ");
  const builder =
    design.id === "study"
      ? "The 3D card is a teaching model; retail cards can have different coolers."
      : design.brand === gpu.maker
        ? `${design.brand} also makes this ${design.name} card.`
        : `${design.brand} builds the ${design.name} card around that ${gpu.maker} chip.`;
  return `${gpu.name} uses ${gpu.maker}’s ${architecture} chip architecture. Its ${gpu.vram}GB of dedicated memory holds game textures and frame data. ${builder}`;
}
export const guideQuestions = [
  "Explain the name",
  "Will it help my CS2 FPS?",
  "What does the memory mean?",
  "Power and case fit",
  "Why different brands?",
];
export function answerGpuQuestion(question, gpu, design) {
  const q = question.toLowerCase();
  if (/price|cost|rupee|budget|buy|india|stock/.test(q))
    return `I don’t have live Indian prices or stock. Compare the exact ${gpu.name} board model, GST-inclusive price, seller, local warranty and return terms. A price for a different memory variant or laptop GPU is not the same product. The official product link identifies this card; it is not a shopping quote.`;
  if (/cs2|counter|fps|360|400|144|frame|monitor|stretched/.test(q))
    return `${gpu.name} renders the frames, but it cannot guarantee 400 FPS or a 360 FPS minimum. For your stretched 4:3 CS2 settings, the CPU and memory can become the limit. A 360Hz screen refreshes every 2.78ms. Check real CS2 tests with the same CPU, resolution, settings and game version, including 1% lows and frame times. Generated frames are not a substitute for a measured competitive-game result.`;
  if (
    /power|psu|watt|cable|connector|case|fit|install|slot|size|length/.test(q)
  )
    return `The reference board-power rating for ${gpu.name} is ${gpu.watts}W. That is the graphics card, not the required wattage of the entire power supply. Partner boards can differ. ${design.length ? `This ${design.brand} ${design.name} is ${design.length}mm long and ${design.slots} slots thick. ` : "This teaching model does not specify retail dimensions. "}Check the exact card’s PSU recommendation, power connectors, cable clearance and case dimensions before buying. Connect the monitor to the card’s display outputs.`;
  if (/memory|vram|gddr|8gb|16gb|32gb|bus|bit|texture/.test(q))
    return `This GPU has ${gpu.vram}GB of ${gpu.memory} memory on a ${gpu.bus}-bit memory interface. VRAM is the GPU’s own workspace for textures and frames; it is separate from your PC’s system RAM. Capacity, memory type and bus width describe different things. More GB alone does not mean more FPS. Some models share a chip name but offer different memory capacities, so compare the exact version.`;
  if (
    /brand|provider|asus|sapphire|asrock|msi|gigabyte|zotac|cooler|partner|design|fan|oc/.test(
      q,
    )
  )
    return `${gpu.maker} designs the GPU chip. ${design.id === "study" ? "Partners build retail cards around it; this view is a representative teaching model." : `${design.brand} makes this ${design.name} graphics card. ${design.note}`} Partners can change cooling, noise, dimensions, power limits, clock settings and warranty. “OC” means a factory overclock. A premium cooler does not change the underlying GPU model.`;
  if (
    /name|version|generation|architecture|series|\bti\b|\bsuper\b|\bxt\b|difference|model/.test(
      q,
    )
  ) {
    const family =
      gpu.maker === "NVIDIA"
        ? "GeForce RTX"
        : gpu.maker === "AMD"
          ? "Radeon RX"
          : "Intel Arc";
    const suffix = /Ti/.test(gpu.name)
      ? "“Ti” identifies a distinct NVIDIA model in that series."
      : /SUPER/.test(gpu.name)
        ? "“SUPER” identifies a distinct NVIDIA model variant."
        : /XTX/.test(gpu.name)
          ? "“XTX” identifies a distinct AMD model variant."
          : /XT/.test(gpu.name)
            ? "“XT” identifies a distinct AMD model variant."
            : "The remaining model number identifies its place within that maker’s series.";
    return `${gpu.name} belongs to the ${family} family and the ${gpu.generation} generation in this museum. Its architecture is ${gpu.architecture}. ${suffix} ${/GB/.test(gpu.name) ? "The GB suffix identifies this specific memory-capacity version. " : ""}Model numbers and suffixes are not a common speed scale across NVIDIA, AMD and Intel. A desktop and laptop GPU with a similar name can behave differently.`;
  }
  if (/laptop|upgrade|replace|desktop|solder/.test(q))
    return `This museum entry is a desktop ${gpu.name}. A desktop graphics card can usually be replaced if the case, motherboard, PSU and cables support the new card. Most laptop GPUs are soldered and cannot be swapped like desktop cards. A laptop with a similar GPU name also has its own power and cooling limits.`;
  if (/what|explain|hello|hi|summary|tell|work|do|render/.test(q))
    return (
      explainGpu(gpu, design) +
      " The GPU performs graphics computation; the large fans and metal cooler move its heat out of the card. Use Inside to see these layers separately."
    );
  return `I can explain ${gpu.name} using the museum’s catalog: its name and generation, memory, power and fit, board partners, or your CS2 goal. Try one of the questions above. I don’t have live benchmark results, prices or a general web-search connection.`;
}
