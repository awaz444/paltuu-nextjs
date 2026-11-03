import Link from "next/link";
import { db } from "@/db/index";
import { formatAge } from "@/utils/formatAge";

type PetRow = {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    age_months: number | null;
    city: string;
    image_url: string | null;
};

// Same availability filters as /browse-pets and the /adopt pages.
async function getRecentPets(): Promise<PetRow[]> {
    try {
        const res = await db.query(
            `SELECT p.pet_id, p.pet_name, p.pet_breed, p.age_months, c.city_name AS city,
                    (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
             FROM pets p
             JOIN users u ON p.owner_id = u.user_id
             JOIN cities c ON p.city_id = c.city_id
             WHERE p.adoption_status = 'available' AND p.approved = true
             ORDER BY p.created_at DESC
             LIMIT 6`
        );
        return res.rows;
    } catch (e) {
        console.error("Pet not-found: recent pets query failed", e);
        return [];
    }
}

/**
 * A listing that was deleted. Popular listings keep getting visits from Google
 * after the owner removes them, so instead of a dead end this shows the newest
 * pets and keeps the visitor browsing. Returns a real 404 status.
 */
export default async function PetNotFound() {
    const pets = await getRecentPets();

    return (
        <main className="min-h-screen bg-white px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto max-w-5xl">
                <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/features/sad-cat.jpg" alt="" aria-hidden width={112} height={112} className="mx-auto h-28 w-28" />
                    <h1 className="mt-3 text-2xl font-bold text-gray-900">This pet isn&apos;t listed any more</h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                        They may have found a home, or the owner took the listing down. These pets were listed recently:
                    </p>
                </div>

                {pets.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
                        {pets.map((pet) => (
                            <Link key={pet.pet_id} href={`/browse-pets/${pet.pet_id}`} className="block">
                                <article className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <div className="aspect-square overflow-hidden bg-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={pet.image_url || "/dog-placeholder.png"}
                                            alt={`${pet.pet_name}${pet.pet_breed ? ` – ${pet.pet_breed}` : ""} for adoption in ${pet.city}`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h2 className="truncate text-[15px] font-semibold text-gray-900">{pet.pet_name}</h2>
                                        <p className="truncate text-xs text-gray-500">
                                            {formatAge(pet.age_months)}
                                            {pet.pet_breed ? ` · ${pet.pet_breed}` : ""}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">{pet.city}</p>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/browse-pets"
                        className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-[15px] font-semibold text-white hover:opacity-90 sm:w-auto"
                    >
                        Browse all pets
                    </Link>
                    <Link
                        href="/adopt/cats"
                        className="flex h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-[15px] font-semibold text-gray-800 hover:border-primary hover:text-primary sm:w-auto"
                    >
                        Cats for adoption
                    </Link>
                    <Link
                        href="/adopt/dogs"
                        className="flex h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-[15px] font-semibold text-gray-800 hover:border-primary hover:text-primary sm:w-auto"
                    >
                        Dogs for adoption
                    </Link>
                </div>
            </div>
        </main>
    );
}
