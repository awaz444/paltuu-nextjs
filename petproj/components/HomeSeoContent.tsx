import Link from "next/link";
import { VET_CITIES } from "@/lib/vetCities";

/**
 * Server-rendered body copy for the homepage. The rest of the page (HeroSection,
 * carousels) is "use client" and thin on crawlable prose, so this section is the
 * homepage's main indexable text — it targets the head term "pets in Pakistan"
 * and funnels internal-link equity with keyword-rich anchors ("vets near you",
 * "adopt a pet", city hubs). Keep it factual and in sync with what the linked
 * pages actually offer.
 */
export default function HomeSeoContent() {
  return (
    <section className="py-16 px-6 lg:px-20 bg-gray-50" aria-labelledby="pets-pakistan-heading">
      <div className="max-w-4xl mx-auto">
        <h2
          id="pets-pakistan-heading"
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6"
        >
          Everything for pets in Pakistan, in one place
        </h2>

        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>
            <strong>Paltuu.pk</strong> is the home for pets in Pakistan. Whether you
            want to{" "}
            <Link href="/browse-pets" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
              adopt a dog or cat
            </Link>
            , find a{" "}
            <Link href="/pet-care" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
              verified vet near you
            </Link>
            , buy the right food and supplies, or reunite a{" "}
            <Link href="/lost-and-found" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
              lost pet
            </Link>{" "}
            with its family, it starts here — across Karachi, Lahore, Islamabad, and
            the rest of the country.
          </p>

          <p>
            Thousands of pet parents use Paltuu to browse{" "}
            <Link href="/adopt" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
              pets available for adoption
            </Link>{" "}
            from shelters, rescues, and individual owners, read{" "}
            <Link href="/blogs" className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium">
              pet care guides written for Pakistan
            </Link>
            , and connect with a growing community documenting every pet in the
            country.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Adopt a pet by city
            </h3>
            <ul className="space-y-2 text-sm">
              {["Karachi", "Lahore", "Islamabad"].map((city) => (
                <li key={city}>
                  <Link
                    href={`/adopt/${city.toLowerCase()}`}
                    className="text-primary hover:underline"
                  >
                    Adopt a pet in {city}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/adopt" className="text-primary hover:underline font-medium">
                  All cities &amp; pet types →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Find a vet near you
            </h3>
            <ul className="space-y-2 text-sm">
              {VET_CITIES.map((city) => (
                <li key={city}>
                  <Link
                    href={`/pet-care/${city.toLowerCase()}`}
                    className="text-primary hover:underline"
                  >
                    Vets near me in {city}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/pet-care" className="text-primary hover:underline font-medium">
                  Browse all verified vets →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
