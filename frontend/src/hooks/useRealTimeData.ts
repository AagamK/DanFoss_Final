import { useState, useEffect, useCallback } from "react";
import type { SensorData } from "@/pages/RealTimeMonitoring";
import { useOfflineStorage, type OfflineData } from "./useOfflineStorage";

const generateMockData = (): SensorData => {
  const now = new Date();
  const time = now.getTime() / 1000;

  const stroke = 125 + Math.sin(time / 20) * 100 + Math.sin(time) * 5;
  const pressure = 140 + Math.sin(time / 15) * 40 + Math.cos(time * 2) * 5 + (Math.random() - 0.5) * 5;
  const temperature = 50 + Math.sin(time / 30) * 10 + (Math.random() - 0.5) * 3;
  const vibration = 0.15 + Math.abs(Math.cos(time / 5)) * 0.1 + Math.random() * 0.05;
  
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (pressure > 185 || temperature > 65) status = 'critical';
  else if (pressure > 170 || temperature > 58 || vibration > 0.25) status = 'warning';
  
  return {
    timestamp: now.toISOString(),
    stroke: Math.max(0, stroke),
    pressure: Math.max(0, pressure),
    temperature: temperature,
    vibration: vibration,
    status
  };
};

export const useRealTimeData = () => {
  const [data, setData] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { db, isOnline, generateOfflineSensorData } = useOfflineStorage();

  const connectToDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isOnline) {
        try {
          const response = await fetch('/api/hydraulic-data/recent?minutes=1');
          if (response.ok) {
            const postgresData = await response.json();
            setData(postgresData);
            setIsConnected(true);
            setIsLoading(false);
            return;
          }
        } catch (postgresError) {
          console.log('PostgreSQL connection failed, using offline data:', postgresError);
        }
      }
      
      const offlineData = await db.getRecentSensorData(1);
      
      if (offlineData.length === 0) {
        // The generate function inside useOfflineStorage needs to be adjusted
        // For now, this will trigger the generation of data points.
        await generateOfflineSensorData(120); 
        const newOfflineData = await db.getRecentSensorData(1);
        setData(newOfflineData.map(convertOfflineToSensor));
      } else {
        setData(offlineData.map(convertOfflineToSensor));
      }
      
      setIsConnected(true);
    } catch (err) {
      console.error('Database connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [db, isOnline, generateOfflineSensorData]);

  const convertOfflineToSensor = (offline: OfflineData): SensorData => ({
    timestamp: offline.timestamp,
    stroke: offline.stroke,
    pressure: offline.pressure,
    temperature: offline.temperature,
    vibration: offline.vibration,
    status: offline.status
  });

  useEffect(() => {
    if (!isConnected) {
      connectToDatabase();
      return;
    }

    // This interval ensures a new data point is added every 0.25 seconds
    const interval = setInterval(async () => {
      if (isOnline) {
        try {
          const response = await fetch('/api/hydraulic-data/latest');
          if (response.ok) {
           const latestData = await response.json();
            setData(prevData => {
              const newData = [...prevData, latestData];
              return newData.slice(-240);
            });
            return;
          }
        } catch (error) {
          console.log('Failed to fetch latest data, generating offline data');
        }
      }

      const newDataPoint = generateMockData();
      await db.addSensorData(newDataPoint);
      
      setData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-240);
      });
    }, 250); // 250 milliseconds = 0.25 seconds

    return () => clearInterval(interval);
  }, [isConnected, connectToDatabase, isOnline, db]);

  const reconnect = useCallback(() => {
    setIsConnected(false);
    setError(null);
    connectToDatabase();
  }, [connectToDatabase]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    reconnect
  };
};

// ... (rest of file is unchanged)
export const createPostgreSQLConnection = async (config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}) => {
  console.log('PostgreSQL config:', config);
};

export const fetchHydraulicData = async (timeRange: string = '1h') => {
  console.log('Fetching data for time range:', timeRange);
  return [];
};