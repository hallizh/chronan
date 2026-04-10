import { getAIProvider } from "@/lib/ai";
import type { MsgExtractWithAI, MsgExtractResult } from "@/types/messages";

export async function handleExtractWithAI(
  msg: MsgExtractWithAI
): Promise<MsgExtractResult> {
  try {
    const provider = await getAIProvider();
    const ingredients = await provider.extractIngredients(msg.pageText, msg.url);
    return { type: "EXTRACT_RESULT", ingredients };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { type: "EXTRACT_RESULT", ingredients: [], error };
  }
}
