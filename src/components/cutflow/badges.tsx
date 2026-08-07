import { Badge } from "@/components/ui/badge";
import { STATUS_META, PRIORITY_META, RISK_META, RiskLevel } from "@/lib/domain";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "#6B7280", bg: "#F1F2F4" };
  return (
    <Badge color={meta.color} bg={meta.bg} className={className}>
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.NORMAL;
  return (
    <Badge color={meta.color} bg={meta.bg} className={className}>
      {meta.label}
    </Badge>
  );
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const meta = RISK_META[risk];
  // 26 (~15% alpha) em vez de 1a (~10%) — no fundo claro um tom tão sutil
  // quase some; no escuro o mesmo valor "brilhava" por contraste.
  return (
    <Badge color={meta.color} bg={`${meta.color}26`} className={className}>
      <span>{meta.emoji}</span> {meta.label}
    </Badge>
  );
}
