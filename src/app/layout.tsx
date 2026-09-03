import type { Metadata } from "next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND_NAME } from "@/lib/brand";
// Fase 1 do rebranding "Cut Flow" (ver REBRAND-AUDIT.md) — Geist Sans
// substitui Inter/Sora como única fonte de interface (era duas famílias,
// uma pra corpo outra pra título; Geist cobre os dois pesos que
// precisamos, menos uma família carregada). Instrument Serif é o
// registro editorial — usado só pontualmente (números grandes,
// percentuais, títulos editoriais), não em toda a interface.
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Planner de Edição`,
  description: "Production / Post-Production Operating System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cf-black text-cf-text">
        {/* Provider único pra árvore inteira — é o que faz o Hint (ui/tooltip.tsx)
            funcionar em qualquer badge/card/ícone do app sem precisar embrulhar
            cada tela individualmente. delayDuration curto: tooltip é uma resposta
            a "o que é isso?", não deveria exigir segurar o mouse parado. */}
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster theme="light" position="bottom-right" toastOptions={{ style: { background: "#FFFFFF", border: "1px solid #E5E5EC", color: "#111319" } }} />
        </TooltipProvider>
      </body>
    </html>
  );
}
