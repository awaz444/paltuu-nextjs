import { notFound } from "next/navigation";
import { getClinicDetail, getReviewStats } from "./data";
import ClinicDetailsClient from "./ClinicDetailsClient";

export default async function ClinicPage({ params }: { params: { id: string } }) {
    const clinic = await getClinicDetail(String(params.id));

    if (!clinic) {
        notFound();
    }

    const reviewStats = getReviewStats(clinic);

    return <ClinicDetailsClient initialClinic={clinic} initialReviewStats={reviewStats} />;
}
