"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { addToCart as addToCartThunk } from "../../store/slices/cartSlice";
import type { AppDispatch } from "@/app/store/store";
import { useSelector, useDispatch } from "react-redux";
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
  ArrowRightOutlined,
} from "@ant-design/icons";
import VariantList from "./variant-list";
import { MoonLoader } from "react-spinners";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import Head from "next/head";
import { useRouter } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

// Define interfaces for the API response
interface ApiProduct {
  product_id: number;
  title: string;
  description: string;
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
  // Add SEO fields
  seo_title?: string;
  seo_description?: string;
}

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  user_email: string | null;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// UI-compatible product interface - Fixed compare_at_price type
interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  compare_at_price: number;
  stock: number;
  description: string;
  created_at: string;
  images: string[];
  reviews: Review[];
  // Add these new properties
  seo_title?: string;
  seo_description?: string;
}

interface ProductDetailsPageProps {
  params: { product_id: string };
  initialProduct?: ApiProduct | null;
  initialReviews?: Review[];
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  params,
  initialProduct = null,
  initialReviews = [],
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { product_id } = params;

  // All state declarations at the top
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
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#000000");

  // All useEffect hooks at the top, before any conditional returns
  useEffect(() => {
    // If we have initial data from server, use it immediately
    if (initialProduct) {
      const transformedProduct = transformApiProductToUI(initialProduct);
      setProduct({ ...transformedProduct, reviews: initialReviews });
      setVariantsData(initialProduct.variants || []);
      setSelectedVariant(initialProduct.variants?.[0] || null);
      setLoading(false);
      return;
    }

    // Only fetch if no initial data (client-side navigation)
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
        const transformedProduct = transformApiProductToUI(apiProduct);

        setProduct(transformedProduct);
        setVariantsData(apiProduct.variants || []);
        setSelectedVariant(apiProduct.variants?.[0] || null);

        // Fetch reviews only if we didn't have initial data
        try {
          const revRes = await fetch(
            `/api/bazaar/reviews?product_id=${apiProduct.product_id}`
          );
          if (revRes.ok) {
            const revs = await revRes.json();
            setProduct((p) => (p ? { ...p, reviews: revs } : p));
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
  }, [product_id, initialProduct, initialReviews]);

  useEffect(() => {
    // Get the computed style of the `--primary-color` CSS variable
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }
  }, []);

  useEffect(() => {
    // Reset added to cart state when variant changes
    if (isAddedToCart) {
      setIsAddedToCart(false);
    }
  }, [selectedVariant]);

  // All function definitions
  const transformApiProductToUI = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.product_id,
      name: apiProduct.title,
      brand: apiProduct.categories?.[0]?.name || "Unknown Brand",
      category: apiProduct.categories?.[0]?.name || "Uncategorized",
      price: apiProduct.variants?.[0]?.price_override || apiProduct.price || 0,
      compare_at_price: Number(apiProduct.compare_at_price) || 0,
      stock:
        apiProduct.variants?.reduce(
          (total, variant) => total + variant.stock,
          0
        ) || 0,
      description: apiProduct.description || "No description available",
      created_at: apiProduct.created_at || new Date().toISOString(),
      images:
        apiProduct.images.length > 0
          ? apiProduct.images
          : ["/placeholder-product.jpg"],
      reviews: initialReviews,
      seo_title: apiProduct.seo_title,
      seo_description: apiProduct.seo_description,
    };
  };

  const handleGoToCart = () => {
    router.push("/cart");
  };

  const formatListingDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);

      const sessionId = getOrCreateGuestSessionId();

      await dispatch(
        addToCartThunk({
          sessionId,
          productId: product.id,
          variantId: selectedVariant?.variant_id ?? null,
          quantity: quantity,
          title: product.name,
          price: selectedVariant?.price_override ?? product.price,
          image: product.images[0] ?? null,
        })
      ).unwrap();

      // Set the added to cart state to true
      setIsAddedToCart(true);

      message.success({
        content: `${product.name} added to cart!`,
        icon: <CheckOutlined className="text-green-500" />,
        className: "custom-message",
      });
    } catch (err: any) {
      console.error("Add to cart error", err);
      message.error(err?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const calculateDiscountPercentage = (
    price: number,
    compareAtPrice: number
  ) => {
    if (!compareAtPrice || compareAtPrice <= price) return 0;
    const discount = ((compareAtPrice - price) / compareAtPrice) * 100;
    return Math.round(discount);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxStock = selectedVariant?.stock ?? product?.stock ?? 0;
    const minOrder = 1;
    const clampedQuantity = Math.max(minOrder, Math.min(newQuantity, maxStock));
    setQuantity(clampedQuantity);

    // Reset the added to cart state when quantity changes
    if (isAddedToCart) {
      setIsAddedToCart(false);
    }
  };

  // Now all conditional returns come after all hooks
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <MoonLoader size={30} color={primaryColor} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <Head>
        <title>{product.seo_title || product.name || "Product Details"}</title>
        <meta
          name="description"
          content={product.seo_description || product.description || ""}
        />
        <meta
          property="og:title"
          content={product.seo_title || product.name || "Product Details"}
        />
        <meta
          property="og:description"
          content={product.seo_description || product.description || ""}
        />
        <meta property="og:image" content={product?.images?.[0] || ""} />
        <meta
          property="og:url"
          content={typeof window !== "undefined" ? window.location.href : ""}
        />
        <meta property="og:type" content="product" />
        <meta
          name="twitter:title"
          content={product.seo_title || product.name || "Product Details"}
        />
        <meta
          name="twitter:description"
          content={product.seo_description || product.description || ""}
        />
        <meta name="twitter:image" content={product?.images?.[0] || ""} />
      </Head>
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
            <div className="flex flex-col lg:flex-row gap-8 lg:items-stretch">
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

              {/* Product Info - Right Column */}
              <div className="lg:w-1/2 flex flex-col">
                <div className="space-y-4 flex-grow">
                  {/* Name + Listing Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight break-words">
                      {product.name}
                    </h1>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <Rate
                        disabled
                        defaultValue={averageRating}
                        className="text-yellow-400 text-sm mr-2"
                      />
                      <span className="text-gray-600 text-sm">
                        ({product.reviews.length})
                      </span>
                    </div>
                  </div>

                  {/* Price and Stock Information */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white bg-opacity-5 p-4 rounded-xl border border-primary border-opacity-20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center">
                            <DollarOutlined className="mr-1 text-primary" />
                            Price
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-primary">
                              PKR{" "}
                              {(
                                selectedVariant?.price_override ?? product.price
                              ).toLocaleString()}
                            </p>
                            {(selectedVariant?.compare_at_price ??
                              product.compare_at_price) > 0 &&
                              (selectedVariant?.compare_at_price ??
                                product.compare_at_price) >
                                (selectedVariant?.price_override ??
                                  product.price) && (
                                <p className="text-sm text-gray-500 line-through">
                                  PKR{" "}
                                  {(
                                    selectedVariant?.compare_at_price ??
                                    product.compare_at_price
                                  ).toLocaleString()}
                                </p>
                              )}
                          </div>
                          {(selectedVariant?.compare_at_price ??
                            product.compare_at_price) >
                            (selectedVariant?.price_override ??
                              product.price) && (
                            <div className="mt-1">
                              <Tag color="green" className="text-xs">
                                Save{" "}
                                {calculateDiscountPercentage(
                                  selectedVariant?.price_override ??
                                    product.price,
                                  selectedVariant?.compare_at_price ??
                                    product.compare_at_price
                                )}
                                %
                              </Tag>
                            </div>
                          )}
                        </div>

                        {/* Stock Availability Badge */}
                        <div>
                          <Tag
                            color={
                              (selectedVariant
                                ? selectedVariant.stock
                                : product.stock) > 0
                                ? "green"
                                : "red"
                            }
                            className="rounded-full"
                          >
                            {(selectedVariant
                              ? selectedVariant.stock
                              : product.stock) > 0
                              ? "In Stock"
                              : "Out of Stock"}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* Quantity Selector - Moved down */}
                  <div className="flex items-center space-x-4 mt-6">
                    <span className="text-gray-700 font-medium">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-medium border-x border-gray-300">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                        disabled={
                          quantity >=
                          (selectedVariant?.stock ?? product?.stock ?? 0)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  {isAddedToCart ? (
                    // Go to Cart Button - White background with primary border
                    <button
                      onClick={handleGoToCart}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-300 bg-white text-primary border-2 border-primary shadow-md hover:shadow-lg hover:bg-gray-50"
                    >
                      <ArrowRightOutlined className="mr-2" />
                      Go to Cart
                    </button>
                  ) : (
                    // Add to Cart Button - Original styling
                    <button
                      onClick={handleAddToCart}
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
                  )}
                </div>
              </div>
            </div>

            <Divider className="my-8 border-gray-200" />

            {/* Full Description with ReactMarkdown */}
            {product.description.length > 150 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Product Description
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                  <ReactMarkdown>{product.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mt-8 sm:mt-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <StarOutlined className="text-primary text-base sm:text-lg" />
                <span>Customer Reviews</span>
                <span className="text-xs sm:text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {product.reviews.length} reviews
                </span>
              </h2>

              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 sm:p-5 md:p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-3 mb-3">
                        {/* User Info */}
                        <div className="flex items-center min-w-0">
                          {review.user_avatar ? (
                            <img
                              src={review.user_avatar}
                              alt={review.user_name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-primary font-semibold text-sm sm:text-base">
                                {review.user_name?.charAt(0) || "U"}
                              </span>
                            </div>
                          )}

                          <div className="min-w-0">
                            {/* Name + Date */}
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {review.user_name}
                              </h4>
                              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                                {formatListingDate(review.created_at)}
                              </span>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center mt-0.5 sm:mt-1 text-xs sm:text-sm">
                              <Rate
                                disabled
                                defaultValue={review.rating}
                                className="text-yellow-400 text-xs sm:text-sm"
                              />
                            </div>

                            {/* Title (on next line) */}
                            {review.title && (
                              <p className="mt-2 sm:mt-1 font-medium text-gray-700 text-xs sm:text-sm break-words">
                                {review.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">
                        {review.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <StarOutlined className="text-3xl sm:text-4xl text-gray-300 mb-2 sm:mb-3" />
                    <p className="text-gray-600 text-sm sm:text-base">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </div>
                )}
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

        /* Custom styles for markdown content */
        .prose {
          color: inherit;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          color: #1f2937;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose h1 {
          font-size: 1.5em;
        }
        .prose h2 {
          font-size: 1.25em;
        }
        .prose h3 {
          font-size: 1.125em;
        }
        .prose p {
          margin-bottom: 1em;
        }
        .prose ul,
        .prose ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .prose li {
          margin-bottom: 0.5em;
        }
        .prose ul {
          list-style-type: disc;
        }
        .prose ol {
          list-style-type: decimal;
        }
        .prose strong {
          font-weight: 600;
          color: #1f2937;
        }
        .prose em {
          font-style: italic;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #dc2626;
        }
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .prose blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }
        .prose a {
          color: #a03048;
          text-decoration: underline;
        }
        .prose a:hover {
          color: #802939;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        .prose th,
        .prose td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        .prose th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </>
  );
};

export default ProductDetailsPage;
