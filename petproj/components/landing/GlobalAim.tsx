import Image from "next/image";
import AppStoreBadges from "@/components/home/AppStoreBadges";

/** paltuu.org: where it's going. The group drawing is the business card's (paltuu-prints). */
export default function GlobalAim() {
    return (
        <section aria-labelledby="aim-heading" className="bg-gray-100 px-5 pt-24 text-center md:pt-28">
            <div className="mx-auto max-w-6xl">
                <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-primary">Where it&apos;s going</p>
                <h2 id="aim-heading" className="mx-auto max-w-3xl text-[26px] font-bold leading-tight text-gray-900 md:text-[42px]">
                    Every pet, in every city, a home.
                </h2>
                <p className="mx-auto mb-6 mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600">
                    What worked in Pakistan works anywhere: owners list, adopters apply, and nobody in between holds the
                    animal. We&apos;re opening Paltuu to pet parents around the world, one city at a time.
                </p>
                <AppStoreBadges className="mb-8 justify-center" />
                <Image
                    src="/landing/group-community.webp"
                    alt="Paltuu's rabbit, puppy, cat and parrot together"
                    width={1200}
                    height={512}
                    sizes="(min-width: 768px) 620px, 100vw"
                    className="mx-auto block h-auto w-full max-w-[620px]"
                />
            </div>
        </section>
    );
}
