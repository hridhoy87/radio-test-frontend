import { useState, useEffect } from 'react';

export const useStations = () => {
  const [stations, setStations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://radio-test-backend.vercel.app/';
        const response = await fetch(`${baseUrl}/api/stations`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        
        const data = await response.json();
        setStations(data.stations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stations');
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  return { stations, loading, error };
};