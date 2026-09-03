import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  eyebrow = "G2 FLOW / WORKSPACE",
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-5 border-b border-cf-border pb-6 pt-2", className)}>
      <div>
        <div className="cf-micro text-cf-text-dim">{eyebrow}</div>
        <h1 className="mt-3 text-[48px] font-semibold leading-[0.9] tracking-[-0.052em] md:text-[62px]">
          {title}<span className="font-editorial font-normal">.</span>
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cf-text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  subtitle,
  count,
  tone,
  className,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  tone?: "danger";
  className?: string;
}) {
  return (
    <div className={cn("mb-3 border-b border-cf-border pb-2", className)}>
      <div className="flex items-baseline gap-2">
        <h2 className={cn("text-[24px] font-semibold tracking-[-0.03em]", tone === "danger" && "text-red-600")}>{title}</h2>
        {typeof count === "number" && <span className="font-editorial text-xl text-cf-text-dim">{count}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-cf-text-dim">{subtitle}</p>}
    </div>
  );
}
