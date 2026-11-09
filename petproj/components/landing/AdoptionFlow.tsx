import Image from "next/image";
import Link from "next/link";

/**
 * How adoption works, shown with real phone screens of the flow (PR #56):
 * application form → pending in My applications → approved. Screens are in
 * public/landing/flow-*.webp, captured at 390 px with demo data and the
 * standard maroon theme. Recapture them when those pages change.
 */

const STEPS = [
    {
        title: "Send an adoption application",
        sub: "A short form about you and your home.",
        src: "/landing/flow-1-apply.webp",
        alt: "The adoption form on a Paltuu pet page, step 1: About you",
    },
    {
        title: "The owner reviews it",
        sub: "Follow it in My applications.",
        src: "/landing/flow-2-pending.webp",
        alt: "My applications on Paltuu, showing an application waiting for the owner",
    },
    {
        title: "Approved. Meet and take her home",
        sub: "Contact the owner and arrange a meet-and-greet.",
        src: "/landing/flow-3-approved.webp",
        alt: "My applications on Paltuu, showing an approved application",
    },
];

export default function AdoptionFlow() {
    return (
        <section aria-labelledby="flow-heading" className="bg-gray-100 px-5 py-12 md:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 id="flow-heading" className="text-xl font-semibold text-gray-900 md:text-[28px]">
                    How adoption works on Paltuu
                </h2>
                <p className="mb-6 mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600">
                    You talk to the owner or shelter directly. Paltuu never takes custody of the animal.
                </p>

                <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
                    {STEPS.map((s, i) => (
                        <li key={s.src} className="flex flex-col gap-3">
                            <div className="flex items-start gap-2.5">
                                <span aria-hidden="true" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                    {i + 1}
                                </span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-gray-900">{s.title}</span>
                                    <span className="text-[13px] leading-snug text-gray-600">{s.sub}</span>
                                </span>
                            </div>
                            <Image
                                src={s.src}
                                alt={s.alt}
                                width={780}
                                height={1248}
                                sizes="(min-width: 768px) 360px, 90vw"
                                className="mx-auto h-auto w-full max-w-[360px] rounded-3xl border border-gray-200 bg-white shadow-sm"
                            />
                        </li>
                    ))}
                </ol>

                {/* The other side of the platform */}
                <div className="mt-7 flex flex-col gap-5 rounded-3xl bg-white p-5 md:flex-row md:items-center md:gap-7">
                    <div className="flex flex-1 flex-col items-start gap-2.5">
                        <Image src="/icons/features/adopt.jpg" alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
                        <p className="text-[17px] font-bold text-gray-900">Rehoming your pet?</p>
                        <p className="text-sm leading-relaxed text-gray-600">
                            List them free. Everyone who applies lands in My listings, and you choose who adopts.
                        </p>
                        <Link
                            href="/create-listing"
                            data-cta="home_flow_list_pet"
                            className="mt-1 rounded-2xl border-[1.5px] border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                        >
                            List your pet
                        </Link>
                    </div>
                    <Image
                        src="/landing/flow-owner.webp"
                        alt="My listings on Paltuu, with an applicant waiting for the owner to approve or decline"
                        width={780}
                        height={427}
                        sizes="(min-width: 768px) 460px, 90vw"
                        className="h-auto w-full rounded-2xl border border-gray-200 md:max-w-[460px] md:flex-1"
                    />
                </div>
            </div>
        </section>
    );
}
