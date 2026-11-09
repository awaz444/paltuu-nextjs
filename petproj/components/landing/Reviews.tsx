import { HOME_TESTIMONIALS } from "@/lib/homeContent";

/**
 * What pet parents say. ⚠️ HOME_TESTIMONIALS are still the founder's
 * placeholders (lib/homeContent.ts), which is why there is no Review JSON-LD.
 * Swap in real reviews there; this component needs no change.
 */
export default function Reviews({ subtitle }: { subtitle: string }) {
    return (
        <section aria-labelledby="reviews-heading" className="bg-primary px-5 py-12 md:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 id="reviews-heading" className="text-xl font-semibold text-white md:text-[28px]">
                    What pet parents say
                </h2>
                <p className="mb-5 mt-1.5 text-sm text-white/85">{subtitle}</p>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    {HOME_TESTIMONIALS.map((t) => (
                        <figure key={t.name} className="flex flex-col gap-3.5 rounded-3xl bg-white p-5">
                            <blockquote className="text-sm leading-relaxed text-gray-700">“{t.quote}”</blockquote>
                            <figcaption className="mt-auto flex items-center gap-2.5">
                                <span aria-hidden="true" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary-tint text-[13px] font-bold text-primary">
                                    {t.name.charAt(0)}
                                </span>
                                <span className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{t.name}</span>
                                    <span className="text-xs text-gray-600">{t.city}</span>
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
