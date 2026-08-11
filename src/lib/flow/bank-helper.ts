import type { FlowCategory, FlowMessage } from "./types";

// Vira uma lista de textos em `FlowMessage[]` com id previsível e único
// (categoria + índice), pra quem escreve frase nova só precisar adicionar
// uma string no array — sem inventar id na mão, sem risco de colisão.
export function bank(category: FlowCategory, texts: string[]): FlowMessage[] {
  return texts.map((text, i) => ({ id: `${category}_${String(i + 1).padStart(2, "0")}`, text, category }));
}
