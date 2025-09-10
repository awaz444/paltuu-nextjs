"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { 
  Check, 
  Package, 
  Truck, 
  Clock, 
  AlertCircle, 
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  Receipt,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_title: string;
  product_sku: string;
  variant_title: string | null;
  variant_sku: string | null;
  variant_attributes: any;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
  is_reviewed: boolean;
}

interface Order {
  order_id: number;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  payment_status: string;
  tracking_number: string | null;
  items: OrderItem[];
}

const MyOrdersPage = () => {
  useSetPrimaryColor();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserId(user?.id || null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${userId}`);
        
        if (!res.ok) throw new Error("Failed to fetch orders");
        
        const ordersData = await res.json();
        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const toggleOrderExpanded = (orderId: number) => {
    if (expandedOrders.includes(orderId)) {
      setExpandedOrders(expandedOrders.filter(id => id !== orderId));
    } else {
      setExpandedOrders([...expandedOrders, orderId]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Check className="w-5 h-5 text-green-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "processing":
        return <Package className="w-5 h-5 text-orange-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-orange-100 text-orange-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReviewClick = (orderId: number, itemId: number) => {
    // This will open a review modal in the future
    console.log(`Review order ${orderId}, item ${itemId}`);
    // For now, we'll just mark it as reviewed in the UI
    setOrders(orders.map(order => {
      if (order.order_id === orderId) {
        return {
          ...order,
          items: order.items.map(item => {
            if (item.order_item_id === itemId) {
              return { ...item, is_reviewed: true };
            }
            return item;
          })
        };
      }
      return order;
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">Loading your orders...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-primary hover:text-primary-dark mr-4"
          >
            <ArrowLeft size={18} className="mr-1" />
          </button>
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-primary">My Orders</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-600 mt-2">
            View your order history and track current orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-md">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start shopping to see your orders here!
            </p>
            <button
              className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark transition"
              onClick={() => router.push("/marketplace")}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-6 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleOrderExpanded(order.order_id)}
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="font-bold text-gray-800">
                      PKR {order.total_amount.toLocaleString()}
                    </span>
                    {expandedOrders.includes(order.order_id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Order Details (Collapsible) */}
                {expandedOrders.includes(order.order_id) && (
                  <div className="border-t border-gray-100 p-6">
                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <Receipt className="w-4 h-4 mr-2" />
                          Order Summary
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>PKR {order.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>PKR {order.shipping_amount.toLocaleString()}</span>
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount</span>
                              <span>- PKR {order.discount_amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
                            <span>Total</span>
                            <span>PKR {order.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">
                          Payment Status
                        </h4>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </div>
                        
                        {order.tracking_number && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Tracking Number
                            </h4>
                            <p className="text-sm font-mono">{order.tracking_number}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <h4 className="font-medium text-gray-700 mb-4">Items</h4>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.order_item_id} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border mr-4 flex-shrink-0">
                            <img 
                              src={item.image_url || "https://via.placeholder.com/150?text=No+Image"} 
                              alt={item.product_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{item.product_title}</h5>
                            {item.variant_title && (
                              <p className="text-sm text-gray-600">{item.variant_title}</p>
                            )}
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-800">
                              PKR {item.total_price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              PKR {item.unit_price.toLocaleString()} each
                            </p>
                            
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => handleReviewClick(order.order_id, item.order_item_id)}
                                disabled={item.is_reviewed}
                                className={`mt-2 text-sm px-3 py-1 rounded-full ${
                                  item.is_reviewed
                                    ? 'bg-green-100 text-green-800 cursor-default'
                                    : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                              >
                                {item.is_reviewed ? (
                                  <span className="flex items-center">
                                    <Check className="w-4 h-4 mr-1" /> Reviewed
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Star className="w-4 h-4 mr-1" /> Review
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrdersPage;