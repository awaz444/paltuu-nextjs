import Link from "next/link";
import Image from "next/image";
import { APP_LINKS } from "@/lib/homeContent";

/**
 * Both store badges are sized by height with width auto — the two SVGs have
 * different aspect ratios, so matching their widths made them sit at different
 * heights.
 *
 * `imgClassName` exists for the promo banners, which need a shorter badge than
 * the h-10 the landing page sections use. Override the height there, not the
 * width, for the reason above.
 */
export default function AppStoreBadges({
    className = "",
    imgClassName = "h-10 w-auto",
}: {
    className?: string;
    imgClassName?: string;
}) {
    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            <Link
                href={APP_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get Paltuu on Google Play"
            >
                <Image
                    src="/app-download-badges/google-play-badge.svg"
                    alt="Get it on Google Play"
                    width={162}
                    height={48}
                    className={imgClassName}
                />
            </Link>
            <Link
                href={APP_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download Paltuu on the App Store"
            >
                <Image
                    src="/app-download-badges/app-store-badge.svg"
                    alt="Download on the App Store"
                    width={144}
                    height={48}
                    className={imgClassName}
                />
            </Link>
        </div>
    );
}
