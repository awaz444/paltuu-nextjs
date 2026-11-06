/**
 * Lost & Found is hidden for now (PALTU-110). The data and its APIs stay, because
 * installed app versions still call them. Turning this back on restores the feed
 * cards and search results; the links, copy and redirects removed in the same
 * ticket need reverting too (see next.config.mjs).
 */
export const LOST_AND_FOUND_ENABLED = false;
