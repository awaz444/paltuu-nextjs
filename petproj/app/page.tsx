'use client'
import { useEffect, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (response.ok) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error fetching health status:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>
      {/* Connection Status Indicator */}
      <div className="fixed top-0 left-0 right-0 flex justify-center p-4">
        {loading ? (
          <span>Checking database connection...</span>
        ) : isConnected ? (
          <span className="text-white">Database Connected!</span>
        ) : (
          <span className="text-red-500">Database Not Connected!</span>
        )}
      </div>

      {/* SVG - Paltu Logo */}
      <div className="mt-16">
        <Image
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          width={300}
          height={300}
          priority
        />
      </div>

      <div className="mt-32">
        By Talha Idrees
      </div>

      <div className="mt-2">
        Coming Soon!
      </div>
    </main>
  );
}
