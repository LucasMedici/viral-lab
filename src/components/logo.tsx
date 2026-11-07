import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo oficial (docs/BRAND.md, arquivos em public/brand/).
 * A troca claro/escuro é feita por CSS (classe .dark no <html>), sem flash na hidratação.
 * Regras: não recolorir, esticar ou aplicar sombra; altura mínima de 24px no horizontal.
 */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex", className)}>
      <Image
        src="/brand/logo-dark.svg"
        alt="ViralLab"
        width={403}
        height={120}
        priority={priority}
        unoptimized
        className="hidden h-7 w-auto dark:block"
      />
      <Image
        src="/brand/logo-light.svg"
        alt="ViralLab"
        width={404}
        height={120}
        priority={priority}
        unoptimized
        className="h-7 w-auto dark:hidden"
      />
    </span>
  );
}

/**
 * Versão para telas de destaque (login, estados vazios): vertical no tema escuro.
 * Não há versão vertical clara, então no tema claro usa o horizontal claro, maior.
 */
export function LogoHero({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      <Image
        src="/brand/logo-vertical-dark.svg"
        alt="ViralLab"
        width={213}
        height={166}
        priority
        unoptimized
        className="hidden h-24 w-auto dark:block"
      />
      <Image
        src="/brand/logo-light.svg"
        alt="ViralLab"
        width={404}
        height={120}
        priority
        unoptimized
        className="h-12 w-auto dark:hidden"
      />
    </span>
  );
}
