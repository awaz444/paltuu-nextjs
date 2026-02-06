"use client";

import React from "react";
import Link from "next/link";
import { Store, ArrowRight, ShieldCheck, Cat, Dog, Truck } from "lucide-react";

// Brand definitions with SEO-friendly descriptions
const brands = [
    {
        name: "Felicia",
        slug: "felicia",
        image: "/felicia gemini.png",
        description: "Premium pet nutrition",
        longDescription: "Felicia offers premium pet nutrition solutions crafted with the finest ingredients to ensure your pets receive optimal health and vitality. Our scientifically formulated products support healthy growth, strong immunity, and overall well-being for pets of all ages and breeds.",
    },
    {
        name: "Prochoice",
        slug: "prochoice",
        image: "/prochoice gemini.png",
        description: "Quality pet food",
        longDescription: "Prochoice delivers high-quality pet food made from natural ingredients and balanced nutrition. Our range includes specialized formulas for different life stages, dietary needs, and health conditions, ensuring every pet gets the nutrition they deserve for a happy, healthy life.",
    },
    {
        name: "Homie",
        slug: "homie",
        image: "/homie gemini.png",
        description: "Comfort for pets",
        longDescription: "Homie specializes in creating comfortable and cozy products that make your pets feel at home. From plush beds and blankets to toys and accessories, our products are designed to provide maximum comfort and happiness for your beloved companions.",
    },
    {
        name: "Petline",
        slug: "petline",
        image: "/petline gemini.png",
        description: "Complete pet care",
        longDescription: "Petline provides comprehensive pet care solutions including grooming supplies, health supplements, training aids, and wellness products. Our complete range ensures that every aspect of your pet's care is covered with professional-grade quality and reliability.",
    },
    {
        name: "Pedigree",
        slug: "pedigree",
        image: "/pedigree gemini.png",
        description: "Trusted dog nutrition",
        longDescription: "Pedigree has been a trusted name in dog nutrition for decades, providing complete and balanced meals for dogs of all sizes and life stages. Our scientifically developed recipes include essential nutrients, vitamins, and minerals to support healthy growth, strong bones, and vibrant coats.",
    },
    {
        name: "Gourmet",
        slug: "gourmet",
        image: "/gourmet gemini.png",
        description: "Premium cat cuisine",
        longDescription: "Gourmet delivers exquisite culinary experiences for cats with premium ingredients and sophisticated flavors. Our range includes gourmet wet foods, treats, and specialized nutrition designed to satisfy even the most discerning feline palates.",
    },
    {
        name: "Brit Care",
        slug: "brit-care",
        image: "/brit care gemini.png",
        description: "Premium pet nutrition",
        longDescription: "Brit Care provides premium nutrition solutions for dogs and cats with scientifically formulated recipes. Our comprehensive range includes specialized diets for different life stages, health conditions, and dietary preferences, ensuring optimal nutrition for every pet.",
    },
    {
        name: "Royal Canin",
        slug: "royal-canin",
        image: "/royal canine gemini.png",
        description: "Veterinary nutrition leader",
        longDescription: "Royal Canin is the global leader in veterinary nutrition, offering scientifically formulated diets for dogs and cats. With over 50 years of expertise, we provide breed-specific, size-specific, and health-focused nutrition solutions backed by veterinary research and nutritional science.",
    },
    {
        name: "Whiskas",
        slug: "whiskas",
        image: "/whiskas gemini.png",
        description: "Complete cat nutrition",
        longDescription: "Whiskas provides complete and balanced nutrition for cats at every life stage. From kitten to senior, our range includes wet and dry foods, treats, and specialized diets formulated with essential nutrients to keep cats healthy, happy, and thriving throughout their lives.",
    },
    {
        name: "Fluff'n Bluff",
        slug: "fluff-n-bluff",
        image: "/fnb gemini.png",
        description: "Premium pet grooming",
        longDescription: "Fluff'n Bluff specializes in premium pet grooming products and accessories designed to keep your pets looking and feeling their best. Our comprehensive range includes shampoos, conditioners, brushes, nail care tools, and styling accessories for professional-quality grooming at home.",
    },
    {
        name: "Jungle",
        slug: "jungle",
        image: "/jungle gemini.png",
        description: "Wild-inspired pet products",
        longDescription: "Jungle brings the wild into your pet's life with nature-inspired products and accessories. Our collection includes natural toys, organic treats, eco-friendly bedding, and adventure gear designed to satisfy your pet's natural instincts while promoting environmental sustainability.",
    },
];

export default function AllBrandsPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": brands.map((brand, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Brand",
                "name": brand.name,
                "description": brand.description,
                "image": brand.image,
                "url": `https://paltuu.pk/marketplace/brands/${brand.slug}`
            }
        }))
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {/* Optimized Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-4">
                        <Store size={32} className="text-primary" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Premium Pet Brands in Pakistan
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">
                        Shop 100% authentic products from the world's most trusted pet nutrition and care brands.
                        Available for delivery in <span className="font-semibold text-gray-900">Karachi</span>.
                    </p>
                </div>
            </div>


            {/* Brands Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {brands.map((brand) => (
                        <Link
                            key={brand.slug}
                            href={`/marketplace/brands/${brand.slug}`}
                            className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row">
                                {/* Brand Image */}
                                <div className="sm:w-1/3 bg-white flex items-center justify-center">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center bg-white rounded-lg">
                                        <img
                                            src={brand.image}
                                            alt={`Buy ${brand.name} ${brand.description} in Pakistan`}
                                            className="object-contain"
                                        />

                                    </div>
                                </div>

                                {/* Brand Content */}
                                <div className="sm:w-2/3 p-6 flex flex-col justify-between">

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                {brand.name}
                                            </h2>

                                            <ArrowRight
                                                size={20}
                                                className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200"
                                            />
                                        </div>

                                        <p className="text-primary font-medium text-sm mb-3 uppercase tracking-wide">
                                            {brand.description}
                                        </p>

                                        <p className="text-gray-600 leading-relaxed">
                                            {brand.longDescription}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <span className="inline-flex items-center text-primary font-medium text-sm group-hover:underline">
                                            Shop {brand.name} Products
                                            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* SEO Power-Footer: Buying Guide & FAQs */}
            <div className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                            Choosing the Right Pet Brand in Pakistan
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Content Block 1: Authenticity (Huge Keyword: "Fake pet food Pakistan") */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                    Authenticity Guarantee
                                </h3>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Counterfeit pet food is a growing concern in Pakistan. At
                                    <span className="font-bold text-primary"> Paltuu.pk</span>, we source directly
                                    from authorized distributors of brands like <span className="font-medium text-gray-900">Royal Canin, Josera, and Reflex</span>.
                                    Every bag of food and accessory is verified authentic to ensure your pet's safety.
                                </p>
                            </div>

                            {/* Content Block 2: Variety (Keywords: "Cat food," "Dog food") */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <Dog className="w-5 h-5 text-primary" />
                                    </div>
                                    Complete Nutrition Range
                                </h3>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Whether you need <span className="font-medium text-gray-900">grain-free dog food</span>,
                                    <span className="font-medium text-gray-900">kitten milk replacers</span>, or
                                    <span className="font-medium text-gray-900">medicated veterinary diets</span>,
                                    our brand catalog covers every life stage. Browse brands specialized in digestive health,
                                    skin care, and weight management.
                                </p>
                            </div>

                            {/* Content Block 3: Delivery (Keywords: "Pet food delivery Karachi") */}
                            <div className="md:col-span-2 bg-gray-50 rounded-2xl p-6 md:p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-primary" />
                                    Fast Delivery in Karachi
                                </h3>
                                <p className="text-gray-600">
                                    We deliver authentic pet products to all major areas including
                                    <span className="font-semibold"> DHA, Clifton, Gulshan-e-Iqbal, North Nazimabad</span>,
                                    and across Karachi. No more heavy lifting get your 15kg food bags delivered home.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}