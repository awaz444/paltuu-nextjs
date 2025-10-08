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
    faCat,
    faHeart,
    faBullseye,
    faEye,
    faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
{
    /* Add this to your global CSS */
}
import "./HeroSection.css";

const HeroSection = () => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Update the year unconditionally
    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <div className="font-montserrat bg-white">
            {/* Header */}

            {/* <header className="bg-primary text-primary py-4 px-4 md:px-6 lg:px-20 flex items-center justify-between rounded-b-[1rem] rounded-t-none shadow-lg">
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
            </header> */}

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
                                Available in{" "}
                                <span className="font-bold">Karachi,</span>{" "}
                                <span className="font-bold">Lahore</span> and{" "}
                                <span className="font-bold">Islamabad</span>
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
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-0 md:mb-1">
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
                            <h3 className="text-xl md:text-xl lg:text-2xl font-medium mb-0 md:mb-1">
                                {" "}
                                {/* Removed mb on mobile */}
                                Find Your New Best Friend
                            </h3>
                            <p className="text-base md:text-md text-gray-700 mb-6 mt-2 md:mb-8 max-w-lg">
                                <span className="font-bold">Paltuu.pk</span> is
                                Pakistan’s first pet adoption and pet care
                                platform, helping you adopt dogs and cats,
                                connect with vets, and shop pet products online.
                                {/* Hidden SEO links */}
                                <a href="/browse-pets" className="sr-only">
                                    Pet Adoption in Pakistan
                                </a>
                                <a href="/pet-care" className="sr-only">
                                    Connect with Vets in Pakistan
                                </a>
                                <a href="/bazaar" className="sr-only">
                                    Buy Pet Products Online in Pakistan
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Container for Founders Club + Cat */}
                    <div className="relative mt-10">
                        {/* Cat on the right (existing) */}
                        <div
                            className="z-2 absolute
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
                            <h4 className="text-xl md:text-2xl font-semibold text-primary flex justify-center items-center gap-3 relative z-10">
                                Why choose
                                <img
                                    src="/paltuu.png"
                                    alt="Paltuu"
                                    className="h-16 md:h-24 inline-block relative md:-top-2 md:-left-2 -top-1 -left-2"
                                />
                            </h4>

                            {/* Perks List */}
                            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-5">
                                <li>
                                    Largest network of adoptable pets in
                                    Pakistan
                                    <a href="/browse-pets" className="sr-only">
                                        Adopt cats and dogs in Pakistan
                                    </a>
                                </li>
                                <li>
                                    Trusted shelters and adoption centers
                                    nationwide
                                    <a href="/browse-pets" className="sr-only">
                                        Pet adoption in Karachi Lahore Islamabad
                                    </a>
                                </li>
                                <li>
                                    Shop pet food, accessories & grooming
                                    products online
                                    <a href="/bazaar" className="sr-only">
                                        Buy pet products online in Pakistan
                                    </a>
                                </li>
                                <li>
                                    24/7 veterinary guidance & pet care support
                                    <a href="/pet-care" className="sr-only">
                                        Find vets in Pakistan online
                                    </a>
                                </li>
                                <li>
                                    Location-based pet adoption and services
                                    <a href="/browse-pets" className="sr-only">
                                        Adopt pets near you in Pakistan
                                    </a>
                                </li>
                            </ul>

                            <a
                                href="/browse-pets"
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

            {/* NEW: Mission & Vision Sections - Theme Matched */}
            <section className="py-12 px-6 lg:px-20 bg-white relative">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Mission Card */}
                    {/* Mission Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
                        {/* Decorative paw in background */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10">
                            <FontAwesomeIcon
                                icon={faPaw}
                                className="text-primary w-full h-full"
                            />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <FontAwesomeIcon
                                    icon={faBullseye}
                                    className="text-primary text-xl"
                                />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-primary">
                                Our Mission
                            </h3>
                        </div>
                        <p className="text-gray-700 pl-1">
                            To revolutionize pet care in Pakistan by making{" "}
                            <strong>
                                pet adoption, veterinary care, and pet products
                            </strong>{" "}
                            easily accessible. Paltuu.pk connects pet lovers in{" "}
                            Karachi, Lahore, Islamabad and beyond with trusted{" "}
                            <strong>
                                adoptable pets, online pet stores, and vet
                                services
                            </strong>
                            .
                            <a href="/browse-pets" className="sr-only">
                                Adopt pets in Pakistan
                            </a>
                            <a href="/bazaar" className="sr-only">
                                Buy pet food and accessories online in Pakistan
                            </a>
                            <a href="/vets" className="sr-only">
                                Find vets in Karachi Lahore Islamabad
                            </a>
                        </p>
                    </div>

                    {/* Vision Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
                        {/* Decorative heart in background */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 opacity-10">
                            <FontAwesomeIcon
                                icon={faHeart}
                                className="text-primary w-full h-full"
                            />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <FontAwesomeIcon
                                    icon={faEye}
                                    className="text-primary text-xl"
                                />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-primary">
                                Our Vision
                            </h3>
                        </div>
                        <p className="text-gray-700 pl-1">
                            We envision a compassionate Pakistan where{" "}
                            <strong>every pet finds a loving home</strong> and{" "}
                            <strong>
                                pet owners can access food, grooming, and
                                healthcare
                            </strong>
                            through trusted platforms. From{" "}
                            <strong>adopting dogs and cats</strong> to shopping
                            for <strong>pet supplies online</strong>, Paltuu.pk
                            makes pet care simple and reliable.
                            <a href="/lost-and-found" className="sr-only">
                                Lost and found pets in Pakistan
                            </a>
                            <a href="/bazaar" className="sr-only">
                                Pet grooming and accessories store Pakistan
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            {/* Enhanced Features Grid */}
            <section className="py-16 px-6 lg:px-20 bg-primary">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Everything You Need For Your Pet
                        </h2>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            Paltuu.pk provides complete pet care solutions in
                            one place – from <strong>pet adoption</strong> to{" "}
                            <strong>
                                pet products and veterinary services
                            </strong>
                            .
                        </p>
                    </div>

                    {/* Features Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: faDog,
                                title: "Adopt Pets",
                                text: "Find cats, dogs & more looking for loving homes",
                                link: "/browse-pets",
                                delay: "100",
                            },
                            {
                                icon: faShoppingCart,
                                title: "Pet Products",
                                text: "Shop food, grooming & accessories online in Pakistan",
                                link: "/bazaar",
                                delay: "150",
                            },
                            {
                                icon: faStethoscope,
                                title: "Find Vets",
                                text: "Connect with trusted veterinary professionals near you",
                                link: "/vets",
                                delay: "200",
                            },
                            {
                                icon: faSearch,
                                title: "Lost & Found",
                                text: "Help reunite missing pets with their families",
                                link: "/lost-and-found",
                                delay: "300",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="relative overflow-hidden group rounded-xl p-8 text-center
          bg-gradient-to-b from-gray-100 to-white shadow-lg
          transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                                {/* Decorative circle */}
                                <div
                                    className={`
            absolute -bottom-20 -right-20 w-40 h-40
            bg-red-500/10 group-hover:bg-red-500/20
            rounded-full group-hover:scale-[2.5]
            transition-all duration-700 delay-${feature.delay}
          `}></div>

                                {/* Icon */}
                                <div className="relative z-10 mb-6">
                                    <div
                                        className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center
            group-hover:bg-primary/20 transition-colors duration-300">
                                        <FontAwesomeIcon
                                            icon={feature.icon}
                                            className="text-3xl text-primary"
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {feature.text}
                                    </p>
                                    <button
                                        className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full
            hover:bg-primary/90 transition-colors duration-300 shadow-sm">
                                        Learn More
                                    </button>
                                </div>

                                {/* Hidden SEO link */}
                                <a href={feature.link} className="sr-only">
                                    {feature.title} on Paltuu.pk
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Pet Section */}
            <section className="py-16 px-6 lg:px-20 bg-primary/5">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Text Content */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                            Adopt Cheeto – Dog Adoption in Lahore
                        </h2>
                        <p className="text-lg text-gray-700 mb-8 max-w-lg mx-auto lg:mx-0">
                            Meet <strong>Cheeto</strong>, a calm and cuddly
                            one-year-old stray dog available for{" "}
                            <strong>adoption in Lahore</strong>. Perfect for
                            families looking for a loving companion, he comes
                            vaccinated and neutered, ready to join his forever
                            home.
                        </p>

                        <div className="space-y-6 mb-8">
                            <div>
                                <h4 className="font-semibold text-lg">
                                    Perfect For You If:
                                </h4>
                                <ul className="text-gray-600 list-disc pl-5 space-y-1">
                                    <li>You want a low-energy companion</li>
                                    <li>
                                        You work from home or spend lots of time
                                        at home
                                    </li>
                                    <li>You love affectionate, cuddly pets</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-lg">
                                    Special Needs:
                                </h4>
                                <p className="text-gray-600">
                                    Requires sun protection due to light
                                    sensitivity
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="/browse-pets/279"
                                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-center
          hover:scale-105 transition-transform duration-300 shadow-lg">
                                Adopt Cheeto
                            </a>
                            <a
                                href="/browse-pets"
                                className="bg-white text-primary border border-primary px-6 py-3 rounded-full font-bold text-center
          hover:scale-105 transition-transform duration-300 shadow-lg">
                                Browse Other Pets
                            </a>
                        </div>

                        {/* Hidden SEO Links */}
                        <a href="/browse-pets" className="sr-only">
                            Dog adoption in Pakistan
                        </a>
                        <a href="/browse-pets?city=lahore" className="sr-only">
                            Adopt a dog in Lahore
                        </a>
                        <a href="/pet-care" className="sr-only">
                            Pet care services in Pakistan
                        </a>
                    </div>

                    {/* Right Column - Featured Pet Card */}
                    <div className="flex justify-center">
                        <div className="bg-white pt-4 pr-4 pl-4 rounded-3xl shadow-sm overflow-hidden border-2 border-primary hover:border-primary hover:scale-102 transition-all duration-300 w-full max-w-md">
                            <div className="relative">
                                <img
                                    src="https://res.cloudinary.com/dfwykqn1d/image/upload/v1744815787/vocg0o0zbnqxowcutgft.jpg"
                                    alt="Cheeto – adoptable dog in Lahore"
                                    className="w-full aspect-square object-cover rounded-2xl"
                                />
                               
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-2xl mb-1">
                                        Cheeto
                                    </h3>
                                    <span className="bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
                                        ♂ Male
                                    </span>
                                </div>

                                <p className="text-gray-600 mb-2">
                                    1 year old • Stray
                                </p>

                                <div className="flex items-center gap-2 text-gray-600 mb-3">
                                    <FontAwesomeIcon
                                        icon={faMapMarkerAlt}
                                        className="text-primary"
                                    />
                                    <span>Lahore, Gulberg</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faStar}
                                            className="text-yellow-400"
                                        />
                                        <span>Energy: 4/5</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faHeart}
                                            className="text-red-400"
                                        />
                                        <span>Cuddly: 5/5</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faDog}
                                            className="text-blue-400"
                                        />
                                        <span>Good with dogs</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon
                                            icon={faCat}
                                            className="text-purple-400"
                                        />
                                        <span>Good with cats</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Vaccinated
                                    </span>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Neutered
                                    </span>
                                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                        Needs company
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
        </div>
    );
};

export default HeroSection;
