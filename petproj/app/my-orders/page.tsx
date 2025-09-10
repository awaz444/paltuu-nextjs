"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar"; // ✅ update path if needed

interface Order {
  id: string;
  productName: string;
  productImage: string;
  status: "completed" | "scheduled";
  date: string;
  price: number;
}

const orders: Order[] = [
  {
    id: "1",
    productName: "Premium Dog Food",
    productImage: "/dog-food.jpg",
    status: "completed",
    date: "2025-09-01",
    price: 3500,
  },
  {
    id: "2",
    productName: "Cat Scratching Post",
    productImage: "/cat-post.jpg",
    status: "scheduled",
    date: "2025-09-15",
    price: 5500,
  },
];

// 🔹 Badge
function Badge({ children, color }: { children: React.ReactNode; color: "green" | "yellow" }) {
  const base = "px-3 py-1 text-xs font-semibold rounded-full inline-block shadow-sm";
  const styles =
    color === "green"
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

// 🔹 Card
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-md hover:shadow-lg transition bg-white border border-gray-100">
      {children}
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"completed" | "scheduled">("completed");

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          {/* Page Title */}
          <h1 className="text-4xl font-bold mb-10 text-center text-[#a03048]">
            My Orders
          </h1>

          {/* Switch Tabs */}
          <div className="relative flex bg-gray-200 rounded-lg mb-10 shadow-inner">
            {/* Slider */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full bg-[#a03048] rounded-lg transition-transform duration-300"
              style={{
                transform:
                  activeTab === "completed"
                    ? "translateX(0)"
                    : "translateX(100%)",
              }}
            />
            {/* Tabs */}
            <div
              onClick={() => setActiveTab("completed")}
              className={`w-1/2 text-center py-2.5 font-medium cursor-pointer relative z-10 transition ${
                activeTab === "completed"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Completed
            </div>
            <div
              onClick={() => setActiveTab("scheduled")}
              className={`w-1/2 text-center py-2.5 font-medium cursor-pointer relative z-10 transition ${
                activeTab === "scheduled"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Scheduled
            </div>
          </div>

          {/* Orders */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
              <p className="text-gray-500 text-lg">
                No <span className="capitalize">{activeTab}</span> orders yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card>
                    <div className="flex gap-6 p-5 items-center">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {order.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{order.date}</p>
                        <p className="text-sm font-medium mt-2 text-gray-700">
                          PKR {order.price.toLocaleString()}
                        </p>
                        <div className="mt-3">
                          <Badge
                            color={order.status === "completed" ? "green" : "yellow"}
                          >
                            {order.status === "completed"
                              ? "Completed"
                              : "Scheduled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
