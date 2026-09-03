import { cn } from "@/lib/utils";

export function EditorialMasthead({
  eyebrow,
  title,
  accentTitle,
  description,
  metric,
  metricLabel,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  accentTitle?: string;
  description?: string;
  metric?: string | number;
  metricLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("cf-masthead", className)}>
      <div className="cf-masthead__main">
        <div className="cf-micro text-cf-text-dim">{eyebrow}</div>
        <h1 className="cf-masthead__title">
          <span>{title}</span>
          {accentTitle ? <span className="font-editorial font-normal">{accentTitle}</span> : null}
        </h1>
        {description ? <p className="cf-masthead__description">{description}</p> : null}
      </div>

      {(typeof metric !== "undefined" || actions) && (
        <div className="cf-masthead__aside">
          {typeof metric !== "undefined" ? (
            <div className="text-right">
              <div className="font-editorial text-[64px] leading-[0.74] tracking-[-0.045em] md:text-[78px]">{metric}</div>
              {metricLabel ? <div className="cf-micro mt-3 text-cf-text-dim">{metricLabel}</div> : null}
            </div>
          ) : null}
          {actions ? <div className="cf-masthead__actions">{actions}</div> : null}
        </div>
      )}
    </header>
  );
}
