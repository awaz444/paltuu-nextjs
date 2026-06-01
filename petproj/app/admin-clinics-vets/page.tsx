import { redirect } from "next/navigation";

// This page has been consolidated into /manage-clinics
export default function AdminClinicsVetsRedirect() {
    redirect("/manage-clinics");
}
