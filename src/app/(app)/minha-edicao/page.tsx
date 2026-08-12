import { redirect } from "next/navigation";

// Consolidado em Meu Dia (ver "src/app/(app)/hoje/page.tsx") — esta rota
// fica só como redirecionamento pra quem tinha o link/favorito antigo não
// cair num 404.
export default function MinhaEdicaoRedirect() {
  redirect("/hoje");
}
