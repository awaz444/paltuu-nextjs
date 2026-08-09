import React, { Suspense } from "react";
import { db } from "@/db/index";
import { Metadata } from "next";
import OpenClient from "./OpenClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { path?: string };
}

// 1. Dynamic Server-Side Metadata Generation for OG previews
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const path = searchParams.path || "";
  const cleanPath = decodeURIComponent(path).replace(/^\/+/, "");

  let title = "Paltuu App";
  let description = "Pakistan's first pet adoption and care platform. Connect with pets, adopt, or find vet clinics near you.";
  let imageUrl = "https://www.paltuu.pk/favicon.png"; // Fallback brand image

  try {
    if (cleanPath.startsWith("post/")) {
      const postId = cleanPath.split("/")[1];
      if (postId) {
        const res = await db.query(
          `SELECT p.content, u.name as author_name,
                  (SELECT json_build_object('url', url, 'media_type', media_type, 'thumbnail_url', thumbnail_url) 
                   FROM social_post_media 
                   WHERE post_id = p.post_id 
                   ORDER BY ordering ASC LIMIT 1) as media_item
           FROM social_posts p
           JOIN users u ON u.user_id = p.user_id
           WHERE p.post_id = $1`,
          [parseInt(postId, 10)]
        );
        if (res.rows.length > 0) {
          const post = res.rows[0];
          title = `${post.author_name} on Paltuu`;
          description = post.content || "Check out this post on Paltuu";
          const media = post.media_item;
          if (media) {
            // For video, embed thumbnail_url. For image, embed url.
            if (media.media_type === "video") {
              imageUrl = media.thumbnail_url || media.url;
            } else {
              imageUrl = media.url;
            }
          }
        }
      }
    } else if (cleanPath.startsWith("profile/")) {
      const userId = cleanPath.split("/")[1];
      if (userId) {
        const res = await db.query(
          `SELECT name, profile_image_url FROM users WHERE user_id = $1`,
          [parseInt(userId, 10)]
        );
        if (res.rows.length > 0) {
          const user = res.rows[0];
          title = `${user.name} on Paltuu`;
          description = `Check out ${user.name}'s profile on Paltuu`;
          if (user.profile_image_url) {
            imageUrl = user.profile_image_url;
          }
        }
      }
    } else if (cleanPath.startsWith("pet-details")) {
      const match = cleanPath.match(/petId=(\d+)/) || cleanPath.match(/id=(\d+)/);
      const petId = match ? match[1] : null;
      if (petId) {
        const res = await db.query(
          `SELECT p.pet_name, p.description, 
                  (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) as image_url 
           FROM pets p 
           WHERE p.pet_id = $1`,
          [parseInt(petId, 10)]
        );
        if (res.rows.length > 0) {
          const pet = res.rows[0];
          title = `${pet.pet_name} on Paltuu`;
          description = pet.description || `Check out ${pet.pet_name} on Paltuu`;
          if (pet.image_url) {
            imageUrl = pet.image_url;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error generating share metadata:", error);
  }

  // Ensure absolute image URL for crawlers
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `https://www.paltuu.pk${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function OpenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#a03048] flex items-center justify-center text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <OpenClient />
    </Suspense>
  );
}
