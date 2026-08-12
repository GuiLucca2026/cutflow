// Checklist padrão de todo vídeo — fonte única dos 11 passos e da carga
// (em horas) que cada um estipula. Antes vivia como duas listas de string
// soltas e duplicadas em app/actions.ts (createVideo e createVideosBulk);
// centralizado aqui porque agora a carga também precisa ser conhecida na
// hora de criar o checklist (ver comentário em CHECKLIST_STEPS abaixo) —
// duas cópias divergindo silenciosamente seria fácil de acontecer.
//
// A carga é "estipulada" no sentido de Deadline Lock (originalFinalDeadline
// em db/schema.ts): um valor travado no momento em que o item é criado,
// não recalculado depois se este arquivo mudar — ver a coluna
// estimated_load_hours em cutflow_checklist_items (fase11-carga-checklist.sql)
// e o uso em app/actions.ts. Isso é o que permite Analytics/Panorama
// somarem "quanto cada um produziu" de um jeito que não muda de valor
// retroativamente só porque alguém ajustou a estimativa de uma etapa.
export type ChecklistStep = {
  label: string;
  estimatedLoadHours: number;
};

export const CHECKLIST_STEPS: ChecklistStep[] = [
  { label: "Ingest dos arquivos", estimatedLoadHours: 0.5 },
  { label: "Organização", estimatedLoadHours: 0.5 },
  { label: "Montagem", estimatedLoadHours: 4 },
  { label: "Trilha sonora", estimatedLoadHours: 1 },
  { label: "Colorização", estimatedLoadHours: 1.5 },
  { label: "Sound design", estimatedLoadHours: 1 },
  { label: "Motion / grafismos", estimatedLoadHours: 2 },
  { label: "Legendas", estimatedLoadHours: 1 },
  { label: "Revisão", estimatedLoadHours: 1 },
  { label: "Exportação", estimatedLoadHours: 0.5 },
  { label: "Upload / envio", estimatedLoadHours: 0.5 },
];

// Só os labels, na ordem — é o que os dois pontos de criação de vídeo
// (createVideo, createVideosBulk em app/actions.ts) usavam antes como
// array de string puro.
export const DEFAULT_CHECKLIST_LABELS = CHECKLIST_STEPS.map((s) => s.label);

// Fallback pra qualquer item cujo label não bata com nenhum dos 11 acima
// (não deveria acontecer — não existe fluxo de item avulso/custom hoje —
// mas evita NaN se um dia existir ou se um dado antigo estiver sujo).
const FALLBACK_LOAD_HOURS = 1;

export function estimatedLoadHoursForLabel(label: string): number {
  return CHECKLIST_STEPS.find((s) => s.label === label)?.estimatedLoadHours ?? FALLBACK_LOAD_HOURS;
}
