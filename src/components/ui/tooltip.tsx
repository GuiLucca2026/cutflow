"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipProvider = TooltipPrimitive.Provider;

// Escuro sólido de propósito, ao contrário do Popover (que segue o vidro
// líquido claro/translúcido do resto da interface) — um tooltip só existe
// por 1-2 segundos em cima de qualquer coisa (card colorido, badge,
// gráfico), então precisa de contraste garantido em vez de combinar com o
// fundo. É o padrão mais comum de tooltip por um motivo: sempre legível,
// não importa o que está embaixo.
function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-64 rounded-md bg-cf-black px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {props.children}
        <TooltipPrimitive.Arrow className="fill-cf-black" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

// Uso direto (Tooltip/TooltipTrigger/TooltipContent) pra quem precisa de
// controle fino. Pro caso comum — "essa coisa aqui precisa de uma frase
// explicando o que é" — usa o Hint abaixo, que é uma linha só no call site.
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

// Atalho pro caso mais comum do app inteiro: "passa o mouse em cima e
// aparece o que é aquilo" (o pedido original que motivou este arquivo).
// `text` vazio/undefined faz o Hint virar passthrough (não embrulha em
// tooltip nenhum) — assim dá pra usar Hint em cima de badges cujo texto
// vem de um mapa que pode ou não ter explicação preenchida, sem precisar
// de um if no call site toda vez.
export function Hint({
  text,
  children,
  side = "top",
}: {
  text?: string | null;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  if (!text) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{text}</TooltipContent>
    </Tooltip>
  );
}
