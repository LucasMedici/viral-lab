import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Variantes do docs/BRAND.md:
 * - primary: fundo Ácido, texto Tinta, peso 600. Apenas UM por tela.
 * - secondary: fundo surface-2, texto, borda.
 * Polimento: escala 0.96 ao pressionar (desligável com `static`) e padding
 * óptico (2px a menos) no lado do ícone quando o botão começa com um ícone.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold transition-[color,background-color,border-color,scale] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const pressable = "active:scale-[0.96] motion-reduce:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/85",
  secondary: "border border-border bg-surface-2 text-text hover:border-muted/50",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-danger text-background hover:bg-danger/90",
  "danger-ghost": "text-danger hover:bg-danger/10",
};

// Lado do ícone com 2px a menos (alinhamento óptico).
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-meta has-[>svg:first-child,>[data-icon]:first-child]:pl-2.5",
  md: "h-10 px-4 text-body has-[>svg:first-child,>[data-icon]:first-child]:pl-3.5",
  icon: "size-10",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string, isStatic = false) {
  return cn(base, !isStatic && pressable, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; static?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", static: isStatic, ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className, isStatic)} {...props} />;
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size; static?: boolean };

export function ButtonLink({ variant = "secondary", size = "md", className, static: isStatic, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className, isStatic)} {...props} />;
}
