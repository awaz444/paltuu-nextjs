import Link from "next/link";
import { formatAge } from "@/utils/formatAge";
import type { RecentPet } from "@/lib/recentPets";

/**
 * Live proof that the listings are real, rendered on the server.
 *
 * The heading names the source of the pets ("listed by owners and shelters")
 * rather than implying Paltuu is offering them, which is the same correction the
 * rest of the page makes.
 */
export default function RecentPetsSection({ pets }: { pets: RecentPet[] }) {
    if (pets.length === 0) return null;

    return (
        <section
            aria-labelledby="recent-pets-heading"
            className="bg-primary px-6 lg:px-12 py-14 md:py-20"
        >
            <div className="max-w-6xl mx-auto">
                <header className="max-w-2xl mb-9">
                    <h2
                        id="recent-pets-heading"
                        className="text-2xl md:text-3xl font-extrabold text-white mb-3"
                    >
                        Recently listed by owners and shelters
                    </h2>
                    <p className="text-base text-white/90 leading-relaxed">
                        Real pets, listed by real people across{" "}
                        <span className="font-semibold text-white">Karachi</span>,{" "}
                        <span className="font-semibold text-white">Lahore</span> and{" "}
                        <span className="font-semibold text-white">Islamabad</span>. Apply
                        and you talk to whoever is rehoming them.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    {pets.map((pet) => (
                        <Link key={pet.pet_id} href={`/browse-pets/${pet.pet_id}`}>
                            <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
                                <div className="relative aspect-square overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={pet.image_url || "/dog-placeholder.png"}
                                        alt={`${pet.pet_name}${
                                            pet.pet_breed ? ` – ${pet.pet_breed}` : ""
                                        } available for pet adoption in ${pet.city}, Pakistan`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {pet.listing_type === "rescue" && (
                                        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            + Rescue
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                                        {pet.pet_name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-2 truncate">
                                        {formatAge(pet.age_months)}
                                        {pet.pet_breed ? ` · ${pet.pet_breed}` : ""}
                                    </p>
                                    <p className="text-sm font-medium text-primary">
                                        {pet.city}
                                    </p>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                <div className="">
                    <Link
                        href="/browse-pets"
                        aria-label="Browse all pets available for adoption in Pakistan"
                        className="inline-flex items-center gap-2 bg-white text-primary font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                    >
                        View all adoptable pets →
                    </Link>
                </div>
            </div>
        </section>
    );
}
