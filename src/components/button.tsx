import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "inverse";

// Navy fill is the one solid action per decision; everything else is outlined.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-strong",
  secondary: "border border-navy bg-plate text-navy hover:bg-tile",
  // The solid action on a navy surface (the landing bar and closing band).
  inverse: "bg-plate text-navy hover:bg-tile",
};

const BASE =
  "inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors";

type Props = ComponentProps<"button"> & { variant?: Variant };

/** Shared button look. Always a real <button>; type defaults to "button" so forms only submit on purpose. */
export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${BASE} disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Same look for a Next <Link>, so a navigation action matches the buttons. */
export const linkButtonClass = `${BASE} ${VARIANTS.primary}`;
export const inverseLinkButtonClass = `${BASE} ${VARIANTS.inverse}`;
