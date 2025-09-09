"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import { formatDistanceToNow } from "date-fns";
import { useSetPrimaryColor } from "../../hooks/useSetPrimaryColor";
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
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import VariantList from "./variant-list";
import { MoonLoader } from "react-spinners";
import { getOrCreateGuestSessionId } from "@/utils/guest";

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
  useSetPrimaryColor();
  const { product_id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [variantsData, setVariantsData] = useState<any[] | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bazaar/products/${product_id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
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
          brand: apiProduct.categories?.[0]?.name || "Unknown Brand",
          category: apiProduct.categories?.[0]?.name || "Uncategorized",
          price:
            apiProduct.variants?.[0]?.price_override || apiProduct.price || 0,
          stock:
            apiProduct.variants?.reduce(
              (total, variant) => total + variant.stock,
              0
            ) || 0,
          description:
            apiProduct.description ||
            apiProduct.short_description ||
            "No description available",
          created_at: apiProduct.created_at || new Date().toISOString(),
          images:
            apiProduct.images.length > 0
              ? apiProduct.images
              : ["/placeholder-product.jpg"],
          reviews: [],
        };

        setProduct(transformedProduct);
        setVariantsData(apiProduct.variants || []);
        // If variants exist, set default selected variant (first)
        const defaultVariant =
          apiProduct.variants && apiProduct.variants.length > 0
            ? apiProduct.variants[0]
            : null;
        setSelectedVariant(defaultVariant);

        // Fetch reviews from the new reviews API
        try {
          const revRes = await fetch(
            `/api/bazaar/reviews?product_id=${apiProduct.product_id}`
          );
          if (revRes.ok) {
            const revs = await revRes.json();
            setProduct((p) => (p ? { ...p, reviews: revs } : p));
          } else {
            console.debug(
              "No reviews or failed to fetch reviews",
              revRes.status
            );
          }
        } catch (e) {
          console.error("Error fetching reviews:", e);
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [product_id]);

  const formatListingDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const addToCart = async () => {
    try {
      setAddingToCart(true);
      const sessionId = getOrCreateGuestSessionId();
      const payload = {
        sessionId,
        productId: product?.id,
        variantId: selectedVariant?.variant_id ?? null,
        quantity: 1,
      };

      const res = await fetch("/api/bazaar/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success({
          content: `${product?.name} added to cart!`,
          icon: <CheckOutlined className="text-green-500" />,
          className: "custom-message",
        });
      } else {
        const d = await res.json();
        message.error(d.error || "Failed to add to cart");
      }
    } catch (e) {
      console.error("Add to cart error", e);
      message.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
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
    message.success({
      content: "Review added successfully!",
      className: "custom-message",
    });
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    message.success({
      content: !isWishlisted ? "Added to wishlist" : "Removed from wishlist",
      className: "custom-message",
      icon: <HeartFilled className="text-pink-500" />,
    });
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          message.success("Product link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success("Product link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <MoonLoader size={40} color="#a03048" />
          <p className="mt-4 text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center mt-20 px-4">
          <div className="max-w-md mx-auto">
            <div className="mb-6 text-6xl">😞</div>
            <Title level={2} className="text-gray-800 mb-4">
              {error === "Product not found"
                ? "Product Not Found"
                : "Something Went Wrong"}
            </Title>
            <Text className="text-gray-600 text-lg">
              {error === "Product not found"
                ? "The product you are looking for does not exist or has been removed."
                : "There was an error loading the product. Please try again later."}
            </Text>
            <div className="mt-8">
              <button
                onClick={() => window.history.back()}
                className="bg-primary text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:bg-primary-dark"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center mt-10 bg-gray-50 min-h-screen">
        <Navbar />
        <Title level={2} className="text-gray-700 pt-20">
          Product not found
        </Title>
      </div>
    );
  }

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <>
      <Navbar />
      <div className="product-details min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-primary transition-all duration-200 font-medium group"
            >
              <ArrowLeftOutlined className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to products
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-2xl overflow-hidden p-6 md:p-8 transition-all duration-300">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Image Gallery */}
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
                    {imageLoading && (
                      <div className="absolute inset-0 flex justify-center items-center bg-white/80 z-10">
                        <MoonLoader
                          size={30}
                          color="#a03048"
                          loading={imageLoading}
                        />
                      </div>
                    )}
                    <img
                      src={product.images[currentImageIndex]}
                      alt={`${product.name}-image`}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading(false)}
                    />
                    <div className="absolute top-4 right-4 flex flex-col space-y-3">
                      <button
                        onClick={toggleWishlist}
                        className="bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        {isWishlisted ? (
                          <HeartFilled className="text-red-500 text-lg" />
                        ) : (
                          <HeartOutlined className="text-gray-600 text-lg hover:text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={shareProduct}
                        className="bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <ShareAltOutlined className="text-gray-600 text-lg hover:text-blue-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex mt-6 space-x-3 overflow-x-auto pb-2">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setImageLoading(true);
                        }}
                        title={`View image ${index + 1}`}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentImageIndex
                            ? "border-primary ring-2 ring-primary ring-opacity-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
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
                {/* Name + Listing Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight break-words">
                    {product.name}
                  </h1>
                  <Tag className="whitespace-nowrap text-sm py-1 px-3 rounded-full bg-primary text-white border-0 self-start sm:self-auto">
                    Listed {formatListingDate(product.created_at)}
                  </Tag>
                </div>

                {/* Brand + Category */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    {product.brand}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  <span className="bg-gray-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <Rate
                      disabled
                      defaultValue={averageRating}
                      className="text-yellow-400 text-sm mr-2"
                    />
                    <span className="text-gray-600 text-sm">
                      ({product.reviews.length} reviews)
                    </span>
                  </div>
                </div>

                <Paragraph className="text-gray-700 text-lg leading-relaxed border-l-4 border-primary pl-4 py-1 bg-gray-50 rounded-r">
                  {product.description}
                </Paragraph>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center">
                      <DollarOutlined className="mr-1 text-blue-500" /> Price
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      PKR{" "}
                      {(
                        selectedVariant?.price_override ?? product.price
                      ).toLocaleString()}
                    </p>
                    {product.price >
                      (selectedVariant?.price_override ?? product.price) && (
                      <p className="text-sm text-gray-500 line-through mt-1">
                        PKR {product.price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center">
                      <ShoppingCartOutlined className="mr-1 text-green-500" /> Stock
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedVariant ? (
                        selectedVariant.stock > 0 ? (
                          <span className="text-green-600">
                            {selectedVariant.stock} Available
                          </span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )
                      ) : product.stock > 0 ? (
                        <span className="text-green-600">
                          {product.stock} Available
                        </span>
                      ) : (
                        <span className="text-red-600">Out of Stock</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center">
                    <EnvironmentOutlined className="mr-1 text-primary" /> Location
                  </p>
                  <p className="text-md font-medium text-gray-600">
                    {product.area}, {product.city}
                  </p>
                </div> */}

                {/* Variants List */}
                {variantsData && variantsData.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-3 text-primary">
                      Available Variants
                    </h3>
                    <VariantList
                      productId={product.id}
                      variants={variantsData ?? undefined}
                      selectedVariantId={selectedVariant?.variant_id}
                      onSelect={(v) => setSelectedVariant(v)}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    onClick={addToCart}
                    disabled={
                      ((selectedVariant
                        ? selectedVariant.stock
                        : product.stock) || 0) === 0 || addingToCart
                    }
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-300 ${
                      ((selectedVariant
                        ? selectedVariant.stock
                        : product.stock) || 0) > 0
                        ? "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary-dark"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {addingToCart ? (
                      <MoonLoader size={20} color="#ffffff" />
                    ) : (
                      <>
                        <ShoppingCartOutlined className="mr-2" />
                        {((selectedVariant
                          ? selectedVariant.stock
                          : product.stock) || 0) > 0
                          ? `Add to Cart`
                          : `Out of Stock`}
                      </>
                    )}
                  </button>

                  <button className="py-3 px-6 border-2 border-primary text-primary rounded-xl font-semibold text-lg hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg">
                    <DollarOutlined className="mr-2" />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>

            <Divider className="my-8 border-gray-200" />

            {/* Reviews Section */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <StarOutlined className="mr-2 text-primary" /> Customer Reviews
                <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {product.reviews.length} reviews
                </span>
              </h2>

              <div className="space-y-6 mb-8">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {review.user}
                          </h4>
                          <div className="flex items-center mt-1">
                            <Rate
                              disabled
                              defaultValue={review.rating}
                              className="text-yellow-400 text-sm"
                            />
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
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <StarOutlined className="text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-600">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </div>
                )}
              </div>

              {/* Add Review */}
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Add Your Review
                </h3>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-700 mr-3 font-medium">
                      Your Rating:
                    </span>
                    <Rate
                      value={newRating}
                      onChange={setNewRating}
                      className="text-yellow-400"
                    />
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
                  className="bg-primary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:bg-primary-dark"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-message {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .ant-rate-star-full {
          color: #fbbf24;
        }
        .ant-tag {
          margin-right: 0;
        }
      `}</style>
    </>
  );
};

export default ProductDetailsPage;