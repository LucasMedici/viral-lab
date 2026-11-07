export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 rounded-[var(--radius-md)] bg-surface-muted" />
      <div className="mt-3 h-4 w-72 rounded-[var(--radius-md)] bg-surface-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-[var(--radius-lg)] bg-surface-muted" />
        <div className="h-36 rounded-[var(--radius-lg)] bg-surface-muted" />
      </div>
    </div>
  );
}
