import { notFound, permanentRedirect } from "next/navigation";
import { getClinicDetail, getReviewStats } from "./data";
import ClinicDetailsClient from "./ClinicDetailsClient";

export default async function ClinicPage({ params }: { params: { id: string } }) {
    const clinic = await getClinicDetail(String(params.id));

    if (!clinic) {
        notFound();
    }

    // Old numeric URLs (/pet-care/clinic/546) were indexed as a second copy of the
    // clinic page. Send them to the slug URL, looked up live so a rename still lands.
    if (/^\d+$/.test(String(params.id)) && clinic.slug && clinic.slug !== String(params.id)) {
        permanentRedirect(`/pet-care/clinic/${encodeURIComponent(clinic.slug)}`);
    }

    const reviewStats = getReviewStats(clinic);

    return <ClinicDetailsClient initialClinic={clinic} initialReviewStats={reviewStats} />;
}
