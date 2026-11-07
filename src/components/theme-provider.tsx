"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema escuro como padrão; claro disponível pelo botão ou pela opção "Sistema". */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
