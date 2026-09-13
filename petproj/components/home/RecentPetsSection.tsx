import Link from "next/link";
import { MapPin } from "lucide-react";
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
            className="py-16 md:py-20 px-6 lg:px-20 bg-primary"
        >
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-10 max-w-2xl mx-auto">
                    <h2
                        id="recent-pets-heading"
                        className="text-3xl md:text-4xl font-extrabold text-white mb-3"
                    >
                        Recently listed by owners and shelters
                    </h2>
                    <p className="text-white/90 text-base md:text-lg">
                        Real pets, listed by real people across{" "}
                        <span className="font-semibold text-white">Karachi</span>,{" "}
                        <span className="font-semibold text-white">Lahore</span> and{" "}
                        <span className="font-semibold text-white">Islamabad</span>. Apply
                        and you talk to whoever is rehoming them.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {pets.map((pet) => (
                        <Link key={pet.pet_id} href={`/browse-pets/${pet.pet_id}`}>
                            <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
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
                                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                                        {pet.pet_name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-2 truncate">
                                        {formatAge(pet.age_months)}
                                        {pet.pet_breed ? ` · ${pet.pet_breed}` : ""}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                        <MapPin size={14} className="text-primary" aria-hidden="true" />
                                        <span>{pet.city}</span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        href="/browse-pets"
                        aria-label="Browse all pets available for adoption in Pakistan"
                        className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 text-base"
                    >
                        View all adoptable pets →
                    </Link>
                </div>
            </div>
        </section>
    );
}
