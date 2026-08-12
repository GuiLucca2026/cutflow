import {
  Sun,
  FolderKanban,
  Clapperboard,
  Camera,
  Calendar,
  GanttChartSquare,
  MessageSquareWarning,
  Users,
  Building2,
  BarChart3,
  Send,
  Kanban,
  Gauge,
  Trash2,
  type LucideIcon,
} from "lucide-react";

// Navegação principal do app, agrupada por contexto de uso (não por ordem
// de criação) — isso é o que aparece tanto na Sidebar (desktop) quanto no
// menu mobile (Topbar em telas < lg), então os dois ficam sempre em sync.
// Antes disso era uma lista única de 14 itens sem hierarquia visual, o que
// pesa bastante pra quem entra pela primeira vez (ex: freelancer convidado
// por link) sem nenhum treinamento prévio.
export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    // Sem label de grupo de propósito — "Meu Dia" agora é 1 item só
    // (consolidou Hoje + Minha Edição + Planejar Semana numa página só,
    // ver src/app/(app)/hoje/page.tsx), um cabeçalho de grupo repetindo o
    // mesmo nome do item logo abaixo seria redundante.
    label: "",
    items: [{ href: "/hoje", label: "Meu Dia", icon: Sun }],
  },
  {
    label: "Produção",
    items: [
      // Contraparte da "Minha Edição": lá é a fila de UMA pessoa, aqui é a
      // produtora inteira dividida por pessoa. Fica fora do grupo "Meu dia"
      // de propósito — o que é pessoal continua pessoal, e quem procura
      // "como está todo mundo" tem um lugar óbvio pra ir.
      { href: "/panorama", label: "Panorama", icon: Gauge },
      { href: "/projetos", label: "Projetos", icon: FolderKanban },
      { href: "/videos", label: "Vídeos", icon: Clapperboard },
      { href: "/captacoes", label: "Captações", icon: Camera },
      { href: "/kanban", label: "Kanban", icon: Kanban },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/calendario", label: "Calendário", icon: Calendar },
      { href: "/timeline", label: "Timeline", icon: GanttChartSquare },
      { href: "/revisoes", label: "Revisões", icon: MessageSquareWarning },
      { href: "/entregas", label: "Entregas", icon: Send },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/equipe", label: "Equipe", icon: Users },
      { href: "/clientes", label: "Clientes", icon: Building2 },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/lixeira", label: "Lixeira", icon: Trash2 },
    ],
  },
];
