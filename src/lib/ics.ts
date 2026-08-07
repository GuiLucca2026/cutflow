// Fase 4 — Calendar Sync: builds a standard .ics (RFC 5545) feed from the
// rows returned by the cutflow_ics_feed() SQL function. Pure string
// building — no dependency on any calendar library.

export type IcsFeedRow = {
  video_id: string;
  name: string;
  status: string;
  priority: string;
  internal_deadline: string | null;
  review_deadline: string | null;
  final_deadline: string;
  editor_name: string;
  project_name: string | null;
  client_name: string | null;
};

const KIND_LABEL = { internal: "Edição", review: "Revisão", delivery: "Entrega" } as const;

function icsDate(d: string) {
  return new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// RFC 5545: content lines shouldn't exceed 75 octets — longer lines get
// folded onto a continuation line starting with a space.
function fold(line: string): string {
  if (line.length <= 75) return line;
  let result = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    result += "\r\n " + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return result;
}

export function buildIcsFeed(calendarName: string, rows: IcsFeedRow[]): string {
  const now = icsDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//G2 FLOW//Agenda de Produção//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const r of rows) {
    const events: { kind: keyof typeof KIND_LABEL; date: string }[] = [{ kind: "delivery", date: r.final_deadline }];
    if (r.internal_deadline) events.push({ kind: "internal", date: r.internal_deadline });
    if (r.review_deadline) events.push({ kind: "review", date: r.review_deadline });

    const where = [r.client_name, r.project_name].filter(Boolean).join(" · ") || "Vídeo avulso";

    for (const e of events) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${r.video_id}-${e.kind}@g2flow`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsDate(e.date)}`,
        `SUMMARY:${icsEscape(`${KIND_LABEL[e.kind]}: ${r.name}`)}`,
        `DESCRIPTION:${icsEscape(where)}`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}
