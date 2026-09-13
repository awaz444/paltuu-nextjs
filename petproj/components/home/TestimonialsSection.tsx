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
            className="py-16 md:py-20 px-6 lg:px-20 bg-primary"
            aria-labelledby="testimonials-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <h2
                        id="testimonials-heading"
                        className="text-3xl md:text-4xl font-extrabold text-white mb-4"
                    >
                        Loved by the community
                    </h2>
                    <p className="text-lg text-white/90">
                        Don&apos;t just take our word for it — hear from pet lovers across
                        Pakistan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {HOME_TESTIMONIALS.map((testimonial, index) => (
                        <Reveal key={testimonial.name} delay={index * 0.06} className="h-full">
                            <figure className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                                <blockquote className="mb-6 flex-grow">
                                    <p className="text-gray-700 italic text-lg leading-relaxed">
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
