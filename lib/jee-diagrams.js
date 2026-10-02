// Local diagram assets can be added to public/diagrams/ as they become available.
// Keep keys stable: the assistant prompt and custom-tag renderer both use them.
export const JEE_DIAGRAMS = Object.freeze({
  // Physics
  "projectile-motion": "/diagrams/projectile_motion.png.jpg",
  "free-body-diagram": "/diagrams/free_body_diagram.png.jpg",
  "inclined-plane": "/diagrams/inclined_plane.png.jpg",
  "electric-field-lines": "/diagrams/electric_field_lines.png.jpg",
  "electric-flux": "/diagrams/electric_flux.png.jpg",
  "magnetic-field-wire": "/diagrams/magnetic_field_wire.png.jpg",
  "ray-optics-lens": "/diagrams/ray_optics_lens.png.jpg",
  "young-double-slit": "/diagrams/young_double_slit.png.jpg",
  // Chemistry
  "chem-benzene": "/diagrams/chem_benzene.png.jpg",
  "chem-electrolytic-cell": "/diagrams/chem_electrolytic_cell.png.jpg",
  "chem-galvanic-cell": "/diagrams/chem_galvanic_cell.png.jpg",
  "chem-hydrogen-bonding": "/diagrams/chem_hydrogen_bonding.png.jpg",
  "chem-orbital-hybridization": "/diagrams/chem_orbital_hybridization.png.jpg",
  "chem-crystal-lattice": "/diagrams/chem_crystal_lattice.png.jpg",
  "chem-periodic-trends": "/diagrams/chem_periodic_trends.png.jpg",
  // Mathematics
  "area-under-curve": "/diagrams/area_under_curve.png.jpg",
  "unit-circle": "/diagrams/unit_circle.png.jpg",
  "conic-sections": "/diagrams/conic_sections.png.jpg",
  "vector-projection": "/diagrams/vector_projection.png.jpg",
  "three-dimensional-coordinate-geometry": "/diagrams/three_dimensional_coordinate_geometry.png.jpg"
});

export const JEE_DIAGRAM_KEYS = Object.freeze(Object.keys(JEE_DIAGRAMS));

export function findLocalDiagramKey(request = "") {
  const normalized = String(request).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return JEE_DIAGRAM_KEYS.find((key) => {
    const topic = key.replace(/^chem-/, "").replace(/-/g, " ");
    return normalized === topic || normalized.includes(` ${topic} `) || normalized.startsWith(`${topic} `) || normalized.endsWith(` ${topic}`);
  }) || null;
}
