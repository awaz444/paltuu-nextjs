import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MIN_POSTS_TO_INDEX, getCommunityProfile, listCommunityPosts } from "@/lib/community";
import { listingMetadata } from "@/lib/communitySeo";
import { SITE_URL } from "@/lib/site";
import { AppCta, CommunityLayout, FeatureCards, Feed, JsonLd } from "@/components/community/CommunityChrome";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";

// Cached for everyone. Who is looking (following, own profile, blocked) is filled in on the client.
export const revalidate = 300;

function parseId(param: string): number | null {
    if (!/^\d{1,18}$/.test(param)) return null;
    const id = Number(param);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const id = parseId(params.id);
    const profile = id ? await getCommunityProfile(id) : null;
    if (!profile) return { title: "Not Found" };

    const handle = profile.username ? ` (@${profile.username})` : "";
    const posts = profile.isPrivate || profile.suspended ? [] : await listCommunityPosts({ authorId: profile.id, limit: MIN_POSTS_TO_INDEX });

    return listingMetadata({
        title: `${profile.name}${handle}`,
        description: profile.bio?.slice(0, 155) || `See ${profile.name}'s posts and pets on Paltuu.`,
        path: `/profile/${profile.id}`,
        // Thin rule, same as the forums: an empty profile adds nothing for search.
        indexable: posts.length >= MIN_POSTS_TO_INDEX,
    });
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
    const id = parseId(params.id);
    if (!id) notFound();
    const profile = await getCommunityProfile(id);
    if (!profile) notFound();

    const hidden = profile.isPrivate || profile.suspended;
    const posts = hidden ? [] : await listCommunityPosts({ authorId: profile.id });

    return (
        <main className="min-h-screen bg-gray-100">
            {!hidden && (
                <JsonLd
                    data={{
                        "@context": "https://schema.org",
                        "@type": "ProfilePage",
                        url: `${SITE_URL}/profile/${profile.id}`,
                        ...(profile.joinedAt ? { dateCreated: profile.joinedAt } : {}),
                        mainEntity: {
                            "@type": "Person",
                            name: profile.name,
                            identifier: String(profile.id),
                            ...(profile.username ? { alternateName: `@${profile.username}` } : {}),
                            ...(profile.bio ? { description: profile.bio } : {}),
                            ...(profile.avatar ? { image: profile.avatar } : {}),
                        },
                    }}
                />
            )}
            <ProfileProvider initial={profile}>
                <ProfileHeader />
                {!profile.suspended && (
                    <CommunityLayout
                        nav={{ outsideForums: true }}
                        aside={
                            <>
                                <FeatureCards />
                                <AppCta />
                            </>
                        }
                    >
                        <ProfileTabs
                            publicPosts={
                                <Feed
                                    posts={posts}
                                    empty={{ title: "No posts yet", body: `When ${profile.name} shares something, it will show up here.` }}
                                />
                            }
                        />
                    </CommunityLayout>
                )}
            </ProfileProvider>
        </main>
    );
}
