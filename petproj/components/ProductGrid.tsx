import React from "react";
import Link from "next/link";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import "./productGrid.css";

interface Product {
    product_id: number;  // Changed from id
    name: string;
    description: string;
    price: string;      // Changed from number
    original_price?: string;
    category: string;
    collection: string;
    image_url: string;  // Changed from image
    inStock?: boolean;  // Added as optional
}

interface ProductGridProps {
    products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    useSetPrimaryColor();

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        // Add to cart logic here
        console.log("Added to cart:", product);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {products.map((product) => (
                <Link
                    key={product.product_id}
                    href={`/marketplace/${product.product_id}`}
                    passHref
                >
                    <div className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 product-card">
                        <div className="relative">
                            <img
                                src={product.image_url || "/product-placeholder.png"}
                                alt={product.name}
                                className="w-full aspect-square object-cover rounded-2xl"
                            />
                            {product.inStock === false && (
                                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
                                    <span className="text-white font-bold">Out of Stock</span>
                                </div>
                            )}
                        </div>
                        <div className="py-4">
                            <h3 className="font-bold text-lg mb-1 truncate max-w-[90%]">
                                {product.name}
                            </h3>
                            {product.original_price ? (
                                <div className="space-y-1">
                                    <p className="text-gray-500 line-through text-sm">
                                        PKR {parseInt(product.original_price).toLocaleString()}
                                    </p>
                                    <p className="text-primary font-semibold text-xl">
                                        PKR {parseInt(product.price).toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-primary font-semibold text-xl mb-3">
                                    PKR {parseInt(product.price).toLocaleString()}
                                </p>
                            )}
                            <button
                                className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 ${
                                    product.inStock !== false
                                    ? "bg-primary text-white hover:bg-primary-dark" 
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                } transition-colors`}
                                onClick={(e) => product.inStock !== false && handleAddToCart(e, product)}
                                disabled={product.inStock === false}
                            >
                                <ShoppingCartOutlined />
                                {product.inStock !== false ? "Add to Cart" : "Out of Stock"}
                            </button>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default ProductGrid;