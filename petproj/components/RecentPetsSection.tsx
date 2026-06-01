"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { EnvironmentOutlined } from "@ant-design/icons";
import { formatAge } from "@/utils/formatAge";

interface Pet {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    age_months: number;
    city: string;
    listing_type: string;
    image_url: string | null;
    sex: string | null;
}

export default function RecentPetsSection() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/browse-pets?page=1&limit=3")
            .then((r) => r.json())
            .then((data) => {
                setPets(data.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading || pets.length === 0) return null;

    return (
        <section
            aria-label="Recently listed pets for adoption in Pakistan"
            className="py-16 px-6 lg:px-20 bg-primary"
        >
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Pets Up for Adoption in Pakistan
                    </h2>
                    <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
                        Thousands of dogs, cats, and more are waiting for a loving home.
                        Find verified pets for adoption in{" "}
                        <span className="font-semibold text-white">Karachi</span>,{" "}
                        <span className="font-semibold text-white">Lahore</span>, and{" "}
                        <span className="font-semibold text-white">Islamabad</span>.
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {pets.map((pet) => (
                        <Link key={pet.pet_id} href={`/browse-pets/${pet.pet_id}`}>
                            <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                <div className="relative aspect-square overflow-hidden">
                                    <img
                                        src={pet.image_url || "/dog-placeholder.png"}
                                        alt={`${pet.pet_name}${pet.pet_breed ? ` – ${pet.pet_breed}` : ""} available for pet adoption in Pakistan`}
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
                                        <EnvironmentOutlined className="text-primary" />
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
                        View All Adoptable Pets →
                    </Link>
                </div>
            </div>
        </section>
    );
}
