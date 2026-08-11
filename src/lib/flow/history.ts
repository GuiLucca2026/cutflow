// Histórico local de mensagens exibidas (spec seção 25) — evita repetir a
// mesma frase toda hora. Guardado no localStorage do navegador (é
// personalidade da INTERFACE, não dado de produção — não precisa ir pro
// Supabase nem ser compartilhado entre pessoas).
import type { FlowCategory, StoredFlowHistoryEntry } from "./types";

const STORAGE_KEY = "g2flow.flowMessageHistory";
// Últimas N mensagens ficam "queimadas" (não podem repetir). 20 é grande
// o bastante pra dar variedade real com um banco de centenas de frases,
// sem impedir repetição depois de um tempo razoável de uso.
const HISTORY_SIZE = 20;

export function readFlowHistory(): StoredFlowHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // localStorage corrompido/bloqueado (modo privado, por exemplo) —
    // degrada pra "sem histórico" em vez de quebrar a saudação.
    return [];
  }
}

export function recordFlowMessage(id: string, category: FlowCategory) {
  if (typeof window === "undefined") return;
  try {
    const history = readFlowHistory();
    const entry: StoredFlowHistoryEntry = { id, category, timestamp: Date.now() };
    const next = [entry, ...history.filter((h) => h.id !== id)].slice(0, HISTORY_SIZE);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Sem espaço/sem permissão de localStorage — não é motivo pra quebrar
    // a tela, só significa que a anti-repetição fica desligada dessa vez.
  }
}

export function recentFlowMessageIds(): string[] {
  return readFlowHistory().map((h) => h.id);
}
