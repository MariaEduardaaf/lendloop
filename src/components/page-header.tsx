import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
      <div>
        <h1 className="text-h1 font-bold tracking-[-0.03em] text-balance sm:text-display">{title}</h1>
        {description && <p className="mt-3 max-w-prose text-lg text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
