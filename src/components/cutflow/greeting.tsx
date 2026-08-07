"use client";

import { useEffect, useState } from "react";

// Saudação calculada no NAVEGADOR de propósito (não no servidor): o Vercel
// roda em UTC, então um "Bom dia" fixo renderizado no server ficaria
// errado boa parte do dia pra quem tá no fuso do Brasil. O primeiro
// render (SSR + primeiro paint no cliente, antes do useEffect rodar)
// precisa bater 100% pra não disparar aviso de hydration mismatch — por
// isso começa neutro ("Olá") e só troca pro texto de horário depois de
// montado, já com a hora local de quem tá vendo a tela.
//   00:00–05:59 → "Vai dormir" · 06:00–11:59 → "Bom dia"
//   12:00–17:59 → "Boa tarde" · 18:00–23:59 → "Boa noite"
function greetingFor(hour: number): string {
  if (hour >= 6 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  if (hour >= 18) return "Boa noite";
  return "Vai dormir";
}

export function Greeting({ firstName, className }: { firstName: string; className?: string }) {
  const [text, setText] = useState(`Olá, ${firstName}.`);

  useEffect(() => {
    const update = () => setText(`${greetingFor(new Date().getHours())}, ${firstName}.`);
    update();
    // Recalcula a cada minuto — se alguém deixar a aba aberta virando a
    // meia-noite ou passando das 6h, a saudação acompanha sem precisar
    // recarregar a página.
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [firstName]);

  return (
    <h1 className={className} suppressHydrationWarning>
      {text}
    </h1>
  );
}
