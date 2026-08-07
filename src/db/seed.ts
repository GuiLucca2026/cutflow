import { db, sql as pgClient } from "./index";
import {
  users,
  clients,
  projects,
  videos,
  videoVersions,
  revisions,
  checklistItems,
  comments,
  activityLogs,
  projectLinks,
  workloadEntries,
  notifications,
  savedViews,
  STATUS_PROGRESS_WEIGHT,
} from "./schema";
import { addDays, addHours, format, subDays } from "date-fns";

// Deterministic-ish but varied demo data generator per spec section 57.
// 5 clients, 8 projects, ~30 videos, 4 team members, statuses spread across
// the whole pipeline including overdue items and clients waiting on feedback.

function iso(d: Date) {
  return d.toISOString();
}
function dstr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

const NOW = new Date();

async function main() {
  console.log("Resetting database…");
  // Deleted in FK-safe order (children before parents). Plain Drizzle
  // deletes, not raw SQL — keeps this dialect-agnostic and correctly
  // scoped to the "cutflow" Postgres schema regardless of table order.
  await db.delete(comments);
  await db.delete(checklistItems);
  await db.delete(revisions);
  await db.delete(videoVersions);
  await db.delete(activityLogs);
  await db.delete(workloadEntries);
  await db.delete(notifications);
  await db.delete(savedViews);
  await db.delete(projectLinks);
  await db.delete(videos);
  await db.delete(projects);
  await db.delete(clients);
  await db.delete(users);

  console.log("Seeding users…");
  const team = [
    { name: "Gui Lucca", email: "gui@cutflow.app", role: "ADMIN" as const, avatarColor: "#C6FF00", dailyCapacityHours: 8 },
    { name: "João Ramos", email: "joao@cutflow.app", role: "EDITOR" as const, avatarColor: "#8B5CF6", dailyCapacityHours: 8 },
    { name: "Maria Fonseca", email: "maria@cutflow.app", role: "EDITOR" as const, avatarColor: "#22D3EE", dailyCapacityHours: 8 },
    { name: "Pedro Alves", email: "pedro@cutflow.app", role: "PRODUTOR" as const, avatarColor: "#F97316", dailyCapacityHours: 6 },
  ];
  const teamRows = team.map((t) => ({ ...t, id: crypto.randomUUID() }));
  await db.insert(users).values(teamRows);
  const [gui, joao, maria, pedro] = teamRows;

  console.log("Seeding clients…");
  const clientDefs = [
    { name: "Vortex Sportwear", tradeName: "Vortex", company: "Vortex Indústria Têxtil e Esportiva Ltda", contactName: "Renata Souza", email: "renata@vortex.com", whatsapp: "+55 11 98888-1111", color: "#C6FF00" },
    { name: "Construtora Horizonte", tradeName: "Horizonte", company: "Horizonte Engenharia e Construções S.A.", contactName: "Marcelo Diniz", email: "marcelo@horizonte.com.br", whatsapp: "+55 11 97777-2222", color: "#38BDF8" },
    { name: "Têxtil Nova Lã", tradeName: "Nova Lã", company: "Nova Lã Indústria Têxtil", contactName: "Camila Prado", email: "camila@novala.com.br", whatsapp: "+55 11 96666-3333", color: "#F472B6" },
    { name: "Corrida Amanhecer", tradeName: "Amanhecer Run", company: "Amanhecer Eventos Esportivos", contactName: "Bruno Castro", email: "bruno@amanhecerrun.com", whatsapp: "+55 11 95555-4444", color: "#FB923C" },
    { name: "Sabor de Raiz", tradeName: "Sabor de Raiz", company: "Sabor de Raiz Gastronomia Ltda", contactName: "Isabela Nunes", email: "isabela@sabderaiz.com.br", whatsapp: "+55 11 94444-5555", color: "#A78BFA" },
  ];
  const clientRows = clientDefs.map((c) => ({ ...c, id: crypto.randomUUID() }));
  await db.insert(clients).values(clientRows);
  const [vortex, horizonte, novala, amanhecer, saborderaiz] = clientRows;

  console.log("Seeding projects + videos…");

  type VideoSeed = {
    name: string;
    format: string;
    aspectRatio: string;
    status: string;
    priority: string;
    editor: typeof gui;
    estimatedHours: number;
    actualHours: number;
    revisionCount: number;
    finalDeadlineOffsetDays: number; // relative to NOW
    internalOffsetDays: number;
    startedDaysAgo?: number;
  };

  let projActivitySeq = 0;
  const allProjects: { id: string }[] = [];
  const allVideos: { id: string; projectId: string }[] = [];

  async function createProject(opts: {
    client: (typeof clientRows)[number];
    name: string;
    type: string;
    priority: string;
    producer: typeof gui;
    leadEditor: typeof gui;
    captureOffset: number;
    startOffset: number;
    deadlineOffset: number;
    originalDeadlineOffset?: number;
    status: string;
    budget: number;
    drive?: string;
    frameio?: string;
    videosSeed: VideoSeed[];
  }) {
    const projectId = crypto.randomUUID();
    const deadline = addDays(NOW, opts.deadlineOffset);
    const originalDeadline = addDays(NOW, opts.originalDeadlineOffset ?? opts.deadlineOffset);

    await db.insert(projects)
      .values({
        id: projectId,
        clientId: opts.client.id,
        name: opts.name,
        description: `Projeto ${opts.type.toLowerCase()} para ${opts.client.tradeName}.`,
        type: opts.type,
        captureDate: dstr(addDays(NOW, opts.captureOffset)),
        startDate: dstr(addDays(NOW, opts.startOffset)),
        deadline: iso(deadline),
        originalDeadline: iso(originalDeadline),
        deadlineChangeReason:
          opts.originalDeadlineOffset && opts.originalDeadlineOffset !== opts.deadlineOffset
            ? "Cliente alterou o briefing e pediu cenas adicionais."
            : null,
        producerId: opts.producer.id,
        leadEditorId: opts.leadEditor.id,
        priority: opts.priority,
        status: opts.status,
        driveUrl: opts.drive ?? "https://drive.google.com/drive/folders/demo",
        frameioUrl: opts.frameio ?? "https://app.frame.io/projects/demo",
        budget: opts.budget,
      })
      ;

    await db.insert(projectLinks)
      .values([
        { id: crypto.randomUUID(), projectId, category: "FOOTAGE", label: "Footage bruto", url: "https://drive.google.com/drive/folders/footage-demo" },
        { id: crypto.randomUUID(), projectId, category: "EDICAO", label: "Frame.io — Revisão", url: opts.frameio ?? "https://app.frame.io/projects/demo" },
        { id: crypto.randomUUID(), projectId, category: "ENTREGA", label: "Entrega final", url: "https://drive.google.com/drive/folders/entrega-demo" },
        { id: crypto.randomUUID(), projectId, category: "REFERENCIA", label: "Referências (Pinterest)", url: "https://pinterest.com/demo/referencias" },
      ])
      ;

    await db.insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        entityType: "PROJECT",
        entityId: projectId,
        userId: opts.producer.id,
        action: "Projeto criado",
        detail: `${opts.producer.name} criou o projeto "${opts.name}".`,
        createdAt: iso(subDays(deadline, 20 + (projActivitySeq++ % 5))),
      })
      ;

    allProjects.push({ id: projectId });

    for (const v of opts.videosSeed) {
      const videoId = crypto.randomUUID();
      const finalDeadline = addDays(NOW, v.finalDeadlineOffsetDays);
      const internalDeadline = addDays(NOW, v.internalOffsetDays);
      const clientDeadline = finalDeadline;
      const reviewDeadline = addDays(internalDeadline, 1);
      const plannedStart = v.startedDaysAgo ? subDays(NOW, v.startedDaysAgo) : addDays(internalDeadline, -2);

      await db.insert(videos)
        .values({
          id: videoId,
          projectId,
          name: v.name,
          format: v.format,
          aspectRatio: v.aspectRatio,
          resolution: v.aspectRatio === "9:16" ? "1080x1920" : "1920x1080",
          durationEstimateSec: 30 + Math.floor(Math.random() * 90),
          editorId: v.editor.id,
          approverId: opts.producer.id,
          plannedStartDate: dstr(plannedStart),
          internalDeadline: iso(internalDeadline),
          reviewDeadline: iso(reviewDeadline),
          clientDeadline: iso(clientDeadline),
          finalDeadline: iso(finalDeadline),
          originalFinalDeadline: iso(finalDeadline),
          priority: v.priority,
          complexity: v.estimatedHours > 8 ? "COMPLEXA" : v.estimatedHours > 4 ? "MEDIA" : "SIMPLES",
          estimatedHours: v.estimatedHours,
          actualHours: v.actualHours,
          status: v.status,
          revisionCount: v.revisionCount,
          currentVersion: v.revisionCount > 0 ? `V${v.revisionCount}` : v.status === "BACKLOG" ? "—" : "V1",
          fileUrl: "https://drive.google.com/file/demo",
          frameioUrl: opts.frameio ?? "https://app.frame.io/projects/demo",
          driveUrl: opts.drive ?? "https://drive.google.com/drive/folders/demo",
        })
        ;

      allVideos.push({ id: videoId, projectId });

      // Checklist
      const checklistLabels = [
        "Ingest dos arquivos",
        "Organização",
        "Montagem",
        "Trilha sonora",
        "Colorização",
        "Sound design",
        "Motion / grafismos",
        "Legendas",
        "Revisão",
        "Exportação",
        "Upload / envio",
      ];
      const doneCount = Math.round(
        (STATUS_PROGRESS_WEIGHT[v.status] / 100) * checklistLabels.length
      );
      await db.insert(checklistItems)
        .values(
          checklistLabels.map((label, i) => ({
            id: crypto.randomUUID(),
            videoId,
            label,
            done: i < doneCount,
            order: i,
          }))
        )
        ;

      // Versions
      if (v.revisionCount > 0 || !["BACKLOG", "AGUARDANDO_MATERIAL", "PRONTO_PARA_EDITAR"].includes(v.status)) {
        const versionsToCreate = Math.max(1, v.revisionCount);
        for (let i = 1; i <= versionsToCreate; i++) {
          await db.insert(videoVersions)
            .values({
              id: crypto.randomUUID(),
              videoId,
              label: `V${i}`,
              fileUrl: "https://app.frame.io/reviews/demo",
              sentAt: iso(subDays(NOW, versionsToCreate - i + 1)),
              sentById: v.editor.id,
              notes: i === 1 ? "Primeiro corte enviado para revisão." : `Ajustes da rodada ${i - 1} aplicados.`,
            })
            ;
        }
      }

      // Revisions/alterations for videos currently in an alteration loop
      if (["ALTERACAO_SOLICITADA", "EM_ALTERACAO", "AGUARDANDO_FEEDBACK", "AGUARDANDO_APROVACAO"].includes(v.status)) {
        await db.insert(revisions)
          .values({
            id: crypto.randomUUID(),
            videoId,
            number: Math.max(1, v.revisionCount),
            type: "CLIENTE",
            description: [
              "Trocar a trilha sonora e remover a cena aos 00:34.",
              "Ajustar cor — está muito saturado nas cenas externas.",
              "Cortar 5 segundos do início, está lento.",
              "Adicionar logo no canto inferior direito nos últimos 3s.",
            ][Math.floor(Math.random() * 4)],
            requestedById: null,
            assignedToId: v.editor.id,
            dueAt: iso(addHours(NOW, 6 + Math.floor(Math.random() * 40))),
            versionLabel: `V${Math.max(1, v.revisionCount)}`,
            status: v.status === "EM_ALTERACAO" ? "EM_ANDAMENTO" : "ABERTA",
          })
          ;
      }

      // Comments
      if (!["BACKLOG", "AGUARDANDO_MATERIAL"].includes(v.status)) {
        await db.insert(comments)
          .values([
            {
              id: crypto.randomUUID(),
              videoId,
              authorId: v.editor.id,
              body: "Primeiro corte pronto, já mandei pra revisão interna.",
              createdAt: iso(subDays(NOW, 3)),
            },
            ...(["AGUARDANDO_FEEDBACK", "ALTERACAO_SOLICITADA", "EM_ALTERACAO", "APROVADO", "ENTREGUE"].includes(v.status)
              ? [
                  {
                    id: crypto.randomUUID(),
                    videoId,
                    authorId: null,
                    authorName: `${opts.client.contactName} (cliente)`,
                    body: v.status === "APROVADO" || v.status === "ENTREGUE" ? "Ficou ótimo, aprovado!" : "Adorei, só uns ajustes pequenos.",
                    createdAt: iso(subDays(NOW, 1)),
                  },
                ]
              : []),
          ])
          ;
      }

      // Activity log
      await db.insert(activityLogs)
        .values({
          id: crypto.randomUUID(),
          entityType: "VIDEO",
          entityId: videoId,
          userId: v.editor.id,
          action: "Status atualizado",
          detail: `Vídeo movido para ${v.status.replaceAll("_", " ")}.`,
          createdAt: iso(subDays(NOW, 1)),
        })
        ;

      // Workload entries (spread estimated hours over the last few days for
      // in-progress items, and over the next few days for upcoming ones)
      if (["EDITANDO", "CORRECAO_INTERNA", "EM_ALTERACAO"].includes(v.status)) {
        const hoursLeft = Math.max(1, v.estimatedHours - v.actualHours);
        const chunks = Math.min(3, Math.ceil(hoursLeft / 4));
        for (let i = 0; i < chunks; i++) {
          await db.insert(workloadEntries)
            .values({
              id: crypto.randomUUID(),
              editorId: v.editor.id,
              videoId,
              date: dstr(addDays(NOW, i)),
              hours: Math.min(4, hoursLeft - i * 4 > 0 ? hoursLeft - i * 4 : 2),
            })
            ;
        }
      }
    }
  }

  // ---- Client: Vortex Sportwear — Campanha Running de Verão -------------
  await createProject({
    client: vortex,
    name: "Campanha Running Verão 2026",
    type: "Publicidade",
    priority: "URGENTE",
    producer: pedro,
    leadEditor: joao,
    captureOffset: -10,
    startOffset: -8,
    deadlineOffset: 2,
    originalDeadlineOffset: -1,
    status: "EM_ANDAMENTO",
    budget: 38000,
    videosSeed: [
      { name: "Fashion Film", format: "Institucional", aspectRatio: "16:9", status: "EM_ALTERACAO", priority: "URGENTE", editor: joao, estimatedHours: 14, actualHours: 9, revisionCount: 2, finalDeadlineOffsetDays: 2, internalOffsetDays: 1, startedDaysAgo: 6 },
      { name: "Reel 01", format: "Reel", aspectRatio: "9:16", status: "AGUARDANDO_FEEDBACK", priority: "ALTA", editor: joao, estimatedHours: 4, actualHours: 4, revisionCount: 1, finalDeadlineOffsetDays: 3, internalOffsetDays: 1, startedDaysAgo: 4 },
      { name: "Reel 02", format: "Reel", aspectRatio: "9:16", status: "EDITANDO", priority: "ALTA", editor: maria, estimatedHours: 4, actualHours: 1.5, revisionCount: 0, finalDeadlineOffsetDays: 4, internalOffsetDays: 2, startedDaysAgo: 1 },
      { name: "Reel 03", format: "Reel", aspectRatio: "9:16", status: "PRONTO_PARA_EDITAR", priority: "NORMAL", editor: maria, estimatedHours: 3, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 5, internalOffsetDays: 3 },
      { name: "Making Of", format: "Aftermovie", aspectRatio: "16:9", status: "BACKLOG", priority: "NORMAL", editor: joao, estimatedHours: 6, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 7, internalOffsetDays: 5 },
      { name: "Teaser", format: "Teaser", aspectRatio: "9:16", status: "ENTREGUE", priority: "ALTA", editor: joao, estimatedHours: 2, actualHours: 2, revisionCount: 1, finalDeadlineOffsetDays: -3, internalOffsetDays: -5, startedDaysAgo: 10 },
      { name: "Stories", format: "Story", aspectRatio: "9:16", status: "APROVADO", priority: "NORMAL", editor: maria, estimatedHours: 2, actualHours: 2, revisionCount: 1, finalDeadlineOffsetDays: 1, internalOffsetDays: -1, startedDaysAgo: 5 },
    ],
  });

  // ---- Client: Construtora Horizonte — Institucional 2026 ----------------
  await createProject({
    client: horizonte,
    name: "Institucional Horizonte 2026",
    type: "Institucional",
    priority: "NORMAL",
    producer: pedro,
    leadEditor: maria,
    captureOffset: -20,
    startOffset: -15,
    deadlineOffset: 6,
    status: "EM_ANDAMENTO",
    budget: 22000,
    videosSeed: [
      { name: "Vídeo Institucional — Matriz", format: "Institucional", aspectRatio: "16:9", status: "REVISAO_INTERNA", priority: "ALTA", editor: maria, estimatedHours: 10, actualHours: 8, revisionCount: 0, finalDeadlineOffsetDays: 6, internalOffsetDays: 3, startedDaysAgo: 7 },
      { name: "Corte curto — Obras", format: "Corte curto", aspectRatio: "1:1", status: "EDITANDO", priority: "NORMAL", editor: maria, estimatedHours: 3, actualHours: 1, revisionCount: 0, finalDeadlineOffsetDays: 8, internalOffsetDays: 5 },
      { name: "Depoimento Cliente 01", format: "Entrevista" as any, aspectRatio: "16:9", status: "AGUARDANDO_MATERIAL", priority: "BAIXA", editor: joao, estimatedHours: 5, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 12, internalOffsetDays: 9 },
    ],
  });

  // ---- Client: Têxtil Nova Lã — Coleção Inverno ---------------------------
  await createProject({
    client: novala,
    name: "Coleção Inverno — Lookbook em Vídeo",
    type: "Fashion Film",
    priority: "ALTA",
    producer: gui,
    leadEditor: joao,
    captureOffset: -6,
    startOffset: -4,
    deadlineOffset: -1,
    status: "EM_ANDAMENTO",
    budget: 27000,
    videosSeed: [
      { name: "Fashion Film Inverno", format: "Institucional", aspectRatio: "16:9", status: "ALTERACAO_SOLICITADA", priority: "URGENTE", editor: joao, estimatedHours: 12, actualHours: 12, revisionCount: 2, finalDeadlineOffsetDays: -1, internalOffsetDays: -3, startedDaysAgo: 9 },
      { name: "Reel Coleção 01", format: "Reel", aspectRatio: "9:16", status: "ENVIADO_AO_CLIENTE", priority: "ALTA", editor: joao, estimatedHours: 4, actualHours: 4, revisionCount: 1, finalDeadlineOffsetDays: -1, internalOffsetDays: -3, startedDaysAgo: 6 },
      { name: "Reel Coleção 02", format: "Reel", aspectRatio: "9:16", status: "EDITANDO", priority: "URGENTE", editor: joao, estimatedHours: 4, actualHours: 0.5, revisionCount: 0, finalDeadlineOffsetDays: 0, internalOffsetDays: 0, startedDaysAgo: 0 },
      { name: "Stories Bastidores", format: "Story", aspectRatio: "9:16", status: "BACKLOG", priority: "NORMAL", editor: maria, estimatedHours: 2, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 3, internalOffsetDays: 2 },
    ],
  });

  // ---- Client: Corrida Amanhecer — Aftermovie -----------------------------
  await createProject({
    client: amanhecer,
    name: "Aftermovie Corrida Amanhecer 2026",
    type: "Evento",
    priority: "ALTA",
    producer: pedro,
    leadEditor: maria,
    captureOffset: -3,
    startOffset: -2,
    deadlineOffset: 4,
    status: "EM_ANDAMENTO",
    budget: 19000,
    videosSeed: [
      { name: "Aftermovie Oficial", format: "Aftermovie", aspectRatio: "16:9", status: "EDITANDO", priority: "ALTA", editor: maria, estimatedHours: 10, actualHours: 3, revisionCount: 0, finalDeadlineOffsetDays: 4, internalOffsetDays: 2, startedDaysAgo: 2 },
      { name: "Teaser Largada", format: "Teaser", aspectRatio: "9:16", status: "ENTREGUE", priority: "URGENTE", editor: maria, estimatedHours: 2, actualHours: 2, revisionCount: 0, finalDeadlineOffsetDays: -2, internalOffsetDays: -3, startedDaysAgo: 5 },
      { name: "Reel Chegada", format: "Reel", aspectRatio: "9:16", status: "CORRECAO_INTERNA", priority: "NORMAL", editor: joao, estimatedHours: 3, actualHours: 3, revisionCount: 1, finalDeadlineOffsetDays: 2, internalOffsetDays: 0, startedDaysAgo: 3 },
      { name: "Trailer Próxima Edição", format: "Trailer", aspectRatio: "16:9", status: "BACKLOG", priority: "BAIXA", editor: joao, estimatedHours: 3, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 14, internalOffsetDays: 11 },
    ],
  });

  // ---- Client: Sabor de Raiz — Conteúdo mensal ----------------------------
  await createProject({
    client: saborderaiz,
    name: "Conteúdo Mensal — Agosto",
    type: "Conteúdo mensal",
    priority: "NORMAL",
    producer: gui,
    leadEditor: joao,
    captureOffset: -5,
    startOffset: -4,
    deadlineOffset: 1,
    status: "EM_ANDAMENTO",
    budget: 9000,
    videosSeed: [
      { name: "Reel Receita 01", format: "Reel", aspectRatio: "9:16", status: "AGUARDANDO_APROVACAO", priority: "NORMAL", editor: joao, estimatedHours: 3, actualHours: 3, revisionCount: 1, finalDeadlineOffsetDays: 1, internalOffsetDays: -1, startedDaysAgo: 4 },
      { name: "Reel Receita 02", format: "Reel", aspectRatio: "9:16", status: "EXPORTANDO", priority: "NORMAL", editor: joao, estimatedHours: 3, actualHours: 3, revisionCount: 0, finalDeadlineOffsetDays: 0, internalOffsetDays: -1, startedDaysAgo: 3 },
      { name: "Stories Cardápio", format: "Story", aspectRatio: "9:16", status: "ENTREGUE", priority: "BAIXA", editor: maria, estimatedHours: 1, actualHours: 1, revisionCount: 0, finalDeadlineOffsetDays: -4, internalOffsetDays: -5, startedDaysAgo: 8 },
    ],
  });

  // ---- Client: Vortex — Conteúdo institucional atrasado (para mostrar risco)
  await createProject({
    client: vortex,
    name: "Vídeo Institucional — Fábrica",
    type: "Institucional",
    priority: "ALTA",
    producer: pedro,
    leadEditor: maria,
    captureOffset: -25,
    startOffset: -20,
    deadlineOffset: -3,
    originalDeadlineOffset: -6,
    status: "EM_ANDAMENTO",
    budget: 15000,
    videosSeed: [
      { name: "Institucional Fábrica — Corte Longo", format: "Institucional", aspectRatio: "16:9", status: "EM_ALTERACAO", priority: "URGENTE", editor: maria, estimatedHours: 9, actualHours: 8, revisionCount: 3, finalDeadlineOffsetDays: -3, internalOffsetDays: -6, startedDaysAgo: 14 },
      { name: "Institucional Fábrica — Corte Curto", format: "Corte curto", aspectRatio: "16:9", status: "AGUARDANDO_FEEDBACK", priority: "ALTA", editor: maria, estimatedHours: 4, actualHours: 4, revisionCount: 2, finalDeadlineOffsetDays: -3, internalOffsetDays: -6, startedDaysAgo: 10 },
    ],
  });

  // ---- Client: Amanhecer — Live cobertura -------------------------------
  await createProject({
    client: amanhecer,
    name: "Live Cobertura — Largada",
    type: "Live",
    priority: "BAIXA",
    producer: gui,
    leadEditor: joao,
    captureOffset: -1,
    startOffset: 0,
    deadlineOffset: 20,
    status: "BACKLOG",
    budget: 5000,
    videosSeed: [
      { name: "Corte Live — Melhores Momentos", format: "Corte longo", aspectRatio: "16:9", status: "BACKLOG", priority: "BAIXA", editor: joao, estimatedHours: 5, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 20, internalOffsetDays: 17 },
    ],
  });

  // ---- Client: Nova Lã — Produto e-commerce -----------------------------
  await createProject({
    client: novala,
    name: "Vídeos de Produto — E-commerce",
    type: "Produto",
    priority: "NORMAL",
    producer: pedro,
    leadEditor: maria,
    captureOffset: -2,
    startOffset: -1,
    deadlineOffset: 9,
    status: "EM_ANDAMENTO",
    budget: 8000,
    videosSeed: [
      { name: "Produto — Cachecol Trama", format: "1:1", aspectRatio: "1:1", status: "PRONTO_PARA_EDITAR", priority: "NORMAL", editor: maria, estimatedHours: 2, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 9, internalOffsetDays: 7 },
      { name: "Produto — Manta Tricô", format: "1:1", aspectRatio: "1:1", status: "AGUARDANDO_MATERIAL", priority: "BAIXA", editor: maria, estimatedHours: 2, actualHours: 0, revisionCount: 0, finalDeadlineOffsetDays: 11, internalOffsetDays: 9 },
    ],
  });

  console.log(`Seed completo: ${clientRows.length} clientes, ${allProjects.length} projetos, ${allVideos.length} vídeos.`);
}

main()
  .then(async () => {
    await pgClient.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await pgClient.end();
    process.exit(1);
  });
