import PakistanLanding from "@/components/landing/PakistanLanding";
import { homeMetadata } from "@/lib/homeMetadata";

/**
 * paltuu.pk's homepage for visitors outside Karachi. middleware.ts serves
 * app/lp/karachi at this same URL to Karachi visitors and app/lp/international
 * on paltuu.org.
 *
 * ISR, refreshed every 15 minutes so the listings stay current. Keep it
 * statically renderable: nothing in this tree may call headers() or cookies().
 * Per-visitor choices happen in middleware (before the CDN) or client-side.
 */
export const revalidate = 900;

export const metadata = homeMetadata;

export default function HomePage() {
    return <PakistanLanding />;
}
