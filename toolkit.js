import { jsxDEV } from "react/jsx-dev-runtime";
import { Fragment, jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
import React, { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeftRight, Calculator, Check, ChevronRight, FlaskConical, Gauge, Search, Sigma, X } from "lucide-react";
import DeviceCalculator from "./device-calculator.js";
import { ELEMENTS } from "./periodic-data.js";
const PRIMARY_TOOLS = [
  ["scientific", "Scientific Calculator", "Scientific", "Trig, logarithms, powers, roots, and factorials.", "sin \u03B8 \xB7 log \xB7 x\u207F"],
  ["percentage", "Percentage Calculator", "Percentage", "Find a percentage, increase, or decrease.", "Parts \xB7 change"],
  ["question-target", "Question Target Planner", "Planning", "Turn your question goal into a daily target.", "Questions / day"],
  ["marks-impact", "Marks & Negative Impact", "Scoring", "Calculate a +4 / \u22121 score and skipped-question impact.", "+4 / \u22121"],
  ["percentile", "Percentile Estimator", "Scoring", "Estimate percentile and rank from marks out of 300.", "Marks \u2192 rank"],
  ["pressure", "Pressure Converter", "Converters", "Convert Pa, kPa, bar, atm, and mmHg.", "Pa \xB7 atm \xB7 bar"],
  ["energy", "Energy & Work Converter", "Converters", "Convert joules, calories, kilojoules, and electronvolts.", "J \xB7 cal \xB7 eV"],
  ["si-cgs", "SI \u2194 CGS Converter", "Converters", "Convert common length, mass, force, and energy units.", "SI \u21C4 CGS"],
  ["temperature", "Thermal Scale Converter", "Converters", "Convert Celsius, Kelvin, and Fahrenheit.", "\xB0C \xB7 K \xB7 \xB0F"],
  ["molarity", "Molarity & Molality", "Chemistry Lab", "Calculate concentration from mass, volume, and solvent.", "M \xB7 m"],
  ["normality", "Normality Dilution Solver", "Chemistry Lab", "Solve dilution with N\u2081V\u2081 = N\u2082V\u2082.", "N\u2081V\u2081 = N\u2082V\u2082"],
  ["ideal-gas", "Ideal Gas Law Solver", "Chemistry Lab", "Solve pressure, volume, amount, or temperature.", "PV = nRT"],
  ["periodic", "Periodic Trends", "Chemistry Lab", "Compare atomic radius, ionization enthalpy, and electronegativity.", "Quick reference"],
  ["kinematics", "Kinematics 1D Solver", "Physics Engines", "Find a missing variable in constant-acceleration motion.", "v = u + at"],
  ["optics", "Lens & Mirror Solver", "Physics Engines", "Solve image distance and magnification with sign conventions.", "1/f relation"],
  ["circuits", "Circuit Equivalent Solver", "Physics Engines", "Find equivalent resistance for series or parallel circuits.", "R\u209B \xB7 R\u209A"],
  ["constants", "Physical Constants", "Physics Engines", "Look up fundamental constants and standard values.", "Reference table"],
  ["quadratic", "Quadratic Roots Solver", "Mathematics", "Find roots and discriminant for ax\xB2 + bx + c = 0.", "\u0394 = b\xB2 \u2212 4ac"],
  ["determinant", "Matrix Determinant Solver", "Mathematics", "Calculate a 2\xD72 or 3\xD73 determinant.", "|A|"],
  ["progression", "AP & GP Solver", "Mathematics", "Find the nth term and sum of an arithmetic or geometric progression.", "a\u2099 \xB7 S\u2099"],
  ["conics", "Conics Quick Reference", "Mathematics", "Compare the standard forms of the conic sections.", "e \xB7 focus \xB7 directrix"]
].map(([id, name, category, description, tag]) => ({ id, name, category, description, tag, type: "calculator" }));
const REFERENCES = [
  ["projectile", "Projectile Motion", "Physics", "R = u\xB2sin2\u03B8/g \xB7 H = u\xB2sin\xB2\u03B8/2g", "Resolve initial velocity into horizontal and vertical components. At equal launch and landing heights, time of flight is 2u sin\u03B8/g."],
  ["newton", "Newton\u2019s Second Law", "Physics", "F\u20D7 = dp\u20D7/dt = m a\u20D7", "For constant mass, net force equals mass times acceleration. Choose a consistent axis before resolving forces."],
  ["friction", "Friction", "Physics", "f\u209B \u2264 \u03BC\u209BN \xB7 f\u2096 = \u03BC\u2096N", "Static friction adjusts up to its limiting value. Kinetic friction acts when surfaces slide."],
  ["work-power", "Work & Power", "Physics", "W = F\u20D7\xB7s\u20D7 \xB7 P = dW/dt", "Work is the component of force along displacement. Instantaneous power is force dotted with velocity."],
  ["centripetal", "Circular Motion", "Physics", "a\u1D9C = v\xB2/r = \u03C9\xB2r", "Centripetal acceleration points toward the centre. The required inward net force is mv\xB2/r."],
  ["impulse", "Impulse & Momentum", "Physics", "J\u20D7 = \u0394p\u20D7 = \u222BF\u20D7dt", "Impulse equals the change in momentum. Momentum is conserved in an isolated system."],
  ["density", "Density & Pressure", "Physics", "\u03C1 = m/V \xB7 P = F/A", "Density is mass per volume. Fluid pressure increases with depth by \u03C1gh in a static fluid."],
  ["shm", "Simple Harmonic Motion", "Physics", "a = \u2212\u03C9\xB2x \xB7 T = 2\u03C0/\u03C9", "In SHM, acceleration is proportional to displacement and directed toward equilibrium."],
  ["waves", "Wave Relation", "Physics", "v = f\u03BB", "Wave speed is frequency multiplied by wavelength. For a string, v = \u221A(T/\u03BC)."],
  ["coulomb-ohm", "Electric Force & Ohm\u2019s Law", "Physics", "F = kq\u2081q\u2082/r\xB2 \xB7 V = IR", "Coulomb force acts along the line joining charges. Ohm\u2019s law applies to an ohmic conductor at fixed physical conditions."],
  ["mole", "Mole & Particle Count", "Chemistry", "n = m/M \xB7 N = nN\u2090", "Moles equal sample mass divided by molar mass. Multiply moles by Avogadro\u2019s constant to get particle count."],
  ["ph", "pH & pOH", "Chemistry", "pH = \u2212log[H\u207A] \xB7 pH + pOH = 14", "At 25\xB0C in dilute aqueous solution, pH and pOH sum to 14. A one unit pH change is a tenfold concentration change."],
  ["buffer", "Henderson\u2013Hasselbalch", "Chemistry", "pH = pK\u2090 + log([A\u207B]/[HA])", "The equation estimates buffer pH from the conjugate base to acid concentration ratio."],
  ["kp-kc", "Equilibrium Constants", "Chemistry", "K\u209A = K\uA700(RT)\u0394n", "For gaseous equilibria, \u0394n is gaseous product moles minus gaseous reactant moles."],
  ["nernst", "Nernst Equation", "Chemistry", "E = E\xB0 \u2212 (0.0591/n)log Q", "At 298 K, the base-10 logarithm form relates cell potential to the reaction quotient."],
  ["half-life", "First-Order Half-Life", "Chemistry", "t\u2081/\u2082 = 0.693/k", "For a first-order reaction, half-life is independent of initial concentration."],
  ["dilution", "Solution Dilution", "Chemistry", "M\u2081V\u2081 = M\u2082V\u2082", "Dilution changes concentration and volume while keeping the amount of solute constant."],
  ["raoult", "Raoult\u2019s Law", "Chemistry", "p\u1D62 = x\u1D62p\u1D62\xB0", "For an ideal solution, a component\u2019s partial vapour pressure equals its mole fraction times pure vapour pressure."],
  ["empirical", "Empirical Formula", "Chemistry", "moles \u2192 divide by smallest \u2192 whole-number ratio", "Convert each element\u2019s mass or percentage to moles, divide all amounts by the smallest, then scale to integers."],
  ["gas-density", "Gas Density", "Chemistry", "d = PM/RT", "For an ideal gas, density is pressure times molar mass divided by RT."],
  ["log-laws", "Logarithm Laws", "Mathematics", "log(ab)=log a+log b \xB7 log(a\u1D56)=p log a", "For positive arguments, products become sums, quotients become differences, and powers move to the front."],
  ["trig-identities", "Core Trigonometric Identities", "Mathematics", "sin\xB2x + cos\xB2x = 1 \xB7 1 + tan\xB2x = sec\xB2x", "The identities follow from the unit circle and are useful for simplifying trigonometric expressions."],
  ["derivative", "Power Rule", "Mathematics", "d(x\u207F)/dx = nx\u207F\u207B\xB9", "The power rule applies to real n where the function is defined. Combine it with linearity."],
  ["integral", "Power Integral", "Mathematics", "\u222Bx\u207Fdx = x\u207F\u207A\xB9/(n+1)+C", "For n \u2260 \u22121, increase the exponent by one and divide by the new exponent. For n = \u22121, the integral is ln|x|+C."],
  ["binomial", "Binomial Term", "Mathematics", "T\u1D63\u208A\u2081 = \u207FC\u1D63 a\u207F\u207B\u02B3b\u02B3", "The general term in (a+b)\u207F uses r from 0 to n. The middle term depends on whether n is even or odd."],
  ["ap-formulas", "Arithmetic Progression", "Mathematics", "a\u2099 = a+(n\u22121)d \xB7 S\u2099 = n/2[2a+(n\u22121)d]", "An AP has a constant common difference d between consecutive terms."],
  ["gp-formulas", "Geometric Progression", "Mathematics", "a\u2099 = ar\u207F\u207B\xB9 \xB7 S\u2099 = a(r\u207F\u22121)/(r\u22121)", "A GP has constant common ratio r. For |r| < 1, the infinite sum is a/(1\u2212r)."],
  ["distance", "Coordinate Distance", "Mathematics", "d = \u221A[(x\u2082\u2212x\u2081)\xB2+(y\u2082\u2212y\u2081)\xB2]", "The distance formula follows from Pythagoras\u2019 theorem in the Cartesian plane."],
  ["dot-product", "Vector Dot Product", "Mathematics", "a\u20D7\xB7b\u20D7 = |a||b|cos\u03B8", "The dot product is zero for perpendicular nonzero vectors. In components, multiply matching coordinates and add."],
  ["probability", "Conditional Probability", "Mathematics", "P(A|B) = P(A\u2229B)/P(B)", "For P(B)>0, conditional probability restricts the sample space to event B."],
  ["gravitation", "Gravitation & Orbital Motion", "Physics", "F = GMm/r\xB2 \xB7 v\u2092 = \u221A(GM/r) \xB7 T\xB2 = 4\u03C0\xB2r\xB3/GM", "Use the centre-to-centre distance r. For a circular orbit, gravity supplies the centripetal force."],
  ["capacitors", "Capacitance Networks", "Physics", "Series: 1/C\u2091q = \u03A3(1/C) \xB7 Parallel: C\u2091q = \u03A3C", "Series capacitors carry equal charge; parallel capacitors share the same potential difference."],
  ["electromagnetic-induction", "Electromagnetic Induction", "Physics", "\u03B5 = \u2212d\u03A6\u1D2E/dt \xB7 \u03A6\u1D2E = BA cos \u03B8", "The negative sign expresses Lenz\u2019s law: induced effects oppose the change in magnetic flux."],
  ["magnetic-force", "Magnetic Force & Motion", "Physics", "F = qvB sin \u03B8 \xB7 r = mv/(|q|B)", "A charged particle moving perpendicular to a uniform magnetic field follows a circular path."],
  ["colligative", "Colligative Properties", "Chemistry", "\u0394T\u1DA0 = iK\u1DA0m \xB7 \u0394T\u1D47 = iK\u1D47m \xB7 \u03C0 = iCRT", "For dilute solutions, colligative changes depend on the number of dissolved particles."],
  ["chemical-kinetics", "Chemical Kinetics", "Chemistry", "ln([A]\u2080/[A]\u209C) = kt \xB7 t\u2081/\u2082 = 0.693/k", "These integrated relations and the half-life expression apply to a first-order reaction."],
  ["electrochemistry", "Electrochemical Cells", "Chemistry", "\u0394G\xB0 = \u2212nFE\xB0cell \xB7 E = E\xB0 \u2212 (RT/nF)ln Q", "A positive standard cell potential corresponds to a negative standard Gibbs energy change."],
  ["chemical-bonding", "Hybridization & Molecular Shape", "Chemistry", "Steric number = \u03C3 bonds + lone pairs", "Count regions of electron density around the central atom to predict electron geometry."],
  ["complex-numbers", "Complex Number Modulus", "Mathematics", "|z| = \u221A(x\xB2+y\xB2) \xB7 z = x+iy", "The modulus is the distance from the origin in the Argand plane; conjugate product gives |z|\xB2."],
  ["standard-limits", "Standard Limits", "Mathematics", "lim\u2093\u2192\u2080 sin x/x = 1 \xB7 lim\u2093\u2192\u2080 (e\u02E3\u22121)/x = 1", "Angles are in radians. These limits are core substitutions for evaluating indeterminate forms."]
].map(([id, name, subject, formula, detail]) => ({ id, name, category: "Reference", description: detail, tag: subject, type: "reference", formula, detail }));
const TOOL_CATALOG = [...PRIMARY_TOOLS, ...REFERENCES];
const TOOL_FILTERS = ["All Tools", "Scientific", "Percentage", "Planning", "Scoring", "Converters", "Chemistry Lab", "Physics Engines", "Mathematics", "Reference"];
const PRESSURE = { Pa: 1, kPa: 1e3, bar: 1e5, atm: 101325, mmHg: 133.322368 };
const ENERGY = { J: 1, kJ: 1e3, cal: 4.184, kcal: 4184, eV: 1602176634e-28 };
const SI_CGS = {
  Length: { "m \u2192 cm": 100, "cm \u2192 m": 0.01 },
  Mass: { "kg \u2192 g": 1e3, "g \u2192 kg": 1e-3 },
  Force: { "N \u2192 dyne": 1e5, "dyne \u2192 N": 1e-5 },
  Energy: { "J \u2192 erg": 1e7, "erg \u2192 J": 1e-7 },
  Pressure: { "Pa \u2192 barye": 10, "barye \u2192 Pa": 0.1 }
};
function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let value = 1;
  for (let i = 2; i <= n; i++) value *= i;
  return value;
}
function fmt(value, precision = 6) {
  if (!Number.isFinite(value)) return "Undefined";
  return Number(value.toPrecision(precision)).toLocaleString("en", { maximumSignificantDigits: precision });
}
function Input({ label, value, onChange, ...props }) {
  return /* @__PURE__ */ jsxDEV2("label", { className: "tool-input", children: [
    /* @__PURE__ */ jsxDEV2("span", { children: label }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 85,
      columnNumber: 40
    }, this),
    /* @__PURE__ */ jsxDEV2("input", { value, onChange: (event) => onChange(event.target.value), ...props }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 85,
      columnNumber: 60
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 85,
    columnNumber: 10
  }, this);
}
function Select({ label, value, onChange, options }) {
  return /* @__PURE__ */ jsxDEV2("label", { className: "tool-input", children: [
    /* @__PURE__ */ jsxDEV2("span", { children: label }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 40
    }, this),
    /* @__PURE__ */ jsxDEV2("select", { value, onChange: (event) => onChange(event.target.value), children: options.map((option) => /* @__PURE__ */ jsxDEV2("option", { value: option, children: option }, option, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 158
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 60
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 88,
    columnNumber: 10
  }, this);
}
function PeriodicExplorer() {
  const [selected, setSelected] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  useEffect(() => {
    if (!tableOpen && !trendsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setTableOpen(false);
        setTrendsOpen(false);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [tableOpen, trendsOpen]);
  const elementClass = (element) => String(element.category || "element").toLowerCase().replace(/[^a-z]+/g, "-");
  const elementColor = (element) => /alkali metal/.test(element.category || "") ? "#e78b6f" : /alkaline earth/.test(element.category || "") ? "#e4b85c" : /transition metal/.test(element.category || "") ? "#779fdb" : /lanthanide/.test(element.category || "") ? "#b28bd4" : /actinide/.test(element.category || "") ? "#d47caa" : /noble gas/.test(element.category || "") ? "#61b9ba" : /halogen/.test(element.category || "") ? "#79b978" : /metalloid/.test(element.category || "") ? "#73a98d" : "#8b9ca5";
  const formatAtomicMass = (element) => {
    const mass = Number(element.atomicMass ?? element.mass);
    if (!Number.isFinite(mass)) return "—";
    const isotopeMass = element.number === 43 || element.number === 61 || (element.number >= 84 && ![90, 91, 92].includes(element.number));
    return isotopeMass && Number.isInteger(mass) ? `[${mass}]` : mass.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  };
  const categoryLegend = [
    ["Alkali metals", "#e78b6f"], ["Alkaline earth", "#e4b85c"], ["Transition metals", "#779fdb"],
    ["Post-transition", "#8b9ca5"], ["Metalloids", "#73a98d"], ["Other nonmetals", "#8b9ca5"],
    ["Halogens", "#79b978"], ["Noble gases", "#61b9ba"], ["Lanthanides", "#b28bd4"], ["Actinides", "#d47caa"]
  ];
  const fBlockElements = ELEMENTS.filter((element) => (element.number >= 57 && element.number <= 71) || (element.number >= 89 && element.number <= 103));
  const mainTableElements = ELEMENTS.filter((element) => !((element.number >= 57 && element.number <= 71) || (element.number >= 89 && element.number <= 103)));
  const format = (value, unit = "") => value === null || value === void 0 || value === "" ? "Not available" : `${value}${unit}`;
  const point = (kelvin) => typeof kelvin === "number" ? `${(kelvin - 273.15).toFixed(1)} °C · ${((kelvin - 273.15) * 9 / 5 + 32).toFixed(1)} °F · ${kelvin} K` : "Not available";
  const propertyGroups = selected ? [
    ["Core Identification Data", [["Atomic Number", selected.number], ["Element Symbol", selected.symbol], ["Element Name", selected.name], ["Atomic Mass / Weight", `${formatAtomicMass(selected)} u`]]],
    ["Electronic & Chemical Configurations", [["Electron Configuration", format(selected.configuration)], ["Oxidation States", format(selected.oxidation)], ["Valence Electrons", selected.shells?.at(-1) ?? "Not available"]]],
    ["Key Physical Properties", [["State of Matter (at STP)", format(selected.state)], ["Melting Point (°C, °F, K)", point(selected.meltK)], ["Boiling Point (°C, °F, K)", point(selected.boilK)], ["Density (g/cm3)", format(selected.density, " g/cm³")]]],
    ["Elemental Periodic Trends", [["Electronegativity (Pauling scale)", format(selected.electronegativity)], ["Ionization Energy / Enthalpy", format(selected.ionization, " kJ/mol")], ["Atomic Radius", format(selected.radius, " pm")]]],
    ["Classification & Historical Details", [["Series / Group Category", selected.category || "Not available"], ["Discovery Info (Year and scientist)", `${selected.year ?? "Year not recorded"} · ${selected.discoveredBy || "Discoverer not recorded"}`]]]
  ] : [];
  const trends = [
    { name: "Atomic Radius", across: "Decreases (↓) Left → Right across a period", down: "Increases (↑) Top ↓ Bottom down a group", reason: "Across a period, proton number rises while added electrons enter the same principal shell. The increase in effective nuclear charge (Zeff) pulls the electron cloud inward. Down a group, a new shell is added and shielding increases, so the valence shell lies farther from the nucleus.", exam: "Radius depends on how it is defined: covalent radius for bonded non-metals, metallic radius for metals, and van der Waals radius for non-bonded atoms. Cation < parent atom < anion. In an isoelectronic series, radius decreases as nuclear charge increases: O²⁻ > F⁻ > Na⁺ > Mg²⁺." },
    { name: "Ionization Enthalpy (Ionization Energy)", across: "Generally increases (↑) Left → Right across a period", down: "Generally decreases (↓) Top ↓ Bottom down a group", reason: "First ionization enthalpy, ΔᵢH₁, is the enthalpy required to remove the most loosely held electron from an isolated gaseous atom in its ground state: X(g) → X⁺(g) + e⁻. A smaller radius and higher Zeff usually make removal harder; greater shell distance and shielding down a group usually make it easier.", exam: "Successive ionization enthalpies increase (ΔᵢH₁ < ΔᵢH₂ < ΔᵢH₃); a very large jump signals that removal has begun from a stable inner shell. Remember the common period-2 exceptions Be > B and N > O (also Mg > Al and P > S): subshell energy and the extra stability of a half-filled p³ subshell affect removal." },
    { name: "Electronegativity", across: "Generally increases (↑) Left → Right across a period", down: "Generally decreases (↓) Top ↓ Bottom down a group", reason: "Electronegativity describes how strongly an atom in a chemical bond attracts the shared electron pair. It rises as atomic size falls and effective nuclear attraction grows; it usually falls down a group as the bonding electrons are farther from the nucleus and more shielded. Fluorine is the most electronegative element.", exam: "Electronegativity is a relative, dimensionless scale value—not an enthalpy for an isolated atom—and can vary with bonding environment and oxidation state. Use Δχ to predict bond polarity: a larger difference generally means a more polar bond; do not confuse χ with electron gain enthalpy." },
    { name: "Electron Affinity / Electron Gain Enthalpy", across: "ΔₑgH generally becomes more negative (↓ energy) Left → Right", down: "ΔₑgH generally becomes less negative (↑ energy) Top ↓ Bottom", reason: "Electron gain enthalpy is the enthalpy change for X(g) + e⁻ → X⁻(g). More negative ΔₑgH means energy is released more strongly on adding the electron. Across a period, rising Zeff usually favors electron addition; down a group, increasing size usually weakens attraction to the added electron.", exam: "The trend is irregular. Chlorine has a more negative electron gain enthalpy than fluorine, and sulfur more negative than oxygen: compact n = 2 orbitals have greater electron–electron repulsion. Noble gases have positive values; groups 2 and 15 are also less favorable than a simple left-to-right rule suggests. Adding a second electron to an anion is endothermic because of repulsion." },
    { name: "Metallic Character", across: "Decreases (↓) Left → Right across a period", down: "Increases (↑) Top ↓ Bottom down a group", reason: "Metallic character is the tendency to lose valence electrons and form cations. Across a period, increasing Zeff and ionization enthalpy make electron loss less favorable, so metallic character falls. Down a group, larger size and shielding make valence electrons easier to remove, so metallic character rises.", exam: "The broad trend is opposite to non-metallic character. Metals are concentrated toward the lower-left and non-metals toward the upper-right of the periodic table. Treat the direction as a general trend: transition-series behavior and metalloid positions require element-specific context." }
  ];
  const trendLaunch = React.createElement("div", { className: "periodic-table-launch", key: "trends-launch" }, [
    React.createElement("div", { key: "copy" }, [
      React.createElement("span", { key: "description", children: "Five core trends, causes, and JEE exceptions." })
    ]),
    React.createElement("button", { className: "button primary", onClick: () => setTrendsOpen(true), children: "Periodic Trends", key: "open" })
  ]);
  return React.createElement(React.Fragment, null,
    React.createElement("section", { className: "periodic-explorer" }, [
      React.createElement("div", { className: "periodic-table-launch", key: "table-launch" }, [
        React.createElement("div", { key: "copy" }, [
          React.createElement("strong", { key: "title", children: "Periodic table" }),
          React.createElement("span", { key: "description", children: "Open an element to inspect its properties." })
        ]),
        React.createElement("button", { className: "button primary", onClick: () => setTableOpen(true), children: "Open periodic table", key: "open" })
      ]),
      trendLaunch,
      tableOpen && React.createElement("div", { className: "periodic-table-scroll periodic-table-fullscreen", key: "table" },
        React.createElement("div", { className: "periodic-table-reference" }, [
          React.createElement("div", { className: "periodic-table-grid", key: "main-grid" }, [
            React.createElement("span", { className: "periodic-axis-corner", style: { gridColumn: 1, gridRow: 1 }, key: "axis-corner", children: "P/G" }),
            ...Array.from({ length: 18 }, (_, index) => React.createElement("span", { className: "periodic-group-header", style: { gridColumn: index + 2, gridRow: 1 }, key: `group-${index + 1}`, children: index + 1 })),
            ...Array.from({ length: 7 }, (_, index) => React.createElement("span", { className: "periodic-period-header", style: { gridColumn: 1, gridRow: index + 2 }, key: `period-${index + 1}`, children: index + 1 })),
            React.createElement("div", { className: "periodic-table-key", style: { gridColumn: "4 / span 2", gridRow: "2 / span 2" }, key: "key" }, [
              React.createElement("div", { className: "periodic-key-tile", key: "sample" }, [
                React.createElement("div", { className: "periodic-element-topline", key: "top" }, [React.createElement("small", { key: "number", children: "8" }), React.createElement("small", { className: "periodic-element-mass", key: "mass", children: "15.999" })]),
                React.createElement("strong", { key: "symbol", children: "O" }),
                React.createElement("span", { key: "name", children: "Oxygen" })
              ]),
              React.createElement("div", { className: "periodic-key-labels", key: "labels" }, [
                React.createElement("span", { key: "atomic-number", children: "Atomic number" }),
                React.createElement("span", { key: "atomic-mass", children: "Atomic mass (u)" }),
                React.createElement("span", { key: "symbol-label", children: "Element symbol" }),
                React.createElement("span", { key: "name-label", children: "Element name" })
              ])
            ]),
            React.createElement("div", { className: "periodic-category-legend", style: { gridColumn: "6 / span 8", gridRow: "2 / span 2" }, key: "legend" }, [
              React.createElement("strong", { key: "legend-title", children: "Element categories" }),
              React.createElement("div", { className: "periodic-category-list", key: "categories" }, categoryLegend.map(([label, color]) => React.createElement("span", { className: "periodic-category-key", key: label, style: { "--element-color": color } }, [React.createElement("i", { key: "swatch" }), label])))
            ]),
            ...[6, 7].map((period) => React.createElement("div", { className: "periodic-f-placeholder", style: { gridColumn: 4, gridRow: period + 1 }, key: `placeholder-${period}` }, period === 6 ? [React.createElement("b", { key: "range", children: "57–71" }), React.createElement("span", { key: "symbol", children: "La–Lu" })] : [React.createElement("b", { key: "range", children: "89–103" }), React.createElement("span", { key: "symbol", children: "Ac–Lr" })])),
            ...mainTableElements.map((element) => React.createElement("button", {
              className: `periodic-element ${elementClass(element)} ${selected?.number === element.number ? "selected" : ""}`,
              style: { gridColumn: element.group + 1, gridRow: element.period + 1, "--element-color": elementColor(element) },
              onClick: () => setSelected(element), title: `${element.number} · ${element.name} · Atomic mass ${formatAtomicMass(element)} u`, key: element.number,
              "aria-label": `${element.name}, atomic number ${element.number}, atomic mass ${formatAtomicMass(element)} unified atomic mass units`
            }, [
              React.createElement("div", { className: "periodic-element-topline", key: "top" }, [React.createElement("small", { key: "number", children: element.number }), React.createElement("small", { className: "periodic-element-mass", key: "mass", children: formatAtomicMass(element) })]),
              React.createElement("strong", { key: "symbol", children: element.symbol }),
              React.createElement("span", { key: "name", children: element.name })
            ]))
          ]),
          React.createElement("div", { className: "periodic-f-block", key: "f-block" }, [
            ...[["Lanthanide Series", 57, 71], ["Actinide Series", 89, 103]].map(([label, start, end]) => React.createElement("div", { className: "periodic-f-row", key: label }, [
              React.createElement("strong", { className: "periodic-series-label", style: { gridColumn: "1 / span 3" }, children: label, key: "label" }),
              ...fBlockElements.filter((element) => element.number >= start && element.number <= end).map((element, index) => React.createElement("button", {
                className: `periodic-element ${elementClass(element)} ${selected?.number === element.number ? "selected" : ""}`,
                style: { gridColumn: index + 4, "--element-color": elementColor(element) },
                onClick: () => setSelected(element), title: `${element.number} · ${element.name} · Atomic mass ${formatAtomicMass(element)} u`, key: element.number,
                "aria-label": `${element.name}, atomic number ${element.number}, atomic mass ${formatAtomicMass(element)} unified atomic mass units`
              }, [
                React.createElement("div", { className: "periodic-element-topline", key: "top" }, [React.createElement("small", { key: "number", children: element.number }), React.createElement("small", { className: "periodic-element-mass", key: "mass", children: formatAtomicMass(element) })]),
                React.createElement("strong", { key: "symbol", children: element.symbol }),
                React.createElement("span", { key: "name", children: element.name })
              ]))
            ]))
          ])
        ])
      ),
      tableOpen && React.createElement("button", { type: "button", className: "periodic-table-exit", "aria-label": "Close periodic table", onClick: () => { setTableOpen(false); setSelected(null); }, key: "table-close" }, React.createElement(X, { size: 22 })),
      selected && tableOpen && React.createElement("div", { className: "periodic-detail-overlay", onMouseDown: (event) => { if (event.target === event.currentTarget) setSelected(null); }, key: "element-detail-overlay" },
        React.createElement("section", { className: `periodic-detail ${elementClass(selected)}`, role: "dialog", "aria-modal": "true", "aria-label": `${selected.name} properties` }, [
          React.createElement("header", { key: "header" }, [
            React.createElement("div", { className: "periodic-element-mark", key: "mark" }, [React.createElement("small", { key: "number", children: selected.number }), React.createElement("strong", { key: "symbol", children: selected.symbol }), React.createElement("span", { key: "name", children: selected.name })]),
            React.createElement("div", { className: "periodic-detail-title", key: "title" }, [
              React.createElement("span", { className: "periodic-category", children: selected.category || "Element", key: "category" }),
              React.createElement("strong", { children: `${selected.name} · Element ${selected.number}`, key: "name" }),
              React.createElement("button", { className: "periodic-detail-close", "aria-label": "Close element properties", onClick: () => setSelected(null), key: "close" }, React.createElement(X, { size: 18 }))
            ])
          ]),
          React.createElement("div", { className: "periodic-property-groups", key: "groups" }, propertyGroups.map(([group, items]) => React.createElement("section", { className: "periodic-property-group", key: group }, [
            React.createElement("h3", { children: group, key: "heading" }),
            React.createElement("div", { className: "periodic-property-grid", key: "properties" }, items.map(([label, value]) => React.createElement("article", { key: label }, [React.createElement("span", { children: label, key: "label" }), React.createElement("strong", { children: value, key: "value" })])))
          ]))),
          React.createElement("p", { className: "periodic-data-note", children: "Reference values are approximate; some properties are not experimentally established for short-lived elements.", key: "note" })
        ])
      )
    ]),
    trendsOpen && React.createElement(React.Fragment, { key: "trends-overlay" }, [
      React.createElement("div", { className: "periodic-table-fullscreen periodic-trends-fullscreen", role: "dialog", "aria-modal": "true", "aria-label": "Periodic Trends", key: "content" },
        React.createElement("div", { className: "periodic-trends-content" }, trends.map((trend) => React.createElement("article", { className: "periodic-trend-card", key: trend.name }, [
          React.createElement("h2", { children: trend.name, key: "heading" }),
          React.createElement("div", { className: "periodic-trend-directions", key: "directions" }, [
            React.createElement("p", { children: trend.across, key: "across" }),
            React.createElement("p", { children: trend.down, key: "down" })
          ]),
          React.createElement("p", { className: "periodic-trend-reason", children: trend.reason, key: "reason" }),
          React.createElement("p", { className: "periodic-trend-exam", children: [React.createElement("strong", { children: "JEE focus · ", key: "label" }), trend.exam], key: "exam" })
        ])))
      ),
      React.createElement("button", { type: "button", className: "periodic-table-exit", "aria-label": "Close Periodic Trends", onClick: () => setTrendsOpen(false), key: "close" }, React.createElement(X, { size: 22 }))
    ])
  );
}
function ToolCalculator({ tool }) {
  const [v, setV] = useState({});
  const set = (key, value) => setV((current) => ({ ...current, [key]: value }));
  const num = (key, fallback = 0) => v[key] === "" || v[key] === void 0 ? fallback : Number(v[key]);
  const result = (title, value, note = "") => /* @__PURE__ */ jsxDEV2("div", { className: "tool-result", children: [
    /* @__PURE__ */ jsxDEV2("span", { children: title }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 95,
      columnNumber: 76
    }, this),
    /* @__PURE__ */ jsxDEV2("strong", { children: value }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 95,
      columnNumber: 96
    }, this),
    note && /* @__PURE__ */ jsxDEV2("small", { children: note }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 95,
      columnNumber: 129
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 95,
    columnNumber: 47
  }, this);
  const numberInput = (key, label, fallback = "") => /* @__PURE__ */ jsxDEV2(Input, { label, value: v[key] ?? fallback, onChange: (value) => set(key, value), type: "number", step: "any" }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 96,
    columnNumber: 54
  }, this);
  if (tool.id === "scientific") {
    const operation = v.operation || "sin";
    const x = num("x");
    const y = num("y");
    const degrees = x * Math.PI / 180;
    let answer;
    if (operation === "sin") answer = Math.sin(degrees);
    if (operation === "cos") answer = Math.cos(degrees);
    if (operation === "tan") answer = Math.tan(degrees);
    if (operation === "ln") answer = Math.log(x);
    if (operation === "log") answer = Math.log10(x);
    if (operation === "sqrt") answer = Math.sqrt(x);
    if (operation === "power") answer = x ** y;
    if (operation === "factorial") answer = factorial(x);
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("x", operation === "power" ? "Base" : "Value", "30"),
        operation === "power" && numberInput("y", "Exponent", "2"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Operation", value: operation, onChange: (value) => set("operation", value), options: ["sin", "cos", "tan", "ln", "log", "sqrt", "power", "factorial"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 112,
          columnNumber: 172
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 112,
        columnNumber: 14
      }, this),
      result("Result", fmt(answer), ["sin", "cos", "tan"].includes(operation) ? "Trigonometric input is in degrees." : "")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 112,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "percentage") {
    const base = num("base");
    const percent = num("percent");
    const mode = v.mode || "of";
    const value = mode === "of" ? base * percent / 100 : mode === "increase" ? base * (1 + percent / 100) : base * (1 - percent / 100);
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("base", mode === "of" ? "Number" : "Starting value"),
        numberInput("percent", "Percentage (%)"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Calculate", value: mode, onChange: (value2) => set("mode", value2), options: ["of", "increase", "decrease"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 117,
          columnNumber: 154
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 117,
        columnNumber: 14
      }, this),
      result(mode === "of" ? `${percent}% of ${base}` : "Final value", fmt(value))
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 117,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "question-target") {
    const goal = num("goal");
    const done = num("done");
    const days = Math.max(0, num("days"));
    const perDay = days ? Math.ceil(Math.max(0, goal - done) / days) : 0;
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("goal", "Question goal", "300"),
        numberInput("done", "Already completed", "0"),
        numberInput("days", "Days remaining", "14")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 122,
        columnNumber: 14
      }, this),
      result("Questions per day", `${perDay}`, `${Math.max(0, goal - done)} questions left across ${days} days.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 122,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "marks-impact") {
    const correct = num("correct");
    const wrong = num("wrong");
    const skipped = num("skipped");
    const score = correct * 4 - wrong;
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("correct", "Correct answers", "0"),
        numberInput("wrong", "Incorrect answers", "0"),
        numberInput("skipped", "Skipped", "0")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 127,
        columnNumber: 14
      }, this),
      result("Net score", `${score}`, `${correct + wrong + skipped} questions \xB7 ${wrong} negative mark${wrong === 1 ? "" : "s"}. Skipping ${wrong} wrong answers would save ${wrong} mark${wrong === 1 ? "" : "s"}.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 127,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "percentile") {
    const marks = Math.max(0, Math.min(300, num("marks")));
    const candidates = Math.max(1, num("candidates", 14e5));
    const points = [[0, 0], [40, 38], [80, 68], [120, 87], [160, 95], [200, 98.1], [240, 99.5], [270, 99.85], [300, 100]];
    let percentile = 0;
    for (let i = 1; i < points.length; i++) if (marks <= points[i][0]) {
      const [x1, y1] = points[i - 1];
      const [x2, y2] = points[i];
      percentile = y1 + (marks - x1) / (x2 - x1) * (y2 - y1);
      break;
    }
    if (marks >= 300) percentile = 100;
    const rank = Math.max(1, Math.round(candidates * (1 - percentile / 100)));
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("marks", "Marks out of 300", "150"),
        numberInput("candidates", "Candidates", "1400000")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 140,
        columnNumber: 14
      }, this),
      result("Estimated percentile", `${percentile.toFixed(2)}%`, `Indicative rank \u2248 ${rank.toLocaleString("en")}. Use as a rough planning estimate.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 140,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "pressure" || tool.id === "energy") {
    const options = tool.id === "pressure" ? Object.keys(PRESSURE) : Object.keys(ENERGY);
    const table = tool.id === "pressure" ? PRESSURE : ENERGY;
    const from = v.from || options[0];
    const to = v.to || options[1];
    const converted = num("value") * table[from] / table[to];
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("value", "Value", "1"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "From", value: from, onChange: (value) => set("from", value), options }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 147,
          columnNumber: 82
        }, this),
        /* @__PURE__ */ jsxDEV2(Select, { label: "To", value: to, onChange: (value) => set("to", value), options }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 147,
          columnNumber: 177
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 147,
        columnNumber: 14
      }, this),
      result("Converted value", `${fmt(converted)} ${to}`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 147,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "si-cgs") {
    const dimension = v.dimension || "Length";
    const directions = Object.keys(SI_CGS[dimension]);
    const direction = v.direction || directions[0];
    const factor = SI_CGS[dimension][direction];
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("value", "Value", "1"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Dimension", value: dimension, onChange: (value) => {
          set("dimension", value);
          set("direction", Object.keys(SI_CGS[value])[0]);
        }, options: Object.keys(SI_CGS) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 154,
          columnNumber: 82
        }, this),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Conversion", value: direction, onChange: (value) => set("direction", value), options: directions }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 154,
          columnNumber: 258
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 154,
        columnNumber: 14
      }, this),
      result("Converted value", `${fmt(num("value") * factor)} ${direction.split(" \u2192 ")[1]}`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 154,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "temperature") {
    const from = v.from || "\xB0C";
    const to = v.to || "K";
    const raw = num("value");
    const c = from === "\xB0C" ? raw : from === "K" ? raw - 273.15 : (raw - 32) * 5 / 9;
    const converted = to === "\xB0C" ? c : to === "K" ? c + 273.15 : c * 9 / 5 + 32;
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("value", "Temperature", "25"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "From", value: from, onChange: (value) => set("from", value), options: ["\xB0C", "K", "\xB0F"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 161,
          columnNumber: 89
        }, this),
        /* @__PURE__ */ jsxDEV2(Select, { label: "To", value: to, onChange: (value) => set("to", value), options: ["\xB0C", "K", "\xB0F"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 161,
          columnNumber: 194
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 161,
        columnNumber: 14
      }, this),
      result("Converted temperature", `${fmt(converted)} ${to}`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 161,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "molarity") {
    const moles = num("mass") / Math.max(Number.EPSILON, num("molarMass", 1));
    const molarity = moles / Math.max(Number.EPSILON, num("volume", 1));
    const molality = moles / Math.max(Number.EPSILON, num("solvent", 1));
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("mass", "Solute mass (g)", "10"),
        numberInput("molarMass", "Molar mass (g/mol)", "40"),
        numberInput("volume", "Solution volume (L)", "0.5"),
        numberInput("solvent", "Solvent mass (kg)", "0.4")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 167,
        columnNumber: 14
      }, this),
      result("Molarity", `${fmt(molarity)} mol/L`, `Molality: ${fmt(molality)} mol/kg \xB7 ${fmt(moles)} mol solute.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 167,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "normality") {
    const unknown = v.unknown || "V\u2082";
    const n1 = num("n1");
    const v1 = num("v1");
    const n2 = num("n2");
    const v2 = num("v2");
    const answers = { "N\u2081": n2 * v2 / Math.max(Number.EPSILON, v1), "V\u2081": n2 * v2 / Math.max(Number.EPSILON, n1), "N\u2082": n1 * v1 / Math.max(Number.EPSILON, v2), "V\u2082": n1 * v1 / Math.max(Number.EPSILON, n2) };
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("n1", "N\u2081", "1"),
        numberInput("v1", "V\u2081 (mL)", "20"),
        numberInput("n2", "N\u2082", "0.2"),
        numberInput("v2", "V\u2082 (mL)", "100"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Solve for", value: unknown, onChange: (value) => set("unknown", value), options: ["N\u2081", "V\u2081", "N\u2082", "V\u2082"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 181
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 172,
        columnNumber: 14
      }, this),
      result(`Solved ${unknown}`, fmt(answers[unknown]), "N\u2081V\u2081 = N\u2082V\u2082")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 172,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "ideal-gas") {
    const solve = v.solve || "P";
    const p = num("p", 101.325);
    const volume = num("volume", 24.5);
    const n = num("n", 1);
    const temp = num("temp", 298);
    const r = 8.314;
    const answers = { P: n * r * temp / Math.max(Number.EPSILON, volume), V: n * r * temp / Math.max(Number.EPSILON, p), n: p * volume / (r * temp), T: p * volume / (n * r) };
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("p", "Pressure P (kPa)", "101.325"),
        numberInput("volume", "Volume V (L)", "24.5"),
        numberInput("n", "Amount n (mol)", "1"),
        numberInput("temp", "Temperature T (K)", "298"),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Solve for", value: solve, onChange: (value) => set("solve", value), options: ["P", "V", "n", "T"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 178,
          columnNumber: 232
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 178,
        columnNumber: 14
      }, this),
      result(`Solved ${solve}`, `${fmt(answers[solve])} ${solve === "P" ? "kPa" : solve === "V" ? "L" : solve === "n" ? "mol" : "K"}`, "PV = nRT \xB7 R = 8.314 kPa\xB7L\xB7mol\u207B\xB9\xB7K\u207B\xB9")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 178,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "kinematics") {
    const solve = v.solve || "v";
    const u = num("u");
    const a = num("a");
    const t = num("t");
    const speed = num("v");
    const s = num("s");
    const answers = { v: u + a * t, s: u * t + 0.5 * a * t * t, u: speed - a * t, a: (speed - u) / t, t: (speed - u) / a };
    const keys = solve === "v" ? ["u", "a", "t"] : solve === "s" ? ["u", "a", "t"] : solve === "u" ? ["v", "a", "t"] : solve === "a" ? ["v", "u", "t"] : ["v", "u", "a"];
    const labels = { u: "Initial velocity u (m/s)", v: "Final velocity v (m/s)", a: "Acceleration a (m/s\xB2)", t: "Time t (s)", s: "Displacement s (m)" };
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        keys.map((key) => numberInput(key, labels[key], key === "t" ? "4" : key === "a" ? "2" : "0")),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Solve for", value: solve, onChange: (value) => set("solve", value), options: ["v", "s", "u", "a", "t"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 185,
          columnNumber: 141
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 185,
        columnNumber: 14
      }, this),
      result(`Solved ${solve}`, `${fmt(answers[solve])} ${solve === "a" ? "m/s\xB2" : solve === "t" ? "s" : solve === "s" ? "m" : "m/s"}`, "Constant acceleration; choose inputs for the selected equation.")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 185,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "optics") {
    const kind = v.kind || "Lens";
    const object = num("u", -30);
    const focal = num("f", 15);
    const image = kind === "Lens" ? focal * object / (object + focal) : focal * object / (object - focal);
    const magnification = kind === "Lens" ? image / object : -image / object;
    const isReal = kind === "Lens" ? image > 0 : image < 0;
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        /* @__PURE__ */ jsxDEV2(Select, { label: "Optical element", value: kind, onChange: (value) => set("kind", value), options: ["Lens", "Mirror"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 192,
          columnNumber: 46
        }, this),
        numberInput("u", "Object distance u (cm)", "-30"),
        numberInput("f", "Focal length f (cm)", "15")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 192,
        columnNumber: 14
      }, this),
      result("Image distance v", `${fmt(image)} cm`, `${isReal ? "Real" : "Virtual"} \xB7 ${magnification < 0 ? "Inverted" : "Upright"} \xB7 m = ${fmt(magnification)}. Cartesian sign convention; real object u < 0.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 192,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "circuits") {
    const mode = v.mode || "Series";
    const values = (v.resistors || "2, 3, 6").split(",").map(Number).filter((value) => value > 0);
    const equivalent = mode === "Series" ? values.reduce((sum, value) => sum + value, 0) : 1 / values.reduce((sum, value) => sum + 1 / value, 0);
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        /* @__PURE__ */ jsxDEV2(Input, { label: "Resistances (\u03A9, comma separated)", value: v.resistors ?? "2, 3, 6", onChange: (value) => set("resistors", value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 197,
          columnNumber: 46
        }, this),
        /* @__PURE__ */ jsxDEV2(Select, { label: "Connection", value: mode, onChange: (value) => set("mode", value), options: ["Series", "Parallel"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 197,
          columnNumber: 175
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 197,
        columnNumber: 14
      }, this),
      result("Equivalent resistance", `${fmt(equivalent)} \u03A9`, `${values.length} resistor${values.length === 1 ? "" : "s"} \xB7 ${mode.toLowerCase()} connection.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 197,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "quadratic") {
    const a = num("a", 1);
    const b = num("b", -5);
    const c = num("c", 6);
    const d = b * b - 4 * a * c;
    const roots = a === 0 ? b === 0 ? "Not a quadratic equation" : fmt(-c / b) : d >= 0 ? `${fmt((-b + Math.sqrt(d)) / (2 * a))}, ${fmt((-b - Math.sqrt(d)) / (2 * a))}` : `${fmt(-b / (2 * a))} \xB1 ${fmt(Math.sqrt(-d) / Math.abs(2 * a))}i`;
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        numberInput("a", "Coefficient a", "1"),
        numberInput("b", "Coefficient b", "-5"),
        numberInput("c", "Coefficient c", "6")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 204,
        columnNumber: 14
      }, this),
      result("Roots", roots, a === 0 ? "For a = 0, the expression is linear or has no unique solution." : `Discriminant \u0394 = ${fmt(d)} \xB7 ${d > 0 ? "two real roots" : d === 0 ? "repeated real root" : "complex conjugates"}.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 204,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "determinant") {
    const size = v.size || "2\xD72";
    const n = size === "2\xD72" ? 4 : 9;
    const values = (v.entries || (size === "2\xD72" ? "1, 2, 3, 4" : "1, 2, 3, 0, 1, 4, 5, 6, 0")).split(",").map(Number);
    let det;
    if (size === "2\xD72") det = values[0] * values[3] - values[1] * values[2];
    else det = values[0] * (values[4] * values[8] - values[5] * values[7]) - values[1] * (values[3] * values[8] - values[5] * values[6]) + values[2] * (values[3] * values[7] - values[4] * values[6]);
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        /* @__PURE__ */ jsxDEV2(Select, { label: "Matrix size", value: size, onChange: (value) => setV((current) => ({ ...current, size: value, entries: value === "2\xD72" ? "1, 2, 3, 4" : "1, 2, 3, 0, 1, 4, 5, 6, 0" })), options: ["2\xD72", "3\xD73"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 212,
          columnNumber: 46
        }, this),
        /* @__PURE__ */ jsxDEV2(Input, { label: `Enter ${n} entries row by row`, value: v.entries ?? (size === "2\xD72" ? "1, 2, 3, 4" : "1, 2, 3, 0, 1, 4, 5, 6, 0"), onChange: (value) => set("entries", value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 212,
          columnNumber: 256
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 212,
        columnNumber: 14
      }, this),
      result("Determinant", values.length < n ? "Enter all entries" : fmt(det), "Separate matrix entries with commas, in row order.")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 212,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "progression") {
    const mode = v.mode || "AP";
    const first = num("first", 2);
    const step = num("step", mode === "AP" ? 3 : 2);
    const terms = Math.max(1, Math.floor(num("terms", 8)));
    const last = mode === "AP" ? first + (terms - 1) * step : first * step ** (terms - 1);
    const sum = mode === "AP" ? terms * (first + last) / 2 : step === 1 ? first * terms : first * (step ** terms - 1) / (step - 1);
    return /* @__PURE__ */ jsxDEV2(Fragment, { children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "tool-form-grid", children: [
        /* @__PURE__ */ jsxDEV2(Select, { label: "Progression", value: mode, onChange: (value) => set("mode", value), options: ["AP", "GP"] }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 218,
          columnNumber: 46
        }, this),
        numberInput("first", "First term a", "2"),
        numberInput("step", mode === "AP" ? "Common difference d" : "Common ratio r", mode === "AP" ? "3" : "2"),
        numberInput("terms", "Number of terms n", "8")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 218,
        columnNumber: 14
      }, this),
      result("nth term", fmt(last), `Sum of ${terms} terms = ${fmt(sum)}.`)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 218,
      columnNumber: 12
    }, this);
  }
  if (tool.id === "periodic") return /* @__PURE__ */ jsxDEV(PeriodicExplorer, {}, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 666,
    columnNumber: 38
  }, this);
  if (tool.type === "reference" || tool.id === "periodic" || tool.id === "constants" || tool.id === "conics") {
    const constants = {
      "Speed of light, c": "2.99792458 \xD7 10\u2078 m\xB7s\u207B\xB9",
      "Planck constant, h": "6.62607015 \xD7 10\u207B\xB3\u2074 J\xB7s",
      "Elementary charge, e": "1.602176634 \xD7 10\u207B\xB9\u2079 C",
      "Avogadro constant, N\u2090": "6.02214076 \xD7 10\xB2\xB3 mol\u207B\xB9",
      "Gas constant, R": "8.314462618 J\xB7mol\u207B\xB9\xB7K\u207B\xB9",
      "Boltzmann constant, k\u1D2E": "1.380649 \xD7 10\u207B\xB2\xB3 J\xB7K\u207B\xB9",
      "Gravitational constant, G": "6.67430 \xD7 10\u207B\xB9\xB9 m\xB3\xB7kg\u207B\xB9\xB7s\u207B\xB2",
      "Standard gravity, g": "9.80665 m\xB7s\u207B\xB2"
    };
    const periodic = ["Atomic radius generally decreases across a period and increases down a group.", "First ionization enthalpy generally increases across a period and decreases down a group.", "Electronegativity generally increases across a period; fluorine is the most electronegative element.", "Electron affinity and the stability of half-filled or fully filled subshells can produce exceptions."];
    const conics = ["Circle: (x\u2212h)\xB2+(y\u2212k)\xB2=r\xB2", "Parabola: y\xB2=4ax or x\xB2=4ay", "Ellipse: x\xB2/a\xB2+y\xB2/b\xB2=1, with c\xB2=a\xB2\u2212b\xB2", "Hyperbola: x\xB2/a\xB2\u2212y\xB2/b\xB2=1, with c\xB2=a\xB2+b\xB2", "Eccentricity: circle 0, ellipse <1, parabola 1, hyperbola >1."];
    return /* @__PURE__ */ jsxDEV2("div", { className: "reference-sheet", children: tool.id === "constants" ? Object.entries(constants).map(([key, value]) => /* @__PURE__ */ jsxDEV2("div", { children: [
      /* @__PURE__ */ jsxDEV2("strong", { children: key }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 235,
        columnNumber: 97
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { children: value }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 235,
        columnNumber: 119
      }, this)
    ] }, key, true, {
      fileName: "<stdin>",
      lineNumber: 235,
      columnNumber: 82
    }, this)) : (tool.id === "periodic" ? periodic : tool.id === "conics" ? conics : [tool.formula, tool.detail]).map((line, index) => /* @__PURE__ */ jsxDEV2("div", { children: [
      /* @__PURE__ */ jsxDEV2("strong", { children: index === 0 ? tool.formula || "Key relation" : `Note ${index + 1}` }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 236,
        columnNumber: 145
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { children: line }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 236,
        columnNumber: 230
      }, this)
    ] }, index, true, {
      fileName: "<stdin>",
      lineNumber: 236,
      columnNumber: 128
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 234,
      columnNumber: 12
    }, this);
  }
  return /* @__PURE__ */ jsxDEV2("div", { className: "tool-result", children: [
    /* @__PURE__ */ jsxDEV2("span", { children: "Reference" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 239,
      columnNumber: 39
    }, this),
    /* @__PURE__ */ jsxDEV2("strong", { children: tool.formula || tool.tag }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 239,
      columnNumber: 61
    }, this),
    /* @__PURE__ */ jsxDEV2("small", { children: tool.detail || tool.description }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 239,
      columnNumber: 104
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 239,
    columnNumber: 10
  }, this);
}
function ToolModal({ tool, onClose }) {
  return /* @__PURE__ */ jsxDEV2("div", { className: "overlay", onMouseDown: (event) => {
    if (event.target === event.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxDEV2("section", { className: `modal tool-modal ${tool.id === "scientific" ? "scientific-modal" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": tool.name, children: [
    /* @__PURE__ */ jsxDEV2("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsxDEV2("div", { children: [
        /* @__PURE__ */ jsxDEV2("span", { className: "tool-modal-category", children: tool.category }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 244,
          columnNumber: 40
        }, this),
        /* @__PURE__ */ jsxDEV2("h2", { children: tool.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 244,
          columnNumber: 100
        }, this),
        /* @__PURE__ */ jsxDEV2("p", { children: tool.description }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 244,
          columnNumber: 120
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 244,
        columnNumber: 35
      }, this),
      /* @__PURE__ */ jsxDEV2("button", { className: "close-button", onClick: onClose, "aria-label": "Close tool", children: /* @__PURE__ */ jsxDEV2(X, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 244,
        columnNumber: 226
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 244,
        columnNumber: 151
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 244,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV2(tool.id === "scientific" ? DeviceCalculator : ToolCalculator, { tool, onClose }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 245,
      columnNumber: 5
    }, this),
    tool.id !== "scientific" && /* @__PURE__ */ jsxDEV2("div", { className: "tool-modal-footer", children: [
      /* @__PURE__ */ jsxDEV2("span", { children: [
        /* @__PURE__ */ jsxDEV2(Calculator, { size: 13 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 246,
          columnNumber: 46
        }, this),
        "Check units and sign conventions in your working."
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 246,
        columnNumber: 40
      }, this),
      /* @__PURE__ */ jsxDEV2("button", { className: "button", onClick: onClose, children: "Close" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 246,
        columnNumber: 126
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 246,
      columnNumber: 5
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 243,
    columnNumber: 117
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 243,
    columnNumber: 10
  }, this);
}
function StudyToolkit() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All Tools");
  const [selected, setSelected] = useState(null);
  const visible = useMemo(() => TOOL_CATALOG.filter((tool) => {
    const matchesCategory = filter === "All Tools" || tool.category === filter;
    const matchesSearch = `${tool.name} ${tool.category} ${tool.description} ${tool.tag} ${tool.formula || ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [filter, query]);
  return /* @__PURE__ */ jsxDEV2("section", { className: "toolkit-view", children: [
    /* @__PURE__ */ jsxDEV2("div", { className: "toolkit-heading", children: [
      /* @__PURE__ */ jsxDEV2("div", { children: [
        /* @__PURE__ */ jsxDEV2("p", { className: "eyebrow", children: [
          "STUDY TOOLKIT \xB7 ",
          TOOL_CATALOG.length,
          " TOOLS"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 260,
          columnNumber: 43
        }, this),
        /* @__PURE__ */ jsxDEV2("h1", { children: "Study Toolkit" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 260,
          columnNumber: 113
        }, this),
        /* @__PURE__ */ jsxDEV2("p", { children: "Calculators, converters, and reference sheets for focused problem solving." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 260,
          columnNumber: 135
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 260,
        columnNumber: 38
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { className: "toolkit-count", children: [
        /* @__PURE__ */ jsxDEV2(Sigma, { size: 14 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 260,
          columnNumber: 254
        }, this),
        TOOL_CATALOG.length,
        "+ tools"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 260,
        columnNumber: 222
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 260,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV2("label", { className: "toolkit-search", children: [
      /* @__PURE__ */ jsxDEV2(Search, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 261,
        columnNumber: 39
      }, this),
      /* @__PURE__ */ jsxDEV2("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Search tools, formulas, converters..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 261,
        columnNumber: 59
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 261,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV2("div", { className: "toolkit-filters", children: TOOL_FILTERS.map((category) => /* @__PURE__ */ jsxDEV2("button", { className: filter === category ? "active" : "", onClick: () => setFilter(category), children: category }, category, false, {
      fileName: "<stdin>",
      lineNumber: 262,
      columnNumber: 70
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 262,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV2("div", { className: "toolkit-results-label", children: [
      /* @__PURE__ */ jsxDEV2("span", { children: [
        visible.length,
        " tools"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 263,
        columnNumber: 44
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { children: filter === "All Tools" ? "All categories" : filter }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 263,
        columnNumber: 79
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 263,
      columnNumber: 5
    }, this),
    visible.length ? /* @__PURE__ */ jsxDEV2("div", { className: "toolkit-grid", children: visible.map((tool) => /* @__PURE__ */ jsxDEV2("button", { className: "tool-card", onClick: () => setSelected(tool), children: [
      /* @__PURE__ */ jsxDEV2("span", { className: "tool-card-icon", children: tool.category === "Chemistry Lab" ? /* @__PURE__ */ jsxDEV2(FlaskConical, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 265,
        columnNumber: 77
      }, this) : tool.category === "Converters" ? /* @__PURE__ */ jsxDEV2(ArrowLeftRight, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 265,
        columnNumber: 139
      }, this) : tool.category === "Physics Engines" ? /* @__PURE__ */ jsxDEV2(Gauge, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 265,
        columnNumber: 208
      }, this) : /* @__PURE__ */ jsxDEV2(Calculator, { size: 17 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 265,
        columnNumber: 230
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 265,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { className: "tool-card-category", children: tool.category }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV2("strong", { children: tool.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 66
      }, this),
      /* @__PURE__ */ jsxDEV2("small", { children: tool.description }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 94
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { className: "tool-card-tag", children: tool.tag }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 127
      }, this),
      /* @__PURE__ */ jsxDEV2("span", { className: "tool-card-arrow", children: /* @__PURE__ */ jsxDEV2(ChevronRight, { size: 15 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 210
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 266,
        columnNumber: 176
      }, this)
    ] }, tool.id, true, {
      fileName: "<stdin>",
      lineNumber: 264,
      columnNumber: 76
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 264,
      columnNumber: 23
    }, this) : /* @__PURE__ */ jsxDEV2("div", { className: "card empty-state", children: [
      /* @__PURE__ */ jsxDEV2("div", { className: "empty-icon", children: /* @__PURE__ */ jsxDEV2(Search, { size: 22 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 267,
        columnNumber: 87
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 267,
        columnNumber: 59
      }, this),
      /* @__PURE__ */ jsxDEV2("h3", { children: "No tools found." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 267,
        columnNumber: 113
      }, this),
      /* @__PURE__ */ jsxDEV2("p", { children: "Try another search or category." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 267,
        columnNumber: 137
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 267,
      columnNumber: 25
    }, this),
    selected && /* @__PURE__ */ jsxDEV2(ToolModal, { tool: selected, onClose: () => setSelected(null) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 268,
      columnNumber: 18
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 259,
    columnNumber: 10
  }, this);
}
export {
  TOOL_CATALOG,
  TOOL_FILTERS,
  StudyToolkit as default
};
