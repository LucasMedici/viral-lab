import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Esse item não existe ou foi excluído.</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">Voltar para as contas</ButtonLink>
    </div>
  );
}
