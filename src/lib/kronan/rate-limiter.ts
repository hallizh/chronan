import { RATE_LIMIT, STORAGE_KEYS } from "@/constants";

interface RateLimiterState {
  tokens: number;
  lastRefillAt: number;
}

/** Token-bucket rate limiter persisted in chrome.storage.session so it survives SW restarts. */
export class KronanRateLimiter {
  private async getState(): Promise<RateLimiterState> {
    const result = await chrome.storage.session.get(STORAGE_KEYS.RATE_LIMITER);
    return (
      result[STORAGE_KEYS.RATE_LIMITER] ?? {
        tokens: RATE_LIMIT.MAX_TOKENS,
        lastRefillAt: Date.now(),
      }
    );
  }

  private async setState(state: RateLimiterState): Promise<void> {
    await chrome.storage.session.set({ [STORAGE_KEYS.RATE_LIMITER]: state });
  }

  async consume(): Promise<void> {
    const state = await this.getState();
    const now = Date.now();

    // Refill tokens based on elapsed time
    const elapsed = now - state.lastRefillAt;
    const refilled = Math.floor(
      (elapsed / RATE_LIMIT.REFILL_INTERVAL_MS) * RATE_LIMIT.REFILL_AMOUNT
    );
    const tokens = Math.min(RATE_LIMIT.MAX_TOKENS, state.tokens + refilled);
    const lastRefillAt = refilled > 0 ? now : state.lastRefillAt;

    if (tokens < 1) {
      // Calculate wait time until next token
      const msUntilToken =
        RATE_LIMIT.REFILL_INTERVAL_MS / RATE_LIMIT.REFILL_AMOUNT;
      await new Promise((r) => setTimeout(r, msUntilToken));
      return this.consume();
    }

    await this.setState({ tokens: tokens - 1, lastRefillAt });
  }
}

export const rateLimiter = new KronanRateLimiter();
