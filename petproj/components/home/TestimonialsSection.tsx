import Reveal from "./Reveal";
import { HOME_TESTIMONIALS } from "@/lib/homeContent";

/**
 * Community quotes.
 *
 * Deliberately NOT marked up as Review/AggregateRating structured data — these
 * are placeholder quotes, and marking up reviews that aren't verifiable is a
 * structured-data policy violation that risks the whole domain. They render as
 * plain HTML until real reviews replace them.
 */
export default function TestimonialsSection() {
    return (
        <section
            className="bg-primary px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="testimonials-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl mb-9">
                    <h2
                        id="testimonials-heading"
                        className="text-2xl md:text-3xl font-extrabold text-white mb-3"
                    >
                        Loved by the community
                    </h2>
                    <p className="text-base text-white/90 leading-relaxed">
Hear from pet lovers across Pakistan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {HOME_TESTIMONIALS.map((testimonial, index) => (
                        <Reveal key={testimonial.name} delay={index * 0.06} className="h-full">
                            <figure className="bg-white p-6 rounded-xl flex flex-col h-full">
                                <blockquote className="mb-5 flex-grow">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        &ldquo;{testimonial.quote}&rdquo;
                                    </p>
                                </blockquote>
                                <figcaption className="flex items-center gap-4 border-t border-gray-100 pt-4">
                                    <span
                                        aria-hidden="true"
                                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary"
                                    >
                                        {testimonial.name.charAt(0)}
                                    </span>
                                    <span>
                                        <span className="block font-bold text-gray-900 text-sm">
                                            {testimonial.name}
                                        </span>
                                        <span className="block text-xs text-gray-500">
                                            {testimonial.city}
                                        </span>
                                    </span>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
