// Headline numbers quoted on /about, in llms.txt and in the homepage FAQ, so
// answer engines see one consistent set. Owner-supplied (same figures as the
// public launch post); update together, and bump AS_OF when they change.
export const BRAND_STATS = {
    asOf: "October 2026",
    users: "nearly 5,000",
    petsListed: "about 2,000",
    cities: 29,
    citySpan: "from Karachi to Chiniot",
};

export const BRAND_STATS_SENTENCE =
    `As of ${BRAND_STATS.asOf}, Paltuu has ${BRAND_STATS.users} registered users, ` +
    `${BRAND_STATS.petsListed} pets listed for adoption since launch, and pet owners in ` +
    `${BRAND_STATS.cities} cities across Pakistan, ${BRAND_STATS.citySpan}.`;
