import { createClient } from "@supabase/supabase-js";
import { AcceptInviteForm } from "@/components/cutflow/accept-invite-form";
import { BrandWordmark } from "@/components/cutflow/brand-mark";

// Public page — same reasoning as /api/ics/[token]: whoever opens this
// link has no session yet, so the lookup goes through a SECURITY DEFINER
// SQL function (cutflow_invite_lookup) that only returns the one row
// matching this exact token, never the full invites table. See
// supabase-setup.sql, "Fase 4b — Convite".
export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let invite: { email: string; name: string; role: string; status: string; expires_at: string; inviter_name: string | null } | null = null;
  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase.rpc("cutflow_invite_lookup", { p_token: token });
    invite = data?.[0] ?? null;
  }

  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false;
  const isUsable = invite && invite.status === "PENDENTE" && !isExpired;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-black text-cf-text px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <BrandWordmark size="lg" />
        </div>

        {!invite ? (
          <p className="text-cf-text-dim text-sm text-center">
            Esse link de convite não existe ou já não é mais válido. Peça pra quem te convidou gerar um novo.
          </p>
        ) : !isUsable ? (
          <p className="text-cf-text-dim text-sm text-center">
            {invite.status === "ACEITO"
              ? "Esse convite já foi usado. Se você já criou sua conta, entre pela tela de login."
              : invite.status === "REVOGADO"
              ? "Esse convite foi cancelado. Peça pra quem te convidou gerar um novo."
              : "Esse convite expirou. Peça pra quem te convidou gerar um novo."}
          </p>
        ) : (
          <AcceptInviteForm token={token} email={invite.email} name={invite.name} role={invite.role} inviterName={invite.inviter_name} />
        )}
      </div>
    </div>
  );
}
