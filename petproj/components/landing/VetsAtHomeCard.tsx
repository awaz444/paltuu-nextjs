import Image from "next/image";
import Link from "next/link";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * Vets at Home for visitors outside Karachi (the Pakistan page): still shown,
 * so people know it exists, but lower down and marked Karachi only. Set in the
 * app's pixel face like every other Vets at Home mention. No prices.
 */
export default function VetsAtHomeCard() {
    return (
        <Link
            href={VETS_AT_HOME.deepLink}
            data-cta="home_vets_at_home_pk"
            className="mt-5 flex flex-col gap-1 rounded-3xl border-2 border-primary bg-white p-4 transition-colors hover:bg-primary-faint md:flex-row md:items-center md:gap-5 md:px-5"
        >
            <Image
                src="/landing/vet-scooter.webp"
                alt="A Paltuu vet riding a scooter to a pet's home"
                width={1600}
                height={893}
                sizes="220px"
                className="h-auto w-[220px] max-w-full shrink-0"
            />
            <span className="flex flex-col gap-1.5">
                <span className="flex flex-wrap items-center gap-2.5">
                    <span className="font-pixel text-base leading-relaxed text-gray-900 md:text-lg">Vets at Home</span>
                    <span className="rounded-full bg-primary px-2.5 py-0.5 font-pixel text-[9px] leading-relaxed text-white">
                        {VETS_AT_HOME.city} only
                    </span>
                </span>
                <span className="text-sm leading-relaxed text-gray-600">
                    Paltuu&apos;s own certified vets come to your door for check-ups, vaccination, neutering and grooming.
                </span>
                <span className="text-sm font-semibold text-primary">In {VETS_AT_HOME.city}? Book in the app →</span>
            </span>
        </Link>
    );
}
