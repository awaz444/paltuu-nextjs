import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import {
    postPath,
    postTitle,
    type CommunityComment,
    type CommunityPost,
} from "@/lib/community";
import type { Crumb } from "@/components/community/CommunityChrome";

export function breadcrumbJsonLd(crumbs: Crumb[], currentPath: string) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${SITE_URL}${c.href ?? currentPath}`,
        })),
    };
}

export function collectionJsonLd(opts: { name: string; description: string; path: string; posts: CommunityPost[] }) {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: opts.name,
        description: opts.description,
        url: `${SITE_URL}${opts.path}`,
        isPartOf: { "@type": "WebSite", name: "Paltuu", url: SITE_URL },
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: opts.posts.length,
            itemListElement: opts.posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}${postPath(p)}`,
                name: postTitle(p),
            })),
        },
    };
}

function person(author: CommunityPost["author"]) {
    return {
        "@type": "Person",
        name: author.name,
        ...(author.username ? { alternateName: `@${author.username}` } : {}),
    };
}

function commentJsonLd(c: CommunityComment): object {
    return {
        "@type": "Comment",
        text: c.content,
        datePublished: c.createdAt,
        author: person(c.author),
        ...(c.likeCount
            ? {
                  interactionStatistic: {
                      "@type": "InteractionCounter",
                      interactionType: "https://schema.org/LikeAction",
                      userInteractionCount: c.likeCount,
                  },
              }
            : {}),
        ...(c.replies.length ? { comment: c.replies.map(commentJsonLd) } : {}),
    };
}

export function postJsonLd(post: CommunityPost, comments: CommunityComment[], community?: { name: string; path: string }) {
    const url = `${SITE_URL}${postPath(post)}`;
    const images = post.media.filter((m) => m.type !== "video").map((m) => m.url);
    const video = post.media.find((m) => m.type === "video" && m.thumb);

    return {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "@id": url,
        url,
        mainEntityOfPage: url,
        headline: postTitle(post),
        ...(post.content ? { text: post.content } : {}),
        ...(images.length ? { image: images } : {}),
        ...(video
            ? {
                  video: {
                      "@type": "VideoObject",
                      name: postTitle(post),
                      description: post.content || postTitle(post),
                      thumbnailUrl: video.thumb,
                      contentUrl: video.url,
                      uploadDate: post.createdAt,
                  },
              }
            : {}),
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        author: person(post.author),
        interactionStatistic: [
            {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/LikeAction",
                userInteractionCount: post.likeCount,
            },
            {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/CommentAction",
                userInteractionCount: post.commentCount,
            },
        ],
        ...(community
            ? { isPartOf: { "@type": "CollectionPage", name: community.name, url: `${SITE_URL}${community.path}` } }
            : {}),
        ...(comments.length ? { comment: comments.map(commentJsonLd) } : {}),
    };
}

/**
 * Metadata for a community listing page. The root layout appends " | Paltuu",
 * so titles here carry no brand suffix. Thin pages stay out of the index but
 * keep their links followable.
 */
export function listingMetadata(opts: {
    title: string;
    description: string;
    path: string;
    indexable: boolean;
    keywords?: string[];
}): Metadata {
    const url = `${SITE_URL}${opts.path}`;
    return {
        title: opts.title,
        description: opts.description,
        keywords: opts.keywords,
        alternates: { canonical: url },
        openGraph: { title: opts.title, description: opts.description, url, type: "website", siteName: "Paltuu.pk" },
        twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
        robots: opts.indexable ? undefined : { index: false, follow: true },
    };
}
