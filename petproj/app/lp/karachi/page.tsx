import PakistanLanding from "@/components/landing/PakistanLanding";
import { homeMetadata } from "@/lib/homeMetadata";

/**
 * paltuu.pk's homepage for visitors in Karachi, where Vets at Home runs.
 * There is no public link to it: middleware.ts rewrites "/" here when Vercel
 * places the visitor in Karachi, and redirects direct visits to /lp/* back to
 * "/". Same metadata and canonical as app/page.tsx, since it is the same URL.
 */
export const revalidate = 900;

export const metadata = homeMetadata;

export default function KarachiHomePage() {
    return <PakistanLanding karachi />;
}
