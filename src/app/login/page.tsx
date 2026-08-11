"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { BrandWordmark } from "@/components/cutflow/brand-mark";
import { HAS_ADMIN_SSO } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Login por e-mail/senha — o caminho de volta pra quem entrou via /convite
// (gente que não é admin da G2 e por isso não tem o botão "Abrir G2 FLOW"
// no painel admin). Quem entra pela G2 continua usando só o SSO normal.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace("/hoje");
      router.refresh();
    } catch (err: any) {
      setError(err?.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err?.message || "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-black text-cf-text px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <BrandWordmark size="lg" />
          <p className="text-cf-text-dim text-sm mt-2">Entrar com e-mail e senha</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Senha</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        {HAS_ADMIN_SSO && (
          <p className="text-cf-text-dim text-xs text-center mt-4">
            É admin da G2? Use o botão “Abrir G2 FLOW” no painel admin da G2 em vez desta tela.
          </p>
        )}
        <p className={cn("text-cf-text-dim text-xs text-center", HAS_ADMIN_SSO ? "mt-1" : "mt-4")}>
          Esqueceu a senha? Peça pra quem te convidou gerar um novo acesso.
        </p>
      </div>
    </div>
  );
}
