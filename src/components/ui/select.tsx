"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-[var(--cf-radius-input)] border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text transition-[border-color,background-color,box-shadow] duration-[var(--cf-dur-hover)] hover:border-cf-border-strong focus:border-cf-primary/45 focus:outline-none focus:ring-2 focus:ring-cf-primary/16 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-cf-text-dim/75",
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60 transition-transform duration-[var(--cf-dur-hover)] data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          "relative z-50 max-h-72 min-w-[10rem] overflow-hidden rounded-[var(--cf-radius-card)] border border-cf-border bg-cf-surface text-cf-text shadow-[0_18px_50px_rgba(17,18,22,.16)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex min-h-9 w-full cursor-default select-none items-center rounded-[7px] py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:bg-cf-surface-2 focus:text-cf-text data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-cf-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
