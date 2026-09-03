"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { markInviteAccepted } from "@/app/actions";
import { ROLE_META } from "@/lib/domain";
import { BRAND_NAME } from "@/lib/brand";

export function AcceptInviteForm({
  token,
  email,
  name,
  role,
  inviterName,
}: {
  token: string;
  email: string;
  name: string;
  role: string;
  inviterName: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (signUpError) throw signUpError;

      await markInviteAccepted(token);

      if (data.session) {
        router.replace("/hoje");
        router.refresh();
      } else {
        // Project has e-mail confirmation turned on — there's no session
        // yet. The account exists, so /login will work once they confirm.
        setNeedsConfirmation(true);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível criar sua conta.");
    } finally {
      setPending(false);
    }
  }

  if (needsConfirmation) {
    return (
      <p className="text-cf-text-dim text-sm text-center">
        Conta criada! Confira seu e-mail (<strong className="text-cf-text">{email}</strong>) pra confirmar — depois é
        só entrar em <span className="text-cf-primary">/login</span> com o e-mail e a senha que você acabou de criar.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-cf-text-dim text-sm text-center">
        {inviterName ? `${inviterName} te convidou` : "Você foi convidado"} pra entrar no {BRAND_NAME} como{" "}
        <span className="text-cf-text font-medium">{ROLE_META[role]?.label ?? role}</span>. Crie uma senha pra
        finalizar.
      </p>

      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input value={name} disabled />
      </div>
      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-password">Senha</Label>
        <Input id="invite-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus placeholder="Mínimo 8 caracteres" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-confirm">Confirmar senha</Label>
        <Input id="invite-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta…" : "Criar conta e entrar"}
      </Button>
    </form>
  );
}
