"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Algo falhou ao carregar</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button variant="secondary" className="mt-6" onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
