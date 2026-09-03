"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-[10px] border border-cf-border bg-cf-surface-2/70 p-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-[7px] border border-transparent px-3 py-1.5 text-sm font-medium text-cf-text-dim transition-[color,background-color,border-color] duration-[var(--cf-dur-hover)] outline-none hover:text-cf-text focus-visible:border-cf-primary/35 focus-visible:ring-2 focus-visible:ring-cf-primary/20 data-[state=active]:border-cf-border data-[state=active]:bg-cf-surface data-[state=active]:text-cf-text data-[state=active]:font-semibold",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/20", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
