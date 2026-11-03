/**
 * "Waiting 3 weeks" style label for adoption cards (PALTU-102). Based on the
 * original created_at — renewing a listing moves it up the feed but doesn't
 * reset how long the pet has been waiting.
 *
 * Returns null for listings under two weeks old (no badge).
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export const getWaitingLabel = (createdAt: string | Date | null | undefined, now: number = Date.now()): string | null => {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return null;

  const days = Math.floor((now - created) / DAY_MS);
  if (days < 14) return null;
  if (days < 60) return `Waiting ${Math.floor(days / 7)} weeks`;
  const months = Math.floor(days / 30);
  return months >= 12 ? "Waiting over a year" : `Waiting ${months} months`;
};
