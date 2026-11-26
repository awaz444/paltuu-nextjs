/**
 * "Listed 3 weeks ago" style label for adoption cards (PALTU-102, copy
 * reworked in PALTU-113 and PALTU-185). Based on the original created_at —
 * renewing a listing moves it up the feed but doesn't reset how long the pet
 * has been waiting.
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
  if (days < 60) return `Listed ${Math.floor(days / 7)} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Listed ${months} months ago`;

  const years = Math.floor(months / 12);
  return years === 1 ? "Listed over a year ago" : `Listed over ${years} years ago`;
};
