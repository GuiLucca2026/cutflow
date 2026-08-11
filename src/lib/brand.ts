// Marca configurável por variável de ambiente — pensado pro dia em que este
// MESMO código passasse a rodar em mais de um deploy Vercel (ex: uma
// instância separada pra outra produtora testar o produto, com Supabase
// próprio e sem nenhum dado da G2 no meio). Trocar só a variável de
// ambiente do projeto Vercel já rebrand a instância inteira; sem a
// variável, cai no padrão de sempre ("G2 FLOW"), então o deploy original da
// G2 continua idêntico a como sempre foi.
//
// NEXT_PUBLIC_* porque também é lido em componentes client (BrandWordmark,
// Sidebar, MobileNav) — variáveis assim são embutidas no bundle em build
// time pelo Next.js, então precisam estar configuradas no ambiente do BUILD
// (Vercel → Settings → Environment Variables), não só em runtime.
export const BRAND_PREFIX = process.env.NEXT_PUBLIC_BRAND_PREFIX || "G2";
export const BRAND_ICON_TEXT = process.env.NEXT_PUBLIC_BRAND_ICON_TEXT || "G2";
export const BRAND_NAME = `${BRAND_PREFIX} FLOW`;

// Só a instância da própria G2 tem o botão "Abrir G2 FLOW" no painel admin
// dela (o handoff via /sso — ver src/app/sso/page.tsx). Outras produtoras
// rodando este mesmo código não têm esse painel, então qualquer texto que
// fale em "admin da G2" / "painel admin" precisa sumir nelas — do contrário
// vira instrução de login que não existe e não faz sentido pra quem lê.
export const HAS_ADMIN_SSO = process.env.NEXT_PUBLIC_HAS_ADMIN_SSO !== "false";
