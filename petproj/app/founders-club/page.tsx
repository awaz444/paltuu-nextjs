'use client';
import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import { toast } from "react-hot-toast";

const FoundersClub = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/founders-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message
      toast.success('Successfully registered for Founders Club!');
      setEmail("");

    } catch (error: any) {
      // Show error message
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center py-16 px-6 md:px-12">
        <motion.h1
          className="text-5xl font-extrabold text-center mb-8 text-[#A03048]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to the Founders Club 🚀
        </motion.h1>

        <p className="text-lg text-center max-w-3xl text-gray-700 mb-10">
          Paltuu aims to revolutionize pet adoption and care by creating a seamless platform that connects pet owners with potential adopters, veterinarians, and a thriving pet-loving community. As a **Founders Club** member, you'll be at the forefront of this movement, gaining exclusive access to networking opportunities, innovation discussions, and special perks.
        </p>

        {/* Updated Email Registration Form */}
        <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-xl shadow-md flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to register"
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A03048]"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className={`bg-[#A03048] text-white px-6 py-3 rounded-lg transition ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#802437]'
            }`}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#F8F8F8] p-6 rounded-xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-[#A03048]">Exclusive Networking</h3>
            <p className="text-gray-600 mt-2">Meet top founders, pet experts, and business leaders.</p>
          </div>

          <div className="bg-[#F8F8F8] p-6 rounded-xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-[#A03048]">Early Access</h3>
            <p className="text-gray-600 mt-2">Be the first to access new features and updates.</p>
          </div>

          <div className="bg-[#F8F8F8] p-6 rounded-xl shadow-md text-center">
            <h3 className="text-xl font-semibold text-[#A03048]">Special Perks</h3>
            <p className="text-gray-600 mt-2">Enjoy discounts, merchandise, and more (TBA).</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoundersClub;