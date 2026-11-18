import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-h1 font-bold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
