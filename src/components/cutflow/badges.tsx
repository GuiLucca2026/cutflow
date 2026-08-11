import { Badge } from "@/components/ui/badge";
import { STATUS_META, PRIORITY_META, RISK_META, RiskLevel, CLIENT_WAIT_META, type ClientWait } from "@/lib/domain";

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
  // Chip sólido (fundo colorido cheio, texto branco) — igual aos chips
  // ALTA/MÉDIA/BAIXA da referência, mais firme que o resto dos badges
  // (que ficam com tom suave) já que prioridade é a informação que mais
  // precisa saltar aos olhos num card.
  return (
    <Badge color={meta.color} solid className={className}>
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

// Selo da fase de espera do cliente — ocupa o lugar do RiskBadge quando a
// bola não está com a gente (ver computeClientWait em lib/domain.ts).
// Sólido de propósito: os dois casos que chegam aqui pedem ação de alguém,
// então precisam pesar mais que o selo de status ao lado.
export function ClientWaitBadge({ wait, className }: { wait: NonNullable<ClientWait>; className?: string }) {
  const meta = CLIENT_WAIT_META[wait.kind];
  return (
    <Badge color={meta.color} solid className={className}>
      {meta.label}
      {/* "dias" por extenso, não "3d": o Badge é uppercase, então "3d"
          virava "3D" — que numa ferramenta de vídeo lê como animação 3D. */}
      {wait.kind === "COBRAR_FEEDBACK" && ` · ${wait.days} ${wait.days === 1 ? "dia" : "dias"}`}
    </Badge>
  );
}
