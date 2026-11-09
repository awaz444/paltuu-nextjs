import { redirect } from "next/navigation";

// Applications are reviewed on My Listings now, next to each listing (PALTU-141).
// This route stays because emails already sent link to it
// (/adoption-applicants?pet_id=…): send them to the same listing there.
export default function AdoptionApplicants({ searchParams }: { searchParams: { pet_id?: string } }) {
    const petId = Number(searchParams?.pet_id);
    redirect(Number.isInteger(petId) && petId > 0 ? `/my-listings?pet=${petId}` : "/my-listings");
}
