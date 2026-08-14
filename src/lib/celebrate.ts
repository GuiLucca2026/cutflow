"use client";

import { toast } from "sonner";
import { STATUS_META } from "@/lib/domain";

// Toast de status — pedido do usuário pra "gamificar" o progresso pessoal
// (ver personal-progress.tsx): o momento de marcar ENTREGUE ganha uma
// mensagem diferente das outras trocas de status, puxada de um banco de
// frases pra não repetir sempre a mesma. Usado nos 3 lugares que trocam
// status de vídeo pelo cliente (Kanban, menu de contexto, ficha do vídeo)
// pra não duplicar a lista de frases em cada um.
const DELIVERY_MESSAGES = [
  "Entregue! Um a menos na fila.",
  "Fechou. Bola com o cliente agora.",
  "Na conta — próximo da fila.",
  "Entregue com estilo.",
  "Mais um concluído este mês.",
  "Feito. Respira e segue pro próximo.",
];

export function toastStatusChange(videoName: string, newStatus: string, oldStatus?: string) {
  if (newStatus === "ENTREGUE" && oldStatus !== "ENTREGUE") {
    const msg = DELIVERY_MESSAGES[Math.floor(Math.random() * DELIVERY_MESSAGES.length)];
    toast.success(`🎉 ${videoName}`, { description: msg, duration: 4500 });
    return;
  }
  toast.success(`${videoName} → ${STATUS_META[newStatus]?.label ?? newStatus}`);
}
