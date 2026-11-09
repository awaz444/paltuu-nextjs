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
                        <Link
                            href={href}
                            data-cta="home_vah_doorstep_vet"
                            className="relative flex min-h-[132px] items-stretch overflow-hidden rounded-[20px] bg-[#f5f5f5] transition-colors hover:bg-gray-200/70"
                        >
                            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
                                Most booked
                            </span>
                            <span className="flex flex-1 flex-col justify-end p-3.5">
                                <span className="font-pixel text-[13px] leading-relaxed text-gray-900">Doorstep Vet</span>
                                <span className="mt-0.5 text-xs text-gray-600">Urgent or scheduled visits</span>
                            </span>
                            <Image
                                src="/landing/vah-stethoscope.webp"
                                alt=""
                                width={507}
                                height={493}
                                className="mr-2 w-32 self-center [image-rendering:pixelated]"
                            />
                        </Link>
                        <div className="flex gap-2.5">
                            <Link
                                href={href}
                                data-cta="home_vah_grooming"
                                className="flex min-h-[230px] flex-1 flex-col rounded-[20px] bg-[#f5f5f5] p-3.5 transition-colors hover:bg-gray-200/70"
                            >
                                <Image
                                    src="/landing/vah-grooming.webp"
                                    alt=""
                                    width={507}
                                    height={493}
                                    className="m-auto w-full max-w-[150px] [image-rendering:pixelated]"
                                />
                                <span className="font-pixel text-[13px] leading-relaxed text-gray-900">Grooming</span>
                                <span className="mt-0.5 text-xs text-gray-600">Bath, haircut and more, at home</span>
                            </Link>
                            <div className="flex flex-1 flex-col gap-2.5">
                                <Link
                                    href={href}
                                    data-cta="home_vah_neutering"
                                    className="flex flex-1 flex-col justify-end rounded-[20px] bg-[#f5f5f5] p-3.5 transition-colors hover:bg-gray-200/70"
                                >
                                    <span className="font-pixel text-xs leading-relaxed text-gray-900">Neutering and Spaying</span>
                                    <span className="mt-0.5 text-xs text-gray-600">Done at home</span>
                                </Link>
                                <Link
                                    href={href}
                                    data-cta="home_vah_vaccination"
                                    className="flex flex-1 items-end gap-1.5 rounded-[20px] bg-[#f5f5f5] p-3.5 transition-colors hover:bg-gray-200/70"
                                >
                                    <span className="flex flex-1 flex-col">
                                        <span className="font-pixel text-xs leading-relaxed text-gray-900">Vaccination</span>
                                        <span className="mt-0.5 text-xs text-gray-600">Core and rabies</span>
                                    </span>
                                    <Image
                                        src="/landing/vah-vaccine.webp"
                                        alt=""
                                        width={617}
                                        height={404}
                                        className="w-14 [image-rendering:pixelated]"
                                    />
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
