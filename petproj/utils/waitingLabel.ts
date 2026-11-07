/**
 * "Still looking · 3 wks" style label for adoption cards (PALTU-102, copy
 * reworked in PALTU-113). Based on the original created_at — renewing a
 * listing moves it up the feed but doesn't reset how long the pet has been
 * waiting. Units are abbreviated so the chip fits on narrow mobile cards.
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

  let duration: string;
  if (days < 60) {
    duration = `${Math.floor(days / 7)} wks`;
  } else {
    const months = Math.floor(days / 30);
    if (months < 12) {
      duration = `${months} mos`;
    } else {
      const years = Math.floor(months / 12);
      duration = `${years} yr${years > 1 ? "s" : ""}+`;
    }
  }
  return `Still looking · ${duration}`;
};
