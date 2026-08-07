import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/bebas-neue";
import "./globals.css";

export const metadata: Metadata = {
  title: "G2 FLOW — Planner de Edição",
  description: "Production / Post-Production Operating System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-cf-black text-cf-text">
        {children}
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#1E2023", border: "1px solid #2B2B2B", color: "#F3F4F1" } }} />
      </body>
    </html>
  );
}
