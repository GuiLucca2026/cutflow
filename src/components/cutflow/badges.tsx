import { Badge } from "@/components/ui/badge";
import { STATUS_META, PRIORITY_META, RISK_META, RiskLevel } from "@/lib/domain";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "#9A9C9F", bg: "#232323" };
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
  return (
    <Badge color={meta.color} bg={`${meta.color}1a`} className={className}>
      <span>{meta.emoji}</span> {meta.label}
    </Badge>
  );
}
