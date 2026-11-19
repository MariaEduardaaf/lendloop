import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "raised";
type Size = "md" | "lg";

// Solid ink is the one primary per decision; soft fill is the quiet secondary; the outline is
// the secondary on the mustard card, where a soft fill would vanish.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-strong",
  secondary: "bg-soft text-ink hover:bg-soft-strong",
  outline: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_rgb(28_27_24/0.35)] hover:bg-white/30",
  // A light pill lifted off the cream ground, for a quiet action outside a card (the landing top bar).
  raised: "bg-surface text-ink shadow-soft hover:bg-soft",
};

const SIZES: Record<Size, string> = {
  md: "min-h-10 px-[18px] text-[0.9375rem]",
  lg: "min-h-[3.25rem] px-7 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-[background-color,box-shadow,color] duration-150 ease-out";

type Props = ComponentProps<"button"> & { variant?: Variant; size?: Size };

/** Shared button look. Always a real <button>; type defaults to "button" so forms only submit on purpose. */
export function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${BASE} disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Same look for a Next <Link>, so a navigation action matches the buttons. */
export const buttonClass = (variant: Variant = "primary", size: Size = "md") => `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
export const linkButtonClass = buttonClass();
export const quietLinkButtonClass = buttonClass("secondary");
