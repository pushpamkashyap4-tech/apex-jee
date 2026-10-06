import React from "react";

export default function ModulePlaceholder({ icon: Icon, title, description, countLabel }) {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
        {Icon && <Icon size={23} aria-hidden="true" />}
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Part 1 · foundation</p>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      {countLabel && <p className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{countLabel}</p>}
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        This module is intentionally a placeholder. Its feature UI and behavior are reserved for a later build part.
      </div>
    </section>
  );
}
