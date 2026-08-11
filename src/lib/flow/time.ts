import type { FlowTimeContext, TimeBand, Weekday } from "./types";

// G2 Filmes é uma produtora brasileira e o planner inteiro já pensa em
// prazo e horário nesse fuso — mas o servidor (Vercel) roda em UTC, e o
// relógio do sistema de quem está com o notebook aberto pode estar
// errado. A saudação (greeting.tsx) já resolve isso pro SEU caso
// calculando no navegador; aqui fazemos ainda melhor: usamos Intl com um
// fuso IANA FIXO, que dá a hora certa de São Paulo não importa se o
// código roda no servidor, no navegador, ou numa máquina configurada com
// outro fuso. Nunca usar `date.getHours()`/`getDay()` puro aqui — esses
// leem o fuso de quem executa o código, exatamente o bug que a spec pediu
// pra evitar (item 38: nunca decidir "hoje"/"cedo"/"sexta" só pelo UTC do
// servidor).
//
// Se um dia o usuário puder configurar o próprio fuso, troque esta
// constante por um valor por usuário — o resto do motor não muda.
export const G2_TIMEZONE = "America/Sao_Paulo";

const WEEKDAYS: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const timePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: G2_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  // h23 evita o clássico bug de hora "24" que hour12:false às vezes dá
  // com Intl em alguns runtimes pra meia-noite.
  hourCycle: "h23",
  weekday: "long",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: G2_TIMEZONE });

// Faixas de horário — spec seção 5, aplicadas em ordem decrescente pra
// cobrir as 24h sem buraco: 21-24 noite · 18-21 fim do expediente ·
// 14-18 tarde · 12-14 almoço · 8-12 manhã · 5-8 cedo · 0-5 madrugada.
export function timeBandFor(hour: number): TimeBand {
  if (hour >= 21) return "night";
  if (hour >= 18) return "eveningWrap";
  if (hour >= 14) return "afternoon";
  if (hour >= 12) return "lunch";
  if (hour >= 8) return "morning";
  if (hour >= 5) return "early";
  return "lateNight";
}

export function computeTimeContext(now: Date = new Date()): FlowTimeContext {
  const parts = timePartsFormatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const weekdayName = get("weekday").toLowerCase();
  const weekday = WEEKDAYS.includes(weekdayName as Weekday) ? (weekdayName as Weekday) : "monday";

  return {
    dateKey: dateKeyFormatter.format(now),
    hour,
    minute,
    weekday,
    timeBand: timeBandFor(hour),
  };
}

/** yyyy-MM-dd de qualquer timestamp, já no fuso de São Paulo. */
export function brazilDateKey(value: string | Date): string {
  return dateKeyFormatter.format(typeof value === "string" ? new Date(value) : value);
}
