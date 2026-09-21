// "Planejar minha semana" — the differentiator feature from the briefing.
// Combines Backward Planning (work out how many days before the deadline
// each video needs to start, given hours remaining) with Auto Schedule
// (greedily fill each work day's capacity, most urgent deadline first)
// into one day-by-day suggestion for a single editor's coming week.
import { addDays, startOfDay } from "date-fns";

export type PlanVideo = {
  id: string;
  name: string;
  projectName: string;
  finalDeadline: string;
  hoursRemaining: number;
};

export type PlanDayItem = { videoId: string; name: string; projectName: string; hours: number; overdue?: boolean };

export type PlanDay = {
  date: string; // yyyy-MM-dd
  isWorkDay: boolean;
  capacityHours: number;
  allocatedHours: number;
  items: PlanDayItem[];
};

export function planWeek(opts: {
  videos: PlanVideo[];
  dailyCapacityHours: number;
  workDays: string; // CSV of JS getDay() values (0 = Sunday .. 6 = Saturday)
  today: Date;
  numDays?: number;
}): PlanDay[] {
  const { videos, dailyCapacityHours, workDays, today, numDays = 7 } = opts;
  const workDaySet = new Set(
    workDays
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n))
  );
  const start = startOfDay(today);

  const days: PlanDay[] = Array.from({ length: numDays }, (_, i) => {
    const d = addDays(start, i);
    const isWorkDay = workDaySet.has(d.getDay());
    return {
      date: d.toISOString().slice(0, 10),
      isWorkDay,
      capacityHours: isWorkDay ? dailyCapacityHours : 0,
      allocatedHours: 0,
      items: [],
    };
  });

  // Most urgent deadline first — that's what makes this "backward
  // planning": work due soonest claims capacity before work with slack.
  const sorted = [...videos].sort((a, b) => new Date(a.finalDeadline).getTime() - new Date(b.finalDeadline).getTime());

  // Anything whose deadline is today or already in the past can't be
  // scheduled "backward" anymore — there's no future day left before it's
  // due. The old loop below would just `break` on day zero for these and
  // silently drop them from the whole week. Instead, they get pinned onto
  // today, in order of how overdue they are (oldest deadline first), and
  // they're allowed to blow past the daily capacity: a video that's late
  // — or due right now — must never simply vanish from the plan, even if
  // that means today shows more than `dailyCapacityHours` of work.
  const forcedToday: PlanVideo[] = [];
  const scheduledNormally: PlanVideo[] = [];
  for (const v of sorted) {
    const deadline = startOfDay(new Date(v.finalDeadline));
    if (deadline.getTime() <= start.getTime()) forcedToday.push(v);
    else scheduledNormally.push(v);
  }

  const todayColumn = days[0];
  for (const v of forcedToday) {
    if (v.hoursRemaining <= 0) continue;
    const deadline = startOfDay(new Date(v.finalDeadline));
    todayColumn.items.push({
      videoId: v.id,
      name: v.name,
      projectName: v.projectName,
      hours: Math.round(v.hoursRemaining * 10) / 10,
      overdue: deadline.getTime() < start.getTime(),
    });
    todayColumn.allocatedHours += v.hoursRemaining;
  }

  for (const v of scheduledNormally) {
    let remaining = v.hoursRemaining;
    if (remaining <= 0) continue;
    const deadline = startOfDay(new Date(v.finalDeadline));

    for (const day of days) {
      if (remaining <= 0) break;
      if (!day.isWorkDay) continue;
      if (new Date(`${day.date}T00:00:00`) > deadline) break; // never schedule work past its own deadline
      const free = day.capacityHours - day.allocatedHours;
      if (free <= 0.01) continue;
      const take = Math.min(free, remaining);
      day.items.push({ videoId: v.id, name: v.name, projectName: v.projectName, hours: Math.round(take * 10) / 10 });
      day.allocatedHours += take;
      remaining -= take;
    }
  }

  return days;
}
