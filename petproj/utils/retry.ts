/**
 * Retries a transient, low-level I/O call (DB query, S3 upload) with exponential
 * backoff. Only use this for calls that are safe to repeat on failure — not for
 * operations with side effects that shouldn't fire twice.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: { retries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
    const { retries = 2, baseDelayMs = 300, label = "operation" } = options;

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt === retries) break;
            const delay = baseDelayMs * 2 ** attempt;
            console.warn(
                `[retry] ${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`,
                err instanceof Error ? err.message : err
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
