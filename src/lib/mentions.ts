// Extrai menções @Nome de um texto livre (comentário ou descrição de
// tarefa) e resolve pro usuário real por correspondência de nome — não
// existe @handle próprio no sistema, só o nome de exibição (ver
// cutflow_users.name). Testa do nome mais comprido pro mais curto: sem
// isso, "@Ana" casaria primeiro que "@Ana Paula" e cortaria a menção pela
// metade quando os dois nomes coexistem.
export function extractMentions(text: string, users: { id: string; name: string }[]): string[] {
  if (!text) return [];
  const sorted = [...users].sort((a, b) => b.name.length - a.name.length);
  const found = new Set<string>();
  let remaining = text;
  for (const u of sorted) {
    const pattern = new RegExp(`@${escapeRegExp(u.name)}\\b`, "i");
    if (pattern.test(remaining)) {
      found.add(u.id);
      // Remove o trecho casado antes de testar o próximo nome, pra um
      // nome mais curto que seja substring de um já encontrado não casar
      // de novo dentro do mesmo texto (ex: "@Ana Paula" já casou por
      // inteiro — não deveria também contar como menção separada a
      // alguém chamado só "Paula").
      remaining = remaining.replace(pattern, "");
    }
  }
  return Array.from(found);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
