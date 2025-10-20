'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import ProductCarousel from './ProductCarousel';
import ProductCarouselSkeleton from './ProductCarouselSkeleton';

interface ApiProduct {
  product_id: number;
  title: string;
  slug: string;
  price: string;
  original_price?: string;
  image: string;
  collection_name: string;
  featured?: boolean;
  variants?: any[];
  rating?: number;
  reviewCount?: number;
}

interface Product {
  product_id: number;
  title: string;
  name?: string;
  description?: string;
  price: string;
  original_price?: string;
  category?: string;
  collection?: string;
  image_url: string;
  inStock?: boolean;
  rating?: number;
  ratingCount?: number;
  trending?: boolean;
  discount?: number;
}

const PaltuuBazaarSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded array of product IDs to show on landing page
  const featuredProductIds = [177, 146, 74, 195, 68, 321]; // Replace with your desired product IDs

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch specific products by IDs for the carousel
        const productIdsParam = featuredProductIds.join(',');
        const response = await fetch(`/api/bazaar/products-optimized?productIds=${productIdsParam}&limit=8&variants=true`);
        if (response.ok) {
          const data = await response.json();
          const apiProducts: ApiProduct[] = data.rows || [];
          
          // Transform API products to match ProductCarousel interface
          const transformedProducts: Product[] = apiProducts.map((apiProduct) => ({
            product_id: apiProduct.product_id,
            title: apiProduct.title,
            price: apiProduct.price,
            original_price: apiProduct.original_price,
            image_url: apiProduct.image,
            collection: apiProduct.collection_name,
            rating: apiProduct.rating,
            ratingCount: apiProduct.reviewCount,
            inStock: true, // Default to true since we don't have stock info
            trending: apiProduct.featured
          }));
          
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-12 px-6 lg:px-20 bg-primary">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-4">

          <img 
            src="/paltuu-bazaar-svg.svg" 
            alt="Paltuu Bazaar" 
            className="mx-auto h-24 md:h-24 w-auto"
          />
        </div>
        
        {/* Tagline */}
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Discover premium pet products, food, and accessories for your furry friends. 
          Quality items delivered right to your doorstep across Pakistan.
        </p>

        {/* Product Carousel */}
        <div className="mb-8">
          {loading ? (
            <ProductCarouselSkeleton />
          ) : (
            <ProductCarousel products={products} />
          )}
        </div>

        {/* Go to Paltuu Bazaar Button */}
        <Link
          href="/bazaar"
          className="inline-flex items-center justify-center gap-3 bg-white text-primary font-bold px-8 py-4 rounded-full text-lg shadow-lg hover:scale-105 transition-transform duration-300"
        >
          <span>Shop Pet Products Now</span>
        </Link>
      </div>
    </section>
  );
};

export default PaltuuBazaarSection;