import { SITE_URL } from "@/lib/site";
import { COMMUNITY_SPECIES } from "@/lib/community";

// llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI assistants.
export const dynamic = "force-static";

export function GET() {
    const communities = COMMUNITY_SPECIES.map(
        (s) => `- [${s.name}](${SITE_URL}/${s.slug}): posts and questions from ${s.singular.toLowerCase()} owners in Pakistan`
    ).join("\n");

    const body = `# Paltuu

> Paltuu (paltuu.pk) is Pakistan's pet platform, not a shelter. Owners and registered shelters list pets for adoption, people find vets near them, and pet owners share posts and ask each other questions in species and breed forums. Vets at Home is available in Karachi. There is a free app for Android and iOS.

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
