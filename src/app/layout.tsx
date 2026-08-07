import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "G2 FLOW — Planner de Edição",
  description: "Production / Post-Production Operating System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cf-black text-cf-text">
        {children}
        <Toaster theme="light" position="bottom-right" toastOptions={{ style: { background: "#FFFFFF", border: "1px solid #E5E5EC", color: "#111319" } }} />
      </body>
    </html>
  );
}
