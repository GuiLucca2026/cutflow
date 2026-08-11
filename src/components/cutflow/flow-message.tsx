"use client";

import * as React from "react";
import { computeFlowContext, pickFlowMessage, readFlowHistory, recordFlowMessage } from "@/lib/flow";
import type { FlowWorkInput } from "@/lib/flow";
import { cn } from "@/lib/utils";

// Personalidade dinâmica do G2 FLOW (spec completa: motor local baseado
// em regras, sem IA/API externa) — o comentário curador vive nos módulos
// de src/lib/flow/*; este componente só liga tudo na tela.
//
// Mesmo cuidado de hidratação que greeting.tsx: o contexto (hora, dia,
// histórico anti-repetição) só existe de verdade no navegador — hora
// exata de quem está vendo a tela e o localStorage não existem no
// primeiro render do servidor. Por isso a frase começa em branco e só
// aparece depois do useEffect, sem gerar aviso de hydration mismatch.
export function FlowMessage({ work, className }: { work: FlowWorkInput; className?: string }) {
  const [text, setText] = React.useState<string | null>(null);

  // Assinatura estável do "estado do dia" recebido via props. Serve só
  // como dependência do efeito: se o conteúdo (contagens de vídeo/captação)
  // não mudou entre um render e outro, a string fica igual e o efeito NÃO
  // roda de novo — é isso que mantém a frase parada durante a sessão
  // (spec item 33), mesmo que o componente pai re-renderize por outro
  // motivo. Quando algo relevante muda de verdade (aprovação, entrega,
  // router.refresh() trazendo dado novo do servidor), a assinatura muda e
  // a mensagem é recalculada — o mais perto de "reagir a evento" que dá
  // pra fazer sem um barramento de eventos dedicado (ver nota em
  // context.ts sobre expansão futura).
  const workSignature = React.useMemo(() => JSON.stringify(work), [work]);

  React.useEffect(() => {
    function evaluate() {
      const ctx = computeFlowContext(work);
      const message = pickFlowMessage(ctx, readFlowHistory().map((h) => h.id));
      recordFlowMessage(message.id, message.category);
      setText(message.text);
      return ctx;
    }

    let last = evaluate();

    // A cada minuto, só recalcula de verdade se a faixa de horário ou o
    // dia mudaram (alguém deixou a aba aberta virando o período/a meia-
    // noite) — spec item 33: "pode atualizar quando passa pro outro
    // período do dia / muda o dia". Fora isso, fica parado.
    const id = setInterval(() => {
      const ctx = computeFlowContext(work);
      if (ctx.timeBand !== last.timeBand || ctx.dateKey !== last.dateKey) {
        last = evaluate();
      }
    }, 60_000);

    return () => clearInterval(id);
    // work entra via workSignature (string estável) de propósito — ver
    // comentário acima do useMemo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workSignature]);

  if (!text) return null;

  return (
    <p suppressHydrationWarning className={cn("cf-fade-in text-sm text-cf-text-dim mt-0.5", className)}>
      {text}
    </p>
  );
}
