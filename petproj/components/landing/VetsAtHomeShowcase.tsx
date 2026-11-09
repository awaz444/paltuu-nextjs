import Image from "next/image";
import Link from "next/link";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * Vets at Home, the Karachi page's second section: on white, set in the app's
 * pixel face (font-pixel), with the vet-on-a-scooter drawing and the same four
 * tiles as the app's Pets tab (paltuu-reactnative EXPRESS_VET_SECTIONS).
 *
 * No prices, on purpose (founder, 2026-11-09): the price is confirmed on the
 * dispatcher call. Booking only exists in the app, so every link deep-links.
 */

const href = VETS_AT_HOME.deepLink;

export default function VetsAtHomeShowcase() {
    return (
        <section aria-labelledby="vah-heading" className="bg-white px-5 pb-14 pt-2 md:pb-20">
            <div className="mx-auto max-w-6xl">
                {/* "Paltuu presents" divider, as in the app */}
                <div className="mb-3 flex items-center gap-4" aria-hidden="true">
                    <span className="h-px flex-1 bg-gray-200" />
                    {/* The vector logo the app uses here (paltuu_bilkul_tight.svg), so it stays sharp at this size. */}
                    <Image
                        src="/paltuu%20bilkul%20tight.svg"
                        alt=""
                        width={2210}
                        height={1173}
                        unoptimized
                        className="h-12 w-auto md:h-16"
                    />
                    <span className="h-px flex-1 bg-gray-200" />
                </div>
                <h2 id="vah-heading" className="text-center font-pixel text-xl leading-normal text-gray-900 md:text-[32px]">
                    Vets at Home
                </h2>
                <p className="mx-auto mt-1.5 max-w-lg text-center text-sm leading-relaxed text-gray-600">
                    Certified vets and caretakers, at your doorstep in {VETS_AT_HOME.city}. No carrier, no traffic, no
                    waiting room.
                </p>

                <div className="mt-6 flex flex-col items-center gap-5 md:flex-row">
                    <div className="w-full md:flex-1">
                        <Image
                            src="/landing/vet-scooter.webp"
                            alt="A Paltuu vet riding a scooter to a pet's home"
                            width={1600}
                            height={893}
                            sizes="(min-width: 768px) 560px, 100vw"
                            className="h-auto w-full"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-2.5 md:flex-1">
                        {/* Bento, laid out like the app's Pets tab (paltuu-reactnative
                            app/(app)/(tabs)/pets.tsx, BentoTile). Doorstep Vet: label pinned
                            bottom-left, the stethoscope oversized and tilted on the right so it
                            bleeds past the tile's top and bottom edges. Grooming (tall): art
                            centred above the label. Neutering & Spaying and Vaccination carry no
                            art, as in the app. */}
                        <Link
                            href={href}
                            data-cta="home_vah_doorstep_vet"
                            className="relative flex h-[130px] overflow-hidden rounded-[20px] bg-[#f5f5f5] transition-colors hover:bg-gray-200/70 md:h-[150px]"
                        >
                            <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
                                Most booked
                            </span>
                            <span className="flex flex-1 flex-col justify-end py-3.5 pl-3.5 pr-2">
                                <span className="font-pixel text-[13px] leading-relaxed text-gray-900">Doorstep Vet</span>
                                <span className="mt-0.5 text-xs text-gray-600">Urgent or scheduled visits</span>
                            </span>
                            <span aria-hidden="true" className="w-[140px] shrink-0 md:w-[160px]" />
                            <Image
                                src="/landing/vah-stethoscope.webp"
                                alt=""
                                width={507}
                                height={493}
                                className="absolute -bottom-4 -top-4 right-2.5 h-[calc(100%+2rem)] w-[140px] -rotate-[15deg] object-contain [image-rendering:pixelated] md:w-[160px]"
                            />
                        </Link>
                        <div className="flex gap-2.5">
                            <Link
                                href={href}
                                data-cta="home_vah_grooming"
                                className="flex h-[230px] flex-1 flex-col overflow-hidden rounded-[20px] bg-[#f5f5f5] transition-colors hover:bg-gray-200/70"
                            >
                                <span className="relative min-h-0 flex-1">
                                    <Image
                                        src="/landing/vah-grooming.webp"
                                        alt=""
                                        fill
                                        sizes="200px"
                                        className="object-contain p-2.5 [image-rendering:pixelated]"
                                    />
                                </span>
                                <span className="px-3.5 pb-2.5 pt-2">
                                    <span className="block font-pixel text-[13px] leading-relaxed text-gray-900">Grooming</span>
                                    <span className="mt-0.5 block text-xs text-gray-600">Bath, haircut and more, at home</span>
                                </span>
                            </Link>
                            <div className="flex flex-1 flex-col gap-2.5">
                                <Link
                                    href={href}
                                    data-cta="home_vah_neutering"
                                    className="flex h-[110px] flex-col justify-end rounded-[20px] bg-[#f5f5f5] px-3.5 pb-2.5 pt-2 transition-colors hover:bg-gray-200/70"
                                >
                                    <span className="font-pixel text-xs leading-relaxed text-gray-900">Neutering and Spaying</span>
                                    <span className="mt-0.5 text-xs text-gray-600">Done at home</span>
                                </Link>
                                <Link
                                    href={href}
                                    data-cta="home_vah_vaccination"
                                    className="flex h-[110px] flex-col justify-end rounded-[20px] bg-[#f5f5f5] px-3.5 pb-2.5 pt-2 transition-colors hover:bg-gray-200/70"
                                >
                                    <span className="font-pixel text-xs leading-relaxed text-gray-900">Vaccination</span>
                                    <span className="mt-0.5 text-xs text-gray-600">Core and rabies</span>
                                </Link>
                            </div>
                        </div>

                        <Link
                            href={href}
                            data-cta="home_vets_at_home_book"
                            className="mt-1.5 flex min-h-[58px] items-center justify-center rounded-2xl bg-primary font-pixel text-[13px] leading-relaxed text-white transition-opacity hover:opacity-90"
                        >
                            Book in the app →
                        </Link>
                        <p className="text-center text-xs text-gray-600">
                            {VETS_AT_HOME.city} only for now. Booking happens in the Paltuu app.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
