'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null); // true, false, or null for loading
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* Connection Status Indicator */}
      <div className="fixed top-0 left-0 right-0 flex justify-center bg-black p-4">
        {loading ? (
          <span>Checking database connection...</span>
        ) : isConnected ? (
          <span className="text-white">Database Connected!</span>
        ) : (
          <span className="text-red-500">Database Not Connected!</span>
        )}
      </div>

      {/* SVG */}
      <div className="mt-16"> {/* Add some margin for spacing */}
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 3000 800"
          style={{ enableBackground: 'new 0 0 3000 800' }}
        >
          <style type="text/css">
            {`.st0{fill:#FFFFFF;}`}
          </style>
          <g>
            <path className="st0" d="M895.29,706.09c-13.19,0-25.3-1.4-36.32-4.19c-11.02-2.79-16.92-6.52-17.69-11.18
              c-1.56-46.25-2.33-93.21-2.33-140.86c0-61.31,1.86-121.77,5.59-181.38c0.62-3.26,4.92-5.7,12.92-7.33
              c7.99-1.63,17.42-2.45,28.29-2.45c9.62,0,19.21,0.63,28.75,1.87s17.5,3.1,23.86,5.59c6.37,2.49,9.55,5.59,9.55,9.31l-0.24,6.05
              c14.12-3.72,27.47-5.59,40.05-5.59c20.33,0,38.53,4.07,54.59,12.22c16.07,8.15,29.73,18.9,40.98,32.25
              c11.25,13.35,19.82,28.25,25.73,44.71c5.9,16.45,8.85,32.98,8.85,49.6c0,14.12-2.29,27.7-6.87,40.74
              c-4.58,13.04-11.64,24.69-21.19,34.93c-9.54,10.25-21.77,18.36-36.67,24.34c-14.91,5.98-32.6,8.96-53.09,8.96
              c-16.92,0-35.86-2.33-56.81-6.99l1.63,70.78c0,4.34-2.41,7.88-7.22,10.6c-4.82,2.71-10.99,4.73-18.51,6.05
              C911.62,705.42,903.67,706.09,895.29,706.09z M960.02,569.18c11.48,0,20.95-3.03,28.4-9.08c7.45-6.06,12.96-13.97,16.53-23.75
              c3.57-9.78,5.36-20.18,5.36-31.2c0-13.19-2.37-26.04-7.1-38.53c-4.73-12.49-11.61-22.85-20.61-31.08
              c-9-8.23-19.95-12.34-32.83-12.34l-4.66,0.24c-1.71,41.76-2.56,83.75-2.56,125.96v19.79H960.02z"/>
            {/* Add other paths here as needed */}
          </g>
        </svg>
      </div>

      <div className="mt-2"> {/* Add some margin for spacing */}
        Coming Soon!
      </div>
      
    </main>
  );
}
