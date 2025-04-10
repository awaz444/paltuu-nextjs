import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faUsers, faDog, faSearch, faStethoscope, faMapMarkerAlt, faBars, faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

const HeroSection = () => {
    return (
        <div className="font-montserrat bg-gray-50">
            {/* Header */}
            <header className="bg-white text-primary py-4 px-6 lg:px-20 flex items-center justify-between">
                <div className="logo mx-auto text-primary">
                    <Image src="/paltuu.svg" alt="Logo" width={150} height={150} />
                </div>
                <FontAwesomeIcon icon={faBars} className="md:hidden text-2xl cursor-pointer" />
            </header>

            <section className="bg-white text-black py-18 px-6 lg:px-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Subheading */}
                    <p className="text-sm text-primary italic mb-2 tracking-wide">
                        Available in Karachi, Lahore and Islamabad
                    </p>

                    {/* Hero Heading */}
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-1">
                        PAKISTAN’S
                    </h1>
                    <h1 className="text-5xl md:text-6xl mb-1">
                       <span className="text-primary">FIRST EVER</span>
                    </h1>
                    <h1 className="text-5xl md:text-6xl font-extrabold nb-4">
                        PAW PORTAL
                    </h1>

                    {/* Tagline */}
                    <h3 className="text-2xl md:text-3xl font-medium mb-6">
                        Find Your New Best Friend
                    </h3>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-gray-700 mb-8">
                        Whether you're looking to adopt, foster, or reunite with your pet — Paltuu is your go-to community for everything pawsome.
                    </p>

                    {/* Founders Club Section */}
                    <div className="bg-primary/5 border border-primary rounded-2xl p-8 mb-10">
                        <h4 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                            Become a Founding Member
                        </h4>
                        <ul className="text-base md:text-lg text-gray-800 space-y-2 mb-6">
                            <li>Early access to exclusive pet listings</li>
                            <li>Priority invites to pet events & adoption drives</li>
                            <li>Founders badge on your profile</li>
                            <li>Surprise merch & pet goodies</li>
                        </ul>

                        {/* Royal Button */}
                        <a href="/sign-up" className="inline-block bg-gradient-to-r from-[#f7caca] via-[#db76ac] to-[#872e8a] text-white font-bold px-10 py-4 rounded-full text-lg shadow-lg hover:scale-105 transition-transform duration-300">
                            Join Our Founders Club
                        </a>
                    </div>
                </div>
            </section>



            {/* Features Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-8 py-16 px-6 lg:px-20 bg-white">
                {[
                    { icon: faDog, title: "Adopt & Foster", text: "Browse pets looking for loving homes" },
                    { icon: faStethoscope, title: "Find Vets", text: "Connect with trusted veterinary professionals" },
                    { icon: faSearch, title: "Lost & Found", text: "Help reunite pets with their families" },
                    { icon: faMapMarkerAlt, title: "City-Based Listings", text: "Explore listings based on your location" },
                ].map((feature, index) => (
                    <div key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                        <FontAwesomeIcon icon={feature.icon} className="text-4xl text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.text}</p>
                    </div>
                ))}
            </section>

            {/* Testimonials */}
            <section className="py-16 px-6 lg:px-20 bg-gray-50">
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
            </section>


        </div>
    );
};

export default HeroSection;
