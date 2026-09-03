export default function AppLoading() {
  return (
    <div className="w-full space-y-7 pb-16" aria-label="Carregando conteúdo" aria-busy="true">
      <div className="border-b border-cf-border pb-7 pt-[18px]">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-12 w-[min(440px,80%)]" />
        <Skeleton className="mt-4 h-4 w-[min(560px,92%)]" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="min-h-[118px] rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-4 rounded-[3px]" />
              <Skeleton className="h-10 w-16" />
            </div>
            <Skeleton className="mt-6 h-3 w-24" />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-cf-border pb-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="min-h-[180px] overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface">
              <Skeleton className="h-16 w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-7 h-3 w-full" />
                <Skeleton className="mt-3 h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`cf-skeleton rounded-[7px] ${className ?? ""}`} />;
}
