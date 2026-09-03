"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isValid, parse } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Calendário próprio no lugar do <input type="date"> nativo. O nativo muda
// de cara em cada navegador/sistema (e no Chrome do Windows é aquele campo
// dd/mm/aaaa que obriga a digitar número por número), então nunca combinava
// com o resto da interface nem dava pra ver o mês inteiro na hora de
// escolher um prazo — que é exatamente a decisão sendo tomada aqui.
//
// O valor entra e sai como "yyyy-MM-dd" (mesmo formato do input nativo), pra
// ser troca direta em quem já usava, sem mexer nas actions.
function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Escolher data",
  id,
  disabled,
  className,
  fromToday = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Bloqueia datas passadas — usado em prazo de entrega e captação. */
  fromToday?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  // Atalhos: a maior parte dos prazos cai em "hoje / amanhã / semana que
  // vem", e clicar um botão é mais rápido do que navegar o calendário.
  const shortcuts: { label: string; days: number }[] = [
    { label: "Hoje", days: 0 },
    { label: "Amanhã", days: 1 },
    { label: "Em 3 dias", days: 3 },
    { label: "Em 1 semana", days: 7 },
  ];

  function pick(date: Date | undefined) {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  }

  function pickIn(days: number) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    pick(d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface px-3 text-left text-sm transition-[border-color,background-color,box-shadow]",
            "hover:border-cf-border-strong focus:border-cf-primary/45 focus:outline-none focus:ring-2 focus:ring-cf-primary/16 disabled:opacity-50",
            !selected && "text-cf-text-dim",
            className
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cf-text-dim" />
          <span className="truncate">
            {selected ? format(selected, "EEE, dd 'de' MMMM", { locale: ptBR }) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      {/* bg-white derruba o bg-cf-surface-2 padrão do PopoverContent (que é
          translúcido + blur, ver globals.css): sobre um formulário cheio de
          campos o calendário ficava com o texto de trás vazando por baixo
          dos números. */}
      <PopoverContent className="w-auto p-3 bg-white" align="start">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => pickIn(s.days)}
              className="rounded-[7px] border border-cf-border px-2.5 py-1.5 text-[11px] font-medium text-cf-text-dim transition-colors hover:border-cf-primary/30 hover:bg-cf-primary/5 hover:text-cf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/20"
            >
              {s.label}
            </button>
          ))}
        </div>
        <DayPicker
          mode="single"
          locale={ptBR}
          selected={selected}
          onSelect={pick}
          defaultMonth={selected}
          disabled={fromToday ? { before: today } : undefined}
          showOutsideDays
          components={{
            Chevron: ({ orientation }) =>
              orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
          }}
          classNames={{
            root: "text-cf-text",
            months: "relative",
            month_caption: "flex items-center justify-center h-8 mb-1",
            caption_label: "text-sm font-semibold capitalize",
            nav: "absolute top-0 inset-x-0 flex items-center justify-between h-8 z-10",
            button_previous:
              "inline-flex h-7 w-7 items-center justify-center rounded-md text-cf-text-dim hover:bg-cf-surface hover:text-cf-text transition-colors disabled:opacity-30",
            button_next:
              "inline-flex h-7 w-7 items-center justify-center rounded-md text-cf-text-dim hover:bg-cf-surface hover:text-cf-text transition-colors disabled:opacity-30",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday: "w-9 text-[11px] font-semibold uppercase text-cf-text-dim/70",
            week: "flex w-full mt-0.5",
            day: "w-9 h-9 p-0",
            day_button:
              "w-9 h-9 rounded-lg text-sm font-medium hover:bg-cf-surface transition-colors disabled:opacity-30 disabled:hover:bg-transparent",
            today: "[&>button]:text-cf-primary [&>button]:font-bold",
            // Texto branco (não cf-black) sobre o roxo da marca — escuro
            // sobre roxo saturado praticamente some.
            selected: "[&>button]:bg-cf-primary [&>button]:text-white [&>button]:font-bold [&>button]:hover:bg-cf-primary",
            outside: "[&>button]:text-cf-text-dim/35",
            disabled: "[&>button]:text-cf-text-dim/25 [&>button]:line-through",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
