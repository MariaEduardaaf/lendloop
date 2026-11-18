import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

/** Shared button look. Always a real <button>; type defaults to "button" so forms only submit on purpose. */
export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Same look for a Next <Link>, so a navigation action matches the buttons. */
export const linkButtonClass = `inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium ${VARIANTS.primary}`;
