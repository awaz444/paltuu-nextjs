"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  Divider,
  Tag,
  Row,
  Col,
  Typography,
  Rate,
  Input,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { MoonLoader } from "react-spinners";

const { Title, Text, Paragraph } = Typography;

// Define interfaces for the API response
interface ApiProduct {
  product_id: number;
  title: string;
  description: string;
  short_description?: string;
  price?: number;
  compare_at_price?: number;
  currency: string;
  featured: boolean;
  status: string;
  images: string[];
  categories: Array<{ category_id: number; name: string }>;
  variants: Array<{
    variant_id: number;
    price_override?: number;
    stock: number;
    attributes: any;
  }>;
  created_at?: string;
  updated_at?: string;
}

// UI-compatible product interface
interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  city: string;
  area: string;
  created_at: string;
  images: string[];
  reviews: Array<{
    id: number;
    user: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

const ProductDetailsPage: React.FC<{ params: { product_id: string } }> = ({
  params,
}) => {
  const { product_id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bazaar/products/${product_id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Product not found');
          } else {
            throw new Error(`Failed to fetch product: ${response.status}`);
          }
          return;
        }

        const apiProduct: ApiProduct = await response.json();

        // Transform API data to UI-compatible format
        const transformedProduct: Product = {
          id: apiProduct.product_id,
          name: apiProduct.title,
          brand: apiProduct.categories?.[0]?.name || 'Unknown Brand',
          category: apiProduct.categories?.[0]?.name || 'Uncategorized',
          price: apiProduct.variants?.[0]?.price_override || apiProduct.price || 0,
          stock: apiProduct.variants?.reduce((total, variant) => total + variant.stock, 0) || 0,
          description: apiProduct.description || apiProduct.short_description || 'No description available',
          city: 'Karachi', // Placeholder - you can add location data to your product model later
          area: 'DHA Phase 6', // Placeholder - you can add location data to your product model later
          created_at: apiProduct.created_at || new Date().toISOString(),
          images: apiProduct.images.length > 0 ? apiProduct.images : ['/placeholder-product.jpg'],
          reviews: [
            // Placeholder reviews - you can implement a reviews system later
            {
              id: 1,
              user: "Ali Khan",
              rating: 5,
              comment: "Great product! Highly recommended.",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              user: "Sara Ahmed",
              rating: 4,
              comment: "Good quality, fast delivery.",
              created_at: new Date().toISOString(),
            }
          ]
        };

        setProduct(transformedProduct);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [product_id]);

  const formatListingDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const addToCart = () => {
    message.success(`${product?.name} added to cart!`);
  };

  const handleReviewSubmit = () => {
    if (!newReview || newRating === 0) {
      message.warning("Please add a rating and review.");
      return;
    }
    const review = {
      id: product!.reviews.length + 1,
      user: "Guest User",
      rating: newRating,
      comment: newReview,
      created_at: new Date().toISOString(),
    };
    setProduct({
      ...product!,
      reviews: [review, ...product!.reviews],
    });
    setNewReview("");
    setNewRating(0);
    message.success("Review added successfully!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <MoonLoader size={30} color="#a03048" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center mt-10 px-4">
          <Title level={2} className="text-gray-700">
            {error === 'Product not found' ? 'Product not found' : 'Error loading product'}
          </Title>
          <Text className="text-gray-500">
            {error === 'Product not found'
              ? 'The product you are looking for does not exist or has been removed.'
              : 'There was an error loading the product. Please try again later.'
            }
          </Text>
          <div className="mt-4">
            <button
              onClick={() => window.history.back()}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center mt-10">
        <Navbar />
        <Title level={2} className="text-gray-700">
          Product not found
        </Title>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="product-details min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-primary transition-colors duration-200 font-medium"
            >
              <ArrowLeftOutlined className="mr-2" /> Back to products
            </button>
          </div>

          <div className="bg-white shadow-xl rounded-2xl overflow-hidden p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Image Gallery */}
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={product.images[currentImageIndex]}
                      alt={`${product.name}-image`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  <div className="flex mt-6 space-x-3">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        title={`View image ${index + 1}`}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex
                            ? "border-primary"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:w-1/2 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {product.name}
                    </h1>
                    <div className="text-lg text-gray-600 mb-2">
                      <span className="font-semibold">{product.brand}</span> •{" "}
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <span className="bg-primary bg-opacity-10 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Listed {formatListingDate(product.created_at)}
                  </span>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(
                            product.reviews.reduce((acc, review) => acc + review.rating, 0) /
                              product.reviews.length
                          )
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">
                      ({product.reviews.length} reviews)
                    </span>
                  </div>
                </div>

                <Paragraph className="text-gray-700 text-lg">
                  {product.description}
                </Paragraph>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-gray-500 mb-1">
                      Price
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      PKR {product.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-gray-500 mb-1">
                      Stock
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {product.stock > 0 ? (
                        <span className="text-green-600">{product.stock} Available</span>
                      ) : (
                        <span className="text-red-600">Out of Stock</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-200 ${
                      product.stock > 0
                        ? "bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCartOutlined className="mr-2" />
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>

                  <button className="py-3 px-6 border-2 border-primary text-primary rounded-xl font-semibold text-lg hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center">
                    <DollarOutlined className="mr-2" />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>

            <Divider className="my-8 border-gray-200" />

            {/* Reviews Section */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <StarOutlined className="mr-2 text-primary" /> Customer Reviews
              </h2>

              <div className="space-y-6 mb-8">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user}</h4>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatListingDate(review.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-4">No reviews yet.</p>
                )}
              </div>

              {/* Add Review */}
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Your Review</h3>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-700 mr-3">Your Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewRating(star)}
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          className="focus:outline-none"
                        >
                          <svg
                            className={`w-6 h-6 ${
                              star <= newRating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleReviewSubmit}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailsPage;