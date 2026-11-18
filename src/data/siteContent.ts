export type PageId =
  | 'home'
  | 'about'
  | 'product-window'
  | 'product-door'
  | 'product-channels'
  | 'product-heavy-sash'
  | 'infrastructure'
  | 'contact';

export interface ProductSpec {
  id: PageId;
  slug: string;
  shortTitle: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  summary: string;
  thicknessRange: string;
  coatingStandard: string;
  profileShapes: string;
  applications: { title: string; detail: string }[];
  features: { title: string; detail: string }[];
}

export const PRODUCTS: ProductSpec[] = [
  {
    id: 'product-window',
    slug: 'upvc-window-steel-reinforcement',
    shortTitle: 'uPVC Window Steel Reinforcement',
    title: 'uPVC Window Steel Reinforcement Sections',
    seoTitle: 'uPVC Window Steel Reinforcement Sections Manufacturer South India',
    metaDescription:
      'High-quality galvanized steel reinforcement sections for uPVC window profiles. Custom-fit shapes providing structural strength against heavy wind loads.',
    headline: 'Maximizing Structural Integrity for High-Performance Windows',
    subheadline: 'uPVC Window Steel Reinforcement Sections Manufacturer in Coimbatore',
    summary:
      'Unreinforced uPVC profiles can bow, warp, or sag under intense solar heat and wind pressure. Since 1995, MK Reinforcement Solutions has manufactured high-tensile, galvanized steel reinforcement sections engineered to act as the strong inner core of uPVC windows.',
    thicknessRange: '1.0 mm – 2.0 mm',
    coatingStandard: 'Hot-Dip Galvanized (GI)',
    profileShapes: 'L-Shapes, U-Channels & Box Sections',
    applications: [
      {
        title: 'Casement Windows',
        detail: 'Provides the rigid foundation needed for heavy sash weights and frequent operating cycles.',
      },
      {
        title: 'Sliding Windows',
        detail: 'Prevents track bowing and alignment issues over long horizontal spans.',
      },
      {
        title: 'Tilt & Turn Systems',
        detail: 'Delivers multi-directional torsional stiffness to support complex hardware systems.',
      },
      {
        title: 'Fixed & Combination Frames',
        detail: 'Maintains a perfect geometric square under large glass deadloads.',
      },
    ],
    features: [
      {
        title: 'Material Grade',
        detail: 'High-yield Hot-Dip Galvanized Steel (GI) with zinc coating weights tailored to prevent rust.',
      },
      {
        title: 'Thickness Range',
        detail: 'Available in standard configurations from 1.0mm to 2.0mm to meet varied structural wind load requirements.',
      },
      {
        title: 'Profile Shapes',
        detail: 'Custom-engineered L-shapes, U-channels, and box sections designed to match leading international uPVC systems.',
      },
    ],
  },
  {
    id: 'product-door',
    slug: 'upvc-door-steel-reinforcement',
    shortTitle: 'uPVC Door Steel Reinforcement',
    title: 'uPVC Door Steel Reinforcement Sections',
    seoTitle: 'Galvanized Steel Reinforcement Sections Manufacturer for uPVC Doors in Coimbatore',
    metaDescription:
      'Premium steel reinforcement sections for uPVC door frames and sashes. Engineered for dimensional stability, anti-warping, and advanced security.',
    headline: 'The Backbone of Secure and Durable uPVC Door Systems',
    subheadline: 'uPVC Door Steel Reinforcement Sections Manufacturer in Coimbatore',
    summary:
      'Doors face constant physical impacts, high foot traffic, and structural loads. MK Reinforcement Solutions fabricates heavy-gauge steel reinforcement sections specifically configured to anchor uPVC door frames and sashes, preventing twisting and maintaining tight weather-seals.',
    thicknessRange: '1.5 mm – 2.5 mm',
    coatingStandard: 'Thick Zinc Passivation',
    profileShapes: 'Closed Box & Heavy C-Channels',
    applications: [
      {
        title: 'Sagging Prevention',
        detail: 'Holds the weight of heavy double or triple-glazed glass units without letting the sash drop.',
      },
      {
        title: 'Heavy Hardware Anchoring',
        detail: 'Provides a solid metal base for screwing down structural 3D hinges, multi-point locks, and handles.',
      },
      {
        title: 'Thermal Stability',
        detail: 'Counteracts the natural expansion and contraction forces of uPVC exposed to direct sunlight.',
      },
    ],
    features: [
      {
        title: 'Precision Tolerances',
        detail: 'Roll-formed with exact radius curves and straightness parameters for friction-free insertion.',
      },
      {
        title: 'Corrosion Protection',
        detail: 'Thick zinc passivation layer ensures the core stays protected inside the closed chamber for decades.',
      },
      {
        title: 'Custom Cuts',
        detail: 'Available in bulk custom-cut lengths to eliminate processing waste on your factory floor.',
      },
    ],
  },
  {
    id: 'product-channels',
    slug: 'gi-u-c-channels',
    shortTitle: 'Galvanized Iron (GI) U & C Channels',
    title: 'Galvanized Iron (GI) U & C Channels',
    seoTitle: 'Galvanized Iron (GI) U & C Channels Manufacturer | South India',
    metaDescription:
      'Precision roll-formed Galvanized Iron (GI) U channels and C channels. High corrosion resistance for structural framing and manufacturing components.',
    headline: 'Precision Profiles Engineered for Versatile Structural Reinforcement',
    subheadline: 'Galvanized Iron (GI) U & C Channels Manufacturers in Coimbatore',
    summary:
      'MK Reinforcement Solutions manufactures heavy-duty, roll-formed Galvanized Iron (GI) U-Channels and C-Channels. Utilizing automated rolling mills at our manufacturing infrastructure, we form these structural sections from clean, high-grade steel sheets.',
    thicknessRange: '1.0 mm – 2.5 mm',
    coatingStandard: 'Uniform Hot-Dip Zinc',
    profileShapes: 'GI U-Channels & Return-Lip C-Channels',
    applications: [
      {
        title: 'GI U-Channels',
        detail: 'Ideal for track framing, edge shielding, guiding systems, and interior partitioning frameworks.',
      },
      {
        title: 'GI C-Channels',
        detail: 'Configured with inner returns to deliver enhanced structural bending resistance for heavy frames and support pillars.',
      },
    ],
    features: [
      {
        title: 'Material Quality',
        detail: 'Premium cold-rolled structural steel base sheet with uniform hot-dip zinc galvanization.',
      },
      {
        title: 'Dimension Consistency',
        detail: 'Stringent automated quality assurance checks maintain exact flange heights, web widths, and metal thicknesses.',
      },
      {
        title: 'Custom Hole Punching',
        detail: 'Inline punching options available for manufacturers requiring standardized slot or hole alignments.',
      },
    ],
  },
  {
    id: 'product-heavy-sash',
    slug: 'heavy-duty-door-sash-reinforcement',
    shortTitle: 'Heavy-Duty Door Sash Steel Reinforcement',
    title: 'Heavy-Duty Door Sash Steel Reinforcement',
    seoTitle: 'Heavy-Duty Door Sash Steel Reinforcement Profile Manufacturer',
    metaDescription:
      'Thick-gauge steel reinforcement sections for heavy uPVC door sashes, large sliding patio doors, and high-traffic commercial entrance systems.',
    headline: 'Maximum Reinforcement for Large Openings and High-Traffic Portals',
    subheadline: 'Heavy-Duty Door Sash Steel Reinforcement Manufacturer in Coimbatore',
    summary:
      'Large architectural openings like expansive sliding patio doors, lift-and-slide systems, and commercial main entrances demand exceptional structural reinforcement. Our Heavy-Duty Door Sash Steel Reinforcements are thick-gauge profiles developed for immense structural strains.',
    thicknessRange: '2.0 mm – 3.0 mm',
    coatingStandard: 'Coastal-Grade Galvanized Steel',
    profileShapes: 'Fully Enclosed Closed Box Sections',
    applications: [
      {
        title: 'Sliding Patio & French Doors',
        detail: 'Essential for maintaining a rigid frame across massive, wide spans of glass.',
      },
      {
        title: 'Lift & Slide Systems',
        detail: 'Manages heavy structural weights while keeping tracking mechanisms perfectly horizontal.',
      },
      {
        title: 'Commercial Entrances',
        detail: 'Engineered to withstand aggressive daily usage cycles in retail, office, or institutional settings.',
      },
    ],
    features: [
      {
        title: 'Thick-Gauge Engineering',
        detail: 'Available in heavy 2.0mm to 3.0mm thickness profiles for unyielding resistance against high wind speeds.',
      },
      {
        title: 'Closed Box Configurations',
        detail: 'Fully enclosed box sections roll-formed to optimize maximum multi-axis structural stiffness.',
      },
      {
        title: 'Perfect Interlocking Fit',
        detail: 'Configured mathematically to slide smoothly into heavy-duty door profiles without disturbing interior drainage webs.',
      },
    ],
  },
];

export interface MilestoneItem {
  year: string;
  shortYear: string;
  title: string;
  description: string;
  machineryFocus: string;
  staffCount: string;
  monthlyOutput: string;
  capacityPercent: number;
}

export const MILESTONES: MilestoneItem[] = [
  {
    year: '1995',
    shortYear: '1995',
    title: 'The Journey Begins',
    description:
      'Founded by S. Manikandan as a modest workshop equipped with one shearing machine and one welding machine, driven by a vision of manufacturing excellence.',
    machineryFocus: '1 Shearing Machine · 1 Welding Unit',
    staffCount: 'Founder-Led Workshop',
    monthlyOutput: 'Foundational Fabrication',
    capacityPercent: 12,
  },
  {
    year: '1998',
    shortYear: '1998',
    title: 'Infrastructure Expansion',
    description:
      'Invested in the first press brake machine and expanded operations with a dedicated founding team of 4 staff members.',
    machineryFocus: 'Press Brake Sheet Bending Line',
    staffCount: '4 Skilled Staff',
    monthlyOutput: 'Regional Sheet Metal Batching',
    capacityPercent: 22,
  },
  {
    year: '2001',
    shortYear: '2001',
    title: 'Product Diversification',
    description:
      'Manufactured and supplied generator acoustic enclosures, expanding the market footprint across the entire state of Tamil Nadu.',
    machineryFocus: 'Acoustic Enclosure Forming & Assembly',
    staffCount: 'Tamil Nadu Supply Network',
    monthlyOutput: 'State-Wide Industrial Supply',
    capacityPercent: 34,
  },
  {
    year: '2005',
    shortYear: '2005',
    title: 'General Fabrication Services',
    description:
      'Scaled technical expertise to handle general fabrication works for industrial and commercial clients across Tamil Nadu.',
    machineryFocus: 'Multi-Axis Fabrication & Structural Work',
    staffCount: 'Expanded Fabrication Crew',
    monthlyOutput: 'Multi-Sector Custom Orders',
    capacityPercent: 45,
  },
  {
    year: '2011',
    shortYear: '2011',
    title: 'Venturing into uPVC Reinforcements',
    description:
      'Pivoted into precision uPVC steel reinforcement sections with a 5-member team at an initial capacity of 30 tonnes per month.',
    machineryFocus: 'Dedicated uPVC Section Forming Line',
    staffCount: '5-Member Specialist Team',
    monthlyOutput: '30 Tonnes / Month',
    capacityPercent: 60,
  },
  {
    year: '2021 – 2026',
    shortYear: '2026',
    title: 'Modernization & Scaling Up',
    description:
      'Added 5+ automated roll-forming machines and scaled to a specialized 15-member team delivering over 150 tonnes per month across South India.',
    machineryFocus: '5+ Automated Continuous Roll-Forming Lines',
    staffCount: '15 Dedicated Professionals',
    monthlyOutput: '150+ Tonnes / Month',
    capacityPercent: 100,
  },
];

export interface ProductionFlowStep {
  step: string;
  shortTitle: string;
  title: string;
  equipment: string;
  tolerance: string;
  qualityGate: string;
  description: string;
  stageGeometry: 'coil' | 'slit' | 'preform' | 'channel' | 'punch' | 'qc' | 'dispatch';
}

export const PRODUCTION_FLOW_STEPS: ProductionFlowStep[] = [
  {
    step: '01',
    shortTitle: 'GI Coil Intake',
    title: 'Weather-Sheltered GI Coil Receiving',
    equipment: 'Indoor Crane & Moisture-Controlled Coil Bay',
    tolerance: '1.0 mm – 3.0 mm Base Gauge',
    qualityGate: 'Mill Test Certificate & Zinc GSM Audit',
    description:
      'High-yield hot-dip galvanized steel coils are inspected upon arrival for base metal yield strength and uniform zinc passivation before entering indoor storage.',
    stageGeometry: 'coil',
  },
  {
    step: '02',
    shortTitle: 'Coil Slitting',
    title: 'Precision Coil Slitting & Strip Preparation',
    equipment: 'Rotary Arbor Slitter & Tension Recoiler',
    tolerance: '±0.15 mm Strip Width',
    qualityGate: 'Burr-Free Edge & Coil Camber Check',
    description:
      'Master galvanized coils are slit to exact strip widths tailored to specific uPVC window, door, or heavy sash chamber geometries without damaging edge zinc protection.',
    stageGeometry: 'slit',
  },
  {
    step: '03',
    shortTitle: 'Roll Forming',
    title: 'Multi-Stand Automated Cold Roll-Forming',
    equipment: '5+ High-Speed Continuous Roll-Forming Mills',
    tolerance: '±0.20 mm Flange & Web Profile',
    qualityGate: 'Continuous Laser Straightness Alignment',
    description:
      'Slit strips pass through progressive hardened roller stands that cold-form clean L-shapes, U-channels, return-lip C-channels, and closed box sections without heat distortion.',
    stageGeometry: 'channel',
  },
  {
    step: '04',
    shortTitle: 'Inline Punching',
    title: 'Synchronized Inline Slot & Hardware Punching',
    equipment: 'Mechanical Press Tool & Custom Die Blocks',
    tolerance: '±0.25 mm Pitch Alignment',
    qualityGate: 'Hardware Clearance & Drainage Web Fit',
    description:
      'Custom die stations punch handle, lock, and drainage slots inline so steel cores slide seamlessly inside uPVC chambers and anchor 3D hinges and multi-point locks.',
    stageGeometry: 'punch',
  },
  {
    step: '05',
    shortTitle: 'Cut-to-Length',
    title: 'Automated Shearing & Custom Sizing',
    equipment: 'Synchronized Flying Shear & Length Gauge',
    tolerance: '±0.50 mm Cut Length',
    qualityGate: 'Square End-Cut & Stack Consistency',
    description:
      'Sections are sheared to standardized stock lengths or custom fabricator-specified dimensions to eliminate cutting scrap on your window and door assembly floor.',
    stageGeometry: 'preform',
  },
  {
    step: '06',
    shortTitle: 'QC Inspection',
    title: 'Integrated Gauge, Torsion & Zinc QC Lab',
    equipment: 'Digital Micrometers & Chamber Fitment Go/No-Go Gauges',
    tolerance: 'Zero-Twist Torsion Verification',
    qualityGate: 'Batch Sign-Off Prior to Strapping',
    description:
      'Every production batch undergoes gauge micrometer measurement, inner-radius clearance checks against live uPVC profile samples, and zinc coating uniformity verification.',
    stageGeometry: 'qc',
  },
  {
    step: '07',
    shortTitle: 'South India Dispatch',
    title: 'Protected Bundling & 4-State Dispatch',
    equipment: 'Coimbatore Logistics Hub · Steel-Strapped Bundles',
    tolerance: '150+ MT / Month Capacity',
    qualityGate: 'Moisture-Wrapped Transit Protection',
    description:
      'Finished sections are bundled by profile code and dispatched directly from our Keeranatham plant to fabricators across Tamil Nadu, Kerala, Karnataka, and Andhra Pradesh.',
    stageGeometry: 'dispatch',
  },
];

export const CORE_COMMITMENTS = [
  {
    code: '01',
    title: 'Millimeter-Level Precision',
    metric: '±0.20 mm Profile Tolerance',
    detail:
      'Engineered to slide smoothly into uPVC chambers without friction, eliminating assembly bottlenecks and ensuring crisp screw retention for locks, friction stays, and 3D hinges.',
  },
  {
    code: '02',
    title: 'Superior Corrosion Resistance',
    metric: 'Hot-Dip Zinc Passivation',
    detail:
      'Protected by uniform hot-dip galvanization engineered specifically to withstand coastal humidity, monsoon condensation, and tropical heat across South India for decades.',
  },
];

export const WHY_PARTNER_ITEMS = [
  {
    index: '01',
    title: '30+ Years of Manufacturing Legacy',
    detail:
      'Three decades of continuous sheet-metal and roll-forming mastery since 1995, turning founder-led engineering discipline into high-volume repeatability.',
  },
  {
    index: '02',
    title: 'Uncompromised Quality Assurance',
    detail:
      'Batch-verified wall thickness (1.0mm to 3.0mm), straightness gauges, and burr-free cutting tolerances so every bar fits your uPVC extrusion cleanly.',
  },
  {
    index: '03',
    title: 'Serving the South Indian Market',
    detail:
      'Strategically located in Keeranatham near Saravanampatti, Coimbatore, enabling dependable scheduled dispatch across Tamil Nadu, Kerala, Karnataka, and Andhra Pradesh.',
  },
];

export const SOUTH_INDIA_CORRIDORS = [
  {
    state: 'Tamil Nadu',
    corridors: 'Coimbatore · Chennai · Madurai · Tiruchirappalli · Salem',
    focus: 'Primary Plant Hub & Same-Day / Next-Day Industrial Dispatch',
  },
  {
    state: 'Kerala',
    corridors: 'Kochi · Thrissur · Kozhikode · Thiruvananthapuram',
    focus: 'Coastal-Grade High-Zinc Sections for High-Humidity Zones',
  },
  {
    state: 'Karnataka',
    corridors: 'Bengaluru · Mysuru · Mangaluru · Hubballi',
    focus: 'High-Rise Commercial Wind-Load & Heavy Door Sash Supply',
  },
  {
    state: 'Andhra Pradesh',
    corridors: 'Visakhapatnam · Vijayawada · Tirupati · Guntur',
    focus: 'Bulk Custom-Cut Lengths for Regional Window & Door Plants',
  },
];

export const INFRASTRUCTURE_UNITS = [
  {
    title: 'Advanced Roll-Forming Machinery',
    description:
      'Automated continuous high-speed roll-forming lines guaranteeing clean geometric lines and millimeter-level tolerances across uPVC steel reinforcements and GI channels.',
  },
  {
    title: 'Slitting & Synchronized Cutting Units',
    description:
      'Heavy-duty coil handlers with inline shearing and cutting systems supplying both standardized bulk lengths and custom-cut pieces to eliminate factory floor wastage.',
  },
  {
    title: 'Press Tool & Sheet Metal Infrastructure',
    description:
      'Mechanical presses and custom tool-and-die blocks engineered for continuous inline punching, slotting, and multi-axis bending for L-brackets and auxiliary hardware.',
  },
  {
    title: 'Weather-Sheltered Coil Storage & Logistics',
    description:
      'Dedicated indoor storage zones for high-yield galvanized steel coils, protecting zinc passivation integrity prior to cold roll-forming.',
  },
  {
    title: 'Integrated Quality Control (QC) Lab',
    description:
      'Dedicated inspection benches equipped with precision gauges to verify gauge thickness (1.0mm to 3.0mm), zinc coating uniformity, and torsion limits before dispatch.',
  },
];
