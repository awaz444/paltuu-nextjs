import Image from "next/image";
import Link from "next/link";
import { APP_SCREENS } from "@/lib/homeContent";
import { COMMUNITY_SPECIES } from "@/lib/community";

/**
 * paltuu.org: the community, in the business card's words ("meet other pet
 * parents", "see what other pets are up to"), with two real app screens.
 */
export default function CommunityShowcase() {
    const [feed, profile] = APP_SCREENS;

    return (
        <section aria-labelledby="community-heading" className="bg-primary px-5 pt-12 text-white md:pt-20">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:gap-12">
                <div className="md:flex-1 md:pb-20">
                    <h2 id="community-heading" className="text-2xl font-bold leading-tight md:text-4xl">
                        Meet other pet parents
                    </h2>
                    <p className="mb-5 mt-2.5 max-w-lg text-[15px] leading-relaxed text-white/90">
                        Give your pet a profile of their own, post their photos, and see what other pets are up to. Ask the
                        people who know your breed.
                    </p>
                    <div className="mb-6 flex flex-wrap gap-2">
                        {COMMUNITY_SPECIES.slice(0, 3).map((s) => (
                            <Link
                                key={s.slug}
                                href={`/${s.slug}`}
                                className="rounded-full border border-white/50 px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-white/10"
                            >
                                {s.name}
                            </Link>
                        ))}
                    </div>
                    <Link
                        href="/home"
                        className="inline-flex items-center rounded-2xl bg-white px-5 py-3.5 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
                    >
                        Join the community →
                    </Link>
                </div>
                <div className="flex items-end justify-center gap-4 md:flex-1">
                    {[feed, profile].map((s, i) => (
                        <div key={s.src} className={`w-[46%] max-w-[230px] drop-shadow-[0_16px_26px_rgba(0,0,0,0.35)] ${i === 1 ? "-mb-14" : ""}`}>
                            <Image src={s.src} alt={s.alt} width={656} height={1224} sizes="230px" className="block h-auto w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
