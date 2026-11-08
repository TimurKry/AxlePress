import type { ReactNode } from "react";

export function SectionHeading({ id, icon, title, step }: { id: string; icon: ReactNode; title: string; step?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-surface-3 text-accent [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex flex-col">
        {step && <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{step}</span>}
        <h2 id={id} className="text-lg font-semibold tracking-tight text-text">
          {title}
        </h2>
      </div>
    </div>
  );
}
