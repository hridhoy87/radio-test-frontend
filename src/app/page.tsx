'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { ReportModal } from '../components/ReportModal';
import { useReport } from '../hooks/useReport';

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
  return mod.MapContainer;
}), { ssr: false });

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Coordinate {
  lat: number;
  lng: number;
  timestamp?: string;
  station?: string;
  device_id?: string;
  comm_state?: string;
  accuracy?: number;
  sample_date?: string;
  sample_time?: string;
  captured_at_utc?: number;
}

interface Trajectory {
  id: string;
  name: string;
  station: string;
  device_id: string;
  coordinates: Coordinate[];
}

// Color palette for stations
const STATION_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB'];

const COMM_STATE_COLORS = {
  'Loud and Clear': '#006400',    // Deep Green
  'Readable Noisy': '#90EE90',    // Light Green  
  'Noisy': '#FFA500',             // Orange
  'Nothing Heard': '#8B0000'      // Blood Red
} as const;

const getStationColor = (station: string): string => {
  const index = station.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % STATION_COLORS.length;
  return STATION_COLORS[index];
};

const getCommStateColor = (comm_state: string): string => {
  return COMM_STATE_COLORS[comm_state as keyof typeof COMM_STATE_COLORS] || '#666666';
};

export default function Home() {
  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const { generateStationReport, isGenerating: reportGenerating } = useReport();
  const mapRef = useRef<any>(null);
  const defaultCenter = { lat: 23.6850, lng: 90.3563 };

  useEffect(() => {
    setIsClient(true);
    fetchTrajectories();
  }, []);
  
  const stations = Array.from(new Set(trajectories.map(t => t.station)))
    .filter(station => station && station.trim() !== '') // Filter out empty/null stations
    .sort();

  const fetchTrajectories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/trajectories');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const trajectoriesData = result.data || [];
      
      const transformedTrajectories = trajectoriesData.map((traj: any) => ({
        id: `${traj.station}-${traj.device_id}`,
        name: `Station: ${traj.station} | Device: ${traj.device_id}`,
        station: traj.station,
        device_id: traj.device_id,
        coordinates: traj.coordinates.map((coord: any) => ({
        lat: coord.lat,
        lng: coord.lng,
        timestamp: coord.timestamp,
        station: coord.station,
        device_id: coord.device_id,
        accuracy: coord.accuracy,
        sample_date: coord.sample_date,
        sample_time: coord.sample_time,
        captured_at_utc: coord.captured_at_utc,
        comm_state: coord.comm_state
        }))
      }));
      
      setTrajectories(transformedTrajectories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/report/csv');
      if (!response.ok) throw new Error(`Failed to generate report: ${response.statusText}`);
      
      const result = await response.json();
      const blob = new Blob([result.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radio-dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating report');
    }
  };

  const handleGenerateReport = async (reportData: {
    start_date: string;
    end_date: string;
    station1: string;
    station2: string;
  }) => {
    try {
      await generateStationReport(reportData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    }
  };

  const getPathCoordinates = (coordinates: Coordinate[]): [number, number][] => {
    return coordinates.map(coord => [coord.lat, coord.lng]);
  };

  if (!isClient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading application...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Radio Dashboard - Trajectory Map</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setIsReportModalOpen(true)} 
            style={buttonStyle('#28a745')}
            disabled={reportGenerating}
          >
            {reportGenerating ? 'Generating...' : 'Generate Report'}
          </button>
          {loading && <span style={{ color: '#666' }}>Loading...</span>}
          <button onClick={fetchTrajectories} style={buttonStyle('#007bff')} disabled={loading}>Refresh Data</button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* No Data Message */}
      {!loading && trajectories.length === 0 && !error && (
        <div style={noDataStyle}>
          No trajectory data found. Try clicking "Refresh Data".
        </div>
      )}

      {/* Station Legend */}
      {trajectories.length > 0 && (
        <div style={legendStyle}>
          <strong>Stations:</strong>
          {Array.from(new Set(trajectories.map(t => t.station))).map(station => (
            <div key={station} style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
              <div style={{ ...colorDot, backgroundColor: getStationColor(station) }}></div>
              <span style={{ fontSize: '12px' }}>{station}</span>
            </div>
          ))}
        </div>
      )}
      {trajectories.length > 0 && (
        <div style={legendStyle1}>
        <strong>Communication States:</strong>
        {Object.entries(COMM_STATE_COLORS).map(([state, color]) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
            <div style={{ ...colorDot, backgroundColor: color }}></div>
            <span style={{ fontSize: '12px' }}>{state}</span>
          </div>
        ))}
      </div>
      )}
      {/* Map */}
      <MapContainer center={[defaultCenter.lat, defaultCenter.lng]} zoom={13} style={{ height: 'calc(100vh - 60px)', width: '100%' }} ref={mapRef}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {trajectories.map((trajectory) => {
          const stationColor = getStationColor(trajectory.station);
          return (
            <div key={trajectory.id}>
              <Polyline positions={getPathCoordinates(trajectory.coordinates)} color={stationColor} weight={4} opacity={0.7} />
              {trajectory.coordinates.map((coord, index) => (
                <Marker 
                  key={`${trajectory.id}-${index}`} 
                  position={[coord.lat, coord.lng]} 
                  icon={createCustomIcon(getCommStateColor(coord.comm_state || 'UNKNOWN'))}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong style={{ color: stationColor }}>Station: {coord.station}</strong><br />
                      <strong>Comm State: {coord.comm_state}</strong><br />  {/* Changed from device_id */}
                      Point {index + 1} of {trajectory.coordinates.length}<br />
                      Lat: {coord.lat.toFixed(6)}, Lng: {coord.lng.toFixed(6)}<br />
                      Accuracy: {coord.accuracy?.toFixed(2)}m<br />
                      Date: {coord.sample_date}, Time: {coord.sample_time}
                      {coord.timestamp && <><br />Received: {new Date(coord.timestamp).toLocaleString()}</>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </div>
          );
        })}
      </MapContainer>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onGenerateReport={handleGenerateReport}
        stations={stations} // Make sure this is passed
      />
    </div>
  );
}

// Style objects
const buttonStyle = (color: string) => ({
  padding: '8px 16px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
});

const errorStyle = {
  padding: '10px',
  backgroundColor: '#f8d7da',
  color: '#721c24',
  border: '1px solid #f5c6cb',
  margin: '10px',
  borderRadius: '4px'
};

const noDataStyle = {
  padding: '10px',
  backgroundColor: '#fff3cd',
  color: '#856404',
  border: '1px solid #ffeaa7',
  margin: '10px',
  borderRadius: '4px'
};

const legendStyle = {
  position: 'absolute' as const,
  top: '70px',
  right: '10px',
  backgroundColor: 'white',
  padding: '10px',
  borderRadius: '5px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  zIndex: 1000,
  maxHeight: '200px',
  overflowY: 'auto' as const
};

const legendStyle1 = {
  position: 'absolute' as const,
  bottom: '30px',
  right: '10px',
  backgroundColor: 'white',
  padding: '10px',
  borderRadius: '5px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  zIndex: 1000,
  maxHeight: '200px',
  overflowY: 'auto' as const
};

const colorDot = {
  width: '12px',
  height: '12px',
  marginRight: '5px',
  borderRadius: '2px'
};

const createCustomIcon = (color: string) => {
  if (typeof window === 'undefined') return undefined;
  const L = require('leaflet');
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};