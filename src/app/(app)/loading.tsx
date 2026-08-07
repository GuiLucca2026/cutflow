// Sem isso, trocar de página significa uma tela em branco/congelada até o
// Server Component terminar de buscar os dados (todas as páginas do app
// são force-dynamic). Esse loading.tsx do Next.js aparece automaticamente
// durante essa espera, então a navegação passa a sensação de "carregando"
// em vez de "travado" — mesmo espírito do spinner que já existia em /sso.
export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cf-lime border-t-transparent animate-spin" />
        <p className="text-cf-text-dim text-sm">Carregando…</p>
      </div>
    </div>
  );
}
