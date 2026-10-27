import type { Metadata } from "next";
import { listCommunityPosts } from "@/lib/community";
import { breadcrumbJsonLd, collectionJsonLd, listingMetadata } from "@/lib/communitySeo";
import {
    AppCta,
    CommunityLayout,
    FeatureCards,
    Feed,
    JsonLd,
    type Crumb,
} from "@/components/community/CommunityChrome";

export const revalidate = 600;

const TITLE = "Pet Owners in Pakistan — Photos, Questions and Advice";
const DESCRIPTION =
    "What pet owners across Pakistan are sharing on Paltuu: photos, questions and advice about cats, dogs and birds, organised by species and breed.";
const PATH = "/home";

export const metadata: Metadata = listingMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    indexable: true,
    keywords: [
        "pet community pakistan",
        "cat owners pakistan",
        "dog owners pakistan",
        "pet forum pakistan",
        "persian cat pakistan",
        "paltuu",
    ],
});

/**
 * Home for signed-in visitors (middleware rewrites "/" here when there is a
 * valid session) and the Home link in the navbar. Signed-out visitors to "/"
 * still get the marketing landing page.
 */
export default async function HomeFeedPage() {
    const posts = await listCommunityPosts();
    const crumbs: Crumb[] = [{ name: "Home" }];

    return (
        <main className="min-h-screen bg-gray-100">
            <JsonLd data={collectionJsonLd({ name: "Paltuu", description: DESCRIPTION, path: PATH, posts })} />
            <JsonLd data={breadcrumbJsonLd(crumbs, PATH)} />
            <h1 className="sr-only">What pet owners in Pakistan are sharing on Paltuu</h1>

            <CommunityLayout
                nav={{}}
                aside={
                    <>
                        <FeatureCards />
                        <AppCta />
                    </>
                }
            >
                <Feed posts={posts} empty={{ title: "No posts yet", body: "Posts from the Paltuu app will show up here." }} />
            </CommunityLayout>
        </main>
    );
}
