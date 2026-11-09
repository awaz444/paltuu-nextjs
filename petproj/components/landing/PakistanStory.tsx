import { HOME_STATS, HOME_TESTIMONIALS } from "@/lib/homeContent";

/**
 * paltuu.org only: the Pakistan case study, told to an international visitor.
 * Figures are the founder's (HOME_STATS), never DB counts. Mentions no
 * Pakistan-only service (vets, Vets at Home): those aren't offered on .org.
 */
export default function PakistanStory() {
    return (
        <section aria-labelledby="story-heading" className="bg-primary px-5 py-12 text-white md:py-20">
            <div className="mx-auto max-w-6xl">
                <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-white/75">Where it started</p>
                <h2 id="story-heading" className="max-w-3xl text-[26px] font-bold leading-tight md:text-[42px]">
                    We built Paltuu in Pakistan. Pakistan made it home.
                </h2>
                <p className="mb-7 mt-3 max-w-2xl text-[15px] leading-relaxed text-white/90">
                    Pets there were being rehomed through scattered social media groups, with no way to tell who was real.
                    Paltuu gave owners and shelters one place to list, and adopters one place to look. It became
                    Pakistan&apos;s first pet super app.
                </p>

                <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {HOME_STATS.map((s) => (
                        <li key={s.label} className="rounded-[20px] bg-white p-4 text-gray-900">
                            <p className="text-2xl font-bold text-primary md:text-[32px]">
                                {s.value.toLocaleString("en-US")}
                                {s.suffix}
                            </p>
                            <p className="mt-0.5 text-[13px] text-gray-600">{s.label.toLowerCase()}</p>
                        </li>
                    ))}
                </ul>

                <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    {HOME_TESTIMONIALS.map((t) => (
                        <figure key={t.name} className="flex flex-col gap-3 rounded-[20px] border border-white/25 bg-white/10 p-4">
                            <blockquote className="text-sm leading-relaxed">“{t.quote}”</blockquote>
                            <figcaption className="mt-auto text-[13px] text-white/85">
                                <strong className="text-white">{t.name}</strong> · {t.city}, Pakistan
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
