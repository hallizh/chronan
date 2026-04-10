import { addToCart, addToShoppingNote, KronanAuthError } from "@/lib/kronan/client";
import type { MsgAddToCart, MsgAddToNote, MsgCartResult } from "@/types/messages";

export async function handleAddToNote(
  msg: MsgAddToNote
): Promise<MsgCartResult> {
  try {
    await addToShoppingNote(msg.lines);
    return { type: "CART_RESULT", success: true };
  } catch (err) {
    return { type: "CART_RESULT", success: false, error: formatError(err) };
  }
}

export async function handleAddToCart(
  msg: MsgAddToCart
): Promise<MsgCartResult> {
  try {
    await addToCart(msg.lines);
    return { type: "CART_RESULT", success: true };
  } catch (err) {
    return { type: "CART_RESULT", success: false, error: formatError(err) };
  }
}

function formatError(err: unknown): string {
  if (err instanceof KronanAuthError) {
    return "AUTH_ERROR: " + err.message;
  }
  return err instanceof Error ? err.message : String(err);
}
