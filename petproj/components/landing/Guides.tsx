import Image from "next/image";
import Link from "next/link";
import type { BlogMetadata } from "@/lib/mdx-types";

/** Pet care guides: the three newest blog posts, as text-first cards. paltuu.pk only. */
export default function Guides({ posts }: { posts: BlogMetadata[] }) {
    if (posts.length === 0) return null;

    return (
        <section aria-labelledby="guides-heading" className="bg-gray-100 px-5 py-12 md:py-20">
            <div className="mx-auto max-w-6xl">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 id="guides-heading" className="text-xl font-semibold text-gray-900 md:text-[28px]">
                            Pet care guides
                        </h2>
                        <p className="mt-1.5 text-sm text-gray-600">Food, health and first-week advice, written for Pakistan.</p>
                    </div>
                    <Link href="/blogs" className="text-sm font-semibold text-primary hover:underline">
                        All guides →
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    {posts.map((p) => (
                        <Link
                            key={p.slug}
                            href={`/blogs/${p.slug}`}
                            className="flex items-start gap-3 rounded-3xl border-2 border-transparent bg-white p-4 transition-colors hover:border-primary"
                        >
                            <Image src="/icons/features/guides.jpg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                            <span className="flex flex-col gap-1">
                                {p.category && <span className="text-xs font-semibold text-primary">{p.category}</span>}
                                <span className="font-bold leading-snug text-gray-900">{p.title}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
