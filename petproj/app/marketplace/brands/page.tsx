"use client";

import React from "react";
import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";

// Brand definitions with SEO-friendly descriptions
const brands = [
    {
        name: "Felicia",
        slug: "felicia",
        image: "https://lfiwvlicdkdheqynvjxb.supabase.co/storage/v1/object/public/product-imgs/products/41/variants/150/1759407491636-0-felicah40-640x640-copy.webp",
        description: "Premium pet nutrition",
        longDescription: "Felicia offers premium pet nutrition solutions crafted with the finest ingredients to ensure your pets receive optimal health and vitality. Our scientifically formulated products support healthy growth, strong immunity, and overall well-being for pets of all ages and breeds.",
    },
    {
        name: "Prochoice",
        slug: "prochoice",
        image: "https://lfiwvlicdkdheqynvjxb.supabase.co/storage/v1/object/public/product-imgs/products/25/variants/104/1759177431814-0-PROCHOICE_Pro32_15kg.webp",
        description: "Quality pet food",
        longDescription: "Prochoice delivers high-quality pet food made from natural ingredients and balanced nutrition. Our range includes specialized formulas for different life stages, dietary needs, and health conditions, ensuring every pet gets the nutrition they deserve for a happy, healthy life.",
    },
    {
        name: "Homie",
        slug: "homie",
        image: "https://lfiwvlicdkdheqynvjxb.supabase.co/storage/v1/object/public/product-imgs/products/210/variants/429/1759923573843-0-Homie-Premium-Adult-Dry-Cat-Food-Chicken.webp",
        description: "Comfort for pets",
        longDescription: "Homie specializes in creating comfortable and cozy products that make your pets feel at home. From plush beds and blankets to toys and accessories, our products are designed to provide maximum comfort and happiness for your beloved companions.",
    },
    {
        name: "Petline",
        slug: "petline",
        image: "https://lfiwvlicdkdheqynvjxb.supabase.co/storage/v1/object/public/product-imgs/products/120/variants/256/1759503126375-0-delicate.jpeg",
        description: "Complete pet care",
        longDescription: "Petline provides comprehensive pet care solutions including grooming supplies, health supplements, training aids, and wellness products. Our complete range ensures that every aspect of your pet's care is covered with professional-grade quality and reliability.",
    },
    {
        name: "La Mito",
        slug: "la-mito",
        image: "/images/brands/la-mito.png",
        description: "Natural pet wellness",
        longDescription: "La Mito focuses on natural pet wellness products made from organic and sustainably sourced ingredients. Our holistic approach to pet health includes natural supplements, organic treats, and eco-friendly care products that promote overall wellness while respecting the environment.",
    },
    {
        name: "Pedigree",
        slug: "pedigree",
        image: "/images/brands/pedigree.png",
        description: "Trusted dog nutrition",
        longDescription: "Pedigree has been a trusted name in dog nutrition for decades, providing complete and balanced meals for dogs of all sizes and life stages. Our scientifically developed recipes include essential nutrients, vitamins, and minerals to support healthy growth, strong bones, and vibrant coats.",
    },
    {
        name: "Gourmet",
        slug: "gourmet",
        image: "/images/brands/gourmet.png",
        description: "Premium cat cuisine",
        longDescription: "Gourmet delivers exquisite culinary experiences for cats with premium ingredients and sophisticated flavors. Our range includes gourmet wet foods, treats, and specialized nutrition designed to satisfy even the most discerning feline palates.",
    },
    {
        name: "Brit Care",
        slug: "brit-care",
        image: "/images/brands/brit-care.png",
        description: "Premium pet nutrition",
        longDescription: "Brit Care provides premium nutrition solutions for dogs and cats with scientifically formulated recipes. Our comprehensive range includes specialized diets for different life stages, health conditions, and dietary preferences, ensuring optimal nutrition for every pet.",
    },
    {
        name: "Royal Canin",
        slug: "royal-canin",
        image: "/images/brands/royal-canin.png",
        description: "Veterinary nutrition leader",
        longDescription: "Royal Canin is the global leader in veterinary nutrition, offering scientifically formulated diets for dogs and cats. With over 50 years of expertise, we provide breed-specific, size-specific, and health-focused nutrition solutions backed by veterinary research and nutritional science.",
    },
    {
        name: "Whiskas",
        slug: "whiskas",
        image: "/images/brands/whiskas.png",
        description: "Complete cat nutrition",
        longDescription: "Whiskas provides complete and balanced nutrition for cats at every life stage. From kitten to senior, our range includes wet and dry foods, treats, and specialized diets formulated with essential nutrients to keep cats healthy, happy, and thriving throughout their lives.",
    },
    {
        name: "Fluff'n Bluff",
        slug: "fluff-n-bluff",
        image: "/images/brands/fluff-n-bluff.png",
        description: "Premium pet grooming",
        longDescription: "Fluff'n Bluff specializes in premium pet grooming products and accessories designed to keep your pets looking and feeling their best. Our comprehensive range includes shampoos, conditioners, brushes, nail care tools, and styling accessories for professional-quality grooming at home.",
    },
    {
        name: "Nourvet",
        slug: "nourvet",
        image: "/images/brands/nourvet.png",
        description: "Veterinary nutrition & supplements",
        longDescription: "Nourvet provides veterinary-grade nutrition and supplements designed to support optimal pet health. Our scientifically formulated products include therapeutic diets, nutritional supplements, vitamins, and specialized health solutions developed in collaboration with veterinary professionals.",
    },
    {
        name: "Jungle",
        slug: "jungle",
        image: "/images/brands/jungle.png",
        description: "Wild-inspired pet products",
        longDescription: "Jungle brings the wild into your pet's life with nature-inspired products and accessories. Our collection includes natural toys, organic treats, eco-friendly bedding, and adventure gear designed to satisfy your pet's natural instincts while promoting environmental sustainability.",
    },
];

export default function AllBrandsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Store size={32} className="text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Shop by Brands
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg max-w-3xl">
                        Discover premium pet products from trusted brands. Each brand offers unique solutions 
                        tailored to your pet's specific needs, from nutrition and comfort to complete care.
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
                                            alt={brand.name}
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

            {/* SEO Content Section */}
            <div className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Why Choose Our Partner Brands?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Quality Assurance</h3>
                                <p className="text-gray-600 text-sm">
                                    All our partner brands meet strict quality standards and are trusted by pet owners worldwide.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Expert Formulation</h3>
                                <p className="text-gray-600 text-sm">
                                    Products are developed by veterinarians and pet nutrition experts for optimal pet health.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Complete Solutions</h3>
                                <p className="text-gray-600 text-sm">
                                    From nutrition to comfort and healthcare, find everything your pet needs in one place.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}