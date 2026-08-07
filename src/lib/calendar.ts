// Pure date-grid helpers for the /calendario views (month/week/day/agenda).
// No React here — keeps the calculations trivially testable and usable
// from server components without a "use client" boundary.
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

export function monthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: addDaysLocal(start, 6) });
}

function addDaysLocal(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function dayKey(d: Date | string): string {
  return format(new Date(d), "yyyy-MM-dd");
}

export function parseDayParam(v: string | undefined): Date {
  if (!v) return new Date();
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? new Date() : d;
}
