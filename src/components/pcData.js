export const components = [
  {
    id: "cpu",
    name: "Processor",
    short: "CPU",
    full: "Central processing unit",
    color: "#d7ff82",
    role: "The decision maker.",
    intro:
      "Runs the instructions behind everything you do. In a game, it works out player movement, physics and what the graphics card should draw next.",
    where: "Sits in the motherboard’s CPU socket, underneath the cooler.",
    required: "Essential",
    specs: [
      [
        "Cores / threads",
        "How much work can run at once. More cores do not automatically mean more game FPS.",
      ],
      [
        "Architecture + cache",
        "How efficiently the chip works, and how much data it can keep close. X3D chips add cache.",
      ],
      [
        "Socket",
        "The physical and electrical connection. Match the CPU, motherboard and supported BIOS.",
      ],
    ],
    variants: [
      [
        "Mainstream desktop",
        "Ryzen 5 / Core i5 / Core Ultra 5",
        "A sensible starting point for gaming. Compare the exact generation and model.",
      ],
      [
        "Gaming with extra cache",
        "AMD Ryzen X3D",
        "Extra on-chip cache can help CPU-limited games. The benefit depends on the game.",
      ],
      [
        "High core count",
        "Ryzen 9 / Core Ultra 9",
        "Useful for sustained rendering and production work. A higher tier is not always faster in games.",
      ],
      [
        "Laptop processor",
        "H / HX / other mobile families",
        "Built for a laptop’s power and cooling limits. Usually soldered in; not a desktop upgrade part.",
      ],
    ],
    watch:
      "Check integrated graphics on the exact model. A motherboard HDMI port alone does not guarantee a picture.",
    cs2: "At low resolution and competitive settings, CPU speed and frame-time consistency can become the main limit.",
    connection: "Socket → motherboard → RAM and GPU",
  },
  {
    id: "motherboard",
    name: "Motherboard",
    short: "BOARD",
    full: "The system’s main circuit board",
    color: "#7ac6b6",
    role: "Everything meets here.",
    intro:
      "Connects the processor, memory, graphics, storage and ports. It provides the routes for data and the circuitry that delivers power to the CPU.",
    where: "Bolts to raised standoffs on the case’s motherboard tray.",
    required: "Essential",
    specs: [
      [
        "Socket + BIOS",
        "A matching socket is only the first check. The board must support the exact CPU and BIOS version.",
      ],
      [
        "Chipset",
        "Controls features such as connectivity and expansion. Premium does not automatically mean faster gaming.",
      ],
      [
        "Form factor",
        "ATX, micro-ATX and mini-ITX describe board size and layout. The case must support it.",
      ],
    ],
    variants: [
      [
        "AMD AM4",
        "Older Ryzen platform · DDR4",
        "A previous-generation platform. AM4 CPUs cannot fit AM5 boards.",
      ],
      [
        "AMD AM5",
        "Ryzen 7000 / 8000 / 9000 families · DDR5",
        "Examples include B650 and B850 chipsets. Confirm the manufacturer’s CPU support list.",
      ],
      [
        "Intel platforms",
        "LGA1700 / LGA1851 examples",
        "Socket and memory support vary by generation and board. Do not choose by brand alone.",
      ],
      [
        "Board sizes",
        "ATX / micro-ATX / mini-ITX",
        "Smaller boards fit smaller cases but may offer fewer slots and ports.",
      ],
    ],
    watch:
      "Install only the case standoffs that line up with mounting holes. An extra standoff can short the board.",
    cs2: "Choose reliable power delivery and the connections you need. Spend on useful features rather than a flagship label.",
    connection: "The hub linking every component",
  },
  {
    id: "ram",
    name: "Memory",
    short: "RAM",
    full: "Random access memory",
    color: "#d1a4ff",
    role: "Your live workspace.",
    intro:
      "Holds the game, apps and data the processor is actively using. It is quick to access, but its contents disappear when the power is off.",
    where: "Clicks into the long DIMM slots beside the CPU socket.",
    required: "Essential",
    specs: [
      [
        "Capacity · GB",
        "How much can stay open. 16GB is a basic gaming starting point; 32GB gives more room for other apps.",
      ],
      [
        "Speed · MT/s",
        "Data transfer rate, not capacity. The CPU, motherboard and memory profile all affect the speed you can use.",
      ],
      [
        "Latency · CL",
        "Clock cycles for one part of memory access. Compare latency together with transfer rate.",
      ],
    ],
    variants: [
      [
        "DDR4",
        "Previous generation",
        "Used by AM4 and some Intel boards. Physically incompatible with DDR5 slots.",
      ],
      [
        "DDR5",
        "Newer generation",
        "Used by AM5. Buy a matched kit supported by the motherboard.",
      ],
      [
        "Desktop vs laptop",
        "DIMM vs SO-DIMM",
        "Different physical sizes. Some laptops use soldered memory instead.",
      ],
      [
        "One stick vs matched pair",
        "Memory channels",
        "A matched pair can use both CPU memory channels. Use the slots specified in the board manual.",
      ],
    ],
    watch:
      "EXPO and XMP are memory overclocking profiles, not guaranteed speeds. Enable a supported profile, then check stability.",
    cs2: "Memory configuration can affect smoothness. More capacity alone will not fix a slow processor or graphics card.",
    connection: "DIMM slots → CPU memory controller",
  },
  {
    id: "gpu",
    name: "Graphics card",
    short: "GPU",
    full: "Graphics processing unit",
    color: "#9dafff",
    role: "Turns a world into pixels.",
    intro:
      "Draws the images you see. A dedicated graphics card has its own processor, video memory and cooling, and sends the finished picture to your monitor.",
    where:
      "Plugs into the main PCIe x16 slot and screws into the case’s rear bracket.",
    required: "For serious gaming",
    specs: [
      [
        "Exact model",
        "Compare real benchmarks at your settings. An RTX 5060 Laptop GPU is not the same product as a desktop RTX 5060.",
      ],
      [
        "Video memory · VRAM",
        "Holds textures and graphics data. Running out can cause stutter; capacity alone is not a speed rating.",
      ],
      [
        "Size + power",
        "Check card length, thickness, power connectors and the PSU recommendation for the exact card.",
      ],
    ],
    variants: [
      [
        "Integrated graphics",
        "Inside some CPUs",
        "Enough for a display and light workloads; gaming performance varies widely. Not every CPU has it.",
      ],
      [
        "Dedicated desktop",
        "GeForce RTX / Radeon RX / Intel Arc",
        "A separate replaceable card. Model, generation, power use and software features all matter.",
      ],
      [
        "Laptop graphics",
        "Mobile GPU",
        "Usually soldered to the motherboard. Power limits and cooling differ between laptops.",
      ],
      [
        "External graphics",
        "eGPU enclosure",
        "Requires a supported external connection and power. Bandwidth, cost and compatibility limit its appeal.",
      ],
    ],
    watch:
      "With a dedicated GPU, connect the monitor to the graphics card. Fully seat its power connector and follow cable-bend guidance.",
    cs2: "Resolution, shadows and anti-aliasing affect GPU work. Lower resolution helps only while the GPU is the limiting part.",
    connection: "PCIe slot + PSU → DisplayPort / HDMI → monitor",
  },
  {
    id: "ssd",
    name: "Storage",
    short: "SSD",
    full: "Solid-state drive",
    color: "#f1c47e",
    role: "Where everything stays.",
    intro:
      "Keeps your operating system, games and files when the PC is switched off. Storage and memory are different: the SSD is the library; RAM is the open desk.",
    where:
      "An M.2 drive screws into a small slot on the motherboard. SATA drives mount in a drive bay.",
    required: "For an operating system",
    specs: [
      [
        "Capacity · GB / TB",
        "How many files and games fit. Leave space for updates, temporary files and new games.",
      ],
      [
        "Interface + protocol",
        "M.2 describes a shape. NVMe uses PCIe; some older M.2 drives use SATA. Match the slot.",
      ],
      [
        "Endurance + warranty",
        "Look at the exact drive’s warranty and workload suitability, not only its maximum sequential speed.",
      ],
    ],
    variants: [
      [
        "M.2 NVMe SSD",
        "PCIe Gen 3 / 4 / 5",
        "Compact and fast. The drive and slot negotiate a supported link; faster peak speed is not extra game FPS.",
      ],
      [
        "2.5-inch SATA SSD",
        "Separate power + data cables",
        "Useful for extra storage or older PCs. Slower transfers than modern NVMe, but still responsive.",
      ],
      [
        "Hard disk drive",
        "HDD · spinning disks",
        "Large capacity for archives. Slower access and more noise than an SSD.",
      ],
      [
        "External storage",
        "USB SSD / HDD",
        "Useful for backups and moving files. Keep a separate backup of important data.",
      ],
    ],
    watch:
      "Confirm M.2 length, interface and lane sharing in the motherboard manual. Do not stack a drive heatsink under a board heatsink.",
    cs2: "An SSD helps loading and updates. A premium SSD is not a reliable way to raise average match FPS.",
    connection: "M.2 / SATA → motherboard → RAM",
  },
  {
    id: "psu",
    name: "Power supply",
    short: "PSU",
    full: "Power supply unit",
    color: "#f2a79b",
    role: "Clean power, everywhere.",
    intro:
      "Converts mains electricity into the regulated DC power your components use. Wattage is its capacity, not how much electricity the PC always consumes.",
    where:
      "Usually mounts in the case’s lower compartment, with its fan facing a suitable air intake.",
    required: "Essential",
    specs: [
      [
        "Quality + protections",
        "Use a reputable, independently reviewed exact model. An efficiency badge does not establish overall quality.",
      ],
      [
        "Wattage + connectors",
        "Size for the actual CPU, GPU and system, with appropriate headroom and the right cables.",
      ],
      [
        "ATX version",
        "Modern ATX 3.x supplies address modern power requirements. Check compatibility with your exact graphics card.",
      ],
    ],
    variants: [
      [
        "Non-modular",
        "All cables attached",
        "Usually simpler and cheaper. Unused cables stay inside the case.",
      ],
      [
        "Semi-modular",
        "Essential cables attached",
        "Removable extra cables can make routing easier.",
      ],
      [
        "Fully modular",
        "Removable cables",
        "Attach what you need. Only use cables explicitly compatible with that exact PSU model.",
      ],
      [
        "ATX / SFX",
        "Different physical sizes",
        "SFX is compact. Case fit, connector types and cable lengths still need checking.",
      ],
    ],
    watch:
      "Never open a PSU. Never reuse modular cables from another unit unless the manufacturer explicitly confirms compatibility.",
    cs2: "Enough reliable power supports stability. Buying extra watts does not make the game run faster.",
    connection: "Wall → PSU → motherboard, CPU, GPU and peripherals",
  },
  {
    id: "cooling",
    name: "Cooling",
    short: "COOLER",
    full: "Heatsinks, fans and thermal interface",
    color: "#85d4e3",
    role: "Moves heat out.",
    intro:
      "Transfers heat from the CPU into a heatsink or radiator, then into the air. Case fans bring fresh air in and move warm air out.",
    where:
      "The CPU cooler mounts over the processor. Fans and radiators attach to compatible case mounts.",
    required: "Essential for normal use",
    specs: [
      [
        "Socket mounting",
        "The cooler needs the right bracket and mounting hardware for the CPU platform.",
      ],
      [
        "Case clearance",
        "Check air-cooler height, RAM clearance, or radiator length and total thickness with its fans.",
      ],
      [
        "Noise + heat load",
        "Choose cooling for the actual processor and your room. A well-sized air cooler can be a good gaming choice.",
      ],
    ],
    variants: [
      [
        "Stock air cooler",
        "Included with some processors",
        "Can cover basic operation for the CPU it ships with. Many CPUs do not include a cooler.",
      ],
      [
        "Tower air cooler",
        "Heatsink + heat pipes + fan",
        "Simple and serviceable. Check height, RAM clearance and socket compatibility.",
      ],
      [
        "All-in-one liquid",
        "AIO · pump + radiator",
        "Offers different mounting and thermal options. Includes more moving parts; radiator fit matters.",
      ],
      [
        "Custom liquid loop",
        "Pump, reservoir, blocks, tubing",
        "An enthusiast project with maintenance and compatibility requirements. Not a prerequisite for gaming.",
      ],
    ],
    watch:
      "Remove the cooler-base protective film. Use its pre-applied paste or apply paste as directed; do not add both.",
    cs2: "Avoiding thermal throttling helps the CPU sustain performance. Liquid cooling is not automatically faster than air cooling.",
    connection: "CPU → thermal paste → cooler → case airflow → room",
  },
  {
    id: "case",
    name: "Case",
    short: "CASE",
    full: "Chassis, mounting and airflow",
    color: "#c0c7d5",
    role: "Gives every part a home.",
    intro:
      "Holds and protects the components, guides airflow and provides front buttons and ports. A PC can run on a test bench, but a case is the practical everyday choice.",
    where:
      "The outer structure. It sets the space available for every other part.",
    required: "Practical, not needed for POST",
    specs: [
      [
        "Component fit",
        "Check motherboard size, graphics-card dimensions, PSU size and cooler clearance together.",
      ],
      [
        "Airflow",
        "Air needs a clear intake and exhaust path. A glass panel is not an air intake.",
      ],
      [
        "Usability",
        "Filters, cable space, accessible ports and easy panel removal matter long after the build is done.",
      ],
    ],
    variants: [
      [
        "Mid tower",
        "A flexible desktop starting point",
        "Often supports ATX or micro-ATX boards and standard-sized components. Check the exact specification.",
      ],
      [
        "Compact / small form factor",
        "Less desk space",
        "Requires careful checking of component sizes, airflow, power and assembly order.",
      ],
      [
        "Full tower",
        "More space",
        "Useful for large components and elaborate cooling. Not necessary just to get high FPS.",
      ],
      [
        "Open test bench",
        "Accessible hardware",
        "Useful for diagnosis and testing. Exposed electronics need a safe, non-conductive workspace.",
      ],
    ],
    watch:
      "Before ordering, compare the case’s actual clearance measurements with the exact GPU and cooler dimensions.",
    cs2: "Good airflow can help keep performance consistent. RGB and a bigger case do not directly raise FPS.",
    connection: "Standoffs, brackets, front-panel wiring and airflow",
  },
];

export const assemblySteps = [
  {
    part: "cpu",
    title: "Seat the processor",
    text: "On a clean, non-conductive surface, open the socket latch. Match the CPU’s orientation marker, gently place it without force, then close the retention mechanism.",
    check:
      "Protect socket pins. Never touch the contacts or force an incompatible CPU.",
    visible: ["motherboard", "cpu"],
  },
  {
    part: "ram",
    title: "Install the memory",
    text: "Check the board manual for the correct slots for your kit, often A2 and B2 on four-slot boards. Align each notch and press evenly until the retention latches engage.",
    check:
      "DDR4 and DDR5 do not fit the same slots. A click on one side does not prove both ends are seated.",
    visible: ["motherboard", "cpu", "ram"],
  },
  {
    part: "ssd",
    title: "Fit the M.2 drive",
    text: "Use a compatible slot and the correct standoff length. Insert the drive at an angle, lower it gently and secure it with the supplied screw or latch. Refit the board heatsink as directed.",
    check:
      "Remove heatsink-pad protective film when the manual requires it. Do not overtighten the tiny screw.",
    visible: ["motherboard", "cpu", "ram", "ssd"],
  },
  {
    part: "motherboard",
    title: "Mount the motherboard",
    text: "Fit the I/O shield first if it is separate. Check the case standoffs match the board’s holes, lower the board into position and tighten its screws gently.",
    check:
      "An extra standoff under the board can cause a short. Keep screws away from exposed circuitry.",
    visible: ["motherboard", "cpu", "ram", "ssd", "case"],
  },
  {
    part: "psu",
    title: "Mount the power supply",
    text: "With mains power disconnected, secure the PSU in the case. Route the motherboard 24-pin and CPU EPS power cables while there is still room to work.",
    check:
      "CPU EPS and GPU PCIe cables are different. Use only cables compatible with this exact PSU.",
    visible: ["motherboard", "cpu", "ram", "ssd", "case", "psu"],
  },
  {
    part: "cooling",
    title: "Install the CPU cooler",
    text: "Follow the cooler’s mounting sequence. Remove any base film, use the supplied thermal interface as directed, tighten evenly and connect the fan to CPU_FAN. Follow AIO pump-header instructions if applicable.",
    check:
      "Check cooler clearance and brackets in advance. Never power a normal desktop CPU without appropriate cooling.",
    visible: ["motherboard", "cpu", "ram", "ssd", "case", "psu", "cooling"],
  },
  {
    part: "gpu",
    title: "Seat the graphics card",
    text: "Remove the necessary case slot covers. Seat the card in the primary PCIe x16 slot, secure the rear bracket, add support if needed and attach the required GPU power cables.",
    check:
      "Fully seat power connectors. Follow the card manufacturer’s guidance on cable routing and bends.",
    visible: components.map((c) => c.id),
  },
  {
    part: "psu",
    title: "Connect and check",
    text: "Connect case power-button wiring using the board manual, case fans, front USB and audio as needed. Verify every power connection, remove loose screws and check that cables cannot touch fan blades.",
    check:
      "Plug the monitor into the dedicated GPU when using one. Attach keyboard and mains power only after inspection.",
    visible: components.map((c) => c.id),
  },
  {
    part: "motherboard",
    title: "Make your first boot",
    text: "Switch on the PSU and press the case power button. Allow time for initial memory training. Look for the firmware screen; if it fails, use the board’s diagnostic LEDs and manual.",
    check:
      "POST is the power-on self-test. Reaching firmware does not mean an operating system is installed.",
    visible: components.map((c) => c.id),
  },
  {
    part: "ssd",
    title: "Set up and validate",
    text: "Check temperatures and detected RAM and storage. Follow the board’s BIOS guidance, install your operating system and drivers, then test stability. Enable a supported memory profile and validate it separately.",
    check:
      "Finish with an actual CS2 match capture: record settings, average FPS and 1% lows. A benchmark screenshot is not a performance guarantee.",
    visible: components.map((c) => c.id),
  },
];

export const glossary = [
  [
    "FPS",
    "Frames per second the PC produces. Average FPS does not describe every moment.",
  ],
  [
    "Hz",
    "How many times a display refreshes per second. A 360Hz screen does not create 360 FPS.",
  ],
  [
    "1% low",
    "A frame-time-derived measure of slow frames. Useful for consistency; it is not the absolute minimum FPS.",
  ],
  [
    "Frame time",
    "How long a frame takes. Consistent times feel smoother than frequent spikes.",
  ],
  [
    "Bottleneck",
    "The part currently limiting performance. It changes with the game, resolution and settings.",
  ],
  [
    "POST",
    "Power-on self-test. The checks firmware runs before trying to boot an operating system.",
  ],
  [
    "BIOS / UEFI",
    "Motherboard firmware used to initialise hardware and configure the system.",
  ],
  [
    "PCIe",
    "A high-speed connection used by graphics cards, NVMe drives and other devices.",
  ],
  [
    "EXPO / XMP",
    "Stored memory overclocking profiles. Support and stability depend on the full system.",
  ],
  [
    "TDP / TGP",
    "Power-related specifications with definitions that vary by product. Not a direct performance comparison.",
  ],
  [
    "VRAM",
    "Memory used by the graphics processor. Separate from system RAM on a dedicated card.",
  ],
  [
    "PSU efficiency",
    "How efficiently wall power becomes DC output. An efficiency rating is not an overall quality score.",
  ],
];

export const quiz = [
  {
    q: "Your monitor is 360Hz. What does that guarantee?",
    a: [
      "The game always runs at 360 FPS",
      "The display can refresh up to 360 times per second",
      "The GPU produces exactly 360 frames",
    ],
    correct: 1,
    why: "Refresh rate describes the display. Game FPS is produced by the PC and varies with workload.",
  },
  {
    q: "Can DDR5 memory go into a DDR4 motherboard?",
    a: [
      "Yes, if it is the same brand",
      "Yes, at a slower speed",
      "No, the generations are incompatible",
    ],
    correct: 2,
    why: "Their slots and electrical requirements differ. Choose the memory generation your board supports.",
  },
  {
    q: "What is the smallest everyday PC that can show a desktop?",
    a: [
      "A compatible CPU, board, RAM, cooling, PSU, boot storage and a working graphics output",
      "Only a CPU and graphics card",
      "A motherboard, case and RGB fans",
    ],
    correct: 0,
    why: "Graphics can be integrated into the CPU. A separate GPU is conditional; storage is needed to run a locally installed OS.",
  },
  {
    q: "CS2 is CPU-limited. What will a faster SSD usually change?",
    a: [
      "Double match FPS",
      "Help loading, without fixing the CPU limit",
      "Increase monitor refresh rate",
    ],
    correct: 1,
    why: "Storage speed and CPU frame production solve different problems.",
  },
  {
    q: "Can you reuse any modular PSU cable that physically fits?",
    a: [
      "No, confirm exact PSU-model compatibility",
      "Yes, the plugs are standard inside",
      "Yes, if both PSUs say Gold",
    ],
    correct: 0,
    why: "PSU-side wiring can differ. Physically fitting cables can still damage hardware.",
  },
];

export function checkBuild(build) {
  const issues = [];
  if (build.cpu !== build.board)
    issues.push({
      severity: "error",
      title: "CPU and socket do not match",
      text: `${build.cpu} processors cannot fit an ${build.board} socket. Choose the same platform, then confirm exact CPU and BIOS support.`,
    });
  const expectedRam = build.board === "AM5" ? "DDR5" : "DDR4";
  if (build.ram !== expectedRam)
    issues.push({
      severity: "error",
      title: "Memory generation mismatch",
      text: `This ${build.board} example requires ${expectedRam}. ${build.ram} cannot be substituted.`,
    });
  if (!build.gpu && !build.igpu)
    issues.push({
      severity: "error",
      title: "No graphics output",
      text: "Add a dedicated GPU or choose a CPU with integrated graphics. A motherboard display connector is not a GPU.",
    });
  if (!build.cooler)
    issues.push({
      severity: "error",
      title: "CPU cooling is missing",
      text: "Fit a compatible cooler with the correct thermal interface before powering on.",
    });
  if (!build.storage)
    issues.push({
      severity: "warning",
      title: "Firmware only: no local OS drive",
      text: "The system may reach POST and firmware, but needs bootable storage for a locally installed operating system.",
    });
  if (!build.gpu && build.igpu)
    issues.push({
      severity: "info",
      title: "Integrated graphics selected",
      text: "This can provide a display. It does not establish suitability for your CS2 FPS target.",
    });
  return issues;
}

export const sources = [
  [
    "Intel",
    "PC assembly guide",
    "https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html",
  ],
  [
    "AMD",
    "AM5 platform and chipsets",
    "https://www.amd.com/en/products/processors/chipsets/am5.html",
  ],
  [
    "Corsair",
    "Memory generation FAQ",
    "https://help.corsair.com/hc/en-us/articles/34383413781777-RAM-FAQ",
  ],
  [
    "NVIDIA",
    "FPS and system latency",
    "https://www.nvidia.com/en-us/geforce/news/reflex-latency-analyzer-360hz-g-sync-monitors/",
  ],
];
