import { SITE_URL } from "@/lib/site";
import { BRAND_STATS_SENTENCE } from "@/lib/brandStats";
import { COMMUNITY_SPECIES } from "@/lib/community";

// llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI assistants.
export const dynamic = "force-static";

export function GET() {
    const communities = COMMUNITY_SPECIES.map(
        (s) => `- [${s.name}](${SITE_URL}/${s.slug}): posts and questions from ${s.singular.toLowerCase()} owners in Pakistan`
    ).join("\n");

    const body = `# Paltuu

> Paltuu (paltuu.pk) is Pakistan's pet platform, not a shelter. Owners and registered shelters list pets for adoption, people find vets near them, and pet owners share posts and ask each other questions in species and breed forums. Vets at Home is available in Karachi. There is a free app for Android and iOS.

## Key facts
- Size: ${BRAND_STATS_SENTENCE}
- Free: browsing pets, applying to adopt, listing a pet for adoption, the vet directory and the community cost nothing. The only paid service is Vets at Home, where you pay for the vet visit.
- Not a shelter: Paltuu doesn't own or house animals. Owners and registered shelters list pets and choose who adopts them.
- How adoption works: open a listing and submit an adoption application. The owner or shelter reviews applications and arranges a meeting with the person they choose.
- Vets at Home: Paltuu's own home vet service, Karachi only. Urgent same-day visits, checkups, vaccinations, neutering and spaying, grooming. Booked in the app; the team calls back to confirm price and timing.
- App: [Android](https://play.google.com/store/apps/details?id=com.paltuu.app), [iOS](https://apps.apple.com/pk/app/paltuu/id6789732258)
- Based at the National Incubation Center, Karachi. Founded by Aawaiz Ali. Contact: contact@paltuu.pk
- [About Paltuu](${SITE_URL}/about): the full facts page with answers to common questions

## Adopt
- [Browse pets](${SITE_URL}/browse-pets): every pet currently listed for adoption
- [Adopt by species and city](${SITE_URL}/adopt): adoption landing pages for cats, dogs and other pets across Pakistani cities

## Home and forums
- [Home](${SITE_URL}/home): public posts from pet owners on the Paltuu app. Forums are organised by species and then breed (for example /cats/persian)
${communities}
- Post pages live at ${SITE_URL}/p/{id}. Only public posts from public accounts are shown on the web.

## Vets
- [Vets and clinics](${SITE_URL}/pet-care): directory of vets and clinics in Karachi, Lahore, Islamabad and more

## Other
- [Lost and found](${SITE_URL}/lost-and-found): lost and found pet reports
- [Blog](${SITE_URL}/blogs): pet care guides for Pakistan
`;

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
    });
}
