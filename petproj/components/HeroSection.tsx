import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import {
    faPaw,
    faUsers,
    faDog,
    faSearch,
    faStethoscope,
    faMapMarkerAlt,
    faBars,
    faStar,
    faStarHalfAlt,
    faGift,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

const HeroSection = () => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Update the year unconditionally
    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <div className="font-montserrat bg-white">
            {/* Header */}

            <header className="bg-primary text-primary py-4 px-4 md:py-10 md:px-6 lg:px-20 flex items-center justify-between rounded-b-[1rem] rounded-t-none shadow-lg">
                <div className="logo">
                    <Image
                        src="/paltu_logo.svg"
                        alt="Logo"
                        width={250}
                        height={250}
                        className="w-32 md:w-48 lg:w-64"
                    />
                </div>
                <a
                    href="/login"
                    className="bg-white text-primary px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                    Login
                </a>
            </header>

            {/* Section - tight spacing on mobile */}
            <section className="bg-white text-black pt-6 pb-10 px-4 md:py-20 md:px-6 lg:px-20 md:mt-0">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-start">
                    {/* Text Content */}
                    <div className="text-center md:text-left flex flex-col items-center md:items-start relative md:top-[-15px]">
                        {/* Subheading Row - compact mobile, unchanged desktop */}
                        <div className="relative md:top-[50px] mb-2 md:mb-4 flex items-center gap-1 md:gap-2 justify-center md:justify-start md:left-[-50px]">
                            <Image
                                src="/swiggly.svg"
                                alt="Swiggly Icon"
                                width={60}
                                height={60}
                                className="w-12 md:w-20 -rotate-12"
                            />
                            <p className="text-xs md:text-sm text-primary italic tracking-wide relative top-[-6px] md:top-[-10px] left-[-4px] md:left-[-9px]">
                                Available in Karachi, Lahore and Islamabad
                            </p>
                        </div>

                        {/* Hero Headings */}
                        <div className="-mt-4 md:mt-0">
                            {" "}
                            {/* Reduced from -mt-6 */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-0 md:mb-1">
                                {" "}
                                {/* Removed mb on mobile */}
                                PAKISTAN'S
                            </h1>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight mb-0 md:mb-1">
                                {" "}
                                {/* Removed mb on mobile */}
                                <span className="text-primary">FIRST EVER</span>
                            </h1>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-2 md:mb-4">
                                {" "}
                                {/* Reduced mb on mobile */}
                                PAW PORTAL
                            </h1>
                            {/* Tagline */}
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-medium mb-0 md:mb-1">
                                {" "}
                                {/* Removed mb on mobile */}
                                Find Your New Best Friend
                            </h3>
                            {/* Description */}
                            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 max-w-lg">
                                {" "}
                                {/* Reduced mb on mobile */}
                                Paltuu is your go-to for everything{" "}
                                <span className="text-primary font-bold">
                                    pawsome
                                </span>
                                .
                            </p>
                        </div>
                    </div>

                    {/* Container for Founders Club + Cat */}
                    <div className="relative mt-10">
                        {/* Cat on the right (existing) */}
                        <div
                            className=" z-20 absolute 
                            -top-[4.05rem] right-2 w-28 h-28       /* Mobile */
                            md:-top-[4.6rem] md:right-2 md:w-32 md:h-32  /* Tablet */
                            lg:-top-[5.4rem] lg:-right-20 lg:w-64 lg:h-64">
                            <Image
                                src="/cat-on-box.png"
                                alt="Fun cat illustration"
                                width={150}
                                height={150}
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Founders Club Block */}
                        <div className="bg-primary/5 border border-primary rounded-2xl p-8 text-center shadow-md relative z-0 overflow-hidden">
                            {/* Dog peeking from bottom left inside the box */}
                            <div
                                className="absolute 
                                bottom-0 left-0 w-20 h-20        /* Mobile */
                                md:bottom-0 md:left-0 md:w-24 md:h-24  /* Tablet */
                                lg:-bottom-4 lg:w-32 lg:h-32">
                                <Image
                                    src="/dog-peekingi.png"
                                    alt="Cute dog peeking"
                                    width={112}
                                    height={112}
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Heading with primary_icon.svg */}
                            <h4 className="text-xl md:text-2xl font-semibold text-primary mb-6 flex justify-center items-center gap-3 relative z-10">
                                Why choose Paltuu?
                            </h4>

                            {/* Perks List */}
                            <ul className="text-base md:text-lg text-gray-800 text-left space-y-4 mb-8 relative z-10">
                                <li className="flex items-start gap-3">
                                    <FontAwesomeIcon
                                        icon={faPaw}
                                        className="text-primary mt-1"
                                    />
                                    Largest network of adoptable pets
                                </li>
                                <li className="flex items-start gap-3">
                                    <FontAwesomeIcon
                                        icon={faUsers}
                                        className="text-primary mt-1"
                                    />
                                    Verified shelters & breeders
                                </li>
                                <li className="flex items-start gap-3">
                                    <FontAwesomeIcon
                                        icon={faStar}
                                        className="text-primary mt-1"
                                    />
                                    24/7 veterinary support
                                </li>
                                <li className="flex items-start gap-3">
                                    <FontAwesomeIcon
                                        icon={faMapMarkerAlt}
                                        className="text-primary mt-1"
                                    />
                                    Location-based services
                                </li>
                            </ul>

                            <a
                                href="/sign-up"
                                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 md:px-10 md:py-4 rounded-full text-sm md:text-lg shadow-lg hover:scale-105 transition-transform duration-300 relative z-10 whitespace-nowrap">
                                <Image
                                    src="/white_icon.svg"
                                    alt="Icon"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 md:w-5 md:h-5"
                                />
                                <span className="truncate">Go To Paltuu</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Founders Badge Showcase */}
            <section className="py-16 px-6 lg:px-20 bg-primary text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">
                        Earn Your Exclusive Founders Badge
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 mb-6">
                        As a founding member, you'll receive a unique badge that
                        highlights your early support and commitment to building
                        a better future for pets across Pakistan.
                    </p>
                    <div className="flex justify-center">
                        <Image
                            src="/white_icon.svg"
                            alt="Founders Badge"
                            width={80}
                            height={80}
                        />
                    </div>
                    <p className="mt-4 text-sm text-white/70">
                        Your badge will appear proudly on your profile and in
                        community interactions.
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-8 py-16 px-6 lg:px-20 bg-white">
                {[
                    {
                        icon: faDog,
                        title: "Adopt & Foster",
                        text: "Browse pets looking for loving homes",
                    },
                    {
                        icon: faStethoscope,
                        title: "Find Vets",
                        text: "Connect with trusted veterinary professionals",
                    },
                    {
                        icon: faSearch,
                        title: "Lost & Found",
                        text: "Help reunite pets with their families",
                    },
                    {
                        icon: faMapMarkerAlt,
                        title: "City-Based Listings",
                        text: "Explore listings based on your location",
                    },
                ].map((feature, index) => (
                    <div
                        key={index}
                        className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                        <FontAwesomeIcon
                            icon={feature.icon}
                            className="text-4xl text-primary mb-4"
                        />
                        <h3 className="text-xl font-semibold mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.text}</p>
                    </div>
                ))}
            </section>

            {/* Testimonials */}
            {/* <section className="py-16 px-6 lg:px-20 bg-gray-50">
                <h2 className="text-3xl font-bold text-center mb-12">
                    What Our Users Say
                </h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { name: "Sarah J.", review: "Found the perfect companion through Paltuu. Truly a blessing!", img: "/assets/man1.jpg" },
                        { name: "Mike R.", review: "Smooth adoption process and an amazing team. Highly recommend!", img: "/assets/man2.jpg" },
                        { name: "Emma W.", review: "Thanks to Paltuu, we reunited with our lost cat in just two days!", img: "/assets/man3.jpg" },
                    ].map((review, index) => (
                        <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-4">
                                <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full object-cover mr-4" />
                                <div>
                                    <h3 className="font-semibold">{review.name}</h3>
                                    <div className="flex text-secondary">
                                        {[...Array(4)].map((_, i) => <FontAwesomeIcon icon={faStar} key={i} />)}
                                        <FontAwesomeIcon icon={faStarHalfAlt} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-600">{review.review}</p>
                        </div>
                    ))}
                </div>
            </section> */}

            <footer className="text-white p-6 rounded-t-[3rem] rounded-b-none bg-primary">
                <div className="container mx-auto text-center">
                    <div className="mb-4">
                        <Image
                            src="/paltu_logo.svg"
                            alt="Logo"
                            className="mx-auto"
                            width={250}
                            height={100}
                        />
                    </div>
                    <div className="mb-4">
                        <p>Follow us on Instagram</p>
                        <a
                            href="https://instagram.com/paltuu.pk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:underline">
                            @paltuu.pk
                        </a>
                    </div>
                    <div className="mb-4">{/* for about us */}</div>
                    <p className="text-sm">
                        &copy; {currentYear} Paltuu. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default HeroSection;
