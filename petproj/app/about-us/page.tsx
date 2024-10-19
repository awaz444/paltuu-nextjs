"use client";

import Navbar from "@/components/navbar";
import Image from "next/image";

export default function AboutUs() {
    return (
        <>
            <Navbar />
            <main className="flex flex-col items-center p-8 bg-gray-100">
                {/* About the Website Section */}
                <section className="w-full max-w-5xl text-center mb-16">
                    <h1 className="text-4xl font-bold mb-6">
                        About Our Website
                    </h1>
                    <p className="text-lg">
                        Welcome to Paltuu, your one-stop platform for pet
                        adoption and fostering. Our mission is to make it easier
                        for pets to find loving homes and ensure they are well
                        taken care of. Whether you’re looking to adopt or
                        foster, we’re here to help you every step of the way.
                    </p>
                </section>

                {/* Meet the Devs Section */}
                <section className="w-full max-w-5xl text-center">
                    <h2 className="text-3xl font-bold mb-8">Meet the Devs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Dev 1 */}
                        <div className="flex flex-col items-center">
                            <Image
                                src="/dev1.jpeg" // Replace with actual image path
                                alt="Dev 1"
                                width={150}
                                height={150}
                                className="rounded-full mb-4"
                            />
                            <h3 className="text-xl font-bold mb-2">Dev 1</h3>
                            <p className="text-center mb-4">
                                Dev 1 is a backend developer passionate about
                                eating BFC. LA 4.0 GPA. Loves using Mashallah
                                API because of its ability to quickly spread
                                data. He listens to CAS because his ex liked
                                CAS. Listens to Future and other trap music when
                                he is not sad. Madrid Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/syed-ashhal/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                                <a
                                    href="https://github.com/dev1"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <i className="bi bi-github"></i>

                                </a>
                            </div>
                        </div>

                        {/* Dev 2 */}
                        <div className="flex flex-col items-center">
                            <Image
                                src="/dev2.jpeg" // Replace with actual image path
                                alt="Dev 2"
                                width={150}
                                height={150}
                                className="rounded-full mb-4"
                            />
                            <h3 className="text-xl font-bold mb-2">Dev 2</h3>
                            <p className="text-center mb-4">
                                Dev 2 is a frontend developer with a passion for
                                scraping. They will do every css task for u. Was
                                friends with Mahatma Gandhi, Socrates and many
                                other historic personailties. He hosted the Last
                                Supper for Jesus. Listens to NPC hip-hop and has
                                great bollywood taste. Madrid Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/syed-muhammad-shuja-ur-rahman-1024762ab/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                                <a
                                    href="https://github.com/dev2"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                                                        <i className="bi bi-github"></i>

                                </a>
                            </div>
                        </div>

                        {/* Dev 3 */}
                        <div className="flex flex-col items-center">
                            <Image
                                src="/dev3.jpg" // Replace with actual image path
                                alt="Dev 3"
                                width={150}
                                height={150}
                                className="rounded-full mb-4"
                            />
                            <h3 className="text-xl font-bold mb-2">Dev 3</h3>
                            <p className="text-center mb-4">
                                Dev 3 is a front-end developer with expertise in
                                designing. He will most likely marry a cousin of
                                his. He always gets BFC with Dev 1. He knows the
                                lyrics to every song and Dev 2 always can't
                                believe it. Listens to Ghazals, Carti and Indie
                                music at the same time. Barca Liverpool Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/aawaiz/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                                <a
                                    href="https://github.com/dev3"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <i className="bi bi-github"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
