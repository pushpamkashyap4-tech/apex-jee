const units = [
  {
    subject: "Physics",
    groups: [
      ["Mechanics", [
        "Units, Measurements & Vectors", "Kinematics", "Laws of Motion", "Work, Energy & Power",
        "Centre of Mass & Collisions", "Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids"
      ]],
      ["Thermal Physics", ["Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory of Gases"]],
      ["Oscillations & Waves", ["Oscillations & Simple Harmonic Motion", "Waves"]],
      ["Electricity & Magnetism", ["Electrostatics", "Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves"]],
      ["Optics", ["Ray Optics", "Wave Optics"]],
      ["Modern Physics", ["Dual Nature of Matter & Radiation", "Atomic Physics", "Nuclear Physics", "Semiconductor Electronics", "Experimental Physics"]]
    ]
  },
  {
    subject: "Chemistry",
    groups: [
      ["Physical Chemistry", [
        "Some Basic Concepts of Chemistry", "Atomic Structure", "States of Matter", "Chemical Thermodynamics",
        "Chemical & Ionic Equilibrium", "Redox Reactions", "Solid State Chemistry", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry"
      ]],
      ["Inorganic Chemistry", [
        "Periodic Table & Periodicity", "Chemical Bonding", "Hydrogen", "s-Block Elements",
        "p-Block Elements", "Environmental Chemistry", "Metallurgy", "p-Block Elements (Class 12: Groups 15–18)", "d- and f-Block Elements", "Coordination Compounds"
      ]],
      ["Organic Chemistry", [
        "General Organic Chemistry", "Hydrocarbons",
        "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids",
        "Organic Compounds Containing Nitrogen", "Biomolecules", "Practical Chemistry", "Polymers", "Chemistry in Everyday Life"
      ]]
    ]
  },
  {
    subject: "Mathematics",
    groups: [
      ["Algebra", [
        "Sets", "Relations & Functions", "Complex Numbers", "Quadratic Equations", "Sequences & Series",
        "Binomial Theorem", "Permutations & Combinations", "Probability", "Matrices & Determinants", "Mathematical Induction"
      ]],
      ["Trigonometry", ["Trigonometric Ratios & Identities", "Inverse Trigonometric Functions", "Trigonometric Equations"]],
      ["Coordinate Geometry", ["Straight Lines", "Circle", "Parabola", "Ellipse", "Hyperbola"]],
      ["Calculus", [
        "Limits, Continuity & Differentiability", "Method of Differentiation", "Applications of Derivatives",
        "Indefinite Integration", "Definite Integration & Area", "Differential Equations"
      ]],
      ["Vectors & 3D Geometry", ["Vector Algebra", "Three-Dimensional Geometry", "Statistics"]],
      ["Linear Programming", ["Linear Programming"]]
    ]
  }
];

const advancedOnly = [
  { subject: "Mathematics", unit: "Trigonometry", name: "Properties of Triangles", classLevel: "Class 11" },
  { subject: "Chemistry", unit: "Physical Chemistry", name: "Nuclear Chemistry", classLevel: "Class 12" }
];

function makeId(subject, unit, name) {
  return `${subject}-${unit}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function chapterId(subject, unit, name) {
  if (subject === "Physics" && name === "Thermal Properties of Matter") return "physics-thermal-physics-thermal-properties-calorimetry";
  if (subject === "Physics" && name === "Waves") return "physics-oscillations-waves-wave-motion";
  // Keep persisted progress and future recall batches keyed to this chapter's original ID.
  if (subject === "Physics" && name === "Electromagnetic Waves") return "physics-modern-physics-electromagnetic-waves";
  // These canonical slots absorb content from their retired chapter entries.
  if (subject === "Chemistry" && name === "General Organic Chemistry") return "chemistry-organic-chemistry-general-organic-chemistry";
  if (subject === "Chemistry" && name === "Practical Chemistry") return "chemistry-organic-chemistry-practical-chemistry";
  return makeId(subject, unit, name);
}

// The JEE bulletins group content by subject and unit, not by school class.
// These class labels follow the Class 11 / 12 breakdown in the supplied
// syllabus reference, using both classes when a combined unit spans them.
const class11 = new Set([
  "Units, Measurements & Vectors", "Kinematics", "Laws of Motion", "Work, Energy & Power",
  "Centre of Mass & Collisions", "Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
  "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory of Gases",
  "Oscillations & Simple Harmonic Motion", "Waves",
  "Some Basic Concepts of Chemistry", "Atomic Structure", "States of Matter", "Chemical Thermodynamics", "Chemical & Ionic Equilibrium", "Redox Reactions", "Statistics",
  "Sets",
  "Periodic Table & Periodicity", "Chemical Bonding", "Hydrocarbons",
  "General Organic Chemistry", "Complex Numbers", "Quadratic Equations", "Sequences & Series",
  "Binomial Theorem", "Permutations & Combinations", "Trigonometric Ratios & Identities",
  "Trigonometric Equations", "Straight Lines", "Circle", "Parabola", "Ellipse", "Hyperbola",
  "Mathematical Induction", "Hydrogen", "s-Block Elements", "p-Block Elements", "Environmental Chemistry", "Practical Chemistry"
]);
const class12 = new Set([
  "Electrostatics", "Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter",
  "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics",
  "Dual Nature of Matter & Radiation", "Atomic Physics", "Nuclear Physics", "Semiconductor Electronics",
  "Solid State Chemistry", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Metallurgy",
  "p-Block Elements (Class 12: Groups 15–18)", "d- and f-Block Elements", "Coordination Compounds",
  "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids",
  "Organic Compounds Containing Nitrogen", "Biomolecules",
  "Polymers", "Chemistry in Everyday Life", "Matrices & Determinants",
  "Inverse Trigonometric Functions", "Relations & Functions", "Limits, Continuity & Differentiability", "Method of Differentiation", "Applications of Derivatives", "Indefinite Integration",
  "Definite Integration & Area", "Differential Equations", "Vector Algebra", "Three-Dimensional Geometry", "Probability", "Linear Programming"
]);
const spansClasses = new Set([
  "Experimental Physics"
]);

function classLevelFor(name) {
  if (class11.has(name)) return "Class 11";
  if (class12.has(name)) return "Class 12";
  if (spansClasses.has(name)) return "Class 11 & 12";
  return "Class 11 & 12";
}

const class11ChemistryOrder = [
  "Some Basic Concepts of Chemistry", "Atomic Structure", "States of Matter", "Chemical Thermodynamics",
  "Chemical & Ionic Equilibrium", "Redox Reactions", "Periodic Table & Periodicity", "Chemical Bonding",
  "Hydrogen", "s-Block Elements", "p-Block Elements", "General Organic Chemistry", "Hydrocarbons",
  "Environmental Chemistry", "Practical Chemistry"
];
const class12ChemistryOrder = [
  "Solid State Chemistry", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry",
  "Metallurgy", "p-Block Elements (Class 12: Groups 15–18)", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes",
  "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Organic Compounds Containing Nitrogen",
  "Biomolecules", "Polymers", "Chemistry in Everyday Life"
];
const chemistryChapterOrder = new Map([...class11ChemistryOrder, ...class12ChemistryOrder].map((name, index) => [name, index]));
const mathClass11Order = [
  "Sets", "Trigonometric Ratios & Identities", "Trigonometric Equations", "Properties of Triangles",
  "Quadratic Equations", "Complex Numbers", "Permutations & Combinations", "Binomial Theorem",
  "Sequences & Series", "Straight Lines", "Circle", "Parabola", "Ellipse", "Hyperbola", "Statistics", "Mathematical Induction"
];
const mathClass12Order = [
  "Relations & Functions", "Inverse Trigonometric Functions", "Matrices & Determinants", "Limits, Continuity & Differentiability",
  "Method of Differentiation", "Applications of Derivatives", "Indefinite Integration", "Definite Integration & Area",
  "Differential Equations", "Vector Algebra", "Three-Dimensional Geometry", "Probability"
];
const mathChapterOrder = new Map([...mathClass11Order, ...mathClass12Order].map((name, index) => [name, index]));

const coreChapters = units.flatMap(({ subject, groups }) => groups.flatMap(([unit, names]) => names.map((name) => ({
  id: chapterId(subject, unit, name), subject, unit, name, classLevel: classLevelFor(name),
  cbseBoards: classLevelFor(name) === "Class 12", exam: "both", advancedOnly: false, custom: false
}))))
  .sort((a, b) => {
    if (a.subject !== b.subject) return 0;
    if (a.subject === "Chemistry") return chemistryChapterOrder.get(a.name) - chemistryChapterOrder.get(b.name);
    if (a.subject === "Mathematics") return mathChapterOrder.get(a.name) - mathChapterOrder.get(b.name);
    return 0;
  });

const advancedOnlyChapters = advancedOnly.map(({ subject, unit, name, classLevel }) => ({
  id: chapterId(subject, unit, name), subject, unit, name, classLevel: classLevel || classLevelFor(name),
  cbseBoards: (classLevel || classLevelFor(name)) === "Class 12",
  exam: "advanced_only", advancedOnly: true, custom: false
}));
const chapterRegistry = [...coreChapters, ...advancedOnlyChapters];
const mains = chapterRegistry.filter((chapter) => chapter.exam === "both" || chapter.exam === "mains_only");
const advanced = chapterRegistry.filter((chapter) => chapter.exam === "both" || chapter.exam === "advanced_only");

export const SYLLABUS = { mains, advanced };
