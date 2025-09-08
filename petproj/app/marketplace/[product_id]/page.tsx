"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  Divider,
  Button,
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

const mockProduct = {
  id: 1,
  name: "Premium Dog Food",
  brand: "HealthyPaws",
  category: "Food",
  price: 2500,
  stock: 12,
  description:
    "Nutritious premium dog food with high protein and balanced vitamins for your pet’s health and energy.",
  city: "Karachi",
  area: "DHA Phase 6",
  created_at: new Date("2025-08-25").toISOString(),
  images: [
    "https://place-puppy.com/400x400",
    "https://place-puppy.com/401x401",
    "https://place-puppy.com/402x402",
  ],
  reviews: [
    {
      id: 1,
      user: "Ali Khan",
      rating: 5,
      comment: "My dog loves this! Great quality food.",
      created_at: new Date("2025-08-26").toISOString(),
    },
    {
      id: 2,
      user: "Sara Ahmed",
      rating: 4,
      comment: "Good quality but a bit expensive.",
      created_at: new Date("2025-08-28").toISOString(),
    },
  ],
};

const ProductDetailsPage: React.FC<{ params: { product_id: string } }> = ({
  params,
}) => {
  const { product_id } = params;
  const [product, setProduct] = useState<typeof mockProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      setProduct(mockProduct);
      setLoading(false);
    }, 800);
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
          <div className="mb-2">
            <Button
              type="text"
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 p-0"
            >
              <ArrowLeftOutlined className="mr-1" /> Back to products
            </Button>
          </div>

          <Card className="shadow-xl rounded-2xl overflow-hidden border-none">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Image Gallery */}
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-100 rounded-xl">
                    <img
                      src={product.images[currentImageIndex]}
                      alt={`${product.name}-image`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  <div className="flex justify-center mt-4 space-x-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex
                            ? "bg-primary"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:w-1/2 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Title level={1} className="mb-2 text-gray-800">
                      {product.name}
                    </Title>
                    <div className="text-lg text-gray-600">
                      <span>{product.brand}</span> •{" "}
                      <span>{product.category}</span>
                    </div>
                  </div>
                  <Tag
                    color="#a03048"
                    className="rounded-full px-3 py-1 mt-2"
                  >
                    Listed {formatListingDate(product.created_at)}
                  </Tag>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <div className="bg-gray-50 p-4 rounded-xl h-full">
                      <Text className="text-sm font-semibold text-gray-500 block mb-1">
                        Price
                      </Text>
                      <Title level={4} className="text-gray-800 m-0">
                        PKR {product.price}
                      </Title>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div className="bg-gray-50 p-4 rounded-xl h-full">
                      <Text className="text-sm font-semibold text-gray-500 block mb-1">
                        Stock
                      </Text>
                      <Title level={4} className="text-gray-800 m-0">
                        {product.stock > 0 ? `${product.stock} Available` : "Out of Stock"}
                      </Title>
                    </div>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="primary"
                    size="large"
                    className="flex-1 h-14 text-lg font-semibold rounded-xl bg-primary hover:bg-primary"
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    icon={<ShoppingCartOutlined />}
                  >
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            </div>

            <Divider className="my-8 border-gray-200" />

            {/* Description */}
            <div className="p-5 rounded-lg border border-gray-200 mb-8">
              <Title
                level={3}
                className="text-gray-800 mb-3 flex items-center"
              >
                <InfoCircleOutlined className="mr-2" /> About this product
              </Title>
              <Paragraph className="text-gray-700">{product.description}</Paragraph>
            </div>

            {/* Reviews Section */}
            <div className="p-5 rounded-lg border border-gray-200">
              <Title
                level={3}
                className="text-gray-800 mb-3 flex items-center"
              >
                <StarOutlined className="mr-2" /> Customer Reviews
              </Title>

              <div className="space-y-4 mb-6">
                {product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-gray-50 rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <Text className="font-semibold">{review.user}</Text>
                        <Rate disabled defaultValue={review.rating} />
                      </div>
                      <Paragraph className="mt-2 text-gray-700">
                        {review.comment}
                      </Paragraph>
                      <Text type="secondary" className="text-xs">
                        {formatListingDate(review.created_at)}
                      </Text>
                    </div>
                  ))
                ) : (
                  <Text>No reviews yet.</Text>
                )}
              </div>

              {/* Add Review */}
              <div className="p-4 bg-white border rounded-lg shadow-sm space-y-3">
                <Rate
                  value={newRating}
                  onChange={(value) => setNewRating(value)}
                />
                <Input.TextArea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write your review..."
                  rows={3}
                />
                <Button type="primary" onClick={handleReviewSubmit}>
                  Submit Review
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProductDetailsPage;
