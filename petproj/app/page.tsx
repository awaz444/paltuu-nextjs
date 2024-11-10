'use client';
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

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
    <>
      <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>

        {/* Connection Status Indicator */}
        <div className="mt-4 flex justify-center p-4" style={{ color: 'rgb(var(--background-color))' }}>
          {loading ? (
            <span>Checking database connection...</span>
          ) : isConnected ? (
            <span >Database Connected!</span>
          ) : (
            <span >Database Not Connected!</span>
          )}
        </div>

        <div className="mt-32">
          By Talha Idrees, Sohail Ahmed and Zain
        </div>

        <div className="mt-2">
          Coming Soon!
        </div>
      </main>
    </>
  );
}
