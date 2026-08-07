import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, differenceInHours, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function fmtDateShort(d: string | Date) {
  return format(new Date(d), "dd/MM", { locale: ptBR });
}

export function fmtDateWeekday(d: string | Date) {
  const date = new Date(d);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (isYesterday(date)) return "Ontem";
  return format(date, "EEE dd/MM", { locale: ptBR });
}

export function fmtDateFull(d: string | Date) {
  return format(new Date(d), "dd 'de' MMMM", { locale: ptBR });
}

export function fmtDateTime(d: string | Date) {
  return format(new Date(d), "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function fmtWaitingSince(d: string | Date) {
  const date = new Date(d);
  const hours = Math.abs(differenceInHours(new Date(), date));
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days === 0) return `${remH}h`;
  return `${days}d e ${remH}h`;
}

export function fmtRelative(d: string | Date) {
  return formatDistanceToNowStrict(new Date(d), { addSuffix: true, locale: ptBR });
}

export function fmtHours(h: number) {
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

export function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
