"use client";

import React from "react";
import Link from "next/link";
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
    faBath,
    faHome,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
// import PaltuuBazaarSection from "./PaltuuBazaarSection"; // Phase 1: Bazaar paused
{
    /* Add this to your global CSS */
}
import "./HeroSection.css";

const HeroSection = () => {

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
                    href="/auth"
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
                                Connecting pets and parents across
                                <span className="font-bold"> Pakistan</span>
                            </p>
                        </div>

                        {/* Hero Headings */}
                        <div className="-mt-4 md:mt-0">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-2 md:mb-4">
                                <span className="block mb-0 md:mb-1">PAKISTAN'S</span>
                                <span className="block text-primary mb-0 md:mb-1">FIRST EVER</span>
                                <span className="block">PET ADOPTION</span>
                                <span className="block">PLATFORM</span>
                            </h1>
                            {/* Tagline */}
                            <h3 className="text-xl md:text-xl lg:text-2xl font-medium mb-0 md:mb-1">
                                Get the Best for Your Pet —{" "}
                                {/* <Link href="/bazaar" className="underline decoration-gray-400 hover:decoration-black text-black">
                                    Shop Bazaar
                                </Link> */}
                                <Link href="/marketplace" className="underline decoration-gray-400 hover:decoration-black text-black">
                                    Shop Now
                                </Link>
                            </h3>
                            <p className="text-base md:text-md text-gray-700 mb-6 mt-2 md:mb-8 max-w-lg">
                                <span className="font-bold">Paltuu.pk</span> is Pakistan's first pet adoption and pet care platform, helping you{" "}
                                <Link href="/browse-pets" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                    adopt dogs and cats
                                </Link>
                                ,{" "}
                                <Link href="/pet-care" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                    connect with vets
                                </Link>
                                , and{" "}
                                <Link href="/marketplace" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                    shop pet products online
                                </Link>.
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
                                <ul className="space-y-3">
                                    <li>
                                        Find and{" "}
                                        <Link href="/browse-pets" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                            adopt pets in Pakistan
                                        </Link>{" "}
                                        from trusted shelters.
                                    </li>
                                    <li>
                                        Connect with{" "}
                                        <Link href="/browse-pets" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                            shelters in Karachi, Lahore, and Islamabad
                                        </Link>.
                                    </li>
                                    <li>
                                        <Link href="/marketplace" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                            Shop pet food & accessories
                                        </Link>{" "}
                                        online with nationwide delivery.
                                    </li>
                                    <li>
                                        <Link href="/pet-care" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                            Find vets in Pakistan
                                        </Link>{" "}
                                        and get expert pet care guidance.
                                    </li>
                                    <li>
                                        <Link href="/browse-pets" className="text-black underline decoration-gray-400 hover:decoration-black font-medium">
                                            Adopt pets near you
                                        </Link>{" "}
                                        with our matching algorithm.
                                    </li>
                                </ul>
                            </ul>

                            <Link
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
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Paltuu Bazaar Section */}
            {/* <PaltuuBazaarSection /> */}{/* Phase 1: Bazaar paused */}

            {/* How Paltuu Works Section */}
            <section className="pt-10 pb-20 px-6 lg:px-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 flex items-center justify-center gap-2 md:gap-4">
                            How
                            <img
                                src="/paltuu.png"
                                alt="Paltuu"
                                className="h-24 md:h-40 object-contain pb-4"
                            />
                            Works
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Your journey to pet parenthood in four simple steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden lg:block absolute top-[2.5rem] left-[12%] right-[12%] h-0.5 bg-gray-200 -z-0"></div>

                        {[
                            {
                                icon: faSearch,
                                title: "Discover",
                                desc: "Find adoptable pets in your city",
                            },
                            {
                                icon: faUsers,
                                title: "Apply & Connect",
                                desc: "Fill the adoption form and contact the owner or shelter",
                            },
                            {
                                icon: faEye,
                                title: "Verify & Decide",
                                desc: "Ask questions and confirm suitability",
                            },
                            {
                                icon: faHome,
                                title: "Welcome Them Home",
                                desc: "Arrange pickup or use Paltuu’s Pet delivery support",
                            },
                        ].map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center relative z-10">
                                <div className="w-20 h-20 rounded-full bg-white border-4 border-primary/10 flex items-center justify-center mb-6 shadow-sm">
                                    <FontAwesomeIcon
                                        icon={step.icon}
                                        className="text-2xl text-primary"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed px-4">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
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
                            one place, from <strong>pet adoption</strong> to{" "}
                            <strong>
                                pet products and veterinary services
                            </strong>
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
                                buttonText: "Adopt Now",
                            },
                            {
                                icon: faCat,
                                title: "Cat Food",
                                text: "Premium cat food, treats & nutrition for your feline",
                                link: "/marketplace/cat-food",
                                delay: "150",
                                buttonText: "Shop Cat Food",
                            },
                            {
                                icon: faDog,
                                title: "Dog Food",
                                text: "Quality dog food & treats for your canine",
                                link: "/marketplace/dog-food",
                                delay: "200",
                                buttonText: "Shop Dog Food",
                            },
                            {
                                icon: faShoppingCart,
                                title: "Pet Litter",
                                text: "Cat litter, training pads & hygiene products",
                                link: "/marketplace/litter",
                                delay: "250",
                                buttonText: "Buy Litter",
                            },
                            {
                                icon: faHeart,
                                title: "Pet Grooming",
                                text: "Shampoos, brushes & grooming essentials",
                                link: "/marketplace?category=grooming", // Phase 1: was /bazaar?category=grooming
                                delay: "300",
                                buttonText: "Shop Grooming",
                            },
                            {
                                icon: faGift,
                                title: "Pet Accessories",
                                text: "Toys, collars, beds & fun accessories for pets",
                                link: "/marketplace?category=accessories", // Phase 1: was /bazaar?category=accessories
                                delay: "350",
                                buttonText: "Shop Accessories",
                            },
                            {
                                icon: faStethoscope,
                                title: "Find Vets",
                                text: "Connect with trusted vets near you",
                                link: "/pet-care",
                                delay: "400",
                                buttonText: "Find Vets",
                            },

                            {
                                icon: faSearch,
                                title: "Lost & Found",
                                text: "Help reunite missing pets with their families",
                                link: "/lost-and-found",
                                delay: "450",
                                buttonText: "Report Pet",
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
                                    <Link
                                        href={feature.link}
                                        className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full
            hover:bg-primary/90 transition-colors duration-300 shadow-sm inline-block">
                                        {feature.buttonText}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact / Numbers Section */}
            <section className="py-12 px-6 lg:px-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3">
                            Making a <span className="text-primary">Difference</span>
                        </h2>
                        <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                            Every number represents a life touched and a story changed forever.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                        {[
                            { count: "2000+", label: "Active Users" },
                            { count: "842", label: "Happy Adopters" },
                            { count: "8", label: "Rescue Partners" },
                            { count: "1000+", label: "Animals Helped" },
                            { count: "891", label: "Critical Rescues" },
                            { count: "798", label: "Forever Homes" },
                        ].map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300">
                                <span className="text-3xl lg:text-4xl font-extrabold text-primary mb-2">
                                    {stat.count}
                                </span>
                                <span className="text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision Sections - Theme Matched */}
            <section className="py-12 px-6 lg:px-20 bg-white relative bg-primary">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Mission Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col h-full bg-white">
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
                        <p className="text-gray-700 pl-1 mb-4 flex-grow">
                            To revolutionize pet care in Pakistan by making{" "}
                            <span className="font-semibold text-gray-900">pet adoption</span>,{" "}
                            <span className="font-semibold text-gray-900">veterinary care</span>, and{" "}
                            <span className="font-semibold text-gray-900">pet products</span>{" "}
                            easily accessible. Paltuu.pk connects pet lovers in{" "}
                            <span className="font-semibold text-gray-900">Karachi, Lahore, Islamabad</span>{" "}
                            and beyond with trusted services.
                        </p>

                        {/* Visible Micro-CTAs */}
                        <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-primary/10 justify-center">
                            <Link
                                href="/browse-pets"
                                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faDog} className="mr-2 text-sm" />
                                <span className="whitespace-nowrap">Adopt Pets</span>
                            </Link>
                            <Link
                                href="/pet-care"
                                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faStethoscope} className="mr-2 text-sm" />
                                <span className="whitespace-nowrap">Find Vets</span>
                            </Link>
                        </div>
                    </div>

                    {/* Vision Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col h-full bg-white">
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
                        <p className="text-gray-700 pl-1 mb-4 flex-grow">
                            We envision a compassionate Pakistan where{" "}
                            <span className="font-semibold text-gray-900">every pet finds a loving home</span>{" "}
                            and owners can access{" "}
                            <span className="font-semibold text-gray-900">food, grooming, and healthcare</span>{" "}
                            through trusted platforms. Paltuu.pk makes pet care simple, reliable, and accessible for everyone.
                        </p>

                        {/* Visible Micro-CTAs */}
                        <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-primary/10 justify-center">
                            {/* Phase 1: Bazaar paused — was linking to /bazaar */}
                            {/* <Link
                                href="/bazaar"
                                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-sm" />
                                <span className="whitespace-nowrap">Shop Bazaar</span>
                            </Link> */}
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="mr-2 text-sm" />
                                <span className="whitespace-nowrap">Shop Now</span>
                            </Link>
                            <Link
                                href="/lost-and-found"
                                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faSearch} className="mr-2 text-sm" />
                                <span className="whitespace-nowrap">Lost & Found</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-6 lg:px-20 bg-gray-50 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-0"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                            Loved by the <span className="text-primary">Community</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Don't just take our word for it, hear from pet lovers across Pakistan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Ayesha K.",
                                city: "Karachi",
                                quote: "Paltuu made the adoption process simple and trustworthy. We found our cat through a verified rescue, and the experience was smooth.",
                            },
                            {
                                name: "Hamza R.",
                                city: "Karachi",
                                quote: "Instead of random Facebook groups, Paltuu gave us real options and real people. Highly recommended for pet adoption.",
                            },
                            {
                                name: "Sara M.",
                                city: "Karachi",
                                quote: "I connected with a rescue partner through Paltuu and helped rehome animals safely. The platform actually works.",
                            },
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className="mb-6 flex-grow">
                                    <p className="text-gray-700 italic text-lg leading-relaxed">
                                        "{testimonial.quote}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">
                                            {testimonial.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {testimonial.city}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HeroSection;
