"use client";

import Navbar from "@/components/navbar";
import Image from "next/image";
import './about-us.css'
import '../globals.css';


export default function AboutUs() {
    return (
        <>
            <Navbar />
            <main className="flex flex-col items-center p-8 bg-gray-100">
                {/* About the Website Section */}
                <section className="w-full max-w-5xl text-center mb-16">
                    <p className="text-lg">
                        Welcome to Paltuu, your one-stop platform for pet
                        adoption and fostering. Our mission is to make it easier
                        for pets to find loving homes and ensure they are well
                        taken care of. Whether you&apos;re looking to adopt or
                        foster, we&apos;re here to help you every step of the
                        way.
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
                                he&apos;s not sad. Madrid Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/syed-ashhal/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-linkedin social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://github.com/ashhalll"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-github social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                    </svg>
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
                                scraping. They will do every css task for you.
                                Was friends with Mahatma Gandhi, Socrates and
                                many other historic personalities. He hosted the
                                Last Supper for Jesus. Listens to NPC hip-hop
                                and has great bollywood taste. Madrid Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/syed-muhammad-shuja-ur-rahman-1024762ab/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-linkedin social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://github.com/shuja-16"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-github social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                    </svg>
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
                                lyrics to every song and Dev 2 always can&apos;t
                                believe it. Listens to Ghazals, Carti and Indie
                                music at the same time. Barca Liverpool Fan.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/aawaiz/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-linkedin social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://github.com/AawaizAli"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-github social-icon"
                                        viewBox="0 0 16 16">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
